"use client";

import { GROWTH_AREAS } from "@/data/growthAreas";
import { sampleQuests } from "@/data/quests";
import { buildQuest, useQuestStore } from "@/stores/questStore";
import { usePlanStore } from "@/stores/planStore";
import { useWorldStore } from "@/stores/worldStore";
import type { WeeklyPlan, WeeklyProgressRecord } from "@/types/plan";
import { addDays, diffDays, todayKey, weekKeyOf, weekNumber, type WeekStart } from "./dates";
import { computeWeekProgress, weekTarget } from "./progression";

/**
 * Week lifecycle:
 *   planning → (user confirms, or automatically after the week's first day) → active → closed
 * A closed week is frozen into a WeeklyProgressRecord. Nothing about it changes afterwards.
 */

export const weekStartSetting = (): WeekStart => useWorldStore.getState().settings.weekStartsOn;

/** Level the user is on during `weekKey`: 1 + number of earlier weeks that unlocked. */
export function levelAt(weekKey: string) {
  const records = usePlanStore.getState().records;
  return 1 + Object.values(records).filter((r) => r.unlocked && r.weekKey < weekKey).length;
}

/** Creates the plan for a week (once): snapshots active Core Goals and generates their tasks. */
export function ensurePlan(weekKey: string, today: string = todayKey()): WeeklyPlan {
  const ps = usePlanStore.getState();
  const existing = ps.plans[weekKey];
  if (existing) return existing;

  const active = ps.coreGoals.filter((g) => g.active && GROWTH_AREAS[g.areaId]?.countsTowardScore);
  const plan: WeeklyPlan = {
    weekKey,
    status: "planning",
    createdAt: new Date().toISOString(),
    createdOn: today,
    confirmedAt: null,
    confirmedTarget: null,
    requirements: active.map((g) => ({
      goalId: g.id,
      areaId: g.areaId,
      title: g.title,
      condition: g.condition,
      minCompleted: Math.max(1, g.minCompleted),
    })),
    bonusCapPct: ps.bonusCapPct,
  };
  ps.putPlan(plan);

  const qs = useQuestStore.getState();
  const inWeek = qs.quests.filter((q) => q.weekKey === weekKey);
  const generated = active.flatMap((g) =>
    inWeek.some((q) => q.coreGoalId === g.id)
      ? []
      : g.requirements.map((r) =>
          buildQuest({
            title: r.title,
            locationId: GROWTH_AREAS[g.areaId].locationId,
            category: g.areaId,
            durationMin: 45,
            slot: "afternoon",
            weekKey,
            date: null,
            effort: r.effort,
            kind: "core",
            coreGoalId: g.id,
          }),
        ),
  );
  if (generated.length) qs.addMany(generated);
  return plan;
}

export function confirmPlan(weekKey: string, auto = false) {
  const ps = usePlanStore.getState();
  const plan = ps.plans[weekKey];
  if (!plan || plan.status !== "planning") return;
  const target = weekTarget(useQuestStore.getState().quests, weekKey);
  ps.updatePlan(weekKey, { status: "active", confirmedAt: new Date().toISOString(), confirmedTarget: target });
  ps.logChange({
    weekKey,
    kind: auto ? "auto-confirm" : "confirm",
    targetBefore: target,
    targetAfter: target,
    note: auto ? "Plan locked automatically after the week's first day." : "Weekly plan confirmed.",
  });
}

function closeWeek(weekKey: string) {
  const ps = usePlanStore.getState();
  if (ps.records[weekKey]) return;
  const plan = ps.plans[weekKey] ?? null;
  const progress = computeWeekProgress(useQuestStore.getState().quests, weekKey, plan);
  const record: WeeklyProgressRecord = {
    weekKey,
    weekNumber: weekNumber(weekKey, ps.journeyStart || weekKey, weekStartSetting()),
    level: levelAt(weekKey),
    target: progress.target,
    plannedDone: progress.plannedDone,
    extraCounted: progress.extraCounted,
    countedUnits: progress.countedUnits,
    score: progress.score,
    coreGoals: progress.coreGoals,
    unlocked: progress.unlocked,
    closedAt: new Date().toISOString(),
  };
  ps.putRecord(record);
  if (plan) ps.updatePlan(weekKey, { status: "closed" });
  if (record.unlocked) {
    ps.addMilestone({
      type: "level-unlocked",
      locationId: "haven",
      title: `Level ${record.level + 1} unlocked`,
      refId: weekKey,
    });
  }
}

/**
 * Brings the week system up to date for `now`: seeds the first week, closes
 * finished weeks, creates this week's plan and auto-confirms it after day one.
 * Idempotent; safe to call on every load and every minute.
 */
export function syncWeeks(now = new Date()) {
  const today = todayKey(now);
  const ws = weekStartSetting();
  const current = weekKeyOf(today, ws);
  const ps = usePlanStore.getState();
  if (!ps.journeyStart) ps.setJourneyStart(today);

  const qs = useQuestStore.getState();
  if (!qs.seeded) {
    qs.addMany(sampleQuests(current, today));
    qs.markSeeded();
  }

  // Close every past week since the journey started (bounded for safety).
  const first = weekKeyOf(usePlanStore.getState().journeyStart, ws);
  let wk = first;
  for (let i = 0; i < 260 && wk < current; i++) {
    closeWeek(wk);
    wk = addDays(wk, 7);
  }

  ensurePlan(current, today);
  const plan = usePlanStore.getState().plans[current];
  // One full day to plan: the week's first day, or the day the plan was made if later.
  const graceDay = plan && (plan.createdOn ?? current) > current ? plan.createdOn : current;
  if (plan?.status === "planning" && diffDays(graceDay, today) >= 1) confirmPlan(current, true);
}

/**
 * Re-keys open (unclosed) weeks after the week-start setting changes.
 * Closed weeks and their records are untouched.
 */
export function rekeyOpenWeeks(newStart: WeekStart) {
  const ps = usePlanStore.getState();
  const qs = useQuestStore.getState();
  const closed = new Set(Object.keys(ps.records));
  const touched = new Set<string>();
  for (const q of qs.quests) {
    if (closed.has(q.weekKey)) continue;
    const next = weekKeyOf(q.date ?? q.weekKey, newStart);
    if (next !== q.weekKey) {
      touched.add(q.weekKey);
      qs.updateQuest(q.id, { weekKey: next });
    }
  }
  const plans = { ...ps.plans };
  for (const key of Object.keys(plans)) if (!closed.has(key)) delete plans[key];
  usePlanStore.setState({ plans });
  return touched.size;
}

export interface CurrentWeekInfo {
  today: string;
  weekKey: string;
  weekNumber: number;
  level: number;
}

export function currentWeekInfo(now: Date): CurrentWeekInfo {
  const today = todayKey(now);
  const ws = weekStartSetting();
  const weekKey = weekKeyOf(today, ws);
  const start = usePlanStore.getState().journeyStart || today;
  return { today, weekKey, weekNumber: weekNumber(weekKey, start, ws), level: levelAt(weekKey) };
}

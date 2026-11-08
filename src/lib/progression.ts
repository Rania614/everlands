import type { EffortSize, Quest, TaskKind } from "@/types/quest";
import type { CoreGoalResult, WeeklyGoalRequirement, WeeklyPlan } from "@/types/plan";
import { toDayKey, weekDays } from "./dates";

/**
 * Weekly progression rules (pure functions, unit-tested in tests/).
 *
 *   Weekly Target  = Σ effortUnits of the week's eligible PLANNED tasks
 *   Planned Done   = Σ effortUnits of those planned tasks that are done
 *   Extra Counted  = min(Σ effortUnits of done eligible EXTRA tasks, ⌊Target × bonusCap%⌋)
 *   Weekly Score   = (Planned Done + Extra Counted) / Weekly Target × 100
 *
 *   Next Level unlocks when Weekly Score > 75 (strictly) AND every Core Goal
 *   requirement snapshotted for the week is achieved.
 *
 * Eligible = not a Quran task. Quran activity never enters any of these sums.
 * A task's contribution depends only on its week, never on its day, so moving
 * it between days cannot change or duplicate its value.
 */

export const UNLOCK_THRESHOLD_PCT = 75;
export const DEFAULT_BONUS_CAP_PCT = 25;
export const MAX_CUSTOM_UNITS = 8;

export const EFFORT_UNITS: Record<Exclude<EffortSize, "custom">, number> = { S: 1, M: 2, L: 3 };

export const EFFORT_LABELS: Record<EffortSize, string> = {
  S: "Small · 1",
  M: "Medium · 2",
  L: "Large · 3",
  custom: "Custom",
};

export const KIND_LABELS: Record<TaskKind, string> = {
  core: "Core goal",
  supporting: "Supporting",
  optional: "Optional",
  stretch: "Stretch",
};

export function unitsFor(effort: EffortSize, custom?: number) {
  if (effort === "custom") return clampUnits(custom ?? 1);
  return EFFORT_UNITS[effort];
}

export function clampUnits(n: number) {
  return Math.min(MAX_CUSTOM_UNITS, Math.max(1, Math.round(n)));
}

/** Kinds that can be part of the target. Optional/stretch are always additional work. */
export function kindCanBePlanned(kind: TaskKind) {
  return kind === "core" || kind === "supporting";
}

export function isEligible(task: Quest) {
  return task.category !== "quran";
}

export function isPlannedEligible(task: Quest) {
  return isEligible(task) && task.planStatus === "planned" && kindCanBePlanned(task.kind);
}

export function tasksInWeek(tasks: Quest[], weekKey: string) {
  return tasks.filter((t) => t.weekKey === weekKey);
}

export function weekTarget(tasks: Quest[], weekKey: string) {
  return tasksInWeek(tasks, weekKey)
    .filter(isPlannedEligible)
    .reduce((sum, t) => sum + t.effortUnits, 0);
}

export interface DayBreakdown {
  day: string;
  /** Units scheduled on this day (planned + extra, eligible only). */
  scheduledUnits: number;
  /** Units completed on this day (by completion date), eligible only. */
  completedUnits: number;
}

export interface WeekProgress {
  weekKey: string;
  target: number;
  plannedDone: number;
  extraDone: number;
  extraCap: number;
  extraCounted: number;
  countedUnits: number;
  /** Rounded to one decimal for display. */
  score: number;
  remaining: number;
  coreGoals: CoreGoalResult[];
  coreGoalsAchieved: boolean;
  scoreMet: boolean;
  unlocked: boolean;
  days: DayBreakdown[];
  unscheduledUnits: number;
}

export function computeWeekProgress(
  tasks: Quest[],
  weekKey: string,
  plan: Pick<WeeklyPlan, "requirements" | "bonusCapPct"> | null,
): WeekProgress {
  const week = tasksInWeek(tasks, weekKey);
  const eligible = week.filter(isEligible);
  const planned = eligible.filter(isPlannedEligible);
  const extra = eligible.filter((t) => !isPlannedEligible(t));

  const target = planned.reduce((s, t) => s + t.effortUnits, 0);
  const plannedDone = planned.filter((t) => t.status === "done").reduce((s, t) => s + t.effortUnits, 0);
  const extraDone = extra.filter((t) => t.status === "done").reduce((s, t) => s + t.effortUnits, 0);
  const bonusCap = plan?.bonusCapPct ?? DEFAULT_BONUS_CAP_PCT;
  const extraCap = Math.floor((target * bonusCap) / 100);
  const extraCounted = Math.min(extraDone, extraCap);
  const countedUnits = plannedDone + extraCounted;

  const coreGoals = evaluateCoreGoals(week, plan?.requirements ?? []);
  const coreGoalsAchieved = coreGoals.every((g) => g.achieved);
  // Integer comparison avoids floating-point edge cases: counted/target > 0.75
  const scoreMet = target > 0 && countedUnits * 100 > UNLOCK_THRESHOLD_PCT * target;

  const days = weekDays(weekKey).map((day) => ({
    day,
    scheduledUnits: eligible.filter((t) => t.date === day).reduce((s, t) => s + t.effortUnits, 0),
    completedUnits: eligible
      .filter((t) => t.status === "done" && t.completedAt && toDayKey(new Date(t.completedAt)) === day)
      .reduce((s, t) => s + t.effortUnits, 0),
  }));

  return {
    weekKey,
    target,
    plannedDone,
    extraDone,
    extraCap,
    extraCounted,
    countedUnits,
    score: target > 0 ? Math.round((countedUnits / target) * 1000) / 10 : 0,
    remaining: Math.max(0, target - plannedDone),
    coreGoals,
    coreGoalsAchieved,
    scoreMet,
    unlocked: scoreMet && coreGoalsAchieved,
    days,
    unscheduledUnits: eligible.filter((t) => !t.date).reduce((s, t) => s + t.effortUnits, 0),
  };
}

export function evaluateCoreGoals(weekTasks: Quest[], requirements: WeeklyGoalRequirement[]): CoreGoalResult[] {
  return requirements.map((r) => {
    const completed = weekTasks.filter((t) => t.coreGoalId === r.goalId && t.status === "done" && isEligible(t)).length;
    return {
      goalId: r.goalId,
      title: r.title,
      areaId: r.areaId,
      completed,
      required: r.minCompleted,
      achieved: completed >= r.minCompleted,
    };
  });
}

/** Neutral, guilt-free explanation of the current unlock state. */
export function unlockExplanation(p: WeekProgress) {
  if (p.target === 0) return "Plan this week's work to start building toward the next level.";
  if (p.unlocked) return "Next level unlocked. Lovely, steady work this week.";
  const missing = p.coreGoals.filter((g) => !g.achieved).map((g) => g.title);
  const needUnits = Math.max(0, Math.floor((UNLOCK_THRESHOLD_PCT * p.target) / 100) + 1 - p.countedUnits);
  const parts: string[] = [];
  if (!p.scoreMet) parts.push(`${needUnits} more unit${needUnits === 1 ? "" : "s"} to pass ${UNLOCK_THRESHOLD_PCT}%`);
  if (missing.length) parts.push(`still open: ${missing.join(", ")}`);
  return `Not unlocked yet: ${parts.join("; ")}.`;
}

/**
 * Impact of a change on the targets of the weeks it touches.
 * Used to ask for confirmation before changing a confirmed plan.
 */
export function targetImpact(before: Quest[], after: Quest[], weekKeys: string[]) {
  return [...new Set(weekKeys)].map((weekKey) => ({
    weekKey,
    before: weekTarget(before, weekKey),
    after: weekTarget(after, weekKey),
  }));
}

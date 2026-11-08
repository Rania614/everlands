"use client";

import { usePlanStore } from "@/stores/planStore";
import { buildQuest, useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { NewQuestInput, Quest } from "@/types/quest";
import type { PlanChangeKind } from "@/types/plan";
import { formatDay, weekKeyOf } from "./dates";
import { ensurePlan, levelAt, weekStartSetting } from "./lifecycle";
import { computeWeekProgress, kindCanBePlanned, targetImpact, weekTarget } from "./progression";

/**
 * Every task mutation the UI performs goes through here so the weekly-plan
 * rules hold everywhere:
 *  - moving a task between days of the same week never touches the target;
 *  - any change that would alter a CONFIRMED week's target is shown to the
 *    user first (before → after) and written to the plan change log;
 *  - completing/undoing just recomputes.
 */

const tasks = () => useQuestStore.getState().quests;
const isActive = (weekKey: string) => usePlanStore.getState().plans[weekKey]?.status === "active";

export interface ActionOptions {
  /**
   * The UI already showed the target impact inline (e.g. "target 14 → 16" on
   * the save button) and the user chose it, so don't ask again. Still logged.
   */
  preconfirmed?: boolean;
}

/** Target changes a set of tasks would cause in CONFIRMED weeks (for inline previews). */
export function confirmedImpacts(next: Quest[], weeks: string[]) {
  return targetImpact(tasks(), next, weeks).filter((i) => i.before !== i.after && isActive(i.weekKey));
}

/** Preview of an update without applying it. */
export function previewUpdate(id: string, patch: Partial<Quest>) {
  const task = tasks().find((t) => t.id === id);
  if (!task) return [];
  const merged = normalizePatch(patch);
  const next = tasks().map((t) => (t.id === id ? { ...t, ...merged } : t));
  return confirmedImpacts(next, [task.weekKey, merged.weekKey ?? task.weekKey]);
}

export function previewRemove(id: string) {
  const task = tasks().find((t) => t.id === id);
  if (!task) return [];
  return confirmedImpacts(tasks().filter((t) => t.id !== id), [task.weekKey]);
}

/** Whether a new task for this week/kind/area needs the "plan or additional work" choice. */
export function needsPlanChoice(weekKey: string, kind: Quest["kind"], locationId: Quest["locationId"], category?: Quest["category"]) {
  const eligible = category !== "quran" && locationId !== "gardens";
  return kindCanBePlanned(kind) && eligible && isActive(weekKey);
}

function normalizePatch(patch: Partial<Quest>): Partial<Quest> {
  const merged: Partial<Quest> = { ...patch };
  if (merged.kind && !kindCanBePlanned(merged.kind)) merged.planStatus = "extra";
  return merged;
}

async function confirmImpact(next: Quest[], weeks: string[], kind: PlanChangeKind, title: string, actionLabel: string, opts?: ActionOptions) {
  const impacts = confirmedImpacts(next, weeks);
  if (!impacts.length) return true;
  const answer = opts?.preconfirmed ? "ok" : await useWorldStore.getState().ask({
    title: "Change the weekly target?",
    message: `“${title}” is part of a confirmed weekly plan. This will change the target:`,
    lines: impacts.map((i) => `Week of ${formatDay(i.weekKey, { month: "short", day: "numeric" })}: ${i.before} → ${i.after} units`),
    actions: [{ id: "ok", label: actionLabel, variant: "primary" }],
  });
  if (answer !== "ok") return false;
  for (const i of impacts) {
    usePlanStore.getState().logChange({ weekKey: i.weekKey, kind, taskTitle: title, targetBefore: i.before, targetAfter: i.after });
  }
  return true;
}

/** Adds a task. In a confirmed week, asks whether it joins the plan or counts as additional work. */
export async function addTask(input: NewQuestInput): Promise<Quest | null> {
  ensurePlan(input.weekKey);
  let planStatus = input.planStatus;
  if (planStatus && needsPlanChoice(input.weekKey, input.kind, input.locationId, input.category)) {
    // The choice was made inline in the form; record it in the plan log.
    const before = weekTarget(tasks(), input.weekKey);
    const units = buildQuest({ ...input, planStatus }).effortUnits;
    usePlanStore.getState().logChange({
      weekKey: input.weekKey,
      kind: planStatus === "planned" ? "add-planned" : "add-extra",
      taskTitle: input.title,
      targetBefore: before,
      targetAfter: planStatus === "planned" ? before + units : before,
    });
  }
  if (!planStatus && needsPlanChoice(input.weekKey, input.kind, input.locationId, input.category)) {
    const draft = buildQuest({ ...input, planStatus: "planned" });
    const before = weekTarget(tasks(), input.weekKey);
    const after = before + draft.effortUnits;
    const choice = await useWorldStore.getState().ask({
      title: "This week's plan is already confirmed",
      message: "Should this task change the weekly target, or count as additional work?",
      lines: [
        `Add to plan: target ${before} → ${after} units.`,
        "Additional work: target stays at " + before + " units; completed extra work counts up to the bonus limit.",
      ],
      actions: [
        { id: "extra", label: "Count as additional work", variant: "secondary" },
        { id: "plan", label: `Add to plan (${after} units)`, variant: "primary" },
      ],
    });
    if (!choice) return null;
    planStatus = choice === "plan" ? "planned" : "extra";
    usePlanStore.getState().logChange({
      weekKey: input.weekKey,
      kind: planStatus === "planned" ? "add-planned" : "add-extra",
      taskTitle: input.title,
      targetBefore: before,
      targetAfter: planStatus === "planned" ? after : before,
    });
  }
  return useQuestStore.getState().addQuest({ ...input, planStatus });
}

export async function updateTask(id: string, patch: Partial<Quest>, opts?: ActionOptions) {
  const task = tasks().find((t) => t.id === id);
  if (!task) return false;
  const merged = normalizePatch(patch);
  const next = tasks().map((t) => (t.id === id ? { ...t, ...merged } : t));
  const kind: PlanChangeKind =
    patch.weekKey && patch.weekKey !== task.weekKey ? "move-week" : patch.kind && patch.kind !== task.kind ? "kind" : "effort";
  const ok = await confirmImpact(next, [task.weekKey, merged.weekKey ?? task.weekKey], kind, task.title, "Save change", opts);
  if (!ok) return false;
  if (merged.weekKey && merged.weekKey !== task.weekKey) ensurePlan(merged.weekKey);
  useQuestStore.getState().updateQuest(id, merged);
  return true;
}

/** Moves a task to a day (or "any day" of its week). Same-week moves never change the target. */
export async function moveTask(id: string, date: string | null, opts?: ActionOptions) {
  const task = tasks().find((t) => t.id === id);
  if (!task) return false;
  const weekKey = date ? weekKeyOf(date, weekStartSetting()) : task.weekKey;
  if (weekKey === task.weekKey) {
    useQuestStore.getState().updateQuest(id, { date });
    return true;
  }
  ensurePlan(weekKey);
  // Joining a confirmed week counts as additional work unless the user re-plans it.
  const planStatus = kindCanBePlanned(task.kind) && !isActive(weekKey) ? "planned" : "extra";
  return updateTask(id, { date, weekKey, planStatus }, opts);
}

export async function removeTask(id: string, opts?: ActionOptions) {
  const task = tasks().find((t) => t.id === id);
  if (!task) return false;
  const next = tasks().filter((t) => t.id !== id);
  const ok = await confirmImpact(next, [task.weekKey], "remove", task.title, "Remove task", opts);
  if (!ok) return false;
  useQuestStore.getState().removeQuest(id);
  return true;
}

/** Ready ⇄ In progress (completion is its own action). */
export function cycleStatus(id: string) {
  const task = tasks().find((t) => t.id === id);
  if (!task || task.status === "done") return;
  useQuestStore.getState().setStatus(id, task.status === "todo" ? "in_progress" : "todo");
}

export function startTask(id: string) {
  const task = tasks().find((t) => t.id === id);
  if (task?.status === "todo") useQuestStore.getState().setStatus(id, "in_progress");
}

export function completeTask(id: string) {
  const task = tasks().find((t) => t.id === id);
  if (!task || task.status === "done") return;
  const plan = usePlanStore.getState().plans[task.weekKey] ?? null;
  const before = computeWeekProgress(tasks(), task.weekKey, plan);
  useQuestStore.getState().setStatus(id, "done");
  const world = useWorldStore.getState();

  if (task.category === "quran") {
    // A quiet acknowledgement only: no celebration, score or reward for worship.
    world.notify(`${task.title} noted`, "May it stay with you.");
    return;
  }
  const after = computeWeekProgress(tasks(), task.weekKey, plan);
  if (!before.unlocked && after.unlocked) {
    world.celebrate("Next level unlocked", `Level ${levelAt(task.weekKey) + 1} opens when this week ends. Weekly score ${after.score}%.`);
    return;
  }
  const goal = after.coreGoals.find((g) => g.goalId === task.coreGoalId);
  const goalNow = goal?.achieved && !before.coreGoals.find((g) => g.goalId === goal.goalId)?.achieved;
  world.celebrate(
    `${task.title} complete`,
    goalNow ? `${goal!.title} core goal achieved. Weekly score ${after.score}%.` : `+${task.effortUnits} unit${task.effortUnits === 1 ? "" : "s"} · weekly score ${after.score}%.`,
  );
}

export function reopenTask(id: string) {
  const task = tasks().find((t) => t.id === id);
  if (task?.status === "done") useQuestStore.getState().setStatus(id, "todo");
}

export function toggleTask(id: string) {
  const task = tasks().find((t) => t.id === id);
  if (!task) return;
  if (task.status === "done") reopenTask(id);
  else completeTask(id);
}

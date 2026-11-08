import type { Quest } from "@/types/quest";
import type { WeeklyGoalRequirement } from "@/types/plan";

export const WEEK = "2026-11-07"; // a Saturday (week starts Saturday)

let n = 0;
export function task(p: Partial<Quest> = {}): Quest {
  n++;
  return {
    id: `t${n}`,
    title: `Task ${n}`,
    locationId: "castle",
    category: "english",
    durationMin: 30,
    status: "todo",
    slot: "morning",
    weekKey: WEEK,
    date: WEEK,
    effort: "M",
    effortUnits: 2,
    kind: "supporting",
    planStatus: "planned",
    custom: true,
    createdAt: "2026-11-07T08:00:00",
    completedAt: null,
    ...p,
  };
}

/** Marks a task done on a given local day. */
export function doneOn(t: Quest, day: string): Quest {
  return { ...t, status: "done", completedAt: new Date(`${day}T12:00:00`).toISOString() };
}

export const REQS: WeeklyGoalRequirement[] = [
  { goalId: "goal-english", areaId: "english", title: "English", condition: "", minCompleted: 2 },
  { goalId: "goal-tech", areaId: "tech", title: "Technical", condition: "", minCompleted: 2 },
];

export const plan = { requirements: REQS, bonusCapPct: 25 };

import type { QuestCategory } from "./quest";
import type { LocationId } from "./world";

export interface GrowthArea {
  id: QuestCategory;
  name: string;
  locationId: LocationId;
  color: string;
  /** Quran is false: tracked separately, never scored. */
  countsTowardScore: boolean;
}

/** A requirement template inside a Core Goal (becomes a task each week). */
export interface CoreGoalRequirementTemplate {
  id: string;
  title: string;
  effort: "S" | "M" | "L";
}

/** Mandatory minimum commitment for a growth area. User-configurable. */
export interface CoreGoal {
  id: string;
  areaId: QuestCategory;
  title: string;
  /** What "done" means, in words (shown before the week starts). */
  condition: string;
  requirements: CoreGoalRequirementTemplate[];
  /** Minimum number of linked tasks that must be completed in the week. */
  minCompleted: number;
  /** Inactive goals do not apply to future weeks. Active weeks keep their snapshot. */
  active: boolean;
}

/** Snapshot of a Core Goal taken when a week's plan is created; never changes silently. */
export interface WeeklyGoalRequirement {
  goalId: string;
  areaId: QuestCategory;
  title: string;
  condition: string;
  minCompleted: number;
}

export type WeeklyPlanStatus = "planning" | "active" | "closed";

export interface WeeklyPlan {
  weekKey: string;
  status: WeeklyPlanStatus;
  createdAt: string;
  /** Local day the plan was created; planning stays open through this day. */
  createdOn: string;
  confirmedAt: string | null;
  /** Target at confirmation time, for transparency. */
  confirmedTarget: number | null;
  requirements: WeeklyGoalRequirement[];
  /** Max additional work that can count, as % of the target. */
  bonusCapPct: number;
}

export type PlanChangeKind =
  | "confirm"
  | "auto-confirm"
  | "add-planned"
  | "add-extra"
  | "remove"
  | "effort"
  | "kind"
  | "move-week";

/** Audit trail of changes to an active weekly plan. */
export interface PlanChange {
  id: string;
  weekKey: string;
  at: string;
  kind: PlanChangeKind;
  taskTitle?: string;
  targetBefore: number;
  targetAfter: number;
  note?: string;
}

export interface CoreGoalResult {
  goalId: string;
  title: string;
  areaId: QuestCategory;
  completed: number;
  required: number;
  achieved: boolean;
}

/** Frozen result of a finished week. */
export interface WeeklyProgressRecord {
  weekKey: string;
  weekNumber: number;
  level: number;
  target: number;
  plannedDone: number;
  extraCounted: number;
  countedUnits: number;
  score: number;
  coreGoals: CoreGoalResult[];
  unlocked: boolean;
  closedAt: string;
}

/**
 * Append-only log of meaningful progress the 3D world can later turn into
 * permanent growth. Never removed. Quran progress never produces milestones.
 */
export type MilestoneType = "level-unlocked" | "course-level-completed" | "project-completed" | "personal-milestone";

export interface WorldMilestone {
  id: string;
  type: MilestoneType;
  locationId: LocationId;
  title: string;
  at: string;
  refId?: string;
}

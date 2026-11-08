import type { LocationId } from "./world";

export type QuestStatus = "todo" | "in_progress" | "done";
export type DaySlot = "morning" | "afternoon" | "evening";

/**
 * Growth area of a task. Each area maps to a world location (see data/growthAreas).
 * `quran` tasks are tracked independently and never count toward the Weekly Score.
 */
export type QuestCategory = "quran" | "english" | "tech" | "personal";

/** Size of a task in work units: S = 1, M = 2, L = 3, custom = user value. */
export type EffortSize = "S" | "M" | "L" | "custom";

/**
 * Role of a task in its weekly plan.
 * - core: fulfils a Core Goal requirement; part of the weekly target.
 * - supporting: planned learning work; part of the weekly target.
 * - optional / stretch: never in the target; counts as additional work (capped).
 */
export type TaskKind = "core" | "supporting" | "optional" | "stretch";

/**
 * - planned: included in the week's target (denominator).
 * - extra: genuine additional work; adds to completed units only, up to the bonus cap.
 */
export type PlanStatus = "planned" | "extra";

/** Optional checklist item inside a task. */
export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

/**
 * A task ("quest" in the UI). Flat and serialisable so it maps 1:1 to a future
 * `tasks` table. A task belongs to exactly one week (`weekKey`); `date` is the
 * optional day inside that week. Moving between days never changes `weekKey`.
 */
export interface Quest {
  id: string;
  title: string;
  description?: string;
  locationId: LocationId;
  category: QuestCategory;
  durationMin: number;
  status: QuestStatus;
  slot: DaySlot;

  /** First day of the week this task belongs to (local day key). */
  weekKey: string;
  /** Scheduled day within the week, or null for "any day this week". */
  date: string | null;
  effort: EffortSize;
  effortUnits: number;
  kind: TaskKind;
  planStatus: PlanStatus;

  /** Optional relations. */
  coreGoalId?: string | null;
  lessonId?: string | null;
  eventId?: string | null;
  quranExamId?: string | null;

  /** Optional checklist; never affects effort units or the score. */
  subtasks?: Subtask[];

  /** True for user-created tasks (sample quests cannot be deleted). */
  custom: boolean;
  createdAt: string;
  /** ISO timestamp; its local day is when the work counts as done. */
  completedAt: string | null;
}

export interface NewQuestInput {
  title: string;
  locationId: LocationId;
  category?: QuestCategory;
  durationMin: number;
  slot: DaySlot;
  weekKey: string;
  date: string | null;
  effort: EffortSize;
  effortUnits?: number;
  kind: TaskKind;
  planStatus?: PlanStatus;
  description?: string;
  coreGoalId?: string | null;
  lessonId?: string | null;
  eventId?: string | null;
  quranExamId?: string | null;
}

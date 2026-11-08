import type { QuestCategory } from "./quest";
import type { LocationId } from "./world";

/* ------------------------------ Courses ------------------------------ */

export interface Course {
  id: string;
  title: string;
  areaId: QuestCategory;
  locationId: LocationId;
  /** Lessons per course level unless overridden (8 for the English course). */
  defaultLessonCount: number;
}

export type CourseLevelStatus = "active" | "completed";

/** The user's position in an external course (e.g. "A2"). Not an Everlands Level. */
export interface CourseLevel {
  id: string;
  courseId: string;
  name: string;
  lessonCount: number;
  status: CourseLevelStatus;
  startedAt: string;
  completedAt: string | null;
  summary?: string;
}

export type LessonStatus = "upcoming" | "scheduled" | "attended" | "missed" | "completed" | "rescheduled";

export interface LessonResource {
  id: string;
  label: string;
  url?: string;
}

export interface Lesson {
  id: string;
  levelId: string;
  number: number;
  title: string;
  description: string;
  date: string | null;
  time: string | null;
  status: LessonStatus;
  /** Attendance is recorded separately from completion and homework. */
  attended: boolean;
  content: string;
  resources: LessonResource[];
  notes: string;
  /** Optional self-assessment, 1–5. */
  understanding: number | null;
  /** Previous dates when a lesson was rescheduled. */
  rescheduledFrom: string[];
}

/* ------------------------------- Quran -------------------------------- */

export type QuranActivity = "memorization" | "revision" | "tathbit" | "exam-prep" | "assessment";
export type QuranSessionStatus = "planned" | "completed";
export type QuranResult = "excellent" | "good" | "needs-review";

export interface QuranSession {
  id: string;
  date: string;
  time: string | null;
  surah: string;
  fromAyah: number | null;
  toAyah: number | null;
  fromPage: number | null;
  toPage: number | null;
  activity: QuranActivity;
  status: QuranSessionStatus;
  notes: string;
  result: QuranResult | null;
  nextRevisionDate: string | null;
  examId: string | null;
}

export interface QuranExam {
  id: string;
  title: string;
  date: string;
  time: string | null;
  ranges: string;
  requiredRounds: number;
  roundsCompleted: number;
  notes: string;
  result: string;
  status: "upcoming" | "done";
}

export type EventType =
  | "class"
  | "quran-class"
  | "exam"
  | "appointment"
  | "meeting"
  | "interview"
  | "lecture"
  | "deadline"
  | "personal"
  | "other";

export type RecurrenceFreq = "daily" | "weekly" | "monthly";

export interface Recurrence {
  freq: RecurrenceFreq;
  interval: number;
  /** Last possible occurrence day (inclusive), or null for no end. */
  until: string | null;
}

export interface ExamDetails {
  subject: string;
  notes: string;
  status: "upcoming" | "completed";
  result: string;
}

/**
 * A real-world commitment. Events are never tasks; tasks may point to an
 * event via `Quest.eventId` (e.g. exam preparation).
 */
export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  location: string;
  description: string;
  /** Minutes before start (or 9:00 for all-day) to remind; null = none. */
  reminderMinutes: number | null;
  color: string;
  recurrence: Recurrence | null;
  courseLevelId: string | null;
  lessonId: string | null;
  /** Present when type === "exam": the dedicated exam experience. */
  exam: ExamDetails | null;
  createdAt: string;
}

/** One rendered calendar row; derived on the fly, never stored. */
export type CalendarEntryKind = "event" | "lesson" | "quran-session" | "quran-exam" | "task";

export interface CalendarEntry {
  key: string;
  kind: CalendarEntryKind;
  refId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  title: string;
  subtitle?: string;
  color: string;
  done?: boolean;
  eventType?: EventType;
}

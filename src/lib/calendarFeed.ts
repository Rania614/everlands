import { GROWTH_AREAS } from "@/data/growthAreas";
import { PALETTE } from "@/lib/constants";
import type { CalendarEntry, CalendarEvent, EventType } from "@/types/calendar";
import type { CourseLevel, Lesson, QuranExam, QuranSession } from "@/types/learning";
import type { Quest } from "@/types/quest";
import { diffDays, timeToMinutes } from "./dates";
import { nextOccurrence, occurrencesInRange } from "./recurrence";

export const EVENT_TYPES: { id: EventType; label: string; color: string }[] = [
  { id: "class", label: "Class", color: "#7E9CC4" },
  { id: "quran-class", label: "Quran class", color: PALETTE.forestGreen },
  { id: "exam", label: "Exam", color: "#C9776A" },
  { id: "appointment", label: "Appointment", color: PALETTE.softPurple },
  { id: "meeting", label: "Meeting", color: PALETTE.twilightBlue },
  { id: "interview", label: "Interview", color: "#B88A4E" },
  { id: "lecture", label: "Lecture", color: PALETTE.skyBlue },
  { id: "deadline", label: "Deadline", color: PALETTE.coral },
  { id: "personal", label: "Personal", color: PALETTE.warmGold },
  { id: "other", label: "Other", color: "#9C93A8" },
];
export const EVENT_TYPE_MAP = Object.fromEntries(EVENT_TYPES.map((t) => [t.id, t])) as Record<EventType, (typeof EVENT_TYPES)[number]>;

export const EVENT_COLORS = ["#7E9CC4", PALETTE.forestGreen, "#C9776A", PALETTE.softPurple, PALETTE.warmGold, PALETTE.coral, PALETTE.skyBlue, "#9C93A8"];

export interface FeedSources {
  events: CalendarEvent[];
  lessons: Lesson[];
  levels: CourseLevel[];
  sessions: QuranSession[];
  quranExams: QuranExam[];
  tasks: Quest[];
}

/**
 * Builds the calendar rows for [from, to]. Each source record yields one row
 * per occurrence; nothing is copied into another store, so editing a record
 * updates every view at once.
 */
export function buildFeed(src: FeedSources, from: string, to: string): CalendarEntry[] {
  const out: CalendarEntry[] = [];

  for (const e of src.events) {
    for (const date of occurrencesInRange(e, from, to)) {
      out.push({
        key: `event:${e.id}@${date}`,
        kind: "event",
        refId: e.id,
        date,
        startTime: e.allDay ? null : e.startTime,
        endTime: e.allDay ? null : e.endTime,
        allDay: e.allDay || !e.startTime,
        title: e.title,
        subtitle: EVENT_TYPE_MAP[e.type]?.label,
        color: e.color || EVENT_TYPE_MAP[e.type]?.color,
        eventType: e.type,
        done: e.exam?.status === "completed",
      });
    }
  }

  const levelName = new Map(src.levels.map((l) => [l.id, l.name]));
  for (const l of src.lessons) {
    if (!l.date || l.date < from || l.date > to) continue;
    out.push({
      key: `lesson:${l.id}`,
      kind: "lesson",
      refId: l.id,
      date: l.date,
      startTime: l.time,
      endTime: null,
      allDay: !l.time,
      title: `English ${levelName.get(l.levelId) ?? ""} · ${l.title}`.replace("  ", " "),
      subtitle: "Lesson",
      color: GROWTH_AREAS.english.color,
      done: l.status === "completed",
    });
  }

  for (const s of src.sessions) {
    if (s.date < from || s.date > to) continue;
    out.push({
      key: `qs:${s.id}`,
      kind: "quran-session",
      refId: s.id,
      date: s.date,
      startTime: s.time,
      endTime: null,
      allDay: !s.time,
      title: `Quran · ${s.surah || "Session"}`,
      subtitle: s.activity,
      color: GROWTH_AREAS.quran.color,
      done: s.status === "completed",
    });
  }

  for (const x of src.quranExams) {
    if (x.date < from || x.date > to) continue;
    out.push({
      key: `qe:${x.id}`,
      kind: "quran-exam",
      refId: x.id,
      date: x.date,
      startTime: x.time,
      endTime: null,
      allDay: !x.time,
      title: x.title,
      subtitle: "Quran exam",
      color: GROWTH_AREAS.quran.color,
      done: x.status === "done",
    });
  }

  for (const t of src.tasks) {
    if (!t.date || t.date < from || t.date > to) continue;
    out.push({
      key: `task:${t.id}`,
      kind: "task",
      refId: t.id,
      date: t.date,
      startTime: null,
      endTime: null,
      allDay: true,
      title: t.title,
      subtitle: "Task",
      color: GROWTH_AREAS[t.category]?.color ?? PALETTE.twilightBlue,
      done: t.status === "done",
    });
  }

  return out.sort(compareEntries);
}

const KIND_ORDER: Record<CalendarEntry["kind"], number> = { event: 0, "quran-exam": 1, lesson: 2, "quran-session": 3, task: 4 };

/** All-day items first, then timed items by start time, then dated tasks. */
function band(e: CalendarEntry) {
  if (e.kind === "task") return 2;
  return e.allDay ? 0 : 1;
}

export function compareEntries(a: CalendarEntry, b: CalendarEntry) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (band(a) !== band(b)) return band(a) - band(b);
  if (a.startTime && b.startTime && a.startTime !== b.startTime) return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
}

export interface UpcomingItem {
  label: string;
  title: string;
  date: string;
  time: string | null;
  daysAway: number;
  color: string;
  view: "course" | "quran" | "calendar";
  focus: { lessonId?: string; eventId?: string; quranExamId?: string; date?: string };
}

/** The calm summary shown on World Home. */
export function upcomingSummary(src: FeedSources, today: string): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  const lesson = src.lessons
    .filter((l) => l.date && l.date >= today && l.status !== "completed" && l.status !== "attended")
    .sort((a, b) => (a.date! + (a.time ?? "")).localeCompare(b.date! + (b.time ?? "")))[0];
  const nextClass = src.events
    .filter((e) => e.type === "class" || e.lessonId || e.courseLevelId)
    .map((e) => ({ e, d: nextOccurrence(e, today) }))
    .filter((x) => x.d)
    .sort((a, b) => (a.d! + (a.e.startTime ?? "")).localeCompare(b.d! + (b.e.startTime ?? "")))[0];
  if (nextClass && (!lesson || nextClass.d! < lesson.date!)) {
    items.push({ label: nextClass.e.lessonId || nextClass.e.courseLevelId || /english/i.test(nextClass.e.title) ? "Next English lesson" : "Next class", title: nextClass.e.title, date: nextClass.d!, time: nextClass.e.startTime, daysAway: diffDays(today, nextClass.d!), color: GROWTH_AREAS.english.color, view: "calendar", focus: { eventId: nextClass.e.id, date: nextClass.d! } });
  } else if (lesson) {
    items.push({ label: "Next English lesson", title: lesson.title, date: lesson.date!, time: lesson.time, daysAway: diffDays(today, lesson.date!), color: GROWTH_AREAS.english.color, view: "course", focus: { lessonId: lesson.id } });
  }

  const session = src.sessions.filter((s) => s.date >= today && s.status === "planned").sort((a, b) => a.date.localeCompare(b.date))[0];
  const quranClass = src.events
    .filter((e) => e.type === "quran-class")
    .map((e) => ({ e, d: nextOccurrence(e, today) }))
    .filter((x) => x.d)
    .sort((a, b) => a.d!.localeCompare(b.d!))[0];
  if (session && (!quranClass || session.date <= quranClass.d!)) {
    items.push({ label: "Next Quran session", title: session.surah || "Session", date: session.date, time: session.time, daysAway: diffDays(today, session.date), color: GROWTH_AREAS.quran.color, view: "quran", focus: {} });
  } else if (quranClass) {
    items.push({ label: "Next Quran session", title: quranClass.e.title, date: quranClass.d!, time: quranClass.e.startTime, daysAway: diffDays(today, quranClass.d!), color: GROWTH_AREAS.quran.color, view: "calendar", focus: { eventId: quranClass.e.id, date: quranClass.d! } });
  }

  const exams = [
    ...src.events.filter((e) => e.type === "exam" && e.exam?.status !== "completed").map((e) => ({ title: e.title, date: nextOccurrence(e, today), time: e.startTime, view: "calendar" as const, focus: { eventId: e.id } })),
    ...src.quranExams.filter((x) => x.status === "upcoming" && x.date >= today).map((x) => ({ title: x.title, date: x.date, time: x.time, view: "quran" as const, focus: { quranExamId: x.id } })),
  ]
    .filter((x): x is typeof x & { date: string } => !!x.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (exams[0]) {
    const x = exams[0];
    items.push({ label: "Nearest exam", title: x.title, date: x.date, time: x.time, daysAway: diffDays(today, x.date), color: "#C9776A", view: x.view, focus: { ...x.focus, date: x.date } });
  }

  const deadline = src.events
    .filter((e) => e.type === "deadline")
    .map((e) => ({ e, d: nextOccurrence(e, today) }))
    .filter((x) => x.d)
    .sort((a, b) => a.d!.localeCompare(b.d!))[0];
  if (deadline) {
    items.push({ label: "Deadline", title: deadline.e.title, date: deadline.d!, time: deadline.e.startTime, daysAway: diffDays(today, deadline.d!), color: PALETTE.coral, view: "calendar", focus: { eventId: deadline.e.id, date: deadline.d! } });
  }
  return items;
}

import type { QuranActivity } from "@/types/learning";
import { addDays, weekKeyOf, type WeekStart } from "./dates";

/**
 * Small pure helpers behind Quick Add. Kept here (not in components) so the
 * defaults are predictable and unit-tested.
 */

export interface DayChoice {
  id: "today" | "tomorrow" | "week" | "pick";
  label: string;
  date: string | null;
}

/** Fast day choices: Today, Tomorrow, "This week" (any day), or a picked date. */
export function dayChoices(today: string): DayChoice[] {
  return [
    { id: "today", label: "Today", date: today },
    { id: "tomorrow", label: "Tomorrow", date: addDays(today, 1) },
    { id: "week", label: "This week", date: null },
    { id: "pick", label: "Pick date", date: null },
  ];
}

/** Week a quick-added task belongs to: its date's week, or the current week. */
export function weekForDate(date: string | null, today: string, weekStart: WeekStart, fallbackWeek?: string) {
  if (date) return weekKeyOf(date, weekStart);
  return fallbackWeek ?? weekKeyOf(today, weekStart);
}

/** No time means an all-day event. */
export function isAllDay(startTime: string | null | undefined) {
  return !startTime;
}

/** Recording a session for today or the past usually means it already happened. */
export function defaultQuranDone(date: string, today: string) {
  return date <= today;
}

export interface ParsedQuranRange {
  surah: string;
  fromAyah: number | null;
  toAyah: number | null;
  fromPage: number | null;
  toPage: number | null;
}

/**
 * One friendly field instead of five. Understands:
 *   "Al-Mulk"            → surah only
 *   "Al-Mulk 1-15"       → ayah range
 *   "Al-Mulk 1–15"       → ayah range (en dash)
 *   "Al-Mulk p562-564"   → page range (also "page 562", "pages 562-564", "ص 562")
 *   "p 562"              → page only
 */
export function parseQuranInput(input: string): ParsedQuranRange {
  const text = input.trim().replace(/[–—]/g, "-");
  const out: ParsedQuranRange = { surah: text, fromAyah: null, toAyah: null, fromPage: null, toPage: null };
  const page = text.match(/(?:^|\s)(?:p\.?|pages?|ص)\s*(\d+)(?:\s*-\s*(\d+))?\s*$/i);
  if (page) {
    out.fromPage = Number(page[1]);
    out.toPage = page[2] ? Number(page[2]) : null;
    out.surah = text.slice(0, page.index).trim();
    return out;
  }
  const ayah = text.match(/\s(\d+)(?:\s*-\s*(\d+))?\s*$/);
  if (ayah && ayah.index! > 0) {
    out.fromAyah = Number(ayah[1]);
    out.toAyah = ayah[2] ? Number(ayah[2]) : null;
    out.surah = text.slice(0, ayah.index).trim();
  }
  return out;
}

/** Inverse of parseQuranInput, for showing an existing session in the quick field. */
export function formatQuranInput(s: ParsedQuranRange) {
  let out = s.surah;
  if (s.fromAyah) out += ` ${s.fromAyah}${s.toAyah ? `-${s.toAyah}` : ""}`;
  if (s.fromPage) out += ` p${s.fromPage}${s.toPage ? `-${s.toPage}` : ""}`;
  return out.trim();
}

export const QURAN_QUICK_ACTIVITIES: { id: QuranActivity; label: string }[] = [
  { id: "revision", label: "Revision" },
  { id: "memorization", label: "Memorization" },
  { id: "tathbit", label: "Tathbit" },
];

/** One-tap preparation tasks offered right after an exam is saved. */
export const EXAM_PREP_TEMPLATES = ["Revise lecture notes", "Solve practice questions", "Review previous exams", "Make a summary sheet"];

/** One-tap homework for a lesson. */
export const HOMEWORK_TEMPLATES = ["Vocabulary homework", "Speaking practice", "Watch the assigned video", "Revise grammar"];

export const QURAN_EXAM_PREP_TEMPLATES = ["Revise the assigned pages", "Recite to a partner", "Full revision round"];

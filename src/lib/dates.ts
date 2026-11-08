/**
 * Local-calendar date helpers. All app dates are stored as local day keys
 * ("YYYY-MM-DD") and optional "HH:mm" times, never as UTC timestamps, so a
 * task scheduled for Tuesday stays on Tuesday across time zones and DST.
 * Day arithmetic uses Date#setDate (calendar days), never +86_400_000 ms.
 */

/** JS weekday index (0 = Sunday … 6 = Saturday). */
export type WeekStart = 0 | 1 | 6;

export const WEEK_START_OPTIONS: { id: WeekStart; label: string }[] = [
  { id: 6, label: "Saturday" },
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
];

export function toDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(now = new Date()) {
  return toDayKey(now);
}

/** Local midnight of a day key. */
export function parseDayKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number) {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

export function addMonths(key: string, months: number) {
  const d = parseDayKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toDayKey(d);
}

/** Calendar-day difference b − a (DST-safe: compares UTC midnights of the local dates). */
export function diffDays(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export function weekday(key: string) {
  return parseDayKey(key).getDay();
}

/** Key of the first day of the week containing `key`. This is the week's id. */
export function weekKeyOf(key: string, weekStart: WeekStart) {
  const diff = (weekday(key) - weekStart + 7) % 7;
  return addDays(key, -diff);
}

export function weekDays(weekKey: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekKey, i));
}

export function isInWeek(key: string, weekKey: string) {
  const d = diffDays(weekKey, key);
  return d >= 0 && d < 7;
}

/** 1-based index of a week counted from the week containing `journeyStart`. */
export function weekNumber(weekKey: string, journeyStart: string, weekStart: WeekStart) {
  const first = weekKeyOf(journeyStart, weekStart);
  return Math.floor(diffDays(first, weekKey) / 7) + 1;
}

export function monthKeyOf(key: string) {
  return key.slice(0, 7);
}

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return parseDayKey(key).toLocaleDateString("en", opts);
}

export function formatTime(time?: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

/** "today", "tomorrow", "in 5 days", "3 days ago" */
export function relativeDays(from: string, to: string) {
  const n = diffDays(from, to);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** Minutes since midnight for an "HH:mm" string. */
export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

import type { CalendarEvent } from "@/types/calendar";
import { addDays, addMonths, diffDays } from "./dates";

const MAX_OCCURRENCES = 500;

/**
 * Day keys on which an event occurs within [from, to] (inclusive).
 * Recurring events are expanded on the fly; only the series is stored.
 */
export function occurrencesInRange(event: CalendarEvent, from: string, to: string): string[] {
  const r = event.recurrence;
  if (!r) return event.date >= from && event.date <= to ? [event.date] : [];

  const out: string[] = [];
  const interval = Math.max(1, r.interval);
  const end = r.until && r.until < to ? r.until : to;
  let i = 0;
  let current = event.date;

  // Jump close to `from` for daily/weekly series to avoid long loops.
  if (r.freq !== "monthly" && current < from) {
    const step = r.freq === "daily" ? interval : interval * 7;
    const skips = Math.floor(diffDays(current, from) / step);
    current = addDays(current, skips * step);
    i = skips;
  }

  while (current <= end && out.length < MAX_OCCURRENCES) {
    if (current >= from) out.push(current);
    i++;
    if (r.freq === "daily") current = addDays(event.date, i * interval);
    else if (r.freq === "weekly") current = addDays(event.date, i * interval * 7);
    else current = addMonths(event.date, i * interval);
  }
  return out;
}

export function nextOccurrence(event: CalendarEvent, fromDay: string, horizonDays = 400) {
  return occurrencesInRange(event, fromDay, addDays(fromDay, horizonDays))[0] ?? null;
}

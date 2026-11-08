"use client";

import { useEffect } from "react";
import { addDays, formatTime, timeToMinutes, todayKey } from "@/lib/dates";
import { occurrencesInRange } from "@/lib/recurrence";
import { useCalendarStore } from "@/stores/calendarStore";
import { useWorldStore } from "@/stores/worldStore";

const shown = new Set<string>();

/**
 * In-app reminders: while Everlands is open, shows a quiet notice when an
 * event's reminder time arrives. (Background/OS notifications are a later milestone.)
 */
export function ReminderWatcher() {
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const today = todayKey(now);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      for (const e of useCalendarStore.getState().events) {
        if (e.reminderMinutes == null) continue;
        for (const day of occurrencesInRange(e, today, addDays(today, 1))) {
          const start = e.allDay || !e.startTime ? 9 * 60 : timeToMinutes(e.startTime);
          const dayOffset = day === today ? 0 : 24 * 60;
          const minutesUntil = start + dayOffset - nowMin;
          const key = `${e.id}@${day}`;
          if (minutesUntil <= e.reminderMinutes && minutesUntil >= -1 && !shown.has(key)) {
            shown.add(key);
            useWorldStore
              .getState()
              .notify(`Reminder: ${e.title}`, minutesUntil <= 0 ? "Starting now." : `${day === today ? "Today" : "Tomorrow"}${e.startTime && !e.allDay ? ` at ${formatTime(e.startTime)}` : ""}.`);
          }
        }
      }
    };
    const first = setTimeout(check, 1500);
    const id = setInterval(check, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return null;
}

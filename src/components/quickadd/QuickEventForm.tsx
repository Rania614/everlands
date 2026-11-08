"use client";

import { useState, type FormEvent } from "react";
import { EVENT_COLORS, EVENT_TYPES, EVENT_TYPE_MAP } from "@/lib/calendarFeed";
import { isAllDay } from "@/lib/quickAdd";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCourseStore } from "@/stores/courseStore";
import type { QuickAddContext } from "@/stores/worldStore";
import type { CalendarEvent, EventType, RecurrenceFreq } from "@/types/calendar";
import { Button } from "../ui/Button";
import { ChipGroup } from "../ui/ChipGroup";
import { Disclosure } from "../ui/Disclosure";
import { inputClass } from "../ui/Field";
import { ErrorText, FieldLabel } from "./fields";

/** Common types as chips; the rest live under More details. */
export const QUICK_EVENT_TYPES: EventType[] = ["class", "appointment", "meeting", "deadline", "personal"];

export const REMINDERS: { value: string; label: string }[] = [
  { value: "", label: "No reminder" },
  { value: "0", label: "At start" },
  { value: "10", label: "10 min before" },
  { value: "30", label: "30 min before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

export interface EventDraft {
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  reminder: string;
  color: string;
  freq: RecurrenceFreq | "";
  interval: number;
  until: string;
  lessonId: string;
  courseLevelId: string;
}

export function eventDraftFrom(e: CalendarEvent): EventDraft {
  return {
    title: e.title,
    type: e.type,
    date: e.date,
    startTime: e.allDay ? "" : (e.startTime ?? ""),
    endTime: e.allDay ? "" : (e.endTime ?? ""),
    location: e.location,
    description: e.description,
    reminder: e.reminderMinutes == null ? "" : String(e.reminderMinutes),
    color: e.color === EVENT_TYPE_MAP[e.type]?.color ? "" : e.color,
    freq: e.recurrence?.freq ?? "",
    interval: e.recurrence?.interval ?? 1,
    until: e.recurrence?.until ?? "",
    lessonId: e.lessonId ?? "",
    courseLevelId: e.courseLevelId ?? "",
  };
}

export function newEventDraft(today: string, ctx: QuickAddContext): EventDraft {
  return {
    title: ctx.title ?? "",
    type: "class",
    date: ctx.date ?? today,
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    reminder: "",
    color: "",
    freq: "",
    interval: 1,
    until: "",
    lessonId: ctx.lessonId ?? "",
    courseLevelId: "",
  };
}

/** Converts a draft to stored fields; keeps any field the form doesn't show (e.g. exam details). */
export function eventFromDraft(d: EventDraft, base?: CalendarEvent): Omit<CalendarEvent, "id" | "createdAt"> {
  const allDay = isAllDay(d.startTime);
  const lessons = useCourseStore.getState().lessons;
  const lesson = lessons.find((l) => l.id === d.lessonId);
  return {
    exam: null,
    ...(base ?? {}),
    title: d.title.trim(),
    type: d.type,
    date: d.date,
    allDay,
    startTime: allDay ? null : d.startTime,
    endTime: allDay || !d.endTime ? null : d.endTime,
    location: d.location.trim(),
    description: d.description.trim(),
    reminderMinutes: d.reminder === "" ? null : Number(d.reminder),
    color: d.color || EVENT_TYPE_MAP[d.type].color,
    recurrence: d.freq ? { freq: d.freq, interval: Math.max(1, d.interval), until: d.until || null } : null,
    lessonId: d.lessonId || null,
    courseLevelId: lesson?.levelId ?? (d.courseLevelId || null),
  };
}

export function validateEvent(d: EventDraft): string | null {
  if (!d.title.trim()) return "Add a title.";
  if (!d.date) return "Pick a date.";
  if (d.startTime && d.endTime && d.endTime < d.startTime) return "The end time is before the start time.";
  return null;
}

/** Level 1 fields: title, type, date, optional time. */
export function EventEssentials({ draft, set, error, idPrefix, showAllTypes = false }: { draft: EventDraft; set: (p: Partial<EventDraft>) => void; error: string | null; idPrefix: string; showAllTypes?: boolean }) {
  const types = showAllTypes || !QUICK_EVENT_TYPES.includes(draft.type) ? EVENT_TYPES.map((t) => t.id).filter((t) => t !== "exam" || draft.type === "exam") : QUICK_EVENT_TYPES;
  return (
    <>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-title`}>Event</FieldLabel>
        <input
          id={`${idPrefix}-title`}
          data-autofocus
          value={draft.title}
          maxLength={100}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. English class, Dentist"
          className={`${inputClass} h-11 text-base`}
          aria-invalid={!!error}
          aria-describedby={error ? `${idPrefix}-error` : undefined}
        />
        {error && <ErrorText id={`${idPrefix}-error`}>{error}</ErrorText>}
      </div>
      <div>
        <FieldLabel>Type</FieldLabel>
        <ChipGroup
          label="Type"
          size="sm"
          value={draft.type}
          onChange={(type) => set({ type })}
          options={types.map((id) => ({ id, label: EVENT_TYPE_MAP[id].label, color: EVENT_TYPE_MAP[id].color }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel htmlFor={`${idPrefix}-date`}>Date</FieldLabel>
          <input id={`${idPrefix}-date`} type="date" required value={draft.date} onChange={(e) => set({ date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor={`${idPrefix}-time`}>Time (optional)</FieldLabel>
          <input id={`${idPrefix}-time`} type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} className={inputClass} />
        </div>
      </div>
      <p className="-mt-1 text-xs text-ink-soft">{isAllDay(draft.startTime) ? "No time: saved as an all-day event." : "Timed event."}</p>
    </>
  );
}

/** Level 2: everything optional. */
export function EventDetails({ draft, set }: { draft: EventDraft; set: (p: Partial<EventDraft>) => void }) {
  const levels = useCourseStore((s) => s.levels);
  const lessons = useCourseStore((s) => s.lessons);
  return (
    <div className="space-y-3">
      <select aria-label="All event types" value={draft.type} onChange={(e) => set({ type: e.target.value as EventType })} className={inputClass}>
        {EVENT_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            Type: {t.label}
          </option>
        ))}
      </select>
      {draft.startTime && (
        <div>
          <FieldLabel htmlFor="ev-end">End time</FieldLabel>
          <input id="ev-end" type="time" value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} className={inputClass} />
        </div>
      )}
      <input aria-label="Location" placeholder="Location" value={draft.location} onChange={(e) => set({ location: e.target.value })} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Reminder" value={draft.reminder} onChange={(e) => set({ reminder: e.target.value })} className={inputClass}>
          {REMINDERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select aria-label="Repeats" value={draft.freq} onChange={(e) => set({ freq: e.target.value as RecurrenceFreq | "" })} className={inputClass}>
          <option value="">Doesn&apos;t repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {draft.freq && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-ink-soft">
            Every
            <input type="number" min={1} max={12} value={draft.interval} onChange={(e) => set({ interval: Number(e.target.value) })} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs font-bold text-ink-soft">
            Until (optional)
            <input type="date" value={draft.until} onChange={(e) => set({ until: e.target.value })} className={`${inputClass} mt-1`} />
          </label>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Color">
        <span className="mr-1 text-xs font-bold text-ink-soft">Color</span>
        {["", ...EVENT_COLORS].map((c) => (
          <button
            key={c || "auto"}
            type="button"
            role="radio"
            aria-checked={draft.color === c}
            aria-label={c ? `Color ${c}` : "Color by type"}
            onClick={() => set({ color: c })}
            className={cn("h-6 w-6 rounded-full border-2", draft.color === c ? "border-ink" : "border-white")}
            style={{ background: c || EVENT_TYPE_MAP[draft.type].color, backgroundImage: c ? undefined : "linear-gradient(135deg, transparent 45%, white 45%, white 55%, transparent 55%)" }}
          />
        ))}
      </div>
      <select aria-label="Related lesson" value={draft.lessonId} onChange={(e) => set({ lessonId: e.target.value })} className={inputClass}>
        <option value="">No related lesson</option>
        {levels.map((lv) => (
          <optgroup key={lv.id} label={`English ${lv.name}`}>
            {lessons
              .filter((l) => l.levelId === lv.id)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <textarea aria-label="Notes" rows={2} placeholder="Notes" value={draft.description} onChange={(e) => set({ description: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
    </div>
  );
}

export function QuickEventForm({ draft, setDraft, onSaved }: { draft: EventDraft; setDraft: (d: EventDraft) => void; onSaved: () => void }) {
  const add = useCalendarStore((s) => s.addEvent);
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<EventDraft>) => {
    setDraft({ ...draft, ...p });
    if (error) setError(null);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = validateEvent(draft);
    if (err) {
      setError(err);
      return;
    }
    add(eventFromDraft(draft));
    onSaved();
  };
  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <EventEssentials draft={draft} set={set} error={error} idPrefix="qa-ev" />
      <Disclosure summary="Location, reminder, repeat, notes">
        <EventDetails draft={draft} set={set} />
      </Disclosure>
      <div className="flex justify-end pt-1">
        <Button type="submit" variant="primary">
          Add event
        </Button>
      </div>
    </form>
  );
}

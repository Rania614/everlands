"use client";

import { useState, type FormEvent } from "react";
import { EVENT_TYPE_MAP } from "@/lib/calendarFeed";
import { useCalendarStore } from "@/stores/calendarStore";
import type { QuickAddContext } from "@/stores/worldStore";
import { Button } from "../ui/Button";
import { Disclosure } from "../ui/Disclosure";
import { inputClass } from "../ui/Field";
import { ExamPrep } from "../calendar/ExamPrep";
import { ErrorText, FieldLabel } from "./fields";

export interface ExamDraft {
  title: string;
  subject: string;
  date: string;
  time: string;
  notes: string;
}

export function newExamDraft(today: string, ctx: QuickAddContext): ExamDraft {
  return { title: ctx.title ?? "", subject: "", date: ctx.date ?? today, time: "", notes: "" };
}

/**
 * Step 1: title, subject, date → saved immediately.
 * Step 2 (same sheet): optional preparation tasks, one tap each.
 */
export function QuickExamForm({
  today,
  draft,
  setDraft,
  onSaved,
  onDone,
}: {
  today: string;
  draft: ExamDraft;
  setDraft: (d: ExamDraft) => void;
  onSaved: () => void;
  onDone: () => void;
}) {
  const add = useCalendarStore((s) => s.addEvent);
  const events = useCalendarStore((s) => s.events);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<ExamDraft>) => {
    setDraft({ ...draft, ...p });
    if (error) setError(null);
  };
  const saved = events.find((e) => e.id === savedId);

  if (saved) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-meadow/30 px-3 py-2 text-sm font-bold text-ink">“{saved.title}” is saved. Add preparation tasks now or later.</p>
        <ExamPrep event={saved} today={today} />
        <div className="flex justify-end pt-1">
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return setError("Add the exam's name.");
    if (!draft.date) return setError("Pick the exam date.");
    const ev = add({
      title: draft.title.trim(),
      type: "exam",
      date: draft.date,
      allDay: !draft.time,
      startTime: draft.time || null,
      endTime: null,
      location: "",
      description: "",
      reminderMinutes: 1440,
      color: EVENT_TYPE_MAP.exam.color,
      recurrence: null,
      courseLevelId: null,
      lessonId: null,
      exam: { subject: draft.subject.trim(), notes: draft.notes, status: "upcoming", result: "" },
    });
    setSavedId(ev.id);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <div>
        <FieldLabel htmlFor="qa-exam-title">Exam</FieldLabel>
        <input
          id="qa-exam-title"
          data-autofocus
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Database Final Exam"
          className={`${inputClass} h-11 text-base`}
          aria-invalid={!!error}
          aria-describedby={error ? "qa-exam-error" : undefined}
        />
        {error && <ErrorText id="qa-exam-error">{error}</ErrorText>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel htmlFor="qa-exam-subject">Subject</FieldLabel>
          <input id="qa-exam-subject" value={draft.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="e.g. Databases" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="qa-exam-date">Date</FieldLabel>
          <input id="qa-exam-date" type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className={inputClass} />
        </div>
      </div>
      <Disclosure summary="Time, notes">
        <div className="space-y-2">
          <input type="time" aria-label="Exam time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} />
          <textarea aria-label="Notes" rows={2} placeholder="Notes" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
        </div>
      </Disclosure>
      <p className="text-xs text-ink-soft">A reminder is set for the day before. Preparation tasks come next.</p>
      <div className="flex justify-end pt-1">
        <Button type="submit" variant="primary">
          Save exam
        </Button>
      </div>
    </form>
  );
}

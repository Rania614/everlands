"use client";

import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { formatDay } from "@/lib/dates";
import { defaultQuranDone, formatQuranInput, parseQuranInput, QURAN_QUICK_ACTIVITIES } from "@/lib/quickAdd";
import { useQuranStore } from "@/stores/quranStore";
import type { QuranActivity, QuranExam, QuranResult, QuranSession } from "@/types/learning";
import { Button } from "../ui/Button";
import { ChipGroup } from "../ui/ChipGroup";
import { Disclosure } from "../ui/Disclosure";
import { inputClass } from "../ui/Field";
import { ErrorText, FieldLabel, WhenPicker } from "./fields";

export const ACTIVITY_LABELS: Record<QuranActivity, string> = {
  memorization: "Memorization",
  revision: "Revision",
  tathbit: "Tathbit (تثبيت)",
  "exam-prep": "Exam preparation",
  assessment: "Assessment",
};
export const RESULT_LABELS: Record<QuranResult, string> = { excellent: "Excellent", good: "Good", "needs-review": "Needs more review" };

export interface QuranDraft {
  activity: QuranActivity;
  range: string;
  date: string;
  done: boolean;
  doneTouched: boolean;
  time: string;
  result: QuranResult | "";
  nextRevisionDate: string;
  notes: string;
  examId: string;
}

export function newQuranDraft(today: string, examId?: string | null, date: string = today): QuranDraft {
  return { activity: examId ? "exam-prep" : "revision", range: "", date, done: defaultQuranDone(date, today), doneTouched: false, time: "", result: "", nextRevisionDate: "", notes: "", examId: examId ?? "" };
}

export function quranDraftFrom(s: QuranSession): QuranDraft {
  return {
    activity: s.activity,
    range: formatQuranInput(s),
    date: s.date,
    done: s.status === "completed",
    doneTouched: true,
    time: s.time ?? "",
    result: s.result ?? "",
    nextRevisionDate: s.nextRevisionDate ?? "",
    notes: s.notes,
    examId: s.examId ?? "",
  };
}

function describeRange(text: string) {
  const r = parseQuranInput(text);
  const parts = [r.surah && `Surah ${r.surah}`, r.fromAyah && `ayah ${r.fromAyah}${r.toAyah ? `–${r.toAyah}` : ""}`, r.fromPage && `page ${r.fromPage}${r.toPage ? `–${r.toPage}` : ""}`].filter(Boolean);
  return parts.join(" · ");
}

/** Activity · Surah/range · date. Assessment, revision date and notes only when asked for. */
export function QuranSessionForm({
  today,
  draft,
  setDraft,
  session,
  onSaved,
}: {
  today: string;
  draft: QuranDraft;
  setDraft: (d: QuranDraft) => void;
  session?: QuranSession | null;
  onSaved: () => void;
}) {
  const add = useQuranStore((s) => s.addSession);
  const update = useQuranStore((s) => s.updateSession);
  const remove = useQuranStore((s) => s.removeSession);
  const exams = useQuranStore((s) => s.exams);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (p: Partial<QuranDraft>) => {
    const next = { ...draft, ...p };
    if (p.date && !next.doneTouched) next.done = defaultQuranDone(p.date, today);
    setDraft(next);
    if (error) setError(null);
  };
  const quick = QURAN_QUICK_ACTIVITIES.some((a) => a.id === draft.activity);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.range.trim()) {
      setError("Which Surah or pages?");
      document.getElementById("qa-quran-range")?.focus();
      return;
    }
    const r = parseQuranInput(draft.range);
    const data = {
      ...r,
      date: draft.date,
      time: draft.time || null,
      activity: draft.activity,
      status: draft.done ? ("completed" as const) : ("planned" as const),
      notes: draft.notes,
      result: (draft.result || null) as QuranResult | null,
      nextRevisionDate: draft.nextRevisionDate || null,
      examId: draft.examId || null,
    };
    if (session) update(session.id, data);
    else add(data);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <div>
        <FieldLabel>Activity</FieldLabel>
        <ChipGroup
          label="Activity"
          size="sm"
          value={draft.activity}
          onChange={(activity) => set({ activity })}
          options={[...QURAN_QUICK_ACTIVITIES, ...(quick ? [] : [{ id: draft.activity, label: ACTIVITY_LABELS[draft.activity] }])]}
        />
      </div>
      <div>
        <FieldLabel htmlFor="qa-quran-range">Surah or range</FieldLabel>
        <input
          id="qa-quran-range"
          data-autofocus={!session || undefined}
          value={draft.range}
          onChange={(e) => set({ range: e.target.value })}
          placeholder="e.g. Al-Mulk 1-15  ·  p562-564"
          className={`${inputClass} h-11 text-base`}
          aria-invalid={!!error}
          aria-describedby={error ? "qa-quran-error" : "qa-quran-hint"}
        />
        {error ? (
          <ErrorText id="qa-quran-error">{error}</ErrorText>
        ) : (
          <p id="qa-quran-hint" className="mt-1 text-xs text-ink-soft">
            {draft.range.trim() ? describeRange(draft.range) : "Add ayahs after the name, or “p” for pages."}
          </p>
        )}
      </div>
      <WhenPicker today={today} date={draft.date} onChange={(date) => set({ date: date ?? today })} allowAnyDay={false} />
      <label className="flex items-center gap-2 text-sm font-bold text-ink">
        <input type="checkbox" checked={draft.done} onChange={(e) => set({ done: e.target.checked, doneTouched: true })} className="h-4 w-4" />
        {draft.date > today ? "Already done" : "Done"}
        <span className="text-xs font-semibold text-ink-soft">{draft.done ? "" : "· planned"}</span>
      </label>

      <Disclosure summary="Time, assessment, next revision, notes" defaultOpen={!!session && !!(draft.result || draft.nextRevisionDate || draft.notes)}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="All activities" value={draft.activity} onChange={(e) => set({ activity: e.target.value as QuranActivity })} className={inputClass}>
              {Object.entries(ACTIVITY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <input type="time" aria-label="Time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Revision result" value={draft.result} onChange={(e) => set({ result: e.target.value as QuranResult | "" })} className={inputClass}>
              <option value="">Result (optional)</option>
              {Object.entries(RESULT_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <label className="text-xs font-bold text-ink-soft">
              <span className="sr-only">Next revision</span>
              <input type="date" aria-label="Next revision date" value={draft.nextRevisionDate} onChange={(e) => set({ nextRevisionDate: e.target.value })} className={inputClass} title="Next revision" />
            </label>
          </div>
          {exams.length > 0 && (
            <select aria-label="For exam" value={draft.examId} onChange={(e) => set({ examId: e.target.value })} className={inputClass}>
              <option value="">Not for an exam</option>
              {exams.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          )}
          <textarea aria-label="Notes" rows={2} placeholder="Notes" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
        </div>
      </Disclosure>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {session &&
          (confirmDelete ? (
            <span className="mr-auto flex items-center gap-2 text-xs font-bold text-ink">
              Delete this session?
              <Button size="sm" variant="primary" onClick={() => { remove(session.id); onSaved(); }}>
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" className="mr-auto" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ))}
        <Button type="submit" variant="primary">
          {session ? "Save" : "Record session"}
        </Button>
      </div>
    </form>
  );
}

export interface QuranExamDraft {
  title: string;
  date: string;
  ranges: string;
  time: string;
  requiredRounds: number;
  notes: string;
  result: string;
  status: QuranExam["status"];
}

export function quranExamDraft(today: string, x?: QuranExam | null): QuranExamDraft {
  return {
    title: x?.title ?? "",
    date: x?.date ?? today,
    ranges: x?.ranges ?? "",
    time: x?.time ?? "",
    requiredRounds: x?.requiredRounds ?? 3,
    notes: x?.notes ?? "",
    result: x?.result ?? "",
    status: x?.status ?? "upcoming",
  };
}

export function QuranExamForm({ draft, setDraft, exam, onSaved }: { draft: QuranExamDraft; setDraft: (d: QuranExamDraft) => void; exam?: QuranExam | null; onSaved: () => void }) {
  const add = useQuranStore((s) => s.addExam);
  const update = useQuranStore((s) => s.updateExam);
  const remove = useQuranStore((s) => s.removeExam);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (p: Partial<QuranExamDraft>) => {
    setDraft({ ...draft, ...p });
    if (error) setError(null);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return setError("Add a name for the exam.");
    const data = { ...draft, title: draft.title.trim(), time: draft.time || null, requiredRounds: Math.max(1, Number(draft.requiredRounds) || 1) };
    if (exam) update(exam.id, data);
    else add({ ...data, roundsCompleted: 0 });
    onSaved();
  };
  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <div>
        <FieldLabel htmlFor="qa-qexam-title">Quran exam</FieldLabel>
        <input id="qa-qexam-title" data-autofocus={!exam || undefined} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Juz Tabarak exam" className={`${inputClass} h-11 text-base`} aria-invalid={!!error} aria-describedby={error ? "qa-qexam-error" : undefined} />
        {error && <ErrorText id="qa-qexam-error">{error}</ErrorText>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel htmlFor="qa-qexam-date">Date</FieldLabel>
          <input id="qa-qexam-date" type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="qa-qexam-ranges">Surahs or pages</FieldLabel>
          <input id="qa-qexam-ranges" value={draft.ranges} onChange={(e) => set({ ranges: e.target.value })} placeholder="Al-Mulk to Al-Mursalat" className={inputClass} />
        </div>
      </div>
      <Disclosure summary="Time, revision rounds, notes, result" defaultOpen={!!exam}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input type="time" aria-label="Time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} />
            <label className="flex items-center gap-2 text-xs font-bold text-ink-soft">
              Revision rounds
              <input type="number" min={1} max={30} value={draft.requiredRounds} onChange={(e) => set({ requiredRounds: Number(e.target.value) })} className="h-10 w-16 rounded-xl border border-twilight/30 bg-white px-2 text-sm text-ink" />
            </label>
          </div>
          {exam && (
            <div className="grid grid-cols-2 gap-2">
              <select aria-label="Status" value={draft.status} onChange={(e) => set({ status: e.target.value as QuranExam["status"] })} className={inputClass}>
                <option value="upcoming">Upcoming</option>
                <option value="done">Taken</option>
              </select>
              <input aria-label="Result" placeholder="Result" value={draft.result} onChange={(e) => set({ result: e.target.value })} className={inputClass} />
            </div>
          )}
          <textarea aria-label="Notes" rows={2} placeholder="Notes" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
        </div>
      </Disclosure>
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {exam &&
          (confirmDelete ? (
            <span className="mr-auto flex items-center gap-2 text-xs font-bold text-ink">
              Delete “{exam.title}”?
              <Button size="sm" variant="primary" onClick={() => { remove(exam.id); onSaved(); }}>
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" className="mr-auto" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ))}
        <Button type="submit" variant="primary">
          {exam ? "Save" : `Save exam · ${formatDay(draft.date, { month: "short", day: "numeric" })}`}
        </Button>
      </div>
    </form>
  );
}

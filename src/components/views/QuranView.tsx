"use client";

import { BookMarked, Check, HeartHandshake, Minus, Pencil, Plus } from "lucide-react";
import { useTodayKey } from "@/hooks/useWeek";
import { diffDays, formatDay, formatTime, monthKeyOf } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useQuestStore } from "@/stores/questStore";
import { useQuranStore } from "@/stores/quranStore";
import { useWorldStore } from "@/stores/worldStore";
import type { QuranExam, QuranSession } from "@/types/learning";
import { InlineTaskAdd } from "../quests/InlineTaskAdd";
import { TaskRow } from "../quests/TaskRow";
import { ACTIVITY_LABELS, RESULT_LABELS } from "../quickadd/QuranForms";
import { QURAN_EXAM_PREP_TEMPLATES } from "@/lib/quickAdd";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Field";
import { ProgressBar } from "../ui/ProgressBar";
import { ViewFrame } from "./ViewFrame";


/** Independent Quran space: monthly plan, sessions and exam preparation. No scores or rewards. */
export function QuranView() {
  const today = useTodayKey();
  if (!today) return null;
  return <Quran today={today} />;
}

function rangeText(s: QuranSession) {
  const parts: string[] = [];
  if (s.fromAyah) parts.push(`Ayah ${s.fromAyah}${s.toAyah ? `–${s.toAyah}` : ""}`);
  if (s.fromPage) parts.push(`Page ${s.fromPage}${s.toPage ? `–${s.toPage}` : ""}`);
  return parts.join(" · ");
}

function Quran({ today }: { today: string }) {
  const target = useQuranStore((s) => s.monthlyTarget);
  const setTarget = useQuranStore((s) => s.setMonthlyTarget);
  const sessions = useQuranStore((s) => s.sessions);
  const exams = useQuranStore((s) => s.exams);
  const focus = useWorldStore((s) => s.focus);
  const openQuickAdd = useWorldStore((s) => s.openQuickAdd);
  const openEditor = useWorldStore((s) => s.openEditor);

  const month = monthKeyOf(today);
  const monthSessions = sessions.filter((s) => monthKeyOf(s.date) === month).sort((a, b) => a.date.localeCompare(b.date));
  const completed = monthSessions.filter((s) => s.status === "completed").length;
  const planned = monthSessions.length;
  const upcomingExams = exams.slice().sort((a, b) => a.date.localeCompare(b.date));
  const reviews = sessions.filter((s) => s.nextRevisionDate && s.nextRevisionDate >= today).sort((a, b) => a.nextRevisionDate!.localeCompare(b.nextRevisionDate!));

  return (
    <ViewFrame eyebrow="Sacred Gardens" title="Quran Journey" icon={<HeartHandshake className="h-5 w-5" />}>
      <p className="mb-4 rounded-2xl bg-white/55 px-4 py-3 text-sm text-ink-soft">
        This space is yours alone. It never affects weekly levels, scores or rewards, and nothing here is ever marked as missed.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <section className="rounded-3xl bg-white/55 p-4" aria-label="Monthly plan">
          <h3 className="font-display text-lg font-semibold text-ink">{formatDay(`${month}-01`, { month: "long", year: "numeric" })}</h3>
          <p className="mt-1 text-sm text-ink">
            {completed} of {target} sessions completed · {planned} planned
          </p>
          <ProgressBar value={completed / target} label="Sessions this month" color="#789D84" className="my-3" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Monthly target</span>
            <Button size="icon" variant="secondary" onClick={() => setTarget(target - 1)} aria-label="Decrease monthly target" disabled={target <= 1}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-display text-lg font-semibold tabular-nums">{target}</span>
            <Button size="icon" variant="secondary" onClick={() => setTarget(target + 1)} aria-label="Increase monthly target">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {reviews.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Upcoming revisions</p>
              <ul className="space-y-1">
                {reviews.slice(0, 4).map((s) => (
                  <li key={s.id} className="rounded-xl bg-white/80 px-3 py-1.5 text-sm text-ink">
                    {s.surah} {rangeText(s) && <span className="text-ink-soft">· {rangeText(s)}</span>} · {formatDay(s.nextRevisionDate!)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white/55 p-4" aria-label="Sessions">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">Sessions this month</h3>
            <Button size="sm" variant="primary" onClick={() => openQuickAdd("quran", { lockKind: true })}>
              <Plus className="h-4 w-4" /> Session
            </Button>
          </div>
          <ul className="space-y-2">
            {monthSessions.map((s) => (
              <SessionRow key={s.id} s={s} onEdit={() => openEditor("quran-session", s.id)} />
            ))}
            {monthSessions.length === 0 && <li className="rounded-2xl bg-white/60 p-4 text-center text-sm text-ink-soft">No sessions this month yet.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-4" aria-label="Quran exams">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Exams</h3>
          <Button size="sm" variant="secondary" onClick={() => openQuickAdd("quran-exam", { lockKind: true })}>
            <Plus className="h-4 w-4" /> Exam
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {upcomingExams.map((x) => (
            <ExamCard key={x.id} exam={x} today={today} highlighted={focus.quranExamId === x.id} onEdit={() => openEditor("quran-exam", x.id)} />
          ))}
          {upcomingExams.length === 0 && <p className="rounded-2xl bg-white/60 p-4 text-sm text-ink-soft">No exams planned.</p>}
        </div>
      </section>

    </ViewFrame>
  );
}

function SessionRow({ s, onEdit }: { s: QuranSession; onEdit: () => void }) {
  const update = useQuranStore((st) => st.updateSession);
  const done = s.status === "completed";
  return (
    <li className={cn("flex items-center gap-3 rounded-2xl border bg-white/85 p-3", done ? "border-meadow" : "border-white")}>
      <button
        type="button"
        onClick={() => update(s.id, { status: done ? "planned" : "completed" })}
        aria-label={done ? "Mark session as planned" : "Mark session as completed"}
        className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border-2", done ? "border-forest bg-forest text-white" : "border-twilight/50 text-transparent hover:border-forest")}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">
          {s.surah || "Session"} <span className="font-semibold text-ink-soft">· {ACTIVITY_LABELS[s.activity]}</span>
        </p>
        <p className="text-xs text-ink-soft">
          {formatDay(s.date)}
          {s.time ? ` · ${formatTime(s.time)}` : ""}
          {rangeText(s) ? ` · ${rangeText(s)}` : ""}
          {s.result ? ` · ${RESULT_LABELS[s.result]}` : ""}
        </p>
      </div>
      <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit session">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

function ExamCard({ exam, today, highlighted, onEdit }: { exam: QuranExam; today: string; highlighted: boolean; onEdit: () => void }) {
  const update = useQuranStore((s) => s.updateExam);
  const quests = useQuestStore((s) => s.quests);
  const sessions = useQuranStore((s) => s.sessions);
  const prep = quests.filter((q) => q.quranExamId === exam.id);
  const prepDone = prep.filter((q) => q.status === "done").length;
  const linkedSessions = sessions.filter((s) => s.examId === exam.id && s.status === "completed").length;
  const days = diffDays(today, exam.date);

  return (
    <article className={cn("rounded-3xl bg-white/55 p-4", highlighted && "ring-2 ring-forest/60")} aria-label={exam.title}>
      <div className="flex flex-wrap items-start gap-2">
        <BookMarked className="mt-0.5 h-5 w-5 text-forest" />
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-base font-semibold text-ink">{exam.title}</h4>
          <p className="text-xs text-ink-soft">
            {formatDay(exam.date, { weekday: "long", month: "long", day: "numeric" })}
            {exam.time ? ` · ${formatTime(exam.time)}` : ""} · {exam.ranges || "Ranges not set"}
          </p>
        </div>
        <Chip color="#789D84">{exam.status === "done" ? "Taken" : days > 0 ? `${days} days to go` : days === 0 ? "Today" : "Date passed"}</Chip>
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit exam">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 rounded-2xl bg-white/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink">
            Revision rounds: {exam.roundsCompleted}/{exam.requiredRounds}
          </p>
          <div className="flex gap-1">
            <Button size="icon" variant="secondary" aria-label="Remove a round" disabled={exam.roundsCompleted <= 0} onClick={() => update(exam.id, { roundsCompleted: exam.roundsCompleted - 1 })}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" aria-label="Record a revision round" onClick={() => update(exam.id, { roundsCompleted: exam.roundsCompleted + 1 })}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ProgressBar value={Math.min(1, exam.roundsCompleted / Math.max(1, exam.requiredRounds))} label="Revision rounds" color="#789D84" size="sm" className="mt-2" />
        {linkedSessions > 0 && <p className="mt-1 text-xs text-ink-soft">{linkedSessions} completed session(s) linked to this exam.</p>}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-sm font-bold text-ink">
          Preparation {prep.length > 0 && <span className="font-semibold text-ink-soft">· {prepDone}/{prep.length}</span>}
        </p>
        <ul className="mb-2 space-y-1.5">
          {prep.map((q) => (
            <TaskRow key={q.id} quest={q} />
          ))}
        </ul>
        <InlineTaskAdd
          context={{ today, area: "quran", date: today, quranExamId: exam.id }}
          placeholder="Add a preparation step…"
          templates={QURAN_EXAM_PREP_TEMPLATES}
          existingTitles={prep.map((q) => q.title)}
        />
      </div>
      {(exam.notes || exam.result) && (
        <p className="mt-3 text-sm text-ink-soft">
          {exam.notes}
          {exam.result && <span className="block font-semibold text-ink">Result: {exam.result}</span>}
        </p>
      )}
    </article>
  );
}


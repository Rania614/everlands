"use client";

import { Award, BookOpen, CalendarClock, Check, ChevronDown, ExternalLink, Plus, Star, Trash2, UserCheck, UserX } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTodayKey } from "@/hooks/useWeek";
import { formatDay, formatTime } from "@/lib/dates";
import { HOMEWORK_TEMPLATES } from "@/lib/quickAdd";
import { cn, uid } from "@/lib/utils";
import { useCourseStore } from "@/stores/courseStore";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { Lesson, LessonStatus } from "@/types/learning";
import { InlineTaskAdd } from "../quests/InlineTaskAdd";
import { TaskRow } from "../quests/TaskRow";
import { Button } from "../ui/Button";
import { Chip, TextInput, inputClass } from "../ui/Field";
import { ProgressBar } from "../ui/ProgressBar";
import { ViewFrame } from "./ViewFrame";

export const LESSON_STATUS: Record<LessonStatus, { label: string; color: string }> = {
  upcoming: { label: "Not scheduled", color: "#9C93A8" },
  scheduled: { label: "Scheduled", color: "#8EB8D2" },
  rescheduled: { label: "Rescheduled", color: "#E5C58F" },
  attended: { label: "Attended", color: "#B9A1D3" },
  missed: { label: "Missed", color: "#E7A99C" },
  completed: { label: "Completed", color: "#789D84" },
};

/**
 * Course overview as one list of lessons. Opening a lesson expands it in
 * place with quick actions (schedule, attendance, homework); the rarely used
 * fields live in a second tab. Course levels are separate from Everlands Levels.
 */
export function CourseView() {
  const today = useTodayKey();
  const focus = useWorldStore((s) => s.focus);
  const courses = useCourseStore((s) => s.courses);
  const levels = useCourseStore((s) => s.levels);
  const lessons = useCourseStore((s) => s.lessons);
  const focusLesson = lessons.find((l) => l.id === focus.lessonId);
  const course = courses[0];
  const courseLevels = levels.filter((l) => l.courseId === course?.id);
  const [levelId, setLevelId] = useState(focusLesson?.levelId ?? courseLevels.find((l) => l.status === "active")?.id ?? courseLevels.at(-1)?.id);
  const level = courseLevels.find((l) => l.id === levelId) ?? courseLevels.at(-1);
  const levelLessons = lessons.filter((l) => l.levelId === level?.id).sort((a, b) => a.number - b.number);
  const [openId, setOpenId] = useState<string | null>(focusLesson?.id ?? levelLessons.find((l) => l.status !== "completed")?.id ?? null);
  const completed = levelLessons.filter((l) => l.status === "completed").length;
  const attended = levelLessons.filter((l) => l.attended).length;

  if (!course || !level || !today) return null;

  return (
    <ViewFrame eyebrow="Knowledge Castle" title={course.title} icon={<BookOpen className="h-5 w-5" />}>
      <section className="mb-4 flex flex-wrap items-center gap-3 rounded-3xl bg-white/55 p-4">
        {courseLevels.length > 1 ? (
          <select aria-label="Course level" value={level.id} onChange={(e) => { setLevelId(e.target.value); setOpenId(null); }} className={`${inputClass} w-auto font-display`}>
            {courseLevels.map((l) => (
              <option key={l.id} value={l.id}>
                Level {l.name} {l.status === "completed" ? "✓" : ""}
              </option>
            ))}
          </select>
        ) : (
          <h3 className="font-display text-lg font-semibold text-ink">Level {level.name}</h3>
        )}
        <p className="text-sm font-bold text-ink">
          {completed}/{level.lessonCount} lessons completed <span className="font-semibold text-ink-soft">· {attended} attended</span>
        </p>
        <ProgressBar value={completed / level.lessonCount} label="Course level progress" color="#7E9CC4" className="basis-full" />
        {level.status === "completed" && <CompletionCard courseId={course.id} summary={level.summary} name={level.name} />}
      </section>

      <ol className="space-y-2" aria-label="Lessons">
        {levelLessons.map((l) => (
          <LessonItem key={l.id} lesson={l} today={today} open={openId === l.id} onToggle={() => setOpenId(openId === l.id ? null : l.id)} />
        ))}
      </ol>
    </ViewFrame>
  );
}

function CompletionCard({ courseId, summary, name }: { courseId: string; summary?: string; name: string }) {
  const startLevel = useCourseStore((s) => s.startLevel);
  const levels = useCourseStore((s) => s.levels);
  const [next, setNext] = useState("");
  const [count, setCount] = useState(8);
  const hasActive = levels.some((l) => l.courseId === courseId && l.status === "active");
  return (
    <div className="basis-full rounded-2xl bg-meadow/30 p-3">
      <p className="flex items-center gap-2 font-display text-base font-semibold text-ink">
        <Award className="h-5 w-5" /> Level {name} completed
      </p>
      <p className="text-sm text-ink-soft">{summary}</p>
      {!hasActive && (
        <form
          className="mt-2 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (next.trim()) startLevel(courseId, next, count);
          }}
        >
          <TextInput label="Next level" value={next} onChange={(e) => setNext(e.target.value)} placeholder="e.g. B1" className="w-36" />
          <TextInput label="Lessons" type="number" min={1} max={40} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-24" />
          <Button type="submit" variant="primary" disabled={!next.trim()}>
            Start next level
          </Button>
        </form>
      )}
    </div>
  );
}

function LessonItem({ lesson, today, open, onToggle }: { lesson: Lesson; today: string; open: boolean; onToggle: () => void }) {
  const quests = useQuestStore((s) => s.quests);
  const homework = quests.filter((q) => q.lessonId === lesson.id);
  const done = homework.filter((q) => q.status === "done").length;
  const st = LESSON_STATUS[lesson.status];
  return (
    <li className={cn("overflow-hidden rounded-2xl border bg-white/70 transition-colors", open ? "border-ink/20 bg-white" : "border-white")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-ink" style={{ background: `${st.color}55` }}>
          {lesson.status === "completed" ? <Check className="h-4 w-4" /> : lesson.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{lesson.title}</span>
          <span className="block text-xs text-ink-soft">
            {lesson.date ? `${formatDay(lesson.date)}${lesson.time ? ` · ${formatTime(lesson.time)}` : ""}` : "Not scheduled"}
            {homework.length > 0 && ` · homework ${done}/${homework.length}`}
          </span>
        </span>
        <Chip color={st.color}>{st.label}</Chip>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>
      {open && <LessonPanel lesson={lesson} today={today} />}
    </li>
  );
}

function LessonPanel({ lesson, today }: { lesson: Lesson; today: string }) {
  const [tab, setTab] = useState<"plan" | "notes">("plan");
  return (
    <div className="border-t border-ink/5 px-3 pb-3 pt-2">
      <div className="mb-3 flex w-fit rounded-2xl bg-cream/70 p-1" role="tablist" aria-label="Lesson sections">
        {[
          { id: "plan" as const, label: "Schedule & homework" },
          { id: "notes" as const, label: "Notes & resources" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("rounded-xl px-3 py-1.5 text-xs font-bold", tab === t.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "plan" ? <PlanTab lesson={lesson} today={today} /> : <NotesTab lesson={lesson} />}
    </div>
  );
}

function PlanTab({ lesson, today }: { lesson: Lesson; today: string }) {
  const schedule = useCourseStore((s) => s.scheduleLesson);
  const setStatus = useCourseStore((s) => s.setLessonStatus);
  const quests = useQuestStore((s) => s.quests);
  const homework = quests.filter((q) => q.lessonId === lesson.id);
  const [date, setDate] = useState(lesson.date ?? "");
  const [time, setTime] = useState(lesson.time ?? "");
  const changed = (date || null) !== lesson.date || (time || null) !== lesson.time;
  const canMarkAttendance = !lesson.date || lesson.date <= today;
  const homeworkDate = lesson.date && lesson.date > today ? lesson.date : today;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (changed && date) schedule(lesson.id, date, time || null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2" aria-label="Schedule">
        <CalendarClock className="mb-2.5 h-4 w-4 text-ink-soft" aria-hidden="true" />
        <label className="text-xs font-bold text-ink-soft">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1 h-9 w-40`} />
        </label>
        <label className="text-xs font-bold text-ink-soft">
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} mt-1 h-9 w-28`} />
        </label>
        <Button type="submit" size="sm" variant={changed && date ? "primary" : "secondary"} disabled={!changed || !date}>
          {lesson.date ? "Reschedule" : "Schedule"}
        </Button>
        {lesson.rescheduledFrom.length > 0 && <span className="pb-2 text-xs text-ink-soft">was {lesson.rescheduledFrom.map((d) => formatDay(d, { month: "short", day: "numeric" })).join(", ")}</span>}
      </form>

      <div className="flex flex-wrap items-center gap-1.5" aria-label="Attendance and status">
        <Button size="sm" variant={lesson.status === "attended" ? "primary" : "secondary"} disabled={!canMarkAttendance} onClick={() => setStatus(lesson.id, "attended")}>
          <UserCheck className="h-4 w-4" /> Attended
        </Button>
        <Button size="sm" variant={lesson.status === "missed" ? "primary" : "secondary"} disabled={!canMarkAttendance} onClick={() => setStatus(lesson.id, "missed")}>
          <UserX className="h-4 w-4" /> Missed
        </Button>
        <Button
          size="sm"
          variant={lesson.status === "completed" ? "primary" : "secondary"}
          onClick={() => setStatus(lesson.id, lesson.status === "completed" ? (lesson.attended ? "attended" : lesson.date ? "scheduled" : "upcoming") : "completed")}
        >
          <Check className="h-4 w-4" /> {lesson.status === "completed" ? "Completed" : "Complete lesson"}
        </Button>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold text-ink-soft">Homework & practice</p>
        <ul className="mb-2 space-y-1.5">
          {homework.map((q) => (
            <TaskRow key={q.id} quest={q} showDate={false} />
          ))}
        </ul>
        <InlineTaskAdd
          context={{ today, area: "english", date: homeworkDate, lessonId: lesson.id }}
          placeholder="Add homework…"
          effort="S"
          templates={HOMEWORK_TEMPLATES}
          existingTitles={homework.map((q) => q.title)}
        />
        <p className="mt-1.5 text-xs text-ink-soft">Homework and attendance are tracked separately.</p>
      </div>
    </div>
  );
}

function NotesTab({ lesson }: { lesson: Lesson }) {
  const update = useCourseStore((s) => s.updateLesson);
  const setAttendance = useCourseStore((s) => s.setAttendance);
  const [resLabel, setResLabel] = useState("");
  const [resUrl, setResUrl] = useState("");
  return (
    <div className="space-y-3">
      <input aria-label="Lesson title" value={lesson.title} onChange={(e) => update(lesson.id, { title: e.target.value })} className={inputClass} />
      <textarea aria-label="Description" placeholder="Description" rows={2} value={lesson.description} onChange={(e) => update(lesson.id, { description: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
      <textarea aria-label="Lesson content" placeholder="Key points, vocabulary, grammar…" rows={3} value={lesson.content} onChange={(e) => update(lesson.id, { content: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
      <div>
        <ul className="mb-1.5 space-y-1">
          {lesson.resources.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-sm">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">
                  {r.label} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-semibold text-ink">{r.label}</span>
              )}
              <button type="button" className="ml-auto text-ink-soft hover:text-ink" aria-label={`Remove ${r.label}`} onClick={() => update(lesson.id, { resources: lesson.resources.filter((x) => x.id !== r.id) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!resLabel.trim()) return;
            const raw = resUrl.trim();
            const url = raw ? (/^https?:\/\//.test(raw) ? raw : `https://${raw}`) : undefined;
            update(lesson.id, { resources: [...lesson.resources, { id: uid("res"), label: resLabel.trim(), url }] });
            setResLabel("");
            setResUrl("");
          }}
        >
          <input aria-label="Resource name" value={resLabel} onChange={(e) => setResLabel(e.target.value)} placeholder="Resource (slides, video…)" className={`${inputClass} h-9 flex-1`} />
          <input aria-label="Resource link" value={resUrl} onChange={(e) => setResUrl(e.target.value)} placeholder="Link (optional)" className={`${inputClass} h-9 flex-1 font-normal`} />
          <button type="submit" disabled={!resLabel.trim()} aria-label="Add resource" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-cream disabled:opacity-40">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
      <textarea aria-label="Notes" placeholder="Notes" rows={2} value={lesson.notes} onChange={(e) => update(lesson.id, { notes: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="How well did it land? (optional)">
          <span className="mr-1 text-xs font-bold text-ink-soft">Understanding</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={lesson.understanding === n}
              aria-label={`${n} of 5`}
              onClick={() => update(lesson.id, { understanding: lesson.understanding === n ? null : n })}
              className="rounded-lg p-0.5 text-gold hover:bg-white"
            >
              <Star className={cn("h-5 w-5", lesson.understanding != null && n <= lesson.understanding ? "fill-gold" : "fill-transparent")} />
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-ink-soft">
          <input type="checkbox" checked={lesson.attended} onChange={(e) => setAttendance(lesson.id, e.target.checked)} />
          Attended the session
        </label>
      </div>
    </div>
  );
}

"use client";

import { Award, BookOpen, CalendarClock, Check, ExternalLink, Plus, Star, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { useTodayKey } from "@/hooks/useWeek";
import { formatDay, formatTime, weekKeyOf } from "@/lib/dates";
import { weekStartSetting } from "@/lib/lifecycle";
import { cn, uid } from "@/lib/utils";
import { useCourseStore } from "@/stores/courseStore";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { Lesson, LessonStatus } from "@/types/learning";
import { QuestCard } from "../quests/QuestCard";
import { TaskFormModal, type TaskDefaults } from "../quests/TaskFormModal";
import { Button } from "../ui/Button";
import { Chip, TextArea, TextInput, inputClass } from "../ui/Field";
import { ProgressBar } from "../ui/ProgressBar";
import { ViewFrame } from "./ViewFrame";

export const LESSON_STATUS: Record<LessonStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "#9C93A8" },
  scheduled: { label: "Scheduled", color: "#8EB8D2" },
  rescheduled: { label: "Rescheduled", color: "#E5C58F" },
  attended: { label: "Attended", color: "#B9A1D3" },
  missed: { label: "Missed", color: "#E7A99C" },
  completed: { label: "Completed", color: "#789D84" },
};

/** Course levels and lessons. Course levels are separate from Everlands Levels. */
export function CourseView() {
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
  const [lessonId, setLessonId] = useState<string | undefined>(focusLesson?.id ?? levelLessons.find((l) => l.status !== "completed")?.id ?? levelLessons[0]?.id);
  const lesson = levelLessons.find((l) => l.id === lessonId) ?? levelLessons[0];
  const completed = levelLessons.filter((l) => l.status === "completed").length;
  const attended = levelLessons.filter((l) => l.attended).length;

  if (!course || !level) return null;

  return (
    <ViewFrame eyebrow="Knowledge Castle" title={course.title} icon={<BookOpen className="h-5 w-5" />}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-2xl bg-white/60 p-1" role="tablist" aria-label="Course levels">
          {courseLevels.map((l) => (
            <button
              key={l.id}
              role="tab"
              type="button"
              aria-selected={l.id === level.id}
              onClick={() => {
                setLevelId(l.id);
                setLessonId(undefined);
              }}
              className={cn("rounded-xl px-3 py-1.5 text-sm font-bold", l.id === level.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
            >
              Level {l.name} {l.status === "completed" && "✓"}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-soft">Course levels track your place in the course. They are separate from Everlands weekly levels.</p>
      </div>

      <section className="mb-4 rounded-3xl bg-white/55 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-ink">
            Level {level.name} · {completed}/{level.lessonCount} lessons completed
          </h3>
          <p className="text-xs font-semibold text-ink-soft">{attended} attended</p>
        </div>
        <ProgressBar value={completed / level.lessonCount} label="Course level progress" color="#7E9CC4" className="mt-2" />
        {level.status === "completed" && <CompletionCard courseId={course.id} summary={level.summary} name={level.name} />}
      </section>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <ol className="space-y-1.5" aria-label="Lessons">
          {levelLessons.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setLessonId(l.id)}
                aria-current={l.id === lesson?.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors",
                  l.id === lesson?.id ? "border-ink/30 bg-white" : "border-white bg-white/60 hover:bg-white",
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-ink" style={{ background: `${LESSON_STATUS[l.status].color}55` }}>
                  {l.status === "completed" ? <Check className="h-4 w-4" /> : l.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{l.title}</span>
                  <span className="block text-xs text-ink-soft">{l.date ? `${formatDay(l.date)}${l.time ? ` · ${formatTime(l.time)}` : ""}` : "Not scheduled"}</span>
                </span>
                <Chip color={LESSON_STATUS[l.status].color}>{LESSON_STATUS[l.status].label}</Chip>
              </button>
            </li>
          ))}
        </ol>
        {lesson && <LessonDetail key={lesson.id} lesson={lesson} />}
      </div>
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
    <div className="mt-3 rounded-2xl bg-meadow/30 p-3">
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

function LessonDetail({ lesson }: { lesson: Lesson }) {
  const today = useTodayKey();
  const update = useCourseStore((s) => s.updateLesson);
  const schedule = useCourseStore((s) => s.scheduleLesson);
  const setStatus = useCourseStore((s) => s.setLessonStatus);
  const setAttendance = useCourseStore((s) => s.setAttendance);
  const quests = useQuestStore((s) => s.quests);
  const tasks = quests.filter((q) => q.lessonId === lesson.id);
  const [date, setDate] = useState(lesson.date ?? "");
  const [time, setTime] = useState(lesson.time ?? "");
  const [adding, setAdding] = useState<TaskDefaults | null>(null);
  const [resLabel, setResLabel] = useState("");
  const [resUrl, setResUrl] = useState("");
  const scheduleChanged = (date || null) !== lesson.date || (time || null) !== lesson.time;

  return (
    <article className="space-y-4 rounded-3xl bg-white/55 p-4" aria-label={lesson.title}>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Lesson title" value={lesson.title} onChange={(e) => update(lesson.id, { title: e.target.value })} className={`${inputClass} w-auto flex-1 font-display text-lg`} />
        <Chip color={LESSON_STATUS[lesson.status].color}>{LESSON_STATUS[lesson.status].label}</Chip>
      </div>
      <TextArea label="Description" value={lesson.description} onChange={(e) => update(lesson.id, { description: e.target.value })} rows={2} />

      <section className="rounded-2xl bg-white/70 p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <CalendarClock className="h-4 w-4" /> Schedule
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <TextInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          <TextInput label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-32" />
          <Button variant="secondary" disabled={!scheduleChanged} onClick={() => schedule(lesson.id, date || null, time || null)}>
            {lesson.date ? "Reschedule" : "Schedule"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">
          Scheduled lessons appear in your Calendar automatically.
          {lesson.rescheduledFrom.length > 0 && ` Previously: ${lesson.rescheduledFrom.map((d) => formatDay(d)).join(", ")}.`}
        </p>
      </section>

      <section className="rounded-2xl bg-white/70 p-3">
        <p className="mb-2 text-sm font-bold text-ink">Attendance & status</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={lesson.status === "attended" ? "primary" : "secondary"} onClick={() => setStatus(lesson.id, "attended")}>
            <UserCheck className="h-4 w-4" /> Attended
          </Button>
          <Button size="sm" variant={lesson.status === "missed" ? "primary" : "secondary"} onClick={() => setStatus(lesson.id, "missed")} disabled={!!(lesson.date && today && lesson.date > today)}>
            <UserX className="h-4 w-4" /> Missed
          </Button>
          <Button size="sm" variant={lesson.status === "completed" ? "primary" : "secondary"} onClick={() => setStatus(lesson.id, lesson.status === "completed" ? (lesson.attended ? "attended" : lesson.date ? "scheduled" : "upcoming") : "completed")}>
            <Check className="h-4 w-4" /> {lesson.status === "completed" ? "Completed" : "Mark lesson completed"}
          </Button>
          <label className="ml-auto flex items-center gap-2 text-xs font-bold text-ink-soft">
            <input type="checkbox" checked={lesson.attended} onChange={(e) => setAttendance(lesson.id, e.target.checked)} />
            Attended the session
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">Attendance, homework and lesson completion are tracked separately. A missed lesson can simply be rescheduled.</p>
      </section>

      <section className="rounded-2xl bg-white/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Homework & practice</p>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              setAdding({
                weekKey: weekKeyOf(lesson.date && today && lesson.date > today ? lesson.date : (today ?? lesson.date ?? ""), weekStartSetting()),
                date: null,
                locationId: "castle",
                lessonId: lesson.id,
                title: "",
                effort: "S",
              })
            }
            disabled={!today}
          >
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>
        <div className="space-y-2">
          {tasks.map((q) => (
            <QuestCard key={q.id} quest={q} compact showDate showLocation={false} />
          ))}
          {tasks.length === 0 && <p className="text-sm text-ink-soft">No homework yet. Tasks added here keep their link to this lesson.</p>}
        </div>
      </section>

      <TextArea label="Lesson content" value={lesson.content} onChange={(e) => update(lesson.id, { content: e.target.value })} rows={3} placeholder="Key points, vocabulary, grammar…" />

      <section>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Resources</p>
        <ul className="mb-2 space-y-1">
          {lesson.resources.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-sm">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">
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
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!resLabel.trim()) return;
            const url = resUrl.trim() && /^https?:\/\//.test(resUrl.trim()) ? resUrl.trim() : resUrl.trim() ? `https://${resUrl.trim()}` : undefined;
            update(lesson.id, { resources: [...lesson.resources, { id: uid("res"), label: resLabel.trim(), url }] });
            setResLabel("");
            setResUrl("");
          }}
        >
          <input aria-label="Resource name" value={resLabel} onChange={(e) => setResLabel(e.target.value)} placeholder="Slides, video…" className={`${inputClass} h-9 w-40 flex-1`} />
          <input aria-label="Resource link" value={resUrl} onChange={(e) => setResUrl(e.target.value)} placeholder="Link (optional)" className={`${inputClass} h-9 w-48 flex-1 font-normal`} />
          <Button size="sm" type="submit" disabled={!resLabel.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      </section>

      <TextArea label="Notes" value={lesson.notes} onChange={(e) => update(lesson.id, { notes: e.target.value })} rows={2} />

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">How well did it land? (optional)</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Understanding">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={lesson.understanding === n}
              aria-label={`${n} of 5`}
              onClick={() => update(lesson.id, { understanding: lesson.understanding === n ? null : n })}
              className="rounded-lg p-1 text-gold hover:bg-white"
            >
              <Star className={cn("h-5 w-5", lesson.understanding != null && n <= lesson.understanding ? "fill-gold" : "fill-transparent")} />
            </button>
          ))}
        </div>
      </div>
      {adding && <TaskFormModal open onClose={() => setAdding(null)} defaults={adding} heading={`Task for ${lesson.title}`} />}
    </article>
  );
}

"use client";

import { BarChart3, BookOpen, Flag, HeartHandshake } from "lucide-react";
import { useWeek } from "@/hooks/useWeek";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { formatDay, monthKeyOf } from "@/lib/dates";
import { unlockExplanation } from "@/lib/progression";
import { usePlanStore } from "@/stores/planStore";
import { useCourseStore } from "@/stores/courseStore";
import { useQuranStore } from "@/stores/quranStore";
import { CoreGoalList, ScoreBar, UnlockPill, pad } from "../quests/WeeklySummary";
import { ProgressBar, ProgressRing } from "../ui/ProgressBar";
import { ViewFrame } from "./ViewFrame";

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/55 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ProgressView() {
  const week = useWeek();
  const records = usePlanStore((s) => s.records);
  const milestones = usePlanStore((s) => s.milestones);
  const { goTo } = useWorldNavigation();
  const history = Object.values(records).sort((a, b) => b.weekKey.localeCompare(a.weekKey));

  return (
    <ViewFrame eyebrow="Gentle overview" title="Progress" icon={<BarChart3 className="h-5 w-5" />}>
      {week && (
        <div className="space-y-4">
          <Section title={`Week ${pad(week.weekNumber)} — Level ${pad(week.level)}`}>
            <div className="grid gap-4 md:grid-cols-[auto_1fr_1fr]">
              <ProgressRing value={Math.min(1, week.progress.score / 100)} size={96} stroke={9} label="Weekly score" color="#B9A1D3">
                <span className="font-display text-xl font-semibold">{week.progress.score}%</span>
              </ProgressRing>
              <div>
                <UnlockPill unlocked={week.progress.unlocked} />
                <p className="mt-2 font-display text-lg font-semibold text-ink">
                  {week.progress.countedUnits} of {week.progress.target} units
                </p>
                <p className="text-sm text-ink-soft">
                  {week.progress.remaining} planned units remaining
                  {week.progress.extraDone ? ` · additional work ${week.progress.extraDone}u (${week.progress.extraCounted}u counted, limit ${week.progress.extraCap}u)` : ""}
                </p>
                <ScoreBar score={week.progress.score} className="mt-3" />
                <p className="mt-2 text-xs text-ink-soft">{unlockExplanation(week.progress)}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">Core Goals</p>
                <CoreGoalList week={week} />
              </div>
            </div>
          </Section>

          <Section title="Daily workload">
            <DailyBreakdown week={week} />
            <p className="mt-2 text-xs text-ink-soft">Days are informational. Effort on any day counts toward the whole week.</p>
          </Section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Previous weekly levels" icon={<Flag className="h-4 w-4" />}>
              {history.length === 0 ? (
                <p className="text-sm text-ink-soft">Your finished weeks will appear here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-ink-soft">
                      <tr>
                        <th className="py-1 pr-2 font-bold">Week</th>
                        <th className="py-1 pr-2 font-bold">Level</th>
                        <th className="py-1 pr-2 font-bold">Score</th>
                        <th className="py-1 pr-2 font-bold">Core</th>
                        <th className="py-1 font-bold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r) => (
                        <tr key={r.weekKey} className="border-t border-white">
                          <td className="py-1.5 pr-2 font-semibold">
                            {pad(r.weekNumber)} <span className="text-xs font-normal text-ink-soft">{formatDay(r.weekKey, { month: "short", day: "numeric" })}</span>
                          </td>
                          <td className="py-1.5 pr-2">{r.level}</td>
                          <td className="py-1.5 pr-2 tabular-nums">{r.target ? `${r.score}% (${r.countedUnits}/${r.target})` : "—"}</td>
                          <td className="py-1.5 pr-2">
                            {r.coreGoals.filter((g) => g.achieved).length}/{r.coreGoals.length}
                          </td>
                          <td className="py-1.5 text-xs font-bold">{r.unlocked ? "Unlocked" : r.target ? "Kept level" : "Rest week"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
            <Section title="Permanent milestones" icon={<Flag className="h-4 w-4" />}>
              {milestones.length === 0 ? (
                <p className="text-sm text-ink-soft">Unlocked levels and completed course levels are kept here for good. The world will grow from them.</p>
              ) : (
                <ul className="space-y-1.5">
                  {milestones
                    .slice()
                    .reverse()
                    .map((m) => (
                      <li key={m.id} className="flex justify-between rounded-xl bg-white/80 px-3 py-1.5 text-sm">
                        <span className="font-semibold text-ink">{m.title}</span>
                        <span className="text-xs text-ink-soft">{new Date(m.at).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                      </li>
                    ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Courses" icon={<BookOpen className="h-4 w-4" />}>
              <CourseSummary onOpen={() => goTo("course")} />
            </Section>
            <Section title="Quran journey" icon={<HeartHandshake className="h-4 w-4" />}>
              <QuranSummary today={week.today} onOpen={() => goTo("quran")} />
            </Section>
          </div>
        </div>
      )}
    </ViewFrame>
  );
}

function DailyBreakdown({ week }: { week: NonNullable<ReturnType<typeof useWeek>> }) {
  const days = week.progress.days;
  const max = Math.max(1, ...days.map((d) => Math.max(d.scheduledUnits, d.completedUnits)));
  return (
    <div className="grid grid-cols-7 gap-2" role="list" aria-label="Daily workload">
      {days.map((d) => (
        <div key={d.day} role="listitem" className="flex flex-col items-center gap-1" aria-label={`${formatDay(d.day)}: ${d.scheduledUnits} units scheduled, ${d.completedUnits} completed`}>
          <div className="flex h-24 w-full items-end justify-center gap-1 rounded-xl bg-white/70 p-1.5">
            <span className="w-2.5 rounded-t bg-sky/70" style={{ height: `${(d.scheduledUnits / max) * 100}%` }} title="Scheduled" />
            <span className="w-2.5 rounded-t bg-lilac" style={{ height: `${(d.completedUnits / max) * 100}%` }} title="Completed" />
          </div>
          <span className={`text-[11px] font-bold ${d.day === week.today ? "text-ink" : "text-ink-soft"}`}>{formatDay(d.day, { weekday: "short" })}</span>
          <span className="text-[10px] tabular-nums text-ink-soft">
            {d.completedUnits}/{d.scheduledUnits}u
          </span>
        </div>
      ))}
      <p className="col-span-7 flex gap-3 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-sky/70" /> scheduled
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-lilac" /> completed that day
        </span>
        <span>· {week.progress.unscheduledUnits}u planned for “any day”</span>
      </p>
    </div>
  );
}

export function CourseSummary({ onOpen }: { onOpen: () => void }) {
  const courses = useCourseStore((s) => s.courses);
  const levels = useCourseStore((s) => s.levels);
  const lessons = useCourseStore((s) => s.lessons);
  return (
    <ul className="space-y-2">
      {courses.map((c) => {
        const cl = levels.filter((l) => l.courseId === c.id);
        const active = cl.find((l) => l.status === "active") ?? cl.at(-1);
        const ls = active ? lessons.filter((l) => l.levelId === active.id) : [];
        const done = ls.filter((l) => l.status === "completed").length;
        return (
          <li key={c.id}>
            <button type="button" onClick={onOpen} className="w-full rounded-2xl bg-white/80 p-3 text-left hover:bg-white">
              <p className="text-sm font-bold text-ink">
                {c.title} · {active?.name ?? "—"} {active?.status === "completed" && "(completed)"}
              </p>
              <p className="mb-1.5 text-xs text-ink-soft">
                {done}/{active?.lessonCount ?? 0} lessons completed · {cl.filter((l) => l.status === "completed").length} level(s) finished
              </p>
              <ProgressBar value={active ? done / active.lessonCount : 0} label={`${c.title} progress`} color="#7E9CC4" size="sm" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function QuranSummary({ today, onOpen }: { today: string; onOpen: () => void }) {
  const target = useQuranStore((s) => s.monthlyTarget);
  const sessions = useQuranStore((s) => s.sessions);
  const exams = useQuranStore((s) => s.exams);
  const month = monthKeyOf(today);
  const thisMonth = sessions.filter((s) => monthKeyOf(s.date) === month && s.status === "completed").length;
  const nextExam = exams.filter((e) => e.status === "upcoming" && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-2xl bg-white/80 p-3 text-left hover:bg-white">
      <p className="text-sm font-bold text-ink">
        {thisMonth} of {target} sessions this month
      </p>
      <ProgressBar value={thisMonth / target} label="Quran sessions this month" color="#789D84" size="sm" className="my-1.5" />
      <p className="text-xs text-ink-soft">
        {nextExam ? `Next exam: ${nextExam.title}, ${formatDay(nextExam.date)}.` : "No exam scheduled."} Separate from weekly levels and never scored.
      </p>
    </button>
  );
}

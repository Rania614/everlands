"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, History, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { useWeek, type WeekView } from "@/hooks/useWeek";
import { formatDay, weekDays } from "@/lib/dates";
import { confirmPlan, ensurePlan } from "@/lib/lifecycle";
import { unlockExplanation } from "@/lib/progression";
import { moveTask } from "@/lib/taskActions";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import { TaskRow } from "../quests/TaskRow";
import { Disclosure } from "../ui/Disclosure";
import { useWorldStore } from "@/stores/worldStore";
import { CoreGoalList, ScoreBar, UnlockPill, pad } from "../quests/WeeklySummary";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Field";
import { ViewFrame } from "../views/ViewFrame";

/** The weekly plan: target, score, Core Goals and a flexible day-by-day board. */
export function WeeklyPlanner() {
  const [offset, setOffset] = useState(0);
  const week = useWeek(offset);
  const openQuickAdd = useWorldStore((s) => s.openQuickAdd);

  return (
    <ViewFrame
      eyebrow={week ? `Week of ${formatDay(week.weekKey, { month: "long", day: "numeric" })}` : "Weekly plan"}
      title="Weekly Planner"
      icon={<CalendarDays className="h-5 w-5" />}
      actions={
        <div className="flex items-center gap-1">
          <Button size="icon" variant="secondary" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week" disabled={offset <= -12}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={offset === 0 ? "primary" : "secondary"} onClick={() => setOffset(0)}>
            This week
          </Button>
          <Button size="icon" variant="secondary" onClick={() => setOffset((o) => o + 1)} aria-label="Next week" disabled={offset >= 8}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {week && (
        <>
          <PlanHeader week={week} />
          {week.plan ? (
            <DayBoard week={week} onAdd={(date) => openQuickAdd("task", { date, weekKey: week.weekKey, label: date ? formatDay(date, { weekday: "long" }) : "any day" })} />
          ) : (
            <FuturePlanPreview week={week} />
          )}
        </>
      )}
    </ViewFrame>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Simple overview first; the numbers behind it are one click away. */
function PlanHeader({ week }: { week: WeekView }) {
  const p = week.progress;
  const record = usePlanStore((s) => s.records[week.weekKey]);
  const status = week.plan?.status;
  return (
    <section className="mb-4 rounded-3xl bg-white/55 p-4" aria-label="Weekly progress">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="font-display text-lg font-semibold text-ink">
          Week {pad(week.weekNumber)} · Level {pad(week.level)}
        </h3>
        <p className="font-display text-lg font-semibold tabular-nums text-ink">
          {p.score}% <span className="text-sm font-bold text-ink-soft">· {p.countedUnits}/{p.target} units</span>
        </p>
        <UnlockPill unlocked={record ? record.unlocked : p.unlocked} />
        {status === "active" && (
          <Chip color="#A7C8A5">
            <Lock className="h-3 w-3" /> Plan confirmed
          </Chip>
        )}
        {status === "closed" && <Chip color="#8EB8D2">Week finished</Chip>}
        {status === "planning" && week.plan && (
          <Button size="sm" variant="primary" className="ml-auto" onClick={() => confirmPlan(week.weekKey)} disabled={p.target === 0}>
            <Check className="h-4 w-4" /> Confirm plan · {p.target} units
          </Button>
        )}
      </div>
      <ScoreBar score={p.score} className="mt-3" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CoreGoalList week={week} compact />
      </div>
      <p className="mt-2 text-xs text-ink-soft">{unlockExplanation(p)}</p>
      <Disclosure label="Numbers & plan changes" className="mt-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Weekly target" value={`${p.target}`} hint={week.plan?.confirmedTarget != null && week.plan.confirmedTarget !== p.target ? `confirmed at ${week.plan.confirmedTarget}` : "units"} />
          <Stat label="Completed" value={`${p.countedUnits}`} hint={p.extraDone ? `incl. +${p.extraCounted} extra (limit ${p.extraCap})` : "units"} />
          <Stat label="Remaining" value={`${p.remaining}`} hint="planned units" />
          <Stat label="Needed to unlock" value="> 75%" hint="+ all Core Goals" />
        </div>
        {status === "planning" && (
          <p className="mt-2 text-xs text-ink-soft">
            While planning, the target follows your plan. It locks when you confirm{week.isCurrent ? ", or automatically at the end of today" : ", or after the week's first day"}.
          </p>
        )}
        <ChangeLog weekKey={week.weekKey} />
      </Disclosure>
    </section>
  );
}

function FuturePlanPreview({ week }: { week: WeekView }) {
  const allGoals = usePlanStore((s) => s.coreGoals);
  const goals = allGoals.filter((g) => g.active);
  if (week.isPast) return <p className="rounded-2xl bg-white/60 p-4 text-sm text-ink-soft">No plan was made for this week.</p>;
  return (
    <section className="rounded-3xl border border-dashed border-twilight/30 bg-white/40 p-4">
      <h3 className="font-display text-base font-semibold text-ink">Core Goals for this week</h3>
      <p className="mb-3 text-sm text-ink-soft">These requirements will apply when you start planning. You can change them in Settings until then.</p>
      <ul className="mb-3 space-y-2">
        {goals.map((g) => (
          <li key={g.id} className="rounded-2xl bg-white/80 p-3">
            <p className="text-sm font-bold text-ink">
              {g.title} <span className="font-semibold text-ink-soft">· complete at least {g.minCompleted}</span>
            </p>
            <p className="text-xs text-ink-soft">{g.condition}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {g.requirements.map((r) => (
                <Chip key={r.id} color="#E5C58F">
                  {r.title}
                </Chip>
              ))}
            </ul>
          </li>
        ))}
        {goals.length === 0 && <li className="text-sm text-ink-soft">No active Core Goals.</li>}
      </ul>
      <Button variant="primary" onClick={() => ensurePlan(week.weekKey)}>
        <Plus className="h-4 w-4" /> Start planning this week
      </Button>
    </section>
  );
}

/** Seven days + "any day". Drag a task to another day, or use its day chip. */
function DayBoard({ week, onAdd }: { week: WeekView; onAdd: (date: string | null) => void }) {
  const quests = useQuestStore((s) => s.quests);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const inWeek = quests.filter((q) => q.weekKey === week.weekKey);
  const days = weekDays(week.weekKey);
  const columns: { key: string | null; label: string; sub: string }[] = [
    ...days.map((d) => ({ key: d, label: formatDay(d, { weekday: "long" }), sub: formatDay(d, { month: "short", day: "numeric" }) })),
    { key: null, label: "Any day", sub: "this week" },
  ];
  const locked = week.plan?.status === "closed";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((c) => {
        const colKey = c.key ?? "any";
        const items = inWeek.filter((q) => q.date === c.key).sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
        const day = c.key ? week.progress.days.find((d) => d.day === c.key) : null;
        const isToday = c.key === week.today;
        return (
          <section
            key={colKey}
            className={cn(
              "flex min-h-32 flex-col rounded-3xl bg-white/55 p-3 transition-colors",
              isToday && "ring-2 ring-twilight/50",
              dragOver === colKey && "bg-sky/30 ring-2 ring-sky",
            )}
            aria-label={`${c.label} ${c.sub}`}
            onDragOver={(e) => {
              if (locked) return;
              e.preventDefault();
              setDragOver(colKey);
            }}
            onDragLeave={() => setDragOver((v) => (v === colKey ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text/everlands-task");
              if (id) moveTask(id, c.key);
            }}
          >
            <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
              <div>
                <h4 className="font-display text-sm font-semibold text-ink">
                  {c.label} {isToday && <span className="text-xs text-forest">· today</span>}
                </h4>
                <p className="text-[11px] font-semibold text-ink-soft">{c.sub}</p>
              </div>
              <p className="text-right text-[11px] font-bold text-ink-soft" title="Units scheduled · units completed that day">
                {day ? `${day.completedUnits}/${day.scheduledUnits}u` : `${week.progress.unscheduledUnits}u`}
              </p>
            </header>
            <ul className="flex-1 space-y-1.5">
              {items.map((q) => (
                <div
                  key={q.id}
                  draggable={!locked}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/everlands-task", q.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(!locked && "cursor-grab active:cursor-grabbing")}
                >
                  <TaskRow quest={q} disabled={locked} stacked />
                </div>
              ))}
              {items.length === 0 && <li className="rounded-xl border border-dashed border-twilight/25 p-2 text-center text-[11px] text-ink-soft">Free</li>}
            </ul>
            {!locked && (
              <button
                type="button"
                onClick={() => onAdd(c.key)}
                className="mt-2 inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold text-ink-soft hover:bg-white hover:text-ink"
                aria-label={`Add a task on ${c.label}`}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ChangeLog({ weekKey }: { weekKey: string }) {
  const changes = usePlanStore((s) => s.changes);
  const list = changes.filter((c) => c.weekKey === weekKey).slice().reverse();
  if (!list.length) return null;
  return (
    <div className="mt-3">
      <p className="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <History className="h-3.5 w-3.5" /> Plan changes ({list.length})
      </p>
      <ul className="mt-2 space-y-1">
        {list.map((c) => (
          <li key={c.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-xs text-ink">
            <span>
              <b className="capitalize">{c.kind.replace("-", " ")}</b>
              {c.taskTitle ? ` · ${c.taskTitle}` : ""}
              {c.note ? ` · ${c.note}` : ""}
            </span>
            <span className="tabular-nums text-ink-soft">
              target {c.targetBefore} → {c.targetAfter} · {new Date(c.at).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

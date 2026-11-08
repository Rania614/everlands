"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, History, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { LOCATIONS } from "@/data/locations";
import { useWeek, type WeekView } from "@/hooks/useWeek";
import { formatDay, weekDays } from "@/lib/dates";
import { confirmPlan, ensurePlan } from "@/lib/lifecycle";
import { unlockExplanation } from "@/lib/progression";
import { moveTask, toggleTask } from "@/lib/taskActions";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import type { Quest } from "@/types/quest";
import { TaskFormModal, type TaskDefaults } from "../quests/TaskFormModal";
import { CoreGoalList, ScoreBar, UnlockPill, pad } from "../quests/WeeklySummary";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Field";
import { ViewFrame } from "../views/ViewFrame";

/** The weekly plan: target, score, Core Goals and a flexible day-by-day board. */
export function WeeklyPlanner() {
  const [offset, setOffset] = useState(0);
  const week = useWeek(offset);
  const [adding, setAdding] = useState<TaskDefaults | null>(null);
  const [editing, setEditing] = useState<Quest | null>(null);

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
            <DayBoard week={week} onAdd={(d) => setAdding(d)} onEdit={setEditing} />
          ) : (
            <FuturePlanPreview week={week} />
          )}
          <ChangeLog weekKey={week.weekKey} />
        </>
      )}
      {adding && <TaskFormModal open onClose={() => setAdding(null)} defaults={adding} />}
      {editing && <TaskFormModal open onClose={() => setEditing(null)} task={editing} />}
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

function PlanHeader({ week }: { week: WeekView }) {
  const p = week.progress;
  const record = usePlanStore((s) => s.records[week.weekKey]);
  const status = week.plan?.status;
  return (
    <section className="mb-4 rounded-3xl bg-white/55 p-4" aria-label="Weekly progress">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-semibold text-ink">
          Week {pad(week.weekNumber)} · Level {pad(week.level)}
        </h3>
        <UnlockPill unlocked={record ? record.unlocked : p.unlocked} />
        {status === "planning" && <Chip color="#E5C58F">Planning</Chip>}
        {status === "active" && (
          <Chip color="#A7C8A5">
            <Lock className="h-3 w-3" /> Plan confirmed
          </Chip>
        )}
        {status === "closed" && <Chip color="#8EB8D2">Week finished</Chip>}
        {status === "planning" && week.plan && (
          <Button size="sm" variant="primary" className="ml-auto" onClick={() => confirmPlan(week.weekKey)} disabled={p.target === 0}>
            <Check className="h-4 w-4" /> Confirm weekly plan ({p.target} units)
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Weekly target" value={`${p.target}`} hint={week.plan?.confirmedTarget != null && week.plan.confirmedTarget !== p.target ? `confirmed at ${week.plan.confirmedTarget}` : "units"} />
        <Stat label="Completed" value={`${p.countedUnits}`} hint={p.extraDone ? `incl. +${p.extraCounted} extra (limit ${p.extraCap})` : "units"} />
        <Stat label="Weekly score" value={`${p.score}%`} hint="needs more than 75%" />
        <Stat label="Remaining" value={`${p.remaining}`} hint="planned units" />
        <div className="col-span-2 rounded-2xl bg-white/70 px-3 py-2 sm:col-span-1">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft">Core Goals</p>
          <CoreGoalList week={week} compact />
        </div>
      </div>
      <ScoreBar score={p.score} className="mt-3" />
      <p className="mt-2 text-xs text-ink-soft">{unlockExplanation(p)}</p>
      {status === "planning" && (
        <p className="mt-1 text-xs text-ink-soft">
          While planning, the target follows your plan. Confirming locks it; later changes are shown before they apply.
          {week.isCurrent ? " If you don't confirm, it locks automatically at the end of today." : " It locks automatically after the week's first day."}
        </p>
      )}
    </section>
  );
}

function FuturePlanPreview({ week }: { week: WeekView }) {
  const goals = usePlanStore((s) => s.coreGoals.filter((g) => g.active));
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

function DayBoard({ week, onAdd, onEdit }: { week: WeekView; onAdd: (d: TaskDefaults) => void; onEdit: (q: Quest) => void }) {
  const quests = useQuestStore((s) => s.quests);
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
        const items = inWeek.filter((q) => q.date === c.key).sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
        const day = c.key ? week.progress.days.find((d) => d.day === c.key) : null;
        const isToday = c.key === week.today;
        return (
          <section
            key={c.key ?? "any"}
            className={cn("flex min-h-36 flex-col rounded-3xl bg-white/55 p-3", isToday && "ring-2 ring-twilight/50")}
            aria-label={`${c.label} ${c.sub}`}
          >
            <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
              <div>
                <h4 className="font-display text-sm font-semibold text-ink">
                  {c.label} {isToday && <span className="text-xs text-forest">· today</span>}
                </h4>
                <p className="text-[11px] font-semibold text-ink-soft">{c.sub}</p>
              </div>
              <p className="text-right text-[11px] font-bold text-ink-soft" title="Scheduled units · units completed on this day">
                {day ? `${day.scheduledUnits}u planned · ${day.completedUnits}u done` : `${week.progress.unscheduledUnits}u`}
              </p>
            </header>
            <ul className="flex-1 space-y-1.5">
              {items.map((q) => (
                <PlannerRow key={q.id} quest={q} days={days} onEdit={() => onEdit(q)} disabled={locked} />
              ))}
              {items.length === 0 && <li className="rounded-xl border border-dashed border-twilight/25 p-2 text-center text-[11px] text-ink-soft">Free</li>}
            </ul>
            {!locked && (
              <button
                type="button"
                onClick={() => onAdd({ weekKey: week.weekKey, date: c.key })}
                className="mt-2 inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold text-ink-soft hover:bg-white hover:text-ink"
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

function PlannerRow({ quest, days, onEdit, disabled }: { quest: Quest; days: string[]; onEdit: () => void; disabled: boolean }) {
  const done = quest.status === "done";
  const loc = LOCATIONS[quest.locationId];
  return (
    <li className={cn("rounded-xl border bg-white/90 p-2", done ? "border-meadow" : "border-white")}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggleTask(quest.id)}
          aria-label={done ? `Mark ${quest.title} as not done` : `Complete ${quest.title}`}
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
            done ? "border-forest bg-forest text-white" : "border-twilight/50 text-transparent hover:border-forest",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </button>
        <button type="button" onClick={onEdit} className={cn("min-w-0 flex-1 text-left text-xs font-bold leading-snug text-ink hover:underline", done && "text-ink-soft line-through")}>
          {quest.title}
        </button>
        <span className="shrink-0 rounded-md bg-lilac/30 px-1.5 text-[10px] font-bold tabular-nums text-ink" title="Work units">
          {quest.category === "quran" ? "—" : `${quest.effortUnits}u`}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1 pl-7">
        <span className="flex min-w-0 items-center gap-1 truncate text-[10px] font-semibold text-ink-soft">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: loc.accent }} />
          {quest.kind === "core" ? "Core" : quest.category === "quran" ? "Quran" : quest.planStatus === "extra" ? "Additional" : "Planned"}
        </span>
        <select
          aria-label={`Move ${quest.title} to another day`}
          value={quest.date ?? ""}
          disabled={disabled}
          onChange={(e) => moveTask(quest.id, e.target.value || null)}
          className="h-6 max-w-[96px] rounded-md border border-twilight/25 bg-white px-1 text-[10px] font-semibold text-ink"
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {formatDay(d, { weekday: "short", day: "numeric" })}
            </option>
          ))}
          <option value="">Any day</option>
        </select>
      </div>
    </li>
  );
}

function ChangeLog({ weekKey }: { weekKey: string }) {
  const changes = usePlanStore((s) => s.changes);
  const list = changes.filter((c) => c.weekKey === weekKey).slice().reverse();
  if (!list.length) return null;
  return (
    <details className="mt-4 rounded-3xl bg-white/50 p-4">
      <summary className="flex cursor-pointer items-center gap-2 font-display text-sm font-semibold text-ink">
        <History className="h-4 w-4" /> Plan changes ({list.length})
      </summary>
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
    </details>
  );
}

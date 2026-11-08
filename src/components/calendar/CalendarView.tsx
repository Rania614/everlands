"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { useCalendarFeed } from "@/hooks/useCalendarFeed";
import { useTodayKey } from "@/hooks/useWeek";
import { addDays, addMonths, formatDay, formatTime, relativeDays, weekDays, weekKeyOf } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWorldStore } from "@/stores/worldStore";
import type { CalendarEntry } from "@/types/calendar";
import { Button } from "../ui/Button";
import { ViewFrame } from "../views/ViewFrame";

type Mode = "month" | "week" | "day" | "agenda";
const MODES: { id: Mode; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Upcoming" },
];

export function CalendarView() {
  const today = useTodayKey();
  if (!today) return null;
  return <Calendar today={today} />;
}

function Calendar({ today }: { today: string }) {
  const focus = useWorldStore((s) => s.focus);
  const weekStart = useWorldStore((s) => s.settings.weekStartsOn);
  const openView = useWorldStore((s) => s.openView);
  const openEditor = useWorldStore((s) => s.openEditor);
  const openQuickAdd = useWorldStore((s) => s.openQuickAdd);
  const [mode, setMode] = useState<Mode>(focus.date ? "day" : "month");
  const [cursor, setCursor] = useState(focus.date ?? today);
  const newEvent = (date: string) => openQuickAdd("event", { date });

  // Visible range per mode
  const monthStart = `${cursor.slice(0, 7)}-01`;
  const gridStart = weekKeyOf(monthStart, weekStart);
  const range =
    mode === "month"
      ? { from: gridStart, to: addDays(gridStart, 41) }
      : mode === "week"
        ? { from: weekKeyOf(cursor, weekStart), to: addDays(weekKeyOf(cursor, weekStart), 6) }
        : mode === "day"
          ? { from: cursor, to: cursor }
          : { from: today, to: addDays(today, 60) };
  const feed = useCalendarFeed(range.from, range.to);

  const step = (dir: 1 | -1) =>
    setCursor((c) => (mode === "month" ? addMonths(c, dir) : mode === "week" ? addDays(c, 7 * dir) : addDays(c, dir)));

  const openEntry = (e: CalendarEntry) => {
    // Edit in a side drawer: the calendar stays visible and in place.
    if (e.kind === "event") openEditor("event", e.refId);
    else if (e.kind === "task") openEditor("task", e.refId);
    else if (e.kind === "quran-session") openEditor("quran-session", e.refId);
    else if (e.kind === "quran-exam") openEditor("quran-exam", e.refId);
    else openView("course", { lessonId: e.refId });
  };

  const title =
    mode === "month"
      ? formatDay(cursor, { month: "long", year: "numeric" })
      : mode === "week"
        ? `${formatDay(range.from, { month: "short", day: "numeric" })} – ${formatDay(range.to, { month: "short", day: "numeric", year: "numeric" })}`
        : mode === "day"
          ? formatDay(cursor, { weekday: "long", month: "long", day: "numeric" })
          : "Next 60 days";

  return (
    <ViewFrame
      eyebrow="Real-life commitments"
      title="Calendar"
      icon={<CalendarDays className="h-5 w-5" />}
      actions={
        <Button variant="primary" size="sm" onClick={() => newEvent(mode === "agenda" ? today : cursor)}>
          <Plus className="h-4 w-4" /> New event
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-2xl bg-white/60 p-1" role="tablist" aria-label="Calendar view">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn("rounded-xl px-3 py-1.5 text-sm font-bold", mode === m.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode !== "agenda" && (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="secondary" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCursor(today)}>
              Today
            </Button>
            <Button size="icon" variant="secondary" onClick={() => step(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <h3 className="font-display text-lg font-semibold text-ink" aria-live="polite">
          {title}
        </h3>
      </div>

      {mode === "month" && (
        <MonthGrid
          start={gridStart}
          month={cursor.slice(0, 7)}
          today={today}
          entries={feed}
          onDay={(d) => {
            setCursor(d);
            setMode("day");
          }}
          onEntry={openEntry}
        />
      )}
      {mode === "week" && <WeekColumns start={range.from} today={today} entries={feed} onEntry={openEntry} onDay={(d) => { setCursor(d); setMode("day"); }} />}
      {mode === "day" && (
        <DayList
          day={cursor}
          today={today}
          entries={feed}
          onEntry={openEntry}
          onAddEvent={() => newEvent(cursor)}
          onAddTask={() => openQuickAdd("task", { date: cursor, weekKey: weekKeyOf(cursor, weekStart) })}
        />
      )}
      {mode === "agenda" && <Agenda today={today} entries={feed} onEntry={openEntry} />}

    </ViewFrame>
  );
}

function EntryChip({ e, onClick, dense = false }: { e: CalendarEntry; onClick: () => void; dense?: boolean }) {
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 rounded-md text-left font-semibold text-ink hover:brightness-95",
        dense ? "px-1 py-0.5 text-[10px] sm:text-[11px]" : "px-2 py-1 text-xs",
        e.done && "opacity-60 line-through",
        e.kind === "task" && "border border-dashed",
      )}
      style={{ background: e.kind === "task" ? "white" : `${e.color}45`, borderColor: e.kind === "task" ? e.color : undefined }}
      title={`${e.title}${e.startTime ? ` · ${formatTime(e.startTime)}` : ""}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 self-start rounded-full mt-1" style={{ background: e.color }} aria-hidden="true" />
      {dense ? (
        <span className="truncate">{e.title}</span>
      ) : (
        <span className="min-w-0">
          {e.startTime && (
            <span className="block tabular-nums text-[10px] text-ink-soft">
              {formatTime(e.startTime)}
              {e.endTime ? ` – ${formatTime(e.endTime)}` : ""}
            </span>
          )}
          <span className="line-clamp-2 break-words">{e.title}</span>
        </span>
      )}
    </button>
  );
}

function MonthGrid({ start, month, today, entries, onDay, onEntry }: { start: string; month: string; today: string; entries: CalendarEntry[]; onDay: (d: string) => void; onEntry: (e: CalendarEntry) => void }) {
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="overflow-hidden rounded-3xl bg-white/50" role="grid" aria-label="Month">
      <div className="grid grid-cols-7 border-b border-white text-center text-[11px] font-bold uppercase tracking-wider text-ink-soft" role="row">
        {days.slice(0, 7).map((d) => (
          <div key={d} className="py-2" role="columnheader">
            {formatDay(d, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const items = entries.filter((e) => e.date === d);
          const inMonth = d.startsWith(month);
          return (
            <div
              key={d}
              role="gridcell"
              tabIndex={0}
              onClick={() => onDay(d)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onDay(d)}
              aria-label={`${formatDay(d, { weekday: "long", month: "long", day: "numeric" })}, ${items.length} item${items.length === 1 ? "" : "s"}`}
              className={cn(
                "min-h-[72px] cursor-pointer border-b border-r border-white/80 p-1 text-left transition-colors hover:bg-white/70 sm:min-h-[96px] sm:p-1.5",
                !inMonth && "bg-ink/[0.03] text-ink-soft/60",
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
                  d === today ? "bg-ink text-cream" : inMonth ? "text-ink" : "text-ink-soft/60",
                )}
              >
                {Number(d.slice(8))}
              </span>
              {/* phones: colour dots; tap the day for details */}
              <div className="flex flex-wrap gap-1 px-0.5 sm:hidden" aria-hidden="true">
                {items.slice(0, 6).map((e) => (
                  <span key={e.key} className="h-2 w-2 rounded-full" style={{ background: e.color, opacity: e.done ? 0.4 : 1 }} />
                ))}
              </div>
              <div className="hidden space-y-0.5 sm:block">
                {items.slice(0, 3).map((e) => (
                  <EntryChip key={e.key} e={e} dense onClick={() => onEntry(e)} />
                ))}
                {items.length > 3 && <p className="px-1 text-[10px] font-bold text-ink-soft">+{items.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekColumns({ start, today, entries, onEntry, onDay }: { start: string; today: string; entries: CalendarEntry[]; onEntry: (e: CalendarEntry) => void; onDay: (d: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-7" aria-label="Week">
      {weekDays(start).map((d) => {
        const items = entries.filter((e) => e.date === d);
        const allDay = items.filter((e) => e.allDay && e.kind !== "task");
        const timed = items.filter((e) => !e.allDay);
        const tasks = items.filter((e) => e.kind === "task");
        return (
          <section key={d} className={cn("flex min-h-40 flex-col rounded-2xl bg-white/55 p-2", d === today && "ring-2 ring-twilight/50")}>
            <button type="button" onClick={() => onDay(d)} className="mb-1.5 text-left">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft">{formatDay(d, { weekday: "short" })}</span>
              <span className={cn("font-display text-lg font-semibold", d === today ? "text-forest" : "text-ink")}>{Number(d.slice(8))}</span>
            </button>
            <div className="space-y-1">
              {allDay.map((e) => (
                <EntryChip key={e.key} e={e} onClick={() => onEntry(e)} />
              ))}
              {allDay.length > 0 && timed.length > 0 && <hr className="border-white" />}
              {timed.map((e) => (
                <EntryChip key={e.key} e={e} onClick={() => onEntry(e)} />
              ))}
              {tasks.length > 0 && <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">Tasks</p>}
              {tasks.map((e) => (
                <EntryChip key={e.key} e={e} onClick={() => onEntry(e)} />
              ))}
              {items.length === 0 && <p className="text-[11px] text-ink-soft/70">Free</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EntryRow({ e, onClick }: { e: CalendarEntry; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn("flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left hover:bg-white", e.done && "opacity-70")}
      >
        <span className="w-16 shrink-0 text-xs font-bold tabular-nums text-ink-soft">
          {e.startTime ? formatTime(e.startTime) : e.kind === "task" ? "Task" : "All day"}
          {e.endTime && <span className="block font-semibold">– {formatTime(e.endTime)}</span>}
        </span>
        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-display text-sm font-semibold text-ink", e.done && "line-through")}>{e.title}</span>
          <span className="block text-xs capitalize text-ink-soft">{e.subtitle?.replace("-", " ")}</span>
        </span>
      </button>
    </li>
  );
}

function DayList({ day, today, entries, onEntry, onAddEvent, onAddTask }: { day: string; today: string; entries: CalendarEntry[]; onEntry: (e: CalendarEntry) => void; onAddEvent: () => void; onAddTask: () => void }) {
  const items = entries.filter((e) => e.date === day);
  const agenda = items.filter((e) => e.kind !== "task");
  const tasks = items.filter((e) => e.kind === "task");
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-3xl bg-white/50 p-3" aria-label="Agenda">
        <div className="mb-2 flex items-center justify-between px-1">
          <h4 className="font-display text-base font-semibold text-ink">Agenda · {relativeDays(today, day)}</h4>
          <Button size="sm" variant="soft" onClick={onAddEvent}>
            <Plus className="h-4 w-4" /> Event
          </Button>
        </div>
        <ul className="space-y-2">
          {agenda.map((e) => (
            <EntryRow key={e.key} e={e} onClick={() => onEntry(e)} />
          ))}
          {agenda.length === 0 && <li className="rounded-2xl bg-white/60 p-4 text-center text-sm text-ink-soft">No events on this day.</li>}
        </ul>
      </section>
      <section className="rounded-3xl bg-white/50 p-3" aria-label="Tasks on this day">
        <div className="mb-2 flex items-center justify-between px-1">
          <h4 className="font-display text-base font-semibold text-ink">Tasks</h4>
          <Button size="sm" variant="soft" onClick={onAddTask}>
            <Plus className="h-4 w-4" /> Task
          </Button>
        </div>
        <ul className="space-y-2">
          {tasks.map((e) => (
            <EntryRow key={e.key} e={e} onClick={() => onEntry(e)} />
          ))}
          {tasks.length === 0 && <li className="rounded-2xl bg-white/60 p-4 text-center text-sm text-ink-soft">No tasks scheduled.</li>}
        </ul>
      </section>
    </div>
  );
}

function Agenda({ today, entries, onEntry }: { today: string; entries: CalendarEntry[]; onEntry: (e: CalendarEntry) => void }) {
  const upcoming = entries.filter((e) => e.kind !== "task" && !e.done);
  const days = [...new Set(upcoming.map((e) => e.date))];
  if (!days.length) return <p className="rounded-2xl bg-white/60 p-6 text-center text-sm text-ink-soft">Nothing on the calendar for the next 60 days.</p>;
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <section key={d} aria-label={formatDay(d)}>
          <h4 className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
            {formatDay(d, { weekday: "long", month: "long", day: "numeric" })} · {relativeDays(today, d)}
          </h4>
          <ul className="space-y-2">
            {upcoming
              .filter((e) => e.date === d)
              .map((e) => (
                <EntryRow key={e.key} e={e} onClick={() => onEntry(e)} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

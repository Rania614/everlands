"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useUpcoming } from "@/hooks/useCalendarFeed";
import { useTodayKey } from "@/hooks/useWeek";
import { formatDay, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWorldStore } from "@/stores/worldStore";

/** Calm "what's next" card on World Home: lessons, Quran, exams, deadlines. */
export function UpcomingWidget({ className, defaultOpen = true }: { className?: string; defaultOpen?: boolean }) {
  const today = useTodayKey();
  const items = useUpcoming(today);
  const openView = useWorldStore((s) => s.openView);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn("glass pointer-events-auto overflow-hidden rounded-3xl shadow-soft", className)} aria-label="Upcoming">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <CalendarDays className="h-4 w-4 shrink-0 text-ink-soft" />
          <span className="font-display text-sm font-semibold text-ink">Upcoming</span>
          {!open && items[0] && (
            <span className="truncate text-xs font-semibold text-ink-soft">
              · {items[0].title}, {items[0].daysAway === 0 ? "today" : `${items[0].daysAway}d`}
            </span>
          )}
          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3">
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.label}>
                <button
                  type="button"
                  onClick={() => openView(it.view, it.focus)}
                  className="flex w-full items-center gap-2.5 rounded-2xl bg-white/70 px-2.5 py-2 text-left hover:bg-white"
                >
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: it.color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft">{it.label}</span>
                    <span className="block truncate text-sm font-bold text-ink">{it.title}</span>
                    <span className="block text-[11px] text-ink-soft">
                      {formatDay(it.date)}
                      {it.time ? ` · ${formatTime(it.time)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-xl bg-white px-2 py-1 text-center text-xs font-bold tabular-nums text-ink">
                    {it.daysAway === 0 ? "Today" : `${it.daysAway}d`}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="rounded-2xl bg-white/60 px-3 py-2 text-xs text-ink-soft">Nothing coming up. Add classes, exams or appointments in the Calendar.</li>}
          </ul>
          <button type="button" onClick={() => openView("calendar")} className="mt-2 w-full rounded-xl py-1 text-xs font-bold text-ink-soft hover:bg-white/70 hover:text-ink">
            Open Calendar →
          </button>
        </div>
      )}
    </section>
  );
}

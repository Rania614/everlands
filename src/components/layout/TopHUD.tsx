"use client";

import { Lock, Settings, Sparkles, Unlock } from "lucide-react";
import { useToday } from "@/hooks/useEnvironment";
import { useWeek } from "@/hooks/useWeek";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { cn } from "@/lib/utils";
import { pad } from "../quests/WeeklySummary";
import { Button } from "../ui/Button";

export function TopHUD() {
  const today = useToday();
  const week = useWeek();
  const { goTo, view } = useWorldNavigation();
  const p = week?.progress;
  const goalsDone = p?.coreGoals.filter((g) => g.achieved).length ?? 0;
  const goalsTotal = p?.coreGoals.length ?? 0;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 sm:p-4">
      <div className="glass pointer-events-auto flex items-center gap-3 rounded-3xl px-3 py-2 shadow-soft sm:px-4">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-meadow to-forest text-white shadow-soft" aria-hidden="true">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <h1 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">Everlands</h1>
          <p className="hidden text-xs font-semibold text-ink-soft sm:block">Your World of Growth &amp; Discovery</p>
        </div>
      </div>

      <div className="glass pointer-events-auto flex items-center gap-2 rounded-3xl py-1.5 pl-2 pr-1.5 shadow-soft sm:gap-3 sm:pl-3">
        <p className="hidden text-sm font-semibold text-ink-soft xl:block" suppressHydrationWarning>
          {today}
        </p>
        {week && p && (
          <button
            type="button"
            onClick={() => goTo("progress")}
            className="flex items-center gap-3 rounded-2xl px-2 py-1 text-left hover:bg-ink/5"
            aria-label={`Week ${week.weekNumber}, level ${week.level}. Weekly score ${p.score} percent. Core goals ${goalsDone} of ${goalsTotal}. ${p.unlocked ? "Next level unlocked" : "Next level not unlocked yet"}. Open progress.`}
          >
            <div className="leading-tight">
              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                <span className="sm:hidden">
                  W{pad(week.weekNumber)} · L{pad(week.level)}
                </span>
                <span className="hidden sm:inline">
                  Week {pad(week.weekNumber)} — Level {pad(week.level)}
                </span>
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-display text-base font-semibold tabular-nums text-ink">{p.score}%</span>
                <span className="relative hidden h-1.5 w-20 overflow-hidden rounded-full bg-ink/10 sm:block" aria-hidden="true">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-lilac" style={{ width: `${Math.min(100, p.score)}%` }} />
                  <span className="absolute inset-y-0 w-px bg-ink/40" style={{ left: "75%" }} />
                </span>
              </div>
            </div>
            <div className="hidden leading-tight md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Core Goals</p>
              <p className="text-sm font-bold text-ink">
                {goalsDone}/{goalsTotal} <span className="font-semibold text-ink-soft">complete</span>
              </p>
            </div>
            <span
              className={cn(
                "hidden items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold lg:inline-flex",
                p.unlocked ? "bg-meadow/70 text-ink" : "bg-ink/5 text-ink-soft",
              )}
            >
              {p.unlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {p.unlocked ? "Next level unlocked" : "In progress"}
            </span>
          </button>
        )}
        <Button
          variant={view === "settings" ? "primary" : "ghost"}
          size="icon"
          onClick={() => goTo(view === "settings" ? "world" : "settings")}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

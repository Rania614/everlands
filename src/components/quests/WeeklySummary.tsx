"use client";

import { CheckCircle2, CircleDashed, Lock, Unlock } from "lucide-react";
import type { WeekView } from "@/hooks/useWeek";
import { UNLOCK_THRESHOLD_PCT, unlockExplanation } from "@/lib/progression";
import { cn } from "@/lib/utils";
import { ProgressBar } from "../ui/ProgressBar";

/** Score bar with the 75% unlock marker. */
export function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <ProgressBar value={Math.min(score, 125) / 125} label={`Weekly score ${score}%`} color="#B9A1D3" />
      <span
        className="absolute -top-0.5 h-3.5 w-0.5 rounded bg-ink/40"
        style={{ left: `${(UNLOCK_THRESHOLD_PCT / 125) * 100}%` }}
        title={`Unlock threshold: more than ${UNLOCK_THRESHOLD_PCT}%`}
        aria-hidden="true"
      />
    </div>
  );
}

export function UnlockPill({ unlocked, className }: { unlocked: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
        unlocked ? "bg-meadow/70 text-ink" : "bg-ink/5 text-ink-soft",
        className,
      )}
    >
      {unlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {unlocked ? "Next level unlocked" : "In progress"}
    </span>
  );
}

export function CoreGoalList({ week, compact = false }: { week: WeekView; compact?: boolean }) {
  const goals = week.progress.coreGoals;
  if (!goals.length) return <p className="text-xs text-ink-soft">No Core Goals this week.</p>;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", !compact && "flex-col")} aria-label="Core Goals">
      {goals.map((g) => (
        <li
          key={g.goalId}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold",
            g.achieved ? "bg-meadow/50 text-ink" : "bg-white/80 text-ink-soft",
          )}
        >
          {g.achieved ? <CheckCircle2 className="h-3.5 w-3.5 text-forest" /> : <CircleDashed className="h-3.5 w-3.5" />}
          {g.title}: {g.achieved ? "Completed" : `${g.completed}/${g.required}`}
        </li>
      ))}
    </ul>
  );
}

/** Compact weekly block used in the quest panel and location views. */
export function WeeklySummary({ week }: { week: WeekView }) {
  const p = week.progress;
  return (
    <div className="rounded-2xl bg-white/60 p-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-ink">
          Week {pad(week.weekNumber)} · Level {pad(week.level)}
        </p>
        <p className="font-display text-lg font-semibold text-ink">{p.score}%</p>
      </div>
      <ScoreBar score={p.score} />
      <p className="mt-2 text-xs font-semibold text-ink-soft">
        {p.countedUnits} of {p.target} units · {p.remaining} remaining
        {p.extraCounted > 0 ? ` · +${p.extraCounted} extra` : ""}
      </p>
      <div className="mt-2">
        <CoreGoalList week={week} compact />
      </div>
      <p className="mt-2 text-xs text-ink-soft" aria-live="polite">
        {unlockExplanation(p)}
      </p>
    </div>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");

"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { formatDay, weekDays } from "@/lib/dates";
import { unitsFor } from "@/lib/progression";
import { moveTask, previewUpdate, toggleTask, updateTask } from "@/lib/taskActions";
import { cn } from "@/lib/utils";
import { useWorldStore } from "@/stores/worldStore";
import type { EffortSize, Quest } from "@/types/quest";

const chipSelect =
  "h-7 cursor-pointer appearance-none rounded-full border border-twilight/20 bg-white/90 px-2.5 text-[11px] font-bold text-ink hover:border-twilight/50 focus:border-twilight disabled:cursor-default disabled:opacity-60";

/**
 * Inline date + effort editing. Changes that would alter a confirmed weekly
 * target show an inline "target A → B · Apply" strip instead of a dialog.
 */
export function TaskInlineMeta({ quest, disabled = false, showDate = true }: { quest: Quest; disabled?: boolean; showDate?: boolean }) {
  const [pending, setPending] = useState<{ patch: Partial<Quest>; before: number; after: number } | null>(null);
  const days = weekDays(quest.weekKey);
  const isQuran = quest.category === "quran";

  const changeSize = (effort: EffortSize) => {
    const patch = { effort, effortUnits: unitsFor(effort) };
    const impact = previewUpdate(quest.id, patch)[0];
    if (impact) setPending({ patch, before: impact.before, after: impact.after });
    else updateTask(quest.id, patch);
  };

  return (
    <>
      {showDate && (
        <select
          aria-label={`Day for ${quest.title}`}
          value={quest.date ?? ""}
          disabled={disabled}
          onChange={(e) => moveTask(quest.id, e.target.value || null)}
          className={chipSelect}
        >
          <option value="">Any day</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {formatDay(d, { weekday: "short", day: "numeric" })}
            </option>
          ))}
        </select>
      )}
      {!isQuran && (
        <select
          aria-label={`Effort for ${quest.title}`}
          value={quest.effort}
          disabled={disabled}
          onChange={(e) => changeSize(e.target.value as EffortSize)}
          className={chipSelect}
          title="Effort in work units"
        >
          <option value="S">Small · 1</option>
          <option value="M">Medium · 2</option>
          <option value="L">Large · 3</option>
          {quest.effort === "custom" && <option value="custom">Custom · {quest.effortUnits}</option>}
        </select>
      )}
      {pending && (
        <span role="alert" className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-gold/40 px-2.5 py-0.5 text-[11px] font-bold text-ink">
          Target {pending.before} → {pending.after}
          <button
            type="button"
            className="rounded-full bg-ink px-2 py-0.5 text-cream"
            onClick={() => {
              updateTask(quest.id, pending.patch, { preconfirmed: true });
              setPending(null);
            }}
          >
            Apply
          </button>
          <button type="button" className="underline" onClick={() => setPending(null)}>
            Cancel
          </button>
        </span>
      )}
    </>
  );
}

/** Compact one-line task used inside lessons, exams and the planner. */
export function TaskRow({
  quest,
  disabled = false,
  showDate = true,
  stacked = false,
}: {
  quest: Quest;
  disabled?: boolean;
  showDate?: boolean;
  /** Narrow columns (planner): chips go on their own line under the title. */
  stacked?: boolean;
}) {
  const openEditor = useWorldStore((s) => s.openEditor);
  const done = quest.status === "done";
  return (
    <li className={cn("flex flex-wrap items-center gap-2 rounded-xl border bg-white/90 px-2.5 py-2", done ? "border-meadow" : "border-white")}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => toggleTask(quest.id)}
        aria-label={done ? `Mark ${quest.title} as not done` : `Complete ${quest.title}`}
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
          done ? "border-forest bg-forest text-white" : "border-twilight/50 text-transparent hover:border-forest",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <button
        type="button"
        onClick={() => openEditor("task", quest.id)}
        className={cn(
          "min-w-0 flex-1 text-left text-sm font-bold text-ink hover:underline",
          stacked ? "line-clamp-2 text-xs leading-snug" : "truncate",
          done && "text-ink-soft line-through",
        )}
        title="Open details"
      >
        {quest.title}
      </button>
      <span className={cn("flex flex-wrap items-center gap-1", stacked && "basis-full pl-8")}>
        <TaskInlineMeta quest={quest} disabled={disabled} showDate={showDate} />
      </span>
    </li>
  );
}

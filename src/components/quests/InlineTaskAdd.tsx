"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { GROWTH_AREAS } from "@/data/growthAreas";
import { weekStartSetting } from "@/lib/lifecycle";
import { weekForDate } from "@/lib/quickAdd";
import { addTask, needsPlanChoice } from "@/lib/taskActions";
import { cn } from "@/lib/utils";
import type { EffortSize, QuestCategory } from "@/types/quest";

export interface InlineTaskContext {
  today: string;
  area: QuestCategory;
  date?: string | null;
  weekKey?: string;
  lessonId?: string | null;
  eventId?: string | null;
  quranExamId?: string | null;
}

/**
 * One-line add: type, press Enter, done. Context (lesson, exam, day, area) is
 * applied automatically. In a confirmed week the task counts as additional
 * work, so the weekly target never changes behind the user's back.
 */
export function InlineTaskAdd({
  context,
  placeholder = "Add a task…",
  effort = "M",
  templates,
  existingTitles = [],
  className,
}: {
  context: InlineTaskContext;
  placeholder?: string;
  effort?: Exclude<EffortSize, "custom">;
  templates?: string[];
  existingTitles?: string[];
  className?: string;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState(false);

  const create = async (t: string) => {
    const date = context.date === undefined ? null : context.date;
    const weekKey = weekForDate(date, context.today, weekStartSetting(), context.weekKey);
    const locationId = GROWTH_AREAS[context.area].locationId;
    await addTask({
      title: t,
      locationId,
      category: context.area,
      durationMin: 30,
      slot: "afternoon",
      weekKey,
      date,
      effort,
      kind: "supporting",
      planStatus: needsPlanChoice(weekKey, "supporting", locationId, context.area) ? "extra" : undefined,
      lessonId: context.lessonId ?? null,
      eventId: context.eventId ?? null,
      quranExamId: context.quranExamId ?? null,
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(true);
      return;
    }
    await create(title.trim());
    setTitle("");
  };

  const unused = templates?.filter((t) => !existingTitles.includes(t)) ?? [];

  return (
    <div className={cn("space-y-2", className)}>
      <form onSubmit={submit} className="flex gap-1.5">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(false);
          }}
          placeholder={placeholder}
          aria-label={placeholder.replace("…", "")}
          aria-invalid={error}
          maxLength={90}
          className={cn(
            "h-9 min-w-0 flex-1 rounded-xl border bg-white/90 px-3 text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-soft/70 focus:border-twilight",
            error ? "border-[#a4594b]" : "border-twilight/25",
          )}
        />
        <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-cream hover:bg-[#3a4768]" aria-label="Add">
          <Plus className="h-4 w-4" />
        </button>
      </form>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Suggestions">
          {unused.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => create(t)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-twilight/40 bg-white/60 px-2.5 py-1 text-xs font-bold text-ink-soft hover:border-twilight hover:text-ink"
            >
              <Plus className="h-3 w-3" /> {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { diffDays, formatDay } from "@/lib/dates";
import { EXAM_PREP_TEMPLATES } from "@/lib/quickAdd";
import { useQuestStore } from "@/stores/questStore";
import type { CalendarEvent } from "@/types/calendar";
import type { QuestCategory } from "@/types/quest";
import { InlineTaskAdd } from "../quests/InlineTaskAdd";
import { TaskRow } from "../quests/TaskRow";
import { ChipGroup } from "../ui/ChipGroup";
import { ProgressBar } from "../ui/ProgressBar";

export function countdownLabel(today: string, date: string, taken = false) {
  if (taken) return "Taken";
  const d = diffDays(today, date);
  return d > 1 ? `${d} days to go` : d === 1 ? "Tomorrow" : d === 0 ? "Today" : "Date passed";
}

/**
 * Exam preparation: countdown, progress, one-tap templates and a one-line add.
 * Tasks are linked to the exam automatically; completing them never marks the
 * exam as taken.
 */
export function ExamPrep({ event, today }: { event: CalendarEvent; today: string }) {
  const quests = useQuestStore((s) => s.quests);
  const [area, setArea] = useState<QuestCategory>("tech");
  const linked = quests.filter((q) => q.eventId === event.id);
  const done = linked.filter((q) => q.status === "done").length;
  const prepDate = event.date >= today ? today : event.date;

  return (
    <section aria-label="Exam preparation" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-coral/30 px-2.5 py-1 text-xs font-bold text-ink">{countdownLabel(today, event.date, event.exam?.status === "completed")}</span>
        <span className="text-xs font-semibold text-ink-soft">{formatDay(event.date, { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>
      {linked.length > 0 && (
        <div>
          <ProgressBar value={done / linked.length} label="Preparation progress" color="#E7A99C" size="sm" />
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {done} of {linked.length} preparation tasks done
          </p>
        </div>
      )}
      <ul className="space-y-1.5">
        {linked.map((q) => (
          <TaskRow key={q.id} quest={q} />
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-ink-soft">Area</span>
        <ChipGroup
          label="Area for preparation tasks"
          size="sm"
          value={area}
          onChange={setArea}
          options={[
            { id: "tech", label: "Technical" },
            { id: "english", label: "English" },
            { id: "personal", label: "Personal" },
          ]}
        />
      </div>
      <InlineTaskAdd
        context={{ today, area, date: prepDate, eventId: event.id }}
        placeholder="Add a preparation task…"
        templates={EXAM_PREP_TEMPLATES}
        existingTitles={linked.map((q) => q.title)}
      />
    </section>
  );
}

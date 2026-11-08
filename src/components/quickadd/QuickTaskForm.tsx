"use client";

import { useState, type FormEvent } from "react";
import { GROWTH_AREAS } from "@/data/growthAreas";
import { DAY_SLOTS, DURATION_OPTIONS } from "@/data/quests";
import { weekStartSetting } from "@/lib/lifecycle";
import { EFFORT_LABELS, KIND_LABELS, MAX_CUSTOM_UNITS, unitsFor, weekTarget } from "@/lib/progression";
import { weekForDate } from "@/lib/quickAdd";
import { addTask, needsPlanChoice } from "@/lib/taskActions";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import type { QuickAddContext } from "@/stores/worldStore";
import type { DaySlot, EffortSize, QuestCategory, TaskKind } from "@/types/quest";
import { Button } from "../ui/Button";
import { ChipGroup } from "../ui/ChipGroup";
import { Disclosure } from "../ui/Disclosure";
import { inputClass } from "../ui/Field";
import { AreaChips, ErrorText, FieldLabel, PlanChoice, SizeChips, WhenPicker } from "./fields";

export interface TaskDraft {
  title: string;
  area: QuestCategory;
  date: string | null;
  effort: EffortSize;
  customUnits: number;
  planStatus: "extra" | "planned";
  kind: TaskKind;
  coreGoalId: string;
  slot: DaySlot;
  durationMin: number;
  description: string;
}

export function newTaskDraft(today: string, ctx: QuickAddContext, lastArea: QuestCategory): TaskDraft {
  const area = ctx.locationId ? (Object.values(GROWTH_AREAS).find((a) => a.locationId === ctx.locationId)?.id ?? lastArea) : lastArea;
  return {
    title: ctx.title ?? "",
    area,
    date: ctx.date === undefined ? today : ctx.date,
    effort: "M",
    customUnits: 4,
    planStatus: "extra",
    kind: "supporting",
    coreGoalId: "",
    slot: "afternoon",
    durationMin: 30,
    description: "",
  };
}

/**
 * Level 1: title, area, when, effort. Everything else (role in the plan, Core
 * Goal, time of day, duration, notes) waits under "More details".
 */
export function QuickTaskForm({
  today,
  ctx,
  draft,
  setDraft,
  onSaved,
}: {
  today: string;
  ctx: QuickAddContext;
  draft: TaskDraft;
  setDraft: (d: TaskDraft) => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const quests = useQuestStore((s) => s.quests);
  const set = (patch: Partial<TaskDraft>) => setDraft({ ...draft, ...patch });

  const weekKey = weekForDate(draft.date, today, weekStartSetting(), ctx.weekKey);
  const plan = usePlanStore((s) => s.plans[weekKey]);
  const goals = usePlanStore((s) => s.coreGoals);
  const isQuran = draft.area === "quran";
  const units = unitsFor(draft.effort, draft.customUnits);
  const locationId = GROWTH_AREAS[draft.area].locationId;
  const kind: TaskKind = isQuran ? "supporting" : draft.kind;
  const showPlanChoice = needsPlanChoice(weekKey, kind, locationId, draft.area);
  const goalOptions = (plan?.requirements ?? goals.filter((g) => g.active).map((g) => ({ goalId: g.id, title: g.title, areaId: g.areaId }))).filter(
    (g) => g.areaId === draft.area,
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Add a short title.");
      document.getElementById("qa-task-title")?.focus();
      return;
    }
    if (kind === "core" && !draft.coreGoalId) {
      setError("Pick the Core Goal this task fulfils, or choose another role under More details.");
      return;
    }
    setBusy(true);
    const created = await addTask({
      title: draft.title,
      locationId,
      category: draft.area,
      durationMin: draft.durationMin,
      slot: draft.slot,
      weekKey,
      date: draft.date,
      effort: draft.effort,
      effortUnits: units,
      kind,
      planStatus: showPlanChoice ? draft.planStatus : undefined,
      description: draft.description.trim() || undefined,
      coreGoalId: kind === "core" ? draft.coreGoalId : null,
      lessonId: ctx.lessonId ?? null,
      eventId: ctx.eventId ?? null,
      quranExamId: ctx.quranExamId ?? null,
    });
    setBusy(false);
    if (created) onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <div>
        <FieldLabel htmlFor="qa-task-title">Task</FieldLabel>
        <input
          id="qa-task-title"
          data-autofocus
          value={draft.title}
          maxLength={90}
          onChange={(e) => {
            set({ title: e.target.value });
            if (error) setError(null);
          }}
          placeholder="What do you want to do?"
          className={`${inputClass} h-11 text-base`}
          aria-invalid={!!error}
          aria-describedby={error ? "qa-task-error" : undefined}
        />
        {error && <ErrorText id="qa-task-error">{error}</ErrorText>}
      </div>
      {!ctx.lockKind || !ctx.lessonId ? <AreaChips value={draft.area} onChange={(area) => set({ area })} /> : null}
      <WhenPicker today={today} date={draft.date} onChange={(date) => set({ date })} />
      {!isQuran && <SizeChips value={draft.effort} onChange={(effort) => set({ effort })} />}
      {showPlanChoice && <PlanChoice value={draft.planStatus} onChange={(planStatus) => set({ planStatus })} before={weekTarget(quests, weekKey)} units={units} />}

      <Disclosure summary="Role, time, notes">
        <div className="space-y-3">
          {!isQuran && (
            <div>
              <FieldLabel>Role in the weekly plan</FieldLabel>
              <ChipGroup
                label="Role in the weekly plan"
                size="sm"
                value={draft.kind}
                onChange={(k) => set({ kind: k, coreGoalId: k === "core" ? (goalOptions[0]?.goalId ?? "") : draft.coreGoalId })}
                options={(Object.keys(KIND_LABELS) as TaskKind[]).map((id) => ({ id, label: KIND_LABELS[id], disabled: id === "core" && goalOptions.length === 0 }))}
              />
            </div>
          )}
          {kind === "core" && goalOptions.length > 1 && (
            <select aria-label="Core Goal" value={draft.coreGoalId} onChange={(e) => set({ coreGoalId: e.target.value })} className={inputClass}>
              {goalOptions.map((g) => (
                <option key={g.goalId} value={g.goalId}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          {!isQuran && (
            <label className="flex items-center gap-2 text-xs font-bold text-ink-soft">
              <input type="checkbox" checked={draft.effort === "custom"} onChange={(e) => set({ effort: e.target.checked ? "custom" : "M" })} />
              Custom effort
              {draft.effort === "custom" && (
                <input
                  type="number"
                  min={1}
                  max={MAX_CUSTOM_UNITS}
                  aria-label="Custom work units"
                  value={draft.customUnits}
                  onChange={(e) => set({ customUnits: Number(e.target.value) })}
                  className="h-8 w-16 rounded-lg border border-twilight/30 bg-white px-2 text-sm text-ink"
                />
              )}
              <span className="font-semibold">{draft.effort === "custom" ? "units" : EFFORT_LABELS[draft.effort]}</span>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Time of day" value={draft.slot} onChange={(e) => set({ slot: e.target.value as DaySlot })} className={inputClass}>
              {DAY_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select aria-label="Duration" value={draft.durationMin} onChange={(e) => set({ durationMin: Number(e.target.value) })} className={inputClass}>
              {DURATION_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <textarea aria-label="Notes" rows={2} placeholder="Notes (optional)" value={draft.description} onChange={(e) => set({ description: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
        </div>
      </Disclosure>

      <div className="flex justify-end pt-1">
        <Button type="submit" variant="primary" disabled={busy}>
          Add task
        </Button>
      </div>
    </form>
  );
}

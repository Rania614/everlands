"use client";

import { useState, type FormEvent } from "react";
import { DAY_SLOTS, DURATION_OPTIONS } from "@/data/quests";
import { AREA_BY_LOCATION, GROWTH_AREAS } from "@/data/growthAreas";
import { LOCATION_LIST } from "@/data/locations";
import { addDays, formatDay, todayKey, weekKeyOf } from "@/lib/dates";
import { weekStartSetting } from "@/lib/lifecycle";
import { EFFORT_LABELS, KIND_LABELS, MAX_CUSTOM_UNITS, unitsFor } from "@/lib/progression";
import { addTask, moveTask, updateTask } from "@/lib/taskActions";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import type { DaySlot, EffortSize, Quest, TaskKind } from "@/types/quest";
import type { LocationId } from "@/types/world";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { SelectInput, TextArea, TextInput } from "../ui/Field";

export interface TaskDefaults {
  title?: string;
  weekKey: string;
  date?: string | null;
  locationId?: LocationId;
  kind?: TaskKind;
  effort?: EffortSize;
  coreGoalId?: string | null;
  lessonId?: string | null;
  eventId?: string | null;
  quranExamId?: string | null;
  description?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit an existing task, or create one from `defaults`. */
  task?: Quest | null;
  defaults?: TaskDefaults;
  heading?: string;
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-2xl bg-white/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          disabled={o.disabled}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-xl px-2.5 py-1.5 text-xs font-bold disabled:opacity-40",
            value === o.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Create or edit a task: effort, role in the weekly plan, day and relations. */
export function TaskFormModal(props: Props) {
  if (!props.open) return null;
  // Remount per open so the form starts from the right task/defaults.
  return <TaskForm key={props.task?.id ?? JSON.stringify(props.defaults)} {...props} />;
}

function TaskForm({ open, onClose, task, defaults, heading }: Props) {
  const d = defaults ?? { weekKey: weekKeyOf(todayKey(), weekStartSetting()) };
  const [title, setTitle] = useState(task?.title ?? d.title ?? "");
  const [locationId, setLocationId] = useState<LocationId>(task?.locationId ?? d.locationId ?? "haven");
  const [effort, setEffort] = useState<EffortSize>(task?.effort ?? d.effort ?? "M");
  const [customUnits, setCustomUnits] = useState(task?.effort === "custom" ? task.effortUnits : 4);
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? d.kind ?? "supporting");
  const [date, setDate] = useState<string>(task ? (task.date ?? "") : (d.date ?? ""));
  const [weekKey, setWeekKey] = useState(task?.weekKey ?? d.weekKey);
  const [slot, setSlot] = useState<DaySlot>(task?.slot ?? "afternoon");
  const [durationMin, setDuration] = useState(task?.durationMin ?? 30);
  const [description, setDescription] = useState(task?.description ?? d.description ?? "");
  const [coreGoalId, setCoreGoalId] = useState<string>(task?.coreGoalId ?? d.coreGoalId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const category = AREA_BY_LOCATION[locationId];
  const isQuran = category === "quran";
  const effectiveWeek = date ? weekKeyOf(date, weekStartSetting()) : weekKey;
  const plan = usePlanStore((s) => s.plans[effectiveWeek]);
  const goals = usePlanStore((s) => s.coreGoals);
  const requirementGoals = (plan?.requirements ?? goals.filter((g) => g.active).map((g) => ({ goalId: g.id, title: g.title, areaId: g.areaId })))
    .filter((r) => r.areaId === category);
  const units = unitsFor(effort, customUnits);
  const thisWeek = weekKeyOf(todayKey(), weekStartSetting());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give the task a short name.");
    if (kind === "core" && !coreGoalId) return setError("Choose which Core Goal this task fulfils, or pick another type.");
    setBusy(true);
    const common = {
      title: title.trim(),
      locationId,
      category,
      effort,
      effortUnits: units,
      kind: isQuran && kind === "core" ? "supporting" : kind,
      slot,
      durationMin,
      description: description.trim() || undefined,
      coreGoalId: kind === "core" ? coreGoalId : (task?.coreGoalId ?? d.coreGoalId ?? null),
    } as const;
    let ok = true;
    if (task) {
      const newDate = date || null;
      if (newDate !== task.date || (!newDate && weekKey !== task.weekKey)) {
        ok = newDate ? await moveTask(task.id, newDate) : await updateTask(task.id, { date: null, weekKey });
      }
      if (ok) ok = await updateTask(task.id, common);
    } else {
      const created = await addTask({
        ...common,
        weekKey: effectiveWeek,
        date: date || null,
        lessonId: d.lessonId ?? null,
        eventId: d.eventId ?? null,
        quranExamId: d.quranExamId ?? null,
      });
      ok = !!created;
    }
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={heading ?? (task ? "Edit task" : "New task")}
      description={isQuran ? "Quran tasks are tracked on their own and never affect the Weekly Score." : `Counts as ${units} work unit${units === 1 ? "" : "s"} toward the week it belongs to.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="task-form" disabled={busy}>
            {task ? "Save task" : "Add task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Title" value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} className="sm:col-span-2" placeholder="e.g. Revise Chapter 2" aria-invalid={!!error} />
        <SelectInput label="Area" value={locationId} onChange={(e) => setLocationId(e.target.value as LocationId)}>
          {LOCATION_LIST.map((l) => (
            <option key={l.id} value={l.id}>
              {GROWTH_AREAS[AREA_BY_LOCATION[l.id]].name} · {l.name}
            </option>
          ))}
        </SelectInput>
        <TextInput label="Day" type="date" value={date} onChange={(e) => setDate(e.target.value)} hint={date ? `Week of ${formatDay(effectiveWeek)}` : "Leave empty for “any day this week”."} />
        {!date && (
          <SelectInput label="Week" value={weekKey} onChange={(e) => setWeekKey(e.target.value)}>
            {[0, 1, 2].map((n) => {
              const wk = addDays(thisWeek, n * 7);
              return (
                <option key={wk} value={wk}>
                  {n === 0 ? "This week" : n === 1 ? "Next week" : "In two weeks"} ({formatDay(wk, { month: "short", day: "numeric" })})
                </option>
              );
            })}
            {![0, 1, 2].some((n) => addDays(thisWeek, n * 7) === weekKey) && <option value={weekKey}>Week of {formatDay(weekKey)}</option>}
          </SelectInput>
        )}

        <div className="sm:col-span-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Effort</p>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<EffortSize> label="Effort" value={effort} onChange={setEffort} options={(Object.keys(EFFORT_LABELS) as EffortSize[]).map((id) => ({ id, label: EFFORT_LABELS[id] }))} />
            {effort === "custom" && (
              <input
                aria-label="Custom work units"
                type="number"
                min={1}
                max={MAX_CUSTOM_UNITS}
                value={customUnits}
                onChange={(e) => setCustomUnits(Number(e.target.value))}
                className="h-9 w-20 rounded-xl border border-twilight/30 bg-white px-2 text-sm font-semibold"
              />
            )}
          </div>
        </div>

        {!isQuran && (
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Role in the weekly plan</p>
            <Segmented<TaskKind>
              label="Role in the weekly plan"
              value={kind}
              onChange={setKind}
              options={(Object.keys(KIND_LABELS) as TaskKind[]).map((id) => ({ id, label: KIND_LABELS[id], disabled: id === "core" && requirementGoals.length === 0 }))}
            />
            <p className="mt-1 text-xs text-ink-soft">
              {kind === "core" || kind === "supporting"
                ? "Part of the weekly target."
                : "Not in the target. When done, it counts as additional work (up to the weekly bonus limit)."}
            </p>
          </div>
        )}
        {kind === "core" && !isQuran && (
          <SelectInput label="Core Goal" value={coreGoalId} onChange={(e) => setCoreGoalId(e.target.value)} className="sm:col-span-2">
            <option value="">Choose a Core Goal…</option>
            {requirementGoals.map((g) => (
              <option key={g.goalId} value={g.goalId}>
                {g.title}
              </option>
            ))}
          </SelectInput>
        )}

        <SelectInput label="Time of day" value={slot} onChange={(e) => setSlot(e.target.value as DaySlot)}>
          {DAY_SLOTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput label="Duration" value={durationMin} onChange={(e) => setDuration(Number(e.target.value))}>
          {DURATION_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </SelectInput>
        <TextArea label="Notes" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" rows={2} />
        {error && <p className="text-sm font-semibold text-[#a4594b] sm:col-span-2">{error}</p>}
      </form>
    </Modal>
  );
}

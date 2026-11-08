"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { DEFAULT_CORE_GOALS, GROWTH_AREAS, SCORED_AREAS } from "@/data/growthAreas";
import { uid } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import type { CoreGoal } from "@/types/plan";
import { Disclosure } from "../ui/Disclosure";
import { Toggle, inputClass } from "../ui/Field";

/**
 * Compact Core Goals: one row per goal with an on/off switch and the minimum
 * to complete. Requirements and workload stay folded until asked for.
 * Changes apply from the next planned week; the current week keeps its snapshot.
 */
export function CoreGoalsEditor() {
  const goals = usePlanStore((s) => s.coreGoals);
  const update = usePlanStore((s) => s.updateCoreGoal);
  const remove = usePlanStore((s) => s.removeCoreGoal);
  const presets = DEFAULT_CORE_GOALS.filter((p) => !goals.some((g) => g.id === p.id));

  const addPreset = (p: CoreGoal) => usePlanStore.setState((s) => ({ coreGoals: [...s.coreGoals, { ...p, active: true }] }));
  const addCustom = () =>
    usePlanStore.getState().addCoreGoal({
      areaId: "personal",
      title: "New goal",
      condition: "",
      requirements: [{ id: uid("req"), title: "First step", effort: "M" }],
      minCompleted: 1,
      active: true,
    });

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {goals.map((g) => (
          <GoalRow key={g.id} goal={g} onChange={(patch) => update(g.id, patch)} onRemove={() => remove(g.id)} />
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => addPreset(p)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-twilight/40 bg-white/60 px-3 py-1 text-xs font-bold text-ink-soft hover:border-twilight hover:text-ink"
          >
            <Plus className="h-3 w-3" /> {p.title} preset
          </button>
        ))}
        <button type="button" onClick={addCustom} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-ink-soft hover:bg-white hover:text-ink">
          <Plus className="h-3 w-3" /> Custom goal
        </button>
      </div>
      <p className="text-xs text-ink-soft">Applies from the next week you plan. Quran is never a Core Goal.</p>
    </div>
  );
}

function GoalRow({ goal, onChange, onRemove }: { goal: CoreGoal; onChange: (p: Partial<CoreGoal>) => void; onRemove: () => void }) {
  const max = goal.requirements.length;
  const setReq = (id: string, patch: Partial<CoreGoal["requirements"][number]>) => onChange({ requirements: goal.requirements.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  return (
    <li className="rounded-2xl bg-white/70 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: GROWTH_AREAS[goal.areaId].color }} aria-hidden="true" />
        <input
          aria-label="Core Goal name"
          value={goal.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 font-display text-base font-semibold text-ink hover:border-twilight/30 focus:border-twilight focus:bg-white"
        />
        <div className="flex items-center gap-1 text-xs font-bold text-ink-soft" aria-label="Minimum to complete">
          Complete
          <button type="button" aria-label="Fewer required" disabled={goal.minCompleted <= 1} onClick={() => onChange({ minCompleted: goal.minCompleted - 1 })} className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink disabled:opacity-40">
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-4 text-center tabular-nums text-ink">{goal.minCompleted}</span>
          <button type="button" aria-label="More required" disabled={goal.minCompleted >= max} onClick={() => onChange({ minCompleted: goal.minCompleted + 1 })} className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink disabled:opacity-40">
            <Plus className="h-3 w-3" />
          </button>
          of {max}
        </div>
        <Toggle checked={goal.active} onChange={(active) => onChange({ active })} label={goal.active ? "On" : "Off"} />
      </div>
      <Disclosure label="Requirements & workload" summary={goal.requirements.map((r) => r.title).join(", ")} className="mt-1">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <select aria-label="Growth area" value={goal.areaId} onChange={(e) => onChange({ areaId: e.target.value as CoreGoal["areaId"] })} className={`${inputClass} h-9 w-auto`}>
              {SCORED_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input aria-label="Completion condition" placeholder="What counts as done?" value={goal.condition} onChange={(e) => onChange({ condition: e.target.value })} className={`${inputClass} h-9 flex-1 font-normal`} />
          </div>
          <ul className="space-y-1.5">
            {goal.requirements.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <input aria-label="Requirement" value={r.title} onChange={(e) => setReq(r.id, { title: e.target.value })} className={`${inputClass} h-9 flex-1 font-normal`} />
                <select aria-label="Requirement effort" value={r.effort} onChange={(e) => setReq(r.id, { effort: e.target.value as "S" | "M" | "L" })} className={`${inputClass} h-9 w-24`}>
                  <option value="S">Small · 1</option>
                  <option value="M">Medium · 2</option>
                  <option value="L">Large · 3</option>
                </select>
                <button
                  type="button"
                  disabled={goal.requirements.length <= 1}
                  onClick={() => onChange({ requirements: goal.requirements.filter((x) => x.id !== r.id), minCompleted: Math.min(goal.minCompleted, goal.requirements.length - 1) })}
                  aria-label={`Remove ${r.title}`}
                  className="text-ink-soft hover:text-ink disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" onClick={() => onChange({ requirements: [...goal.requirements, { id: uid("req"), title: "New requirement", effort: "M" }] })} className="inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-ink">
              <Plus className="h-3 w-3" /> Requirement
            </button>
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-[#a4594b]">
              <Trash2 className="h-3 w-3" /> Remove goal
            </button>
          </div>
        </div>
      </Disclosure>
    </li>
  );
}

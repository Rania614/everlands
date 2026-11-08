"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GROWTH_AREAS, SCORED_AREAS } from "@/data/growthAreas";
import { uid } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import type { CoreGoal } from "@/types/plan";
import type { QuestCategory } from "@/types/quest";
import { Button } from "../ui/Button";
import { Toggle, inputClass } from "../ui/Field";

/**
 * Core Goals are user data, not hardcoded categories. Edits apply to weeks
 * whose plan hasn't been created yet; active weeks keep their snapshot.
 */
export function CoreGoalsEditor() {
  const goals = usePlanStore((s) => s.coreGoals);
  const update = usePlanStore((s) => s.updateCoreGoal);
  const remove = usePlanStore((s) => s.removeCoreGoal);
  const add = usePlanStore((s) => s.addCoreGoal);
  const [newArea, setNewArea] = useState<QuestCategory>("personal");

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Changes apply from the next week you plan. This week keeps the requirements it started with, so nothing changes silently.
      </p>
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} onChange={(patch) => update(g.id, patch)} onRemove={() => remove(g.id)} />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Growth area for new Core Goal" value={newArea} onChange={(e) => setNewArea(e.target.value as QuestCategory)} className={`${inputClass} w-auto`}>
          {SCORED_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Button
          onClick={() =>
            add({
              areaId: newArea,
              title: GROWTH_AREAS[newArea].name,
              condition: "Describe what counts as done.",
              requirements: [{ id: uid("req"), title: "First requirement", effort: "M" }],
              minCompleted: 1,
              active: true,
            })
          }
        >
          <Plus className="h-4 w-4" /> Add Core Goal
        </Button>
      </div>
      <p className="text-xs text-ink-soft">Quran is never a Core Goal: it is tracked in its own space and never affects levels.</p>
    </div>
  );
}

function GoalCard({ goal, onChange, onRemove }: { goal: CoreGoal; onChange: (p: Partial<CoreGoal>) => void; onRemove: () => void }) {
  const setReq = (id: string, patch: Partial<CoreGoal["requirements"][number]>) =>
    onChange({ requirements: goal.requirements.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ background: GROWTH_AREAS[goal.areaId].color }} aria-hidden="true" />
        <input aria-label="Core Goal name" value={goal.title} onChange={(e) => onChange({ title: e.target.value })} className={`${inputClass} w-40`} />
        <span className="text-xs font-bold text-ink-soft">{GROWTH_AREAS[goal.areaId].name}</span>
        <Toggle checked={goal.active} onChange={(active) => onChange({ active })} label={goal.active ? "Active" : "Off"} />
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onRemove} aria-label={`Delete ${goal.title}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <input aria-label="Completion condition" value={goal.condition} onChange={(e) => onChange({ condition: e.target.value })} className={`${inputClass} mt-2 font-normal`} />
      <ul className="mt-2 space-y-1.5">
        {goal.requirements.map((r) => (
          <li key={r.id} className="flex items-center gap-2">
            <input aria-label="Requirement" value={r.title} onChange={(e) => setReq(r.id, { title: e.target.value })} className={`${inputClass} h-9 flex-1 font-normal`} />
            <select aria-label="Requirement effort" value={r.effort} onChange={(e) => setReq(r.id, { effort: e.target.value as "S" | "M" | "L" })} className={`${inputClass} h-9 w-24`}>
              <option value="S">S · 1</option>
              <option value="M">M · 2</option>
              <option value="L">L · 3</option>
            </select>
            <Button
              size="sm"
              variant="ghost"
              disabled={goal.requirements.length <= 1}
              onClick={() => onChange({ requirements: goal.requirements.filter((x) => x.id !== r.id), minCompleted: Math.min(goal.minCompleted, goal.requirements.length - 1) })}
              aria-label={`Remove ${r.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => onChange({ requirements: [...goal.requirements, { id: uid("req"), title: "New requirement", effort: "M" }] })}>
          <Plus className="h-3.5 w-3.5" /> Requirement
        </Button>
        <label className="flex items-center gap-2 text-xs font-bold text-ink-soft">
          Minimum completed
          <input
            type="number"
            min={1}
            max={goal.requirements.length}
            value={goal.minCompleted}
            onChange={(e) => onChange({ minCompleted: Math.max(1, Math.min(goal.requirements.length, Number(e.target.value))) })}
            className="h-8 w-16 rounded-lg border border-twilight/30 bg-white px-2 text-sm font-semibold text-ink"
          />
          of {goal.requirements.length}
        </label>
      </div>
    </div>
  );
}

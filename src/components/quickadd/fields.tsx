"use client";

import { AREA_LIST, GROWTH_AREAS } from "@/data/growthAreas";
import { formatDay } from "@/lib/dates";
import { dayChoices } from "@/lib/quickAdd";
import type { EffortSize, QuestCategory } from "@/types/quest";
import { ChipGroup } from "../ui/ChipGroup";
import { inputClass } from "../ui/Field";

/** Shared Level-1 fields used by Quick Add and the editors. */

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-bold text-ink-soft">
      {children}
    </label>
  );
}

const SHORT_AREA: Record<QuestCategory, string> = { english: "English", tech: "Technical", personal: "Personal", quran: "Quran" };

export function AreaChips({ value, onChange, includeQuran = true }: { value: QuestCategory; onChange: (v: QuestCategory) => void; includeQuran?: boolean }) {
  return (
    <div>
      <FieldLabel>Area</FieldLabel>
      <ChipGroup
        label="Area"
        size="sm"
        value={value}
        onChange={onChange}
        options={AREA_LIST.filter((a) => includeQuran || a.id !== "quran").map((a) => ({ id: a.id, label: SHORT_AREA[a.id], color: GROWTH_AREAS[a.id].color }))}
      />
    </div>
  );
}

/**
 * Today · Tomorrow · This week · Pick date. `date === null` means "any day
 * this week" (the task keeps its week, see weekForDate).
 */
export function WhenPicker({
  today,
  date,
  onChange,
  label = "When",
  allowAnyDay = true,
}: {
  today: string;
  date: string | null;
  onChange: (date: string | null) => void;
  label?: string;
  allowAnyDay?: boolean;
}) {
  const choices = dayChoices(today).filter((c) => allowAnyDay || c.id !== "week");
  const current = date === today ? "today" : date === choices[1].date ? "tomorrow" : date === null && allowAnyDay ? "week" : "pick";
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-1.5">
        <ChipGroup
          label={label}
          size="sm"
          value={current}
          onChange={(id) => {
            const c = choices.find((x) => x.id === id)!;
            if (id === "pick") onChange(date ?? today);
            else onChange(c.date);
          }}
          options={choices.map((c) => ({ id: c.id, label: c.id === "pick" && current === "pick" && date ? formatDay(date, { month: "short", day: "numeric" }) : c.label }))}
        />
        {current === "pick" && (
          <input
            type="date"
            aria-label="Pick a date"
            value={date ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className={`${inputClass} h-8 w-auto py-0 text-xs`}
          />
        )}
      </div>
    </div>
  );
}

export const SIZE_OPTIONS: { id: Exclude<EffortSize, "custom">; label: string; title: string }[] = [
  { id: "S", label: "Small", title: "1 unit" },
  { id: "M", label: "Medium", title: "2 units" },
  { id: "L", label: "Large", title: "3 units" },
];

export function SizeChips({ value, onChange }: { value: EffortSize; onChange: (v: EffortSize) => void }) {
  return (
    <div>
      <FieldLabel>Effort</FieldLabel>
      <ChipGroup
        label="Effort"
        size="sm"
        value={value === "custom" ? "custom" : value}
        onChange={onChange}
        options={[...SIZE_OPTIONS, ...(value === "custom" ? [{ id: "custom" as const, label: "Custom", title: "" }] : [])]}
      />
    </div>
  );
}

/** Inline replacement for the old second dialog: shown only when the week's plan is confirmed. */
export function PlanChoice({ value, onChange, before, units }: { value: "extra" | "planned"; onChange: (v: "extra" | "planned") => void; before: number; units: number }) {
  return (
    <div className="rounded-2xl bg-gold/20 p-2.5">
      <FieldLabel>This week&apos;s plan is confirmed. This task counts as…</FieldLabel>
      <ChipGroup
        label="Counts as"
        size="sm"
        value={value}
        onChange={onChange}
        options={[
          { id: "extra", label: "Additional work", title: "Target stays the same" },
          { id: "planned", label: `Part of the plan · target ${before} → ${before + units}` },
        ]}
      />
    </div>
  );
}

export function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-bold text-[#a4594b]">
      {children}
    </p>
  );
}

"use client";

import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorldStore } from "@/stores/worldStore";
import { WEEK_START_OPTIONS, type WeekStart } from "@/lib/dates";
import { rekeyOpenWeeks, syncWeeks } from "@/lib/lifecycle";
import { usePlanStore } from "@/stores/planStore";
import { CoreGoalsEditor } from "./CoreGoalsEditor";
import type { GraphicsQuality, MotionPreference } from "@/types/world";
import { Button } from "../ui/Button";
import { ViewFrame } from "./ViewFrame";

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-2xl bg-white/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn("rounded-xl px-3 py-1.5 text-sm font-bold", value === o.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/70 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink-soft">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const settings = useWorldStore((s) => s.settings);
  const update = useWorldStore((s) => s.updateSettings);
  const recenter = useWorldStore((s) => s.recenter);
  const goToWorld = useWorldStore((s) => s.goToWorld);
  const systemReduced = useWorldStore((s) => s.systemReducedMotion);
  const bonusCap = usePlanStore((s) => s.bonusCapPct);
  const setBonusCap = usePlanStore((s) => s.setBonusCap);
  const ask = useWorldStore((s) => s.ask);

  const changeWeekStart = async (next: WeekStart) => {
    if (next === settings.weekStartsOn) return;
    const ok = await ask({
      title: "Change the first day of the week?",
      message: "Open weeks will be regrouped around the new start day. Finished weeks and their results stay exactly as they are. The current week returns to planning so you can confirm its target again.",
      actions: [{ id: "ok", label: "Change week start", variant: "primary" }],
    });
    if (ok !== "ok") return;
    update({ weekStartsOn: next });
    rekeyOpenWeeks(next);
    syncWeeks();
  };

  return (
    <ViewFrame eyebrow="Make it yours" title="Settings" icon={<Settings className="h-5 w-5" />}>
      <div className="max-w-3xl">
        <Row title="Motion" hint={`Reduce animations in the world and interface.${systemReduced ? " Your device prefers reduced motion." : ""}`}>
          <Segmented<MotionPreference>
            label="Motion"
            value={settings.motion}
            onChange={(motion) => update({ motion })}
            options={[
              { id: "system", label: "System" },
              { id: "reduced", label: "Reduced" },
              { id: "full", label: "Full" },
            ]}
          />
        </Row>
        <Row title="Graphics quality" hint="Low turns off shadows and some decorations for older devices.">
          <Segmented<GraphicsQuality>
            label="Graphics quality"
            value={settings.quality}
            onChange={(quality) => update({ quality })}
            options={[
              { id: "auto", label: "Auto" },
              { id: "high", label: "High" },
              { id: "low", label: "Low" },
            ]}
          />
        </Row>
        <Row title="Week starts on" hint="Each week is one level. Choose the day a new level begins.">
          <Segmented<`${WeekStart}`>
            label="Week starts on"
            value={`${settings.weekStartsOn}`}
            onChange={(v) => changeWeekStart(Number(v) as WeekStart)}
            options={WEEK_START_OPTIONS.map((o) => ({ id: `${o.id}` as `${WeekStart}`, label: o.label }))}
          />
        </Row>
        <Row title="Additional work limit" hint="Completed tasks beyond the plan can add up to this share of the weekly target. Applies to newly planned weeks.">
          <label className="flex items-center gap-3 text-sm font-bold text-ink">
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={bonusCap}
              onChange={(e) => setBonusCap(Number(e.target.value))}
              aria-label="Additional work limit, percent of target"
            />
            <span className="w-12 tabular-nums">{bonusCap}%</span>
          </label>
        </Row>
        <div className="border-b border-white/70 py-4">
          <p className="font-display text-base font-semibold text-ink">Core Goals</p>
          <p className="mb-3 text-sm text-ink-soft">Minimum weekly commitments. All must be achieved, together with a score above 75%, to unlock the next level.</p>
          <CoreGoalsEditor />
        </div>
        <Row title="Location labels" hint="Show name tags above locations in the world.">
          <button
            type="button"
            role="switch"
            aria-checked={settings.showLabels}
            onClick={() => update({ showLabels: !settings.showLabels })}
            className={cn("relative h-8 w-14 rounded-full transition-colors", settings.showLabels ? "bg-forest" : "bg-ink/20")}
          >
            <span className="sr-only">Location labels</span>
            <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all", settings.showLabels ? "left-7" : "left-1")} />
          </button>
        </Row>
        <Row title="Dragon companion" hint="Give your baby dragon a name.">
          <input
            aria-label="Dragon name"
            value={settings.dragonName}
            maxLength={20}
            onChange={(e) => update({ dragonName: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && update({ dragonName: "Pip" })}
            className="h-10 w-48 rounded-xl border border-twilight/30 bg-white/90 px-3 text-sm font-semibold text-ink"
          />
        </Row>
        <Row title="Camera" hint="Return the world view to its starting position.">
          <Button
            onClick={() => {
              goToWorld();
              recenter();
            }}
          >
            Recenter world
          </Button>
        </Row>
        <p className="pt-4 text-xs text-ink-soft">
          Shortcuts: 1–6 switch views, Esc returns to the world or closes a preview. Drag to pan, scroll or pinch to zoom.
        </p>
      </div>
    </ViewFrame>
  );
}

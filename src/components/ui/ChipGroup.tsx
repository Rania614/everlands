"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> {
  id: T;
  label: ReactNode;
  color?: string;
  disabled?: boolean;
  title?: string;
}

/**
 * Single-choice chips (radiogroup). Arrow keys move between options, as in a
 * native radio group, so every choice is keyboard-friendly.
 */
export function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
  className,
}: {
  label: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const enabled = options.filter((o) => !o.disabled);
  const move = (dir: 1 | -1) => {
    const i = enabled.findIndex((o) => o.id === value);
    const next = enabled[(i + dir + enabled.length) % enabled.length];
    if (next) onChange(next.id);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap gap-1.5", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        const focusable = active || (!options.some((x) => x.id === value) && o.id === enabled[0]?.id);
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={focusable ? 0 : -1}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-bold transition-colors disabled:opacity-40",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
              active ? "border-ink bg-ink text-cream" : "border-twilight/25 bg-white/80 text-ink hover:border-twilight/60",
            )}
          >
            {o.color && <span className="h-2 w-2 rounded-full" style={{ background: o.color }} aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

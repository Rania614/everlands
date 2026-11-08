"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** "More details" section: optional fields stay out of the way until asked for. */
export function Disclosure({
  label = "More details",
  summary,
  defaultOpen = false,
  children,
  className,
}: {
  label?: string;
  /** Short hint of what's inside, shown while closed (e.g. "Notes, reminder"). */
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn("rounded-2xl", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl py-1.5 text-left text-sm font-bold text-ink-soft hover:text-ink"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        {label}
        {!open && summary && <span className="truncate text-xs font-semibold text-ink-soft/70">· {summary}</span>}
      </button>
      {open && (
        <div id={id} className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

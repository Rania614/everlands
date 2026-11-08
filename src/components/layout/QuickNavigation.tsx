"use client";

import { BarChart3, CalendarDays, CalendarRange, Globe2, ListChecks, Settings, type LucideIcon } from "lucide-react";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { cn } from "@/lib/utils";
import type { AppView } from "@/types/world";

const ITEMS: { view: AppView; label: string; icon: LucideIcon; key: string }[] = [
  { view: "world", label: "World", icon: Globe2, key: "1" },
  { view: "planner", label: "Planner", icon: CalendarRange, key: "2" },
  { view: "calendar", label: "Calendar", icon: CalendarDays, key: "3" },
  { view: "tasks", label: "Tasks", icon: ListChecks, key: "4" },
  { view: "progress", label: "Progress", icon: BarChart3, key: "5" },
  { view: "settings", label: "Settings", icon: Settings, key: "6" },
];

export const NAV_SHORTCUTS = Object.fromEntries(ITEMS.map((i) => [i.key, i.view])) as Record<string, AppView>;

/** Left rail on desktop, bottom bar on mobile. Every item changes the view. */
export function QuickNavigation() {
  const { view, goTo } = useWorldNavigation();
  const current = view === "location" || view === "course" || view === "quran" ? "world" : view;

  return (
    <nav
      aria-label="Quick navigation"
      className={cn(
        "pointer-events-auto z-30",
        "fixed inset-x-0 bottom-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:absolute md:inset-x-auto md:bottom-auto md:left-4 md:top-1/2 md:-translate-y-1/2 md:p-0",
      )}
    >
      <ul className="glass mx-auto flex max-w-md justify-between rounded-3xl p-1.5 shadow-soft md:flex-col md:gap-1">
        {ITEMS.map(({ view: v, label, icon: Icon, key }) => {
          const active = current === v;
          return (
            <li key={v} className="flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => goTo(v)}
                aria-current={active ? "page" : undefined}
                title={`${label} (${key})`}
                className={cn(
                  "group relative flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold transition-colors sm:text-[11px] md:h-14 md:w-16 md:justify-center",
                  active ? "bg-ink text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

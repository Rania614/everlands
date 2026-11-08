"use client";

import { LocateFixed } from "lucide-react";
import { LOCATION_LIST } from "@/data/locations";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { cn } from "@/lib/utils";
import { useWorldStore } from "@/stores/worldStore";

/** Keyboard/touch friendly list of locations, mirroring the in-world hotspots. */
export function LocationDock({ className }: { className?: string }) {
  const { selectedLocationId, selectLocation } = useWorldNavigation();
  const recenter = useWorldStore((s) => s.recenter);
  return (
    <div className={cn("glass pointer-events-auto flex items-center gap-1 rounded-full p-1 shadow-soft", className)} role="toolbar" aria-label="Locations">
      {LOCATION_LIST.map((l) => {
        const active = selectedLocationId === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => selectLocation(l.id)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:text-sm",
              active ? "bg-ink text-cream" : "text-ink hover:bg-white",
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.accent }} aria-hidden="true" />
            {l.name}
          </button>
        );
      })}
      <button
        type="button"
        onClick={recenter}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-white hover:text-ink"
        aria-label="Recenter map"
        title="Recenter map"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}

"use client";

import { LOCATION_LIST } from "@/data/locations";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { cn } from "@/lib/utils";
import type { LocationId } from "@/types/world";

const SPOTS: Record<LocationId, { x: string; y: string }> = {
  castle: { x: "46%", y: "24%" },
  workshop: { x: "70%", y: "40%" },
  haven: { x: "47%", y: "48%" },
  gardens: { x: "60%", y: "74%" },
};

/**
 * Static map used when WebGL is unavailable or the 3D scene fails.
 * Every location remains selectable, so the app stays fully usable.
 */
export function WorldFallback({ reason }: { reason: "unsupported" | "error" }) {
  const { selectedLocationId, selectLocation } = useWorldNavigation();
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <ellipse cx="480" cy="360" rx="330" ry="170" fill="#A88468" />
        <ellipse cx="480" cy="330" rx="340" ry="160" fill="#A7C8A5" />
        <ellipse cx="480" cy="318" rx="320" ry="146" fill="#B8D6B2" />
        <ellipse cx="610" cy="530" rx="120" ry="58" fill="#A88468" />
        <ellipse cx="610" cy="515" rx="120" ry="54" fill="#B8D6B2" />
        <rect x="560" y="430" width="16" height="70" rx="4" fill="#B98A62" transform="rotate(-30 560 430)" />
        <ellipse cx="190" cy="250" rx="80" ry="36" fill="#A7C8A5" opacity="0.8" />
        <circle cx="470" cy="330" r="34" fill="#E4DACA" />
        <circle cx="470" cy="330" r="18" fill="#9FCBE2" />
      </svg>
      {LOCATION_LIST.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => selectLocation(l.id)}
          aria-pressed={selectedLocationId === l.id}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2 font-display text-sm font-semibold shadow-soft",
            selectedLocationId === l.id ? "bg-ink text-cream" : "bg-white/90 text-ink hover:bg-white",
          )}
          style={{ left: SPOTS[l.id].x, top: SPOTS[l.id].y }}
        >
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: l.accent }} />
          {l.name}
        </button>
      ))}
      <p className="glass absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs font-semibold text-ink-soft md:bottom-24">
        {reason === "unsupported"
          ? "3D isn't available on this device, so here's a simple map. Everything still works."
          : "The 3D world couldn't load, so here's a simple map. Everything still works."}
      </p>
    </div>
  );
}

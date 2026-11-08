"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Layers, X } from "lucide-react";
import { LOCATIONS } from "@/data/locations";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { progressOf, questsForLocation } from "@/lib/utils";
import { useQuestStore } from "@/stores/questStore";
import { useWeek } from "@/hooks/useWeek";
import { ACTIVITY_ICONS } from "../ui/icons";
import { Button } from "../ui/Button";
import { LocationThumbnail } from "../ui/LocationThumbnail";
import { ProgressBar } from "../ui/ProgressBar";

export function LocationPreview() {
  const { selectedLocationId, enterLocation, closePreview } = useWorldNavigation();
  const allQuests = useQuestStore((s) => s.quests);
  const week = useWeek();
  const quests = allQuests.filter((q) => q.weekKey === week?.weekKey);
  const loc = selectedLocationId ? LOCATIONS[selectedLocationId] : null;

  return (
    <AnimatePresence mode="wait">
      {loc && (
        <motion.section
          key={loc.id}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="glass pointer-events-auto w-full overflow-hidden rounded-3xl shadow-lift"
          aria-label={`${loc.name} preview`}
          role="region"
        >
          <div className="relative h-24 sm:h-32">
            <LocationThumbnail id={loc.id} />
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-ink hover:bg-white"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: loc.accent === "#E5C58F" ? "#9a7a3f" : loc.accent }}>
              {loc.tagline}
            </p>
            <h2 className="font-display text-xl font-semibold leading-tight text-ink">{loc.name}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{loc.description}</p>
            <PreviewStats id={loc.id} quests={quests} />
            <ul className="mt-3 hidden flex-wrap gap-1.5 sm:flex" aria-label="Available activities">
              {loc.activities.map((a) => {
                const Icon = ACTIVITY_ICONS[a.icon];
                return (
                  <li key={a.id} className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink">
                    <Icon className="h-3.5 w-3.5 text-ink-soft" />
                    {a.title}
                  </li>
                );
              })}
            </ul>
            <Button variant="primary" size="lg" className="mt-4 w-full" onClick={() => enterLocation(loc.id)}>
              Enter {loc.name} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function PreviewStats({ id, quests }: { id: keyof typeof LOCATIONS; quests: ReturnType<typeof useQuestStore.getState>["quests"] }) {
  const local = questsForLocation(quests, id);
  const { ratio, done, total } = progressOf(local);
  const loc = LOCATIONS[id];
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" /> {loc.activities.length} activities
        </span>
        <span>
          {total ? `${done}/${total} quests this week` : "No quests this week"}
        </span>
      </div>
      <ProgressBar value={ratio} label={`${loc.name} progress`} color={loc.accent} size="sm" />
    </div>
  );
}

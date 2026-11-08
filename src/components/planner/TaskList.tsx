"use client";

import { AnimatePresence } from "framer-motion";
import { ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { LOCATION_LIST } from "@/data/locations";
import { useWeek } from "@/hooks/useWeek";
import { addDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { LocationId } from "@/types/world";
import { QuestCard } from "../quests/QuestCard";
import { WeeklySummary } from "../quests/WeeklySummary";
import { Button } from "../ui/Button";
import { ViewFrame } from "../views/ViewFrame";

type Filter = "all" | "open" | "done";
type Scope = "this" | "next" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "To do" },
  { id: "done", label: "Done" },
];

export function TaskList() {
  const quests = useQuestStore((s) => s.quests);
  const week = useWeek();
  const [filter, setFilter] = useState<Filter>("all");
  const [scope, setScope] = useState<Scope>("this");
  const [place, setPlace] = useState<LocationId | "any">("any");
  const openQuickAdd = useWorldStore((s) => s.openQuickAdd);

  const visible = quests
    .filter((q) => {
      if (week && scope === "this" && q.weekKey !== week.weekKey) return false;
      if (week && scope === "next" && q.weekKey !== addDays(week.weekKey, 7)) return false;
      if (filter === "open" && q.status === "done") return false;
      if (filter === "done" && q.status !== "done") return false;
      if (place !== "any" && q.locationId !== place) return false;
      return true;
    })
    .sort((a, b) => (a.weekKey + (a.date ?? "9")).localeCompare(b.weekKey + (b.date ?? "9")));

  return (
    <ViewFrame
      eyebrow="Everything you plan to do"
      title="Tasks"
      icon={<ListChecks className="h-5 w-5" />}
      actions={
        <Button variant="primary" size="sm" onClick={() => openQuickAdd("task", { date: week?.today })} disabled={!week}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl bg-white/60 p-1" role="tablist" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  type="button"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn("rounded-xl px-3 py-1.5 text-sm font-bold", filter === f.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select
              aria-label="Filter by week"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="h-10 rounded-2xl border border-twilight/30 bg-white/80 px-3 text-sm font-semibold text-ink"
            >
              <option value="this">This week</option>
              <option value="next">Next week</option>
              <option value="all">All weeks</option>
            </select>
            <select
              aria-label="Filter by location"
              value={place}
              onChange={(e) => setPlace(e.target.value as LocationId | "any")}
              className="h-10 rounded-2xl border border-twilight/30 bg-white/80 px-3 text-sm font-semibold text-ink"
            >
              <option value="any">All locations</option>
              {LOCATION_LIST.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {visible.map((q) => (
                <QuestCard key={q.id} quest={q} showDate />
              ))}
            </AnimatePresence>
            {visible.length === 0 && (
              <p className="rounded-2xl bg-white/60 p-4 text-center text-sm text-ink-soft">
                {filter === "done" ? "Nothing finished here yet, and that's fine." : "Nothing here. Enjoy the calm."}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3">{week && <WeeklySummary week={week} />}</div>
      </div>
    </ViewFrame>
  );
}

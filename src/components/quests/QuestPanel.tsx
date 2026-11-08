"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ListChecks, Plus, ScrollText } from "lucide-react";
import { useState } from "react";
import { useWeek } from "@/hooks/useWeek";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { cn } from "@/lib/utils";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import { Button } from "../ui/Button";
import { QuestCard } from "./QuestCard";
import { TaskFormModal } from "./TaskFormModal";
import { WeeklySummary } from "./WeeklySummary";

/**
 * Today's quests beside the world: tasks scheduled today, then open
 * "any day this week" tasks. Daily progress here is informational only.
 */
export function QuestPanel({
  className,
  open: openProp,
  onOpenChange,
}: {
  className?: string;
  /** Optional controlled state (mobile keeps its own, collapsed by default). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const quests = useQuestStore((s) => s.quests);
  const storeOpen = useWorldStore((s) => s.questPanelOpen);
  const setStoreOpen = useWorldStore((s) => s.setQuestPanelOpen);
  const open = openProp ?? storeOpen;
  const setOpen = onOpenChange ?? setStoreOpen;
  const { goTo } = useWorldNavigation();
  const week = useWeek();
  const [adding, setAdding] = useState(false);

  const today = week?.today;
  const todays = quests
    .filter((q) => q.date === today)
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
  const anyDay = quests.filter((q) => q.weekKey === week?.weekKey && !q.date && q.status !== "done");
  const doneToday = todays.filter((q) => q.status === "done").length;

  return (
    <aside className={cn("pointer-events-auto", className)} aria-label="Today's quests">
      <div className="glass overflow-hidden rounded-3xl shadow-soft">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="quest-panel-body"
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gold/50 text-ink">
            <ScrollText className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-semibold leading-tight">Today&apos;s Quests</span>
            <span className="block text-xs font-semibold text-ink-soft">
              {doneToday}/{todays.length} today{week ? ` · week ${week.progress.score}%` : ""}
            </span>
          </span>
          <ChevronDown className={cn("h-5 w-5 text-ink-soft transition-transform", open && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="quest-panel-body"
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="scrollbar-thin max-h-[min(62vh,560px)] space-y-2.5 overflow-y-auto px-3 pb-3 md:max-h-[calc(100vh-15rem)]">
                {week && <WeeklySummary week={week} />}
                <AnimatePresence initial={false}>
                  {todays.map((q) => (
                    <QuestCard key={q.id} quest={q} compact />
                  ))}
                </AnimatePresence>
                {todays.length === 0 && (
                  <p className="rounded-2xl bg-white/60 p-3 text-center text-sm text-ink-soft">Nothing scheduled today. A quiet day is fine.</p>
                )}
                {anyDay.length > 0 && (
                  <>
                    <p className="px-1 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">Any day this week</p>
                    {anyDay.map((q) => (
                      <QuestCard key={q.id} quest={q} compact />
                    ))}
                  </>
                )}
                <div className="flex gap-2">
                  <Button variant="soft" size="sm" className="flex-1" onClick={() => setAdding(true)} disabled={!week}>
                    <Plus className="h-4 w-4" /> Add task
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => goTo("planner")}>
                    <ListChecks className="h-4 w-4" /> Weekly plan
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {week && (
        <TaskFormModal open={adding} onClose={() => setAdding(false)} defaults={{ weekKey: week.weekKey, date: week.today }} />
      )}
    </aside>
  );
}

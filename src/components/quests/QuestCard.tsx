"use client";

import { motion } from "framer-motion";
import { CalendarDays, Check, Clock, MapPin, Pencil, Play, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { GROWTH_AREAS } from "@/data/growthAreas";
import { LOCATIONS } from "@/data/locations";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { formatDay } from "@/lib/dates";
import { KIND_LABELS } from "@/lib/progression";
import { completeTask, removeTask, reopenTask, startTask, toggleTask } from "@/lib/taskActions";
import { cn, formatMinutes } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import type { Quest, QuestStatus } from "@/types/quest";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Field";
import { TaskFormModal } from "./TaskFormModal";

const STATUS: Record<QuestStatus, { label: string; className: string }> = {
  todo: { label: "Ready", className: "bg-sky/30 text-ink" },
  in_progress: { label: "In progress", className: "bg-gold/50 text-ink" },
  done: { label: "Complete", className: "bg-meadow/60 text-ink" },
};

interface QuestCardProps {
  quest: Quest;
  compact?: boolean;
  showLocation?: boolean;
  showDate?: boolean;
}

export function QuestCard({ quest, compact = false, showLocation = true, showDate = false }: QuestCardProps) {
  const { selectLocation } = useWorldNavigation();
  const goalTitle = usePlanStore((s) => s.coreGoals.find((g) => g.id === quest.coreGoalId)?.title);
  const [editing, setEditing] = useState(false);
  const loc = LOCATIONS[quest.locationId];
  const done = quest.status === "done";
  const status = STATUS[quest.status];
  const isQuran = quest.category === "quran";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative rounded-2xl border bg-white/80 p-3 transition-colors",
        done ? "border-meadow/70 bg-meadow/15" : "border-white hover:border-twilight/30",
      )}
      aria-label={`${quest.title}, ${status.label}`}
    >
      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full" style={{ background: loc.accent }} aria-hidden="true" />
      <div className="flex items-start gap-3 pl-1.5">
        <button
          type="button"
          onClick={() => toggleTask(quest.id)}
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
            done ? "border-forest bg-forest text-white" : "border-twilight/50 bg-white text-transparent hover:border-forest hover:text-forest/60",
          )}
          aria-label={done ? `Mark ${quest.title} as not done` : `Complete ${quest.title}`}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={cn("font-display text-[15px] font-semibold leading-snug text-ink", done && "text-ink-soft line-through decoration-forest/60")}>
              {quest.title}
            </h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", status.className)}>{status.label}</span>
          </div>
          {!compact && quest.description && <p className="mt-0.5 text-sm text-ink-soft">{quest.description}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-ink-soft">
            {showLocation && (
              <button
                type="button"
                onClick={() => selectLocation(quest.locationId)}
                className="inline-flex items-center gap-1 rounded-md hover:text-ink"
                title={`Show ${loc.name} on the map`}
              >
                <MapPin className="h-3.5 w-3.5" style={{ color: loc.accent }} />
                {loc.name}
              </button>
            )}
            {showDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {quest.date ? formatDay(quest.date) : "Any day this week"}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatMinutes(quest.durationMin)}
            </span>
            {isQuran ? (
              <Chip color={GROWTH_AREAS.quran.color}>Tracked separately</Chip>
            ) : (
              <>
                <Chip color="#B9A1D3" className="tabular-nums">
                  {quest.effortUnits} unit{quest.effortUnits === 1 ? "" : "s"}
                </Chip>
                {quest.kind === "core" ? (
                  <Chip color="#E5C58F">Core · {goalTitle ?? "goal"}</Chip>
                ) : quest.planStatus === "extra" ? (
                  <Chip color="#A7C8A5">{quest.kind === "supporting" ? "Additional" : KIND_LABELS[quest.kind]}</Chip>
                ) : null}
              </>
            )}
            {(quest.eventId || quest.quranExamId) && <Chip color="#E7A99C">Exam prep</Chip>}
            {quest.lessonId && <Chip color="#8EB8D2">Lesson</Chip>}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${quest.title}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {quest.custom && (
            <Button size="sm" variant="ghost" onClick={() => removeTask(quest.id)} aria-label={`Delete ${quest.title}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {quest.status === "todo" && (
            <Button size="sm" variant="secondary" onClick={() => startTask(quest.id)}>
              <Play className="h-3.5 w-3.5" /> Start
            </Button>
          )}
          {done ? (
            <Button size="sm" variant="ghost" onClick={() => reopenTask(quest.id)}>
              <RotateCcw className="h-3.5 w-3.5" /> Undo
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={() => completeTask(quest.id)}>
              <Check className="h-3.5 w-3.5" /> Complete
            </Button>
          )}
        </div>
      )}
      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={quest} />
    </motion.article>
  );
}

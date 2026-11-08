"use client";

import { AnimatePresence } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { useState } from "react";
import { LOCATIONS } from "@/data/locations";
import { useWeek } from "@/hooks/useWeek";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { completeTask, startTask } from "@/lib/taskActions";
import { cn, progressOf, questsForLocation } from "@/lib/utils";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { LocationId } from "@/types/world";
import { Plus } from "lucide-react";
import { WeeklySummary } from "../quests/WeeklySummary";
import { CourseSummary, QuranSummary } from "./ProgressView";
import { FocusTimer } from "../quests/FocusTimer";
import { QuestCard } from "../quests/QuestCard";
import { Button } from "../ui/Button";
import { ACTIVITY_ICONS } from "../ui/icons";
import { LocationThumbnail } from "../ui/LocationThumbnail";
import { Panel } from "../ui/Panel";
import { ProgressBar } from "../ui/ProgressBar";
import { ViewFrame } from "./ViewFrame";

/** Productivity interface for one location: its activities, quests and a focus timer. */
export function LocationView({ id }: { id: LocationId }) {
  const loc = LOCATIONS[id];
  const quests = useQuestStore((s) => s.quests);
  const complete = completeTask;
  const start = startTask;
  const { backToWorld } = useWorldNavigation();
  const openView = useWorldStore((s) => s.openView);
  const week = useWeek();
  const openQuickAdd = useWorldStore((s) => s.openQuickAdd);
  // This week's tasks for this place (the Central Haven shows the whole week).
  const local = questsForLocation(
    quests.filter((q) => q.weekKey === week?.weekKey),
    id,
  );
  const { ratio, done, total } = progressOf(local);
  const firstOpen = local.find((q) => q.status !== "done");
  const [activityId, setActivityId] = useState(loc.activities[0].id);
  const activity = loc.activities.find((a) => a.id === activityId) ?? loc.activities[0];

  return (
    <ViewFrame
      eyebrow={loc.tagline}
      title={loc.name}
      actions={
        <Button variant="soft" size="sm" onClick={backToWorld}>
          <MapIcon className="h-4 w-4" /> Back to world
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white">
            <div className="h-36 sm:h-44">
              <LocationThumbnail id={id} />
            </div>
            <div className="bg-white/70 p-4">
              <p className="text-sm text-ink-soft">{loc.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={ratio} label={`${loc.name} progress`} color={loc.accent} />
                <span className="shrink-0 text-xs font-bold text-ink-soft">
                  {done}/{total} this week
                </span>
              </div>
            </div>
          </div>

          {id === "castle" && (
            <Panel as="div" title="English course" eyebrow="Lessons & homework" className="bg-white/50 shadow-none">
              <CourseSummary onOpen={() => openView("course")} />
            </Panel>
          )}
          {id === "gardens" && week && (
            <Panel as="div" title="Quran journey" eyebrow="Separate from levels" className="bg-white/50 shadow-none">
              <QuranSummary today={week.today} onOpen={() => openView("quran")} />
            </Panel>
          )}
          {id === "haven" && week && <WeeklySummary week={week} />}

          <Panel as="div" title="Activities" eyebrow={`${loc.activities.length} available`} className="bg-white/50 shadow-none">
            <ul className="grid gap-2 sm:grid-cols-2">
              {loc.activities.map((a) => {
                const Icon = ACTIVITY_ICONS[a.icon];
                const active = a.id === activity.id;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setActivityId(a.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                        active ? "border-ink/40 bg-white" : "border-white bg-white/60 hover:bg-white",
                      )}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${loc.accent}55` }}>
                        <Icon className="h-4 w-4 text-ink" />
                      </span>
                      <span>
                        <span className="block font-display text-sm font-semibold text-ink">{a.title}</span>
                        <span className="block text-xs text-ink-soft">{a.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          <FocusTimer
            key={`${id}-${activity.id}-${firstOpen?.id ?? "none"}`}
            minutes={firstOpen?.durationMin ?? 25}
            label={firstOpen && firstOpen.title !== activity.title ? `${activity.title} · ${firstOpen.title}` : activity.title}
            color={loc.accent}
            onFinish={() => firstOpen && complete(firstOpen.id)}
          />
          {firstOpen && firstOpen.status === "todo" && (
            <p className="-mt-2 px-1 text-xs text-ink-soft">
              Starting the timer is optional.{" "}
              <button type="button" className="font-bold text-ink underline-offset-2 hover:underline" onClick={() => start(firstOpen.id)}>
                Mark “{firstOpen.title}” as in progress
              </button>
            </p>
          )}
          <Panel
            as="div"
            title={id === "haven" ? "All of this week's quests" : "This week's quests here"}
            className="bg-white/50 shadow-none"
            actions={
              <Button size="sm" variant="soft" onClick={() => openQuickAdd("task", { date: week?.today, locationId: id })} disabled={!week}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            }
          >
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {local.map((q) => (
                  <QuestCard key={q.id} quest={q} showLocation={id === "haven"} showDate />
                ))}
              </AnimatePresence>
              {local.length === 0 && <p className="rounded-2xl bg-white/60 p-3 text-sm text-ink-soft">No quests here this week yet.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </ViewFrame>
  );
}

"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion, useSystemReducedMotionSync, useWebGLSupport } from "@/hooks/useEnvironment";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { cn } from "@/lib/utils";
import { syncWeeks } from "@/lib/lifecycle";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCourseStore } from "@/stores/courseStore";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import { useQuranStore } from "@/stores/quranStore";
import { useWorldStore } from "@/stores/worldStore";
import { CalendarView } from "../calendar/CalendarView";
import { TaskList } from "../planner/TaskList";
import { WeeklyPlanner } from "../planner/WeeklyPlanner";
import { DialogHost } from "../ui/Modal";
import { EditorHost } from "../editors/EditorHost";
import { QuickAddHost } from "../quickadd/QuickAddHost";
import { CourseView } from "../views/CourseView";
import { QuranView } from "../views/QuranView";
import { UpcomingWidget } from "../world/UpcomingWidget";
import { ReminderWatcher } from "./ReminderWatcher";
import { QuestPanel } from "../quests/QuestPanel";
import { LocationView } from "../views/LocationView";
import { ProgressView } from "../views/ProgressView";
import { SettingsView } from "../views/SettingsView";
import { LocationDock } from "../world/LocationDock";
import { LocationPreview } from "../world/LocationPreview";
import { WorldFallback } from "../world/WorldFallback";
import { WorldLoaderStatic } from "../world/WorldLoaderStatic";
import { NAV_SHORTCUTS, QuickNavigation } from "./QuickNavigation";
import { Toast } from "./Toast";
import { TopHUD } from "./TopHUD";

// The 3D world (three.js + R3F) is split into its own chunk and loaded client-side only.
const WorldCanvas = dynamic(() => import("../world/WorldCanvas"), {
  ssr: false,
  loading: () => <WorldLoaderStatic />,
});

export function AppShell() {
  useSystemReducedMotionSync();
  const reduced = useReducedMotion();
  const webgl = useWebGLSupport();
  const { view, enteredLocationId, goTo, closePreview } = useWorldNavigation();
  const inWorld = view === "world";

  // Load every persisted store after mount (avoids hydration mismatch), then
  // bring the week system up to date; re-check every minute for day/week changes.
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    Promise.all(
      [useWorldStore, useQuestStore, usePlanStore, useCourseStore, useQuranStore, useCalendarStore].map((s) =>
        Promise.resolve(s.persist.rehydrate()),
      ),
    ).then(() => {
      syncWeeks();
      id = setInterval(() => syncWeeks(), 60_000);
    });
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts: 1-6 switch views, Esc backs out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "Escape") {
        if (useWorldStore.getState().view !== "world") goTo("world");
        else closePreview();
        return;
      }
      // N = Quick Add (an event when looking at the calendar).
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        const s = useWorldStore.getState();
        s.openQuickAdd(s.view === "calendar" ? "event" : "task");
        return;
      }
      const next = NAV_SHORTCUTS[e.key];
      if (next) goTo(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, closePreview]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <div className="everlands-sky fixed inset-0 overflow-hidden">
        {/* World layer */}
        <div className={cn("absolute inset-0 isolate z-0 transition-[filter] duration-300", !inWorld && "blur-[2px] brightness-95")} aria-hidden={!inWorld}>
          {webgl === "supported" && <WorldCanvas active={inWorld} fallback={<WorldFallback reason="error" />} />}
          {webgl === "unsupported" && <WorldFallback reason="unsupported" />}
          {webgl === "checking" && <WorldLoaderStatic />}
        </div>

        <ReminderWatcher />
        <DialogHost />
        <QuickAddHost />
        <EditorHost />
        <TopHUD />
        <QuickNavigation />
        <Toast />

        {/* World overlays */}
        {inWorld && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <QuestPanel className="absolute right-3 top-[76px] hidden w-[340px] md:block lg:right-4 lg:top-[84px] lg:w-[360px]" />
            <DesktopUpcoming />
            <DesktopDock />
            <div className="absolute bottom-24 left-3 right-3 md:bottom-6 md:left-28 md:right-auto md:w-[340px]">
              <LocationPreview />
            </div>
            <MobileQuests />
          </div>
        )}

        {/* Productivity views */}
        <AnimatePresence mode="wait">
          {!inWorld && (
            <div
              key={view === "location" ? `loc-${enteredLocationId}` : view}
              className="absolute inset-0 z-20 px-3 pb-24 pt-[76px] md:pb-4 md:pl-28 md:pr-4 lg:pt-[88px]"
            >
              {view === "location" && enteredLocationId && <LocationView id={enteredLocationId} />}
              {view === "planner" && <WeeklyPlanner />}
              {view === "calendar" && <CalendarView />}
              {view === "course" && <CourseView />}
              {view === "quran" && <QuranView />}
              {view === "tasks" && <TaskList />}
              {view === "progress" && <ProgressView />}
              {view === "settings" && <SettingsView />}
            </div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Upcoming commitments on World Home (desktop), kept small and calm. */
function DesktopUpcoming() {
  return <UpcomingWidget className="absolute left-28 top-[84px] hidden w-[300px] lg:block" />;
}

/** Location shortcuts; hidden while a preview card is open so they never overlap. */
function DesktopDock() {
  const previewOpen = useWorldStore((s) => s.selectedLocationId !== null);
  if (previewOpen) return null;
  return (
    <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block">
      <LocationDock />
    </div>
  );
}

/** Mobile: quest panel lives at the top as a collapsible sheet, hidden while a preview is open. */
function MobileQuests() {
  const previewOpen = useWorldStore((s) => s.selectedLocationId !== null);
  const [open, setOpen] = useState(false);
  if (previewOpen) return null;
  return (
    <div className="absolute left-3 right-3 top-[72px] space-y-2 md:hidden">
      <QuestPanel open={open} onOpenChange={setOpen} />
      {!open && <UpcomingWidget defaultOpen={false} />}
    </div>
  );
}

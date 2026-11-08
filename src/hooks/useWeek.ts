"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, todayKey, weekKeyOf, weekNumber } from "@/lib/dates";
import { computeWeekProgress, type WeekProgress } from "@/lib/progression";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { WeeklyPlan } from "@/types/plan";

/** Today's local day key; null until mounted so the server never guesses the user's date. */
export function useTodayKey() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setToday(todayKey());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return today;
}

export interface WeekView {
  today: string;
  weekKey: string;
  currentWeekKey: string;
  weekNumber: number;
  level: number;
  plan: WeeklyPlan | null;
  progress: WeekProgress;
  isCurrent: boolean;
  isPast: boolean;
}

/** Progress for a week (default: the current one), recomputed live from the stores. */
export function useWeek(offsetWeeks = 0): WeekView | null {
  const today = useTodayKey();
  const quests = useQuestStore((s) => s.quests);
  const plans = usePlanStore((s) => s.plans);
  const records = usePlanStore((s) => s.records);
  const journeyStart = usePlanStore((s) => s.journeyStart);
  const weekStart = useWorldStore((s) => s.settings.weekStartsOn);

  return useMemo(() => {
    if (!today) return null;
    const currentWeekKey = weekKeyOf(today, weekStart);
    const weekKey = addDays(currentWeekKey, offsetWeeks * 7);
    const plan = plans[weekKey] ?? null;
    const level = 1 + Object.values(records).filter((r) => r.unlocked && r.weekKey < weekKey).length;
    return {
      today,
      weekKey,
      currentWeekKey,
      weekNumber: weekNumber(weekKey, journeyStart || today, weekStart),
      level,
      plan,
      progress: computeWeekProgress(quests, weekKey, plan),
      isCurrent: offsetWeeks === 0,
      isPast: offsetWeeks < 0,
    };
  }, [today, quests, plans, records, journeyStart, weekStart, offsetWeeks]);
}

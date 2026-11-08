"use client";

import { useMemo } from "react";
import { buildFeed, upcomingSummary, type FeedSources } from "@/lib/calendarFeed";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCourseStore } from "@/stores/courseStore";
import { useQuestStore } from "@/stores/questStore";
import { useQuranStore } from "@/stores/quranStore";

export function useFeedSources(): FeedSources {
  const events = useCalendarStore((s) => s.events);
  const lessons = useCourseStore((s) => s.lessons);
  const levels = useCourseStore((s) => s.levels);
  const sessions = useQuranStore((s) => s.sessions);
  const quranExams = useQuranStore((s) => s.exams);
  const tasks = useQuestStore((s) => s.quests);
  return useMemo(() => ({ events, lessons, levels, sessions, quranExams, tasks }), [events, lessons, levels, sessions, quranExams, tasks]);
}

export function useCalendarFeed(from: string, to: string) {
  const src = useFeedSources();
  return useMemo(() => buildFeed(src, from, to), [src, from, to]);
}

export function useUpcoming(today: string | null) {
  const src = useFeedSources();
  return useMemo(() => (today ? upcomingSummary(src, today) : []), [src, today]);
}

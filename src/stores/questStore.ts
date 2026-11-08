"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LOCATIONS } from "@/data/locations";
import { AREA_BY_LOCATION } from "@/data/growthAreas";
import { STORAGE_KEYS } from "@/lib/constants";
import { todayKey, weekKeyOf } from "@/lib/dates";
import { kindCanBePlanned, unitsFor } from "@/lib/progression";
import { safeStorage, uid } from "@/lib/utils";
import type { NewQuestInput, Quest } from "@/types/quest";

/**
 * Task records only. Business rules (weekly plan confirmation, celebrations,
 * change log) live in lib/taskActions.ts, which is what the UI calls.
 */
interface QuestState {
  quests: Quest[];
  seeded: boolean;

  addQuest: (input: NewQuestInput) => Quest;
  addMany: (quests: Quest[]) => void;
  updateQuest: (id: string, patch: Partial<Quest>) => void;
  removeQuest: (id: string) => void;
  setStatus: (id: string, status: Quest["status"]) => void;
  markSeeded: () => void;
}

export function buildQuest(input: NewQuestInput): Quest {
  const category = input.category ?? AREA_BY_LOCATION[input.locationId] ?? "personal";
  const units = unitsFor(input.effort, input.effortUnits);
  const planStatus = kindCanBePlanned(input.kind) ? (input.planStatus ?? "planned") : "extra";
  return {
    id: uid("q"),
    title: input.title.trim(),
    description: input.description,
    locationId: input.locationId,
    category,
    durationMin: input.durationMin,
    slot: input.slot,
    status: "todo",
    weekKey: input.weekKey,
    date: input.date,
    effort: input.effort,
    effortUnits: units,
    kind: input.kind,
    planStatus,
    coreGoalId: input.coreGoalId ?? null,
    lessonId: input.lessonId ?? null,
    eventId: input.eventId ?? null,
    quranExamId: input.quranExamId ?? null,
    custom: true,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set) => ({
      quests: [],
      seeded: false,

      addQuest: (input) => {
        const quest = buildQuest(input);
        set((s) => ({ quests: [...s.quests, quest] }));
        return quest;
      },
      addMany: (quests) => set((s) => ({ quests: [...s.quests, ...quests] })),
      updateQuest: (id, patch) =>
        set((s) => ({ quests: s.quests.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
      removeQuest: (id) => set((s) => ({ quests: s.quests.filter((q) => q.id !== id) })),
      setStatus: (id, status) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === id
              ? {
                  ...q,
                  status,
                  completedAt: status === "done" ? (q.completedAt ?? new Date().toISOString()) : null,
                }
              : q,
          ),
        })),
      markSeeded: () => set({ seeded: true }),
    }),
    {
      name: STORAGE_KEYS.quests,
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ quests: s.quests, seeded: s.seeded }),
      /**
       * v1/v2 tasks were daily (reset each morning) with XP or day points.
       * v3 tasks belong to a week and carry an effort value.
       */
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version >= 3) return p as unknown as QuestState;
        const today = todayKey();
        const week = weekKeyOf(today, 6);
        const old = Array.isArray(p.quests) ? (p.quests as Array<Record<string, unknown>>) : [];
        const quests: Quest[] = old.map((q) => {
          const locationId = (q.locationId as Quest["locationId"]) ?? "haven";
          const large = q.id === "q-react-architecture";
          const rest = { ...q } as Record<string, unknown>;
          delete rest.xp;
          return {
            ...(rest as unknown as Quest),
            locationId: LOCATIONS[locationId] ? locationId : "haven",
            weekKey: week,
            date: (p.dayKey as string) || today,
            effort: large ? "L" : "M",
            effortUnits: large ? 3 : 2,
            kind: "supporting",
            planStatus: "planned",
            coreGoalId: null,
            lessonId: null,
            eventId: null,
            quranExamId: null,
          };
        });
        return { quests, seeded: quests.length > 0 } as unknown as QuestState;
      },
    },
  ),
);

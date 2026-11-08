"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeStorage, uid } from "@/lib/utils";
import type { QuranExam, QuranSession } from "@/types/learning";

/**
 * Independent Quran tracking. Nothing here feeds the Weekly Score, Levels,
 * milestones or rewards. Missed sessions are never marked or penalised.
 */
interface QuranState {
  monthlyTarget: number;
  sessions: QuranSession[];
  exams: QuranExam[];

  setMonthlyTarget: (n: number) => void;
  addSession: (s: Omit<QuranSession, "id">) => QuranSession;
  updateSession: (id: string, patch: Partial<QuranSession>) => void;
  removeSession: (id: string) => void;
  addExam: (e: Omit<QuranExam, "id">) => QuranExam;
  updateExam: (id: string, patch: Partial<QuranExam>) => void;
  removeExam: (id: string) => void;
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set) => ({
      monthlyTarget: 4,
      sessions: [],
      exams: [],

      setMonthlyTarget: (n) => set({ monthlyTarget: Math.max(1, Math.min(60, Math.round(n))) }),
      addSession: (input) => {
        const session = { ...input, id: uid("qs") };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session;
      },
      updateSession: (id, patch) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      addExam: (input) => {
        const exam = { ...input, id: uid("qe") };
        set((s) => ({ exams: [...s.exams, exam] }));
        return exam;
      },
      updateExam: (id, patch) => set((s) => ({ exams: s.exams.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeExam: (id) => set((s) => ({ exams: s.exams.filter((x) => x.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.quran,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ monthlyTarget: s.monthlyTarget, sessions: s.sessions, exams: s.exams }),
    },
  ),
);

"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CORE_GOALS } from "@/data/growthAreas";
import { STORAGE_KEYS } from "@/lib/constants";
import { DEFAULT_BONUS_CAP_PCT } from "@/lib/progression";
import { safeStorage, uid } from "@/lib/utils";
import type {
  CoreGoal,
  PlanChange,
  WeeklyPlan,
  WeeklyProgressRecord,
  WorldMilestone,
} from "@/types/plan";

interface PlanState {
  /** First day the user opened Everlands; Week 1 is the week containing it. */
  journeyStart: string;
  coreGoals: CoreGoal[];
  plans: Record<string, WeeklyPlan>;
  changes: PlanChange[];
  records: Record<string, WeeklyProgressRecord>;
  milestones: WorldMilestone[];
  /** Default bonus cap for new weekly plans. */
  bonusCapPct: number;

  setJourneyStart: (day: string) => void;
  putPlan: (plan: WeeklyPlan) => void;
  updatePlan: (weekKey: string, patch: Partial<WeeklyPlan>) => void;
  logChange: (change: Omit<PlanChange, "id" | "at">) => void;
  putRecord: (record: WeeklyProgressRecord) => void;
  addMilestone: (m: Omit<WorldMilestone, "id" | "at">) => void;
  setBonusCap: (pct: number) => void;

  addCoreGoal: (goal: Omit<CoreGoal, "id">) => void;
  updateCoreGoal: (id: string, patch: Partial<CoreGoal>) => void;
  removeCoreGoal: (id: string) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      journeyStart: "",
      coreGoals: DEFAULT_CORE_GOALS,
      plans: {},
      changes: [],
      records: {},
      milestones: [],
      bonusCapPct: DEFAULT_BONUS_CAP_PCT,

      setJourneyStart: (day) => set({ journeyStart: day }),
      putPlan: (plan) => set((s) => ({ plans: { ...s.plans, [plan.weekKey]: plan } })),
      updatePlan: (weekKey, patch) =>
        set((s) => (s.plans[weekKey] ? { plans: { ...s.plans, [weekKey]: { ...s.plans[weekKey], ...patch } } } : {})),
      logChange: (change) =>
        set((s) => ({ changes: [...s.changes, { ...change, id: uid("chg"), at: new Date().toISOString() }] })),
      putRecord: (record) => set((s) => ({ records: { ...s.records, [record.weekKey]: record } })),
      addMilestone: (m) =>
        set((s) =>
          // Append-only and idempotent per reference: achieved progress never disappears or duplicates.
          m.refId && s.milestones.some((x) => x.type === m.type && x.refId === m.refId)
            ? {}
            : { milestones: [...s.milestones, { ...m, id: uid("ms"), at: new Date().toISOString() }] },
        ),
      setBonusCap: (pct) => set({ bonusCapPct: Math.max(0, Math.min(50, Math.round(pct))) }),

      addCoreGoal: (goal) => set((s) => ({ coreGoals: [...s.coreGoals, { ...goal, id: uid("goal") }] })),
      updateCoreGoal: (id, patch) =>
        set((s) => ({ coreGoals: s.coreGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeCoreGoal: (id) => set((s) => ({ coreGoals: s.coreGoals.filter((g) => g.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.plan,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
    },
  ),
);

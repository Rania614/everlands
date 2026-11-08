"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeStorage } from "@/lib/utils";
import type { AppSettings, AppView, DragonState, LocationId } from "@/types/world";

export interface Toast {
  id: number;
  title: string;
  message?: string;
  /** "celebrate" also makes the dragon cheer; "info" is a quiet notice. */
  kind: "celebrate" | "info";
}

export interface DialogAction {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}

/** A confirmation dialog. `resolve` receives the chosen action id, or null on cancel. */
export interface DialogRequest {
  title: string;
  message: string;
  lines?: string[];
  actions: DialogAction[];
  resolve: (actionId: string | null) => void;
}

/** Deep-link targets for views that show one item (lesson, event, exam...). */
export interface ViewFocus {
  lessonId?: string;
  levelId?: string;
  eventId?: string;
  quranExamId?: string;
  date?: string;
}

interface WorldState {
  view: AppView;
  selectedLocationId: LocationId | null;
  hoveredLocationId: LocationId | null;
  enteredLocationId: LocationId | null;
  /** Where the dragon is heading (or resting). */
  dragonTarget: LocationId;
  /** Low-frequency mirror of the dragon state for UI (updated on state change only). */
  dragonState: DragonState;
  /** Incremented to trigger a celebration in the 3D scene. */
  celebrationTick: number;
  /** Incremented to ask the camera to return to the overview. */
  recenterTick: number;
  questPanelOpen: boolean;
  toast: Toast | null;
  dialog: DialogRequest | null;
  focus: ViewFocus;
  systemReducedMotion: boolean;
  settings: AppSettings;

  selectLocation: (id: LocationId) => void;
  clearSelection: () => void;
  setHovered: (id: LocationId | null) => void;
  enterLocation: (id: LocationId) => void;
  setView: (view: AppView) => void;
  goToWorld: () => void;
  celebrate: (title: string, message?: string) => void;
  notify: (title: string, message?: string) => void;
  /** Opens a dialog and resolves with the chosen action id (null = cancelled). */
  ask: (req: Omit<DialogRequest, "resolve">) => Promise<string | null>;
  closeDialog: (actionId: string | null) => void;
  openView: (view: AppView, focus?: ViewFocus) => void;
  dismissToast: () => void;
  recenter: () => void;
  setQuestPanelOpen: (open: boolean) => void;
  setDragonState: (state: DragonState) => void;
  setSystemReducedMotion: (value: boolean) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  motion: "system",
  quality: "auto",
  showLabels: true,
  dragonName: "Pip",
  // Saturday: the common start of the week in Egypt and much of the Arab world.
  weekStartsOn: 6,
};

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      view: "world",
      selectedLocationId: null,
      hoveredLocationId: null,
      enteredLocationId: null,
      dragonTarget: "haven",
      dragonState: "idle",
      celebrationTick: 0,
      recenterTick: 0,
      questPanelOpen: true,
      toast: null,
      dialog: null,
      focus: {},
      systemReducedMotion: false,
      settings: DEFAULT_SETTINGS,

      selectLocation: (id) => set({ selectedLocationId: id, dragonTarget: id }),
      clearSelection: () => set({ selectedLocationId: null }),
      setHovered: (id) => {
        if (get().hoveredLocationId !== id) set({ hoveredLocationId: id });
      },
      enterLocation: (id) =>
        set({ view: "location", enteredLocationId: id, selectedLocationId: id, dragonTarget: id }),
      setView: (view) => set({ view }),
      goToWorld: () => set({ view: "world" }),
      celebrate: (title, message) =>
        set((s) => ({
          celebrationTick: s.celebrationTick + 1,
          toast: { id: Date.now(), title, message, kind: "celebrate" },
        })),
      notify: (title, message) => set({ toast: { id: Date.now(), title, message, kind: "info" } }),
      ask: (req) =>
        new Promise((resolve) => {
          get().dialog?.resolve(null);
          set({ dialog: { ...req, resolve } });
        }),
      closeDialog: (actionId) => {
        const d = get().dialog;
        set({ dialog: null });
        d?.resolve(actionId);
      },
      openView: (view, focus = {}) => set({ view, focus }),
      dismissToast: () => set({ toast: null }),
      recenter: () => set((s) => ({ recenterTick: s.recenterTick + 1, selectedLocationId: null })),
      setQuestPanelOpen: (open) => set({ questPanelOpen: open }),
      setDragonState: (dragonState) => {
        if (get().dragonState !== dragonState) set({ dragonState });
      },
      setSystemReducedMotion: (value) => set({ systemReducedMotion: value }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ settings: s.settings, questPanelOpen: s.questPanelOpen }),
      // Deep-merge settings so newly added options get their defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WorldState>;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) } };
      },
    },
  ),
);

/** Effective reduced-motion flag: user setting first, then the OS preference. */
export function selectReducedMotion(s: WorldState) {
  if (s.settings.motion === "reduced") return true;
  if (s.settings.motion === "full") return false;
  return s.systemReducedMotion;
}

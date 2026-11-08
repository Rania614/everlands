"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeStorage, uid } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, "id" | "createdAt">) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (input) => {
        const event: CalendarEvent = { ...input, id: uid("ev"), createdAt: new Date().toISOString() };
        set((s) => ({ events: [...s.events, event] }));
        return event;
      },
      updateEvent: (id, patch) => set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.calendar,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ events: s.events }),
    },
  ),
);

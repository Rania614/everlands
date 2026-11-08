import type { Quest } from "@/types/quest";
import type { LocationId } from "@/types/world";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Damped interpolation that is frame-rate independent. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Local calendar day key, e.g. "2026-11-07". */
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function progressOf(quests: Quest[]) {
  const total = quests.length;
  const done = quests.filter((q) => q.status === "done").length;
  return { done, total, ratio: total ? done / total : 0 };
}

export function questsForLocation(quests: Quest[], id: LocationId) {
  // The Central Haven reflects the whole day.
  return id === "haven" ? quests : quests.filter((q) => q.locationId === id);
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/** Deterministic pseudo-random generator so decorations are stable across renders. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Storage wrapper that never throws (private mode, quota, SSR). */
export const safeStorage = {
  getItem(name: string): string | null {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name: string, value: string) {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(name: string) {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

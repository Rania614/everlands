export type Vec3 = [number, number, number];

export type LocationId = "haven" | "castle" | "gardens" | "workshop";

/** Future product modules each location will eventually host. */
export type LocationModule = "home" | "english" | "quran" | "tech";

export type ActivityIcon =
  | "book"
  | "headphones"
  | "mic"
  | "pen"
  | "sprout"
  | "moon"
  | "repeat"
  | "code"
  | "cpu"
  | "wrench"
  | "map"
  | "sun"
  | "target";

export interface LocationActivity {
  id: string;
  title: string;
  description: string;
  icon: ActivityIcon;
}

export interface WorldLocation {
  id: LocationId;
  name: string;
  tagline: string;
  description: string;
  module: LocationModule;
  /** Centre of the landmark in world space; the camera focuses here. */
  position: Vec3;
  /** Where the dragon stands when visiting. */
  dragonSpot: Vec3;
  /** Point the dragon looks at while exploring. */
  lookAt: Vec3;
  /** Radius of the clickable hotspot and highlight ring. */
  hotspotRadius: number;
  /** Height of the floating marker above `position`. */
  markerHeight: number;
  accent: string;
  elevated: boolean;
  /** Waypoints from the Central Haven dragon spot to this location's dragon spot. */
  pathFromHaven: Vec3[];
  activities: LocationActivity[];
}

export type AppView =
  | "world"
  | "location"
  | "planner"
  | "calendar"
  | "tasks"
  | "course"
  | "quran"
  | "progress"
  | "settings";

export type DragonState =
  | "idle"
  | "walk"
  | "fly"
  | "celebrate"
  | "sleep"
  | "explore";

export type MotionPreference = "system" | "reduced" | "full";
export type GraphicsQuality = "auto" | "high" | "low";

import type { WeekStart } from "@/lib/dates";

export interface AppSettings {
  motion: MotionPreference;
  quality: GraphicsQuality;
  showLabels: boolean;
  dragonName: string;
  /** First day of each level-week (JS weekday index). */
  weekStartsOn: WeekStart;
}

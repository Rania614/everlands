import { PALETTE } from "@/lib/constants";
import type { QuestCategory } from "@/types/quest";
import type { CoreGoal, GrowthArea } from "@/types/plan";
import type { LocationId } from "@/types/world";

export const GROWTH_AREAS: Record<QuestCategory, GrowthArea> = {
  english: { id: "english", name: "English", locationId: "castle", color: "#7E9CC4", countsTowardScore: true },
  tech: { id: "tech", name: "Technical", locationId: "workshop", color: PALETTE.coral, countsTowardScore: true },
  personal: { id: "personal", name: "Personal Growth", locationId: "haven", color: PALETTE.warmGold, countsTowardScore: true },
  quran: { id: "quran", name: "Quran", locationId: "gardens", color: PALETTE.forestGreen, countsTowardScore: false },
};

export const AREA_LIST = Object.values(GROWTH_AREAS);
/** Areas that can hold Core Goals (Quran is intentionally excluded). */
export const SCORED_AREAS = AREA_LIST.filter((a) => a.countsTowardScore);

export const AREA_BY_LOCATION: Record<LocationId, QuestCategory> = {
  castle: "english",
  workshop: "tech",
  haven: "personal",
  gardens: "quran",
};

/** Defaults the user can edit, deactivate or extend in Settings. */
export const DEFAULT_CORE_GOALS: CoreGoal[] = [
  {
    id: "goal-english",
    areaId: "english",
    title: "English",
    condition: "Attend the weekly class and complete its homework.",
    requirements: [
      { id: "req-en-class", title: "Attend one English class", effort: "M" },
      { id: "req-en-hw", title: "Complete the required homework", effort: "M" },
    ],
    minCompleted: 2,
    active: true,
  },
  {
    id: "goal-tech",
    areaId: "tech",
    title: "Technical",
    condition: "Study one technical topic and complete its practice.",
    requirements: [
      { id: "req-tech-topic", title: "Study one technical topic", effort: "M" },
      { id: "req-tech-practice", title: "Complete one practical exercise", effort: "L" },
    ],
    minCompleted: 2,
    active: true,
  },
  {
    id: "goal-personal",
    areaId: "personal",
    title: "Personal Growth",
    condition: "One step toward a personal goal.",
    requirements: [{ id: "req-personal", title: "Take one step on a personal goal", effort: "S" }],
    minCompleted: 1,
    active: false,
  },
];

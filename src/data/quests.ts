import type { DaySlot, Quest } from "@/types/quest";

/** Sample tasks seeded into the first week (weekKey/date filled in at seed time). */
export function sampleQuests(weekKey: string, today: string): Quest[] {
  const base = {
    status: "todo" as const,
    custom: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    weekKey,
    planStatus: "planned" as const,
  };
  return [
    {
      ...base,
      id: "q-quran-revision",
      title: "Quran Revision",
      description: "Revise yesterday's portion slowly and with attention.",
      locationId: "gardens",
      category: "quran",
      durationMin: 30,
      slot: "morning",
      date: today,
      effort: "M",
      effortUnits: 2,
      kind: "supporting",
    },
    {
      ...base,
      id: "q-english-listening",
      title: "English Listening",
      description: "One podcast episode, then note five new phrases.",
      locationId: "castle",
      category: "english",
      durationMin: 25,
      slot: "afternoon",
      date: today,
      effort: "M",
      effortUnits: 2,
      kind: "supporting",
    },
    {
      ...base,
      id: "q-react-architecture",
      title: "React Architecture",
      description: "Sketch the store and component boundaries for a feature.",
      locationId: "workshop",
      category: "tech",
      durationMin: 45,
      slot: "evening",
      date: today,
      effort: "L",
      effortUnits: 3,
      kind: "supporting",
    },
  ];
}

export const DAY_SLOTS: { id: DaySlot; label: string; hint: string }[] = [
  { id: "morning", label: "Morning", hint: "Fresh focus" },
  { id: "afternoon", label: "Afternoon", hint: "Steady work" },
  { id: "evening", label: "Evening", hint: "Gentle wrap-up" },
];

export const DURATION_OPTIONS = [10, 15, 20, 25, 30, 45, 60, 90, 120];

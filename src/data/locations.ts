import { PALETTE } from "@/lib/constants";
import type { LocationId, WorldLocation } from "@/types/world";

const HAVEN_SPOT: [number, number, number] = [2.1, 0, 2.1];

export const LOCATIONS: Record<LocationId, WorldLocation> = {
  haven: {
    id: "haven",
    name: "Central Haven",
    tagline: "Where every day begins",
    description:
      "A sunlit garden around the Everspring fountain. Plan your day, set intentions and see how far you have come.",
    module: "home",
    position: [0, 0, 0],
    dragonSpot: HAVEN_SPOT,
    lookAt: [0, 1.2, 0],
    hotspotRadius: 3.4,
    markerHeight: 4.6,
    accent: PALETTE.warmGold,
    elevated: false,
    pathFromHaven: [],
    activities: [
      { id: "plan", title: "Daily Planning", description: "Shape today into morning, afternoon and evening.", icon: "sun" },
      { id: "intent", title: "Set Intentions", description: "Choose the one thing that matters most today.", icon: "target" },
      { id: "review", title: "Review Progress", description: "Look back gently at what you have grown.", icon: "map" },
    ],
  },
  castle: {
    id: "castle",
    name: "Knowledge Castle",
    tagline: "Halls of language & learning",
    description:
      "A tall library-castle above the meadow. Its towers hold your English practice: listening, vocabulary, speaking and writing.",
    module: "english",
    position: [-6.0, 1.2, -5.4],
    dragonSpot: [-4.4, 1.2, -3.9],
    lookAt: [-6.2, 3.0, -5.8],
    hotspotRadius: 3.0,
    markerHeight: 6.5,
    accent: "#7E9CC4",
    elevated: true,
    pathFromHaven: [
      [-1.9, 0, 1.9],
      [-2.75, 0, -0.2],
      [-2.05, 0, -1.83],
      [-3.32, 1.2, -2.96],
      [-4.4, 1.2, -3.9],
    ],
    activities: [
      { id: "listening", title: "English Listening", description: "Podcasts and recorded sessions.", icon: "headphones" },
      { id: "vocab", title: "Vocabulary", description: "New words, gently revisited.", icon: "book" },
      { id: "speaking", title: "Speaking Practice", description: "Record and replay your voice.", icon: "mic" },
      { id: "writing", title: "Writing", description: "Short daily paragraphs.", icon: "pen" },
    ],
  },
  gardens: {
    id: "gardens",
    name: "Sacred Gardens",
    tagline: "A quiet place for revision",
    description:
      "A calm pavilion of arches and still water across the wooden bridge. A peaceful space for Quran memorization and revision.",
    module: "quran",
    position: [12.6, 0, 12.6],
    dragonSpot: [11.0, 0, 11.2],
    lookAt: [12.9, 1.4, 12.9],
    hotspotRadius: 3.8,
    markerHeight: 5.0,
    accent: PALETTE.forestGreen,
    elevated: false,
    pathFromHaven: [
      [4.5, 0, 4.6],
      [7.1, 0.12, 7.1],
      [8.7, 0.32, 8.7],
      [10.3, 0.12, 10.3],
      [11.0, 0, 11.2],
    ],
    activities: [
      { id: "revision", title: "Quran Revision", description: "Revisit what you have memorized.", icon: "repeat" },
      { id: "memorize", title: "Memorization", description: "A new portion, at your own pace.", icon: "book" },
      { id: "reflect", title: "Quiet Reflection", description: "A few calm minutes, no counting.", icon: "moon" },
    ],
  },
  workshop: {
    id: "workshop",
    name: "Inventor's Workshop",
    tagline: "Gears, code & curious builds",
    description:
      "A cosy timber workshop full of turning gears. This is where technical learning and projects come to life.",
    module: "tech",
    position: [6.4, 0, -3.8],
    dragonSpot: [4.5, 0, -1.4],
    lookAt: [6.4, 1.4, -3.8],
    hotspotRadius: 3.0,
    markerHeight: 4.4,
    accent: PALETTE.coral,
    elevated: false,
    pathFromHaven: [
      [3.2, 0, 0.5],
      [4.5, 0, -1.4],
    ],
    activities: [
      { id: "react", title: "React Architecture", description: "Patterns, state and structure.", icon: "code" },
      { id: "build", title: "Build Projects", description: "Ship something small every week.", icon: "wrench" },
      { id: "systems", title: "System Design", description: "Think in boxes and arrows.", icon: "cpu" },
    ],
  },
};

export const LOCATION_ORDER: LocationId[] = ["haven", "castle", "workshop", "gardens"];

export const LOCATION_LIST = LOCATION_ORDER.map((id) => LOCATIONS[id]);

export const HAVEN_DRAGON_SPOT = HAVEN_SPOT;

/** The second floating island: visible but not explorable in this phase. */
export const FUTURE_ISLAND = {
  name: "Skyreach Isle",
  position: [-15.5, 2.6, 9.5] as [number, number, number],
  radius: 3.8,
};

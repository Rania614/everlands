/**
 * Everlands art-direction palette. Every 3D material and UI token derives
 * from these values so the world and the productivity panels read as one.
 */
export const PALETTE = {
  skyBlue: "#8EB8D2",
  meadowGreen: "#A7C8A5",
  forestGreen: "#789D84",
  softPurple: "#B9A1D3",
  warmGold: "#E5C58F",
  coral: "#E7A99C",
  cloudCream: "#F3E9D7",
  twilightBlue: "#8292B2",
} as const;

/** Derived shades used for depth in the 3D world (not UI text). */
export const WORLD_SHADES = {
  grassLight: "#B8D6B2",
  grass: PALETTE.meadowGreen,
  grassDark: "#93B891",
  foliage: PALETTE.forestGreen,
  foliageDark: "#5F8570",
  foliageLight: "#9DBF98",
  earth: "#C9A584",
  earthDark: "#A88468",
  rock: "#9C93A8",
  rockDark: "#7D7891",
  stone: "#E4DACA",
  stoneDark: "#CBBFAE",
  wood: "#B98A62",
  woodDark: "#93694A",
  water: "#9FCBE2",
  waterDeep: PALETTE.skyBlue,
  roofBlue: "#7E9CC4",
  roofBlueDark: PALETTE.twilightBlue,
  window: "#F7E3B5",
  ink: "#3B4560",
} as const;

/** Isometric camera: true isometric elevation (~35.26°) looking at the origin. */
export const CAMERA = {
  direction: [1, 1, 1] as const,
  distance: 80,
  /** World units that should fit across the shorter viewport side at base zoom. */
  fitUnits: 40,
  minZoomFactor: 0.7,
  maxZoomFactor: 2.8,
  focusZoomFactor: 1.75,
  /** Pan limits on the ground plane (x / z). */
  bounds: { minX: -20, maxX: 18, minZ: -14, maxZ: 18 },
  focusDuration: 0.85,
};

export const DRAGON = {
  walkSpeed: 2.4,
  flySpeed: 6.5,
  /** Route length above which the dragon flies instead of walking. */
  flyDistanceThreshold: 16,
  /** Height difference that makes the dragon fly. */
  flyElevationThreshold: 0.9,
  sleepAfterSeconds: 28,
  exploreEverySeconds: 11,
  celebrateSeconds: 1.8,
};

export const STORAGE_KEYS = {
  quests: "everlands:quests:v1",
  settings: "everlands:settings:v1",
  plan: "everlands:plan:v1",
  courses: "everlands:courses:v1",
  quran: "everlands:quran:v1",
  calendar: "everlands:calendar:v1",
} as const;

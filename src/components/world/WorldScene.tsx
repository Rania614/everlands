"use client";

import { useMemo } from "react";
import { FUTURE_ISLAND, LOCATIONS } from "@/data/locations";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import { seeded } from "@/lib/utils";
import type { Vec3 } from "@/types/world";
import { DragonCompanion } from "../dragon/DragonCompanion";
import { CentralHaven } from "../locations/CentralHaven";
import { InventorWorkshop } from "../locations/InventorWorkshop";
import { CASTLE_PLATEAU, KnowledgeCastle } from "../locations/KnowledgeCastle";
import { GARDENS_ISLET, SacredGardens } from "../locations/SacredGardens";
import { Atmosphere } from "./Atmosphere";
import { FutureIsland, SkyStones, Staircase, WoodenBridge } from "./Connections";
import { Bushes, Flowers, Forest, GrassTufts, Rocks, StonePath, scatter, type TreeSpec } from "./Decorations";
import { FloatingIsland } from "./FloatingIsland";
import { distToSegmentXZ, islandEdge } from "./geometry";
import { LocationHotspot } from "./LocationHotspot";
import { mat } from "./materials";
import { Pond, Stream, Waterfall } from "./Water";

export const MAIN_ISLAND = { radius: 11, seed: 1.3 };

export interface SceneQuality {
  level: "high" | "low";
  shadows: boolean;
}

/* ---------- static layout (computed once at module load) -------------- */

const dirTo = (x: number, z: number) => {
  const l = Math.hypot(x, z);
  return [x / l, z / l] as const;
};

// Waterfall pouring off the front-left edge, fed by a spring pond.
const FALL_DIR = dirTo(-0.35, 1);
const FALL_ANGLE = Math.atan2(FALL_DIR[1], FALL_DIR[0]);
const FALL_EDGE = islandEdge(MAIN_ISLAND.radius, MAIN_ISLAND.seed, FALL_DIR[0], FALL_DIR[1]) - 0.05;
const FALL_LIP: Vec3 = [FALL_DIR[0] * FALL_EDGE, 0, FALL_DIR[1] * FALL_EDGE];
const POND: Vec3 = [-3.0, 0, 4.4];
const STREAM: Vec3[] = [
  [-3.1, 0, 5.4],
  [-3.35, 0, 7.4],
  [FALL_LIP[0] + 0.05, 0, FALL_LIP[2] - 0.3],
];

// Bridge to the Sacred Gardens islet (45°).
const D45 = dirTo(1, 1);
const MAIN_EDGE_45 = islandEdge(MAIN_ISLAND.radius, MAIN_ISLAND.seed, D45[0], D45[1]);
const GARDENS = LOCATIONS.gardens.position;
const ISLET_EDGE = islandEdge(GARDENS_ISLET.radius, GARDENS_ISLET.seed, -D45[0], -D45[1]);
const BRIDGE_FROM: Vec3 = [D45[0] * (MAIN_EDGE_45 - 0.75), 0, D45[1] * (MAIN_EDGE_45 - 0.75)];
const BRIDGE_TO: Vec3 = [GARDENS[0] - D45[0] * (ISLET_EDGE - 0.7), 0, GARDENS[2] - D45[1] * (ISLET_EDGE - 0.7)];

// Floating stones toward the future island.
const DF = dirTo(FUTURE_ISLAND.position[0], FUTURE_ISLAND.position[2]);
const SKY_STONES: Vec3[] = [
  [DF[0] * 11.9, 0.3, DF[1] * 11.9],
  [DF[0] * 12.9, 1.05, DF[1] * 12.9],
  [DF[0] * 13.9, 1.8, DF[1] * 13.9],
];

const STAIR_FROM: Vec3 = [-2.05, 0, -1.83];
const STAIR_TO: Vec3 = [-3.32, CASTLE_PLATEAU.height, -2.96];

const PATHS: Vec3[][] = [
  [[2.9, 0, 0.9], [3.2, 0, 0.5], [4.5, 0, -1.4], [5.4, 0, -2.6]],
  [[3.0, 0, 3.0], [4.5, 0, 4.6], [BRIDGE_FROM[0] + 0.3, 0, BRIDGE_FROM[2] + 0.3]],
  [[BRIDGE_TO[0] + 0.4, 0, BRIDGE_TO[2] + 0.4], [11.0, 0, 11.2], [11.4, 0, 11.4]],
  [[-2.9, 0, 1.3], [-6.5, 0, 3.9], [DF[0] * 10.8, 0, DF[1] * 10.8]],
  [[-3.4, 0, 1.0], [-3.0, 0, 3.0]],
];
const PLATEAU_PATH: Vec3[][] = [[STAIR_TO, [-4.4, 1.2, -3.9], [-5.1, 1.2, -4.5]]];

const WORKSHOP = LOCATIONS.workshop.position;

function blockedOnMain(x: number, z: number, margin = 0) {
  const r = Math.hypot(x, z);
  if (r > islandEdge(MAIN_ISLAND.radius, MAIN_ISLAND.seed, x, z) - 0.9 - margin) return true;
  if (r < 3.6 + margin) return true; // plaza
  if (Math.hypot(x - CASTLE_PLATEAU.center[0], z - CASTLE_PLATEAU.center[1]) < CASTLE_PLATEAU.radius + 0.6 + margin) return true;
  if (Math.hypot(x - WORKSHOP[0], z - WORKSHOP[2]) < 3.0 + margin) return true;
  if (Math.hypot(x - POND[0], z - POND[2]) < 1.6 + margin) return true;
  if (distToSegmentXZ(x, z, STAIR_FROM[0], STAIR_FROM[2], STAIR_TO[0], STAIR_TO[2]) < 1.2 + margin) return true;
  const stream = [POND, ...STREAM];
  for (let i = 0; i < stream.length - 1; i++) {
    if (distToSegmentXZ(x, z, stream[i][0], stream[i][2], stream[i + 1][0], stream[i + 1][2]) < 0.85 + margin) return true;
  }
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      if (distToSegmentXZ(x, z, path[i][0], path[i][2], path[i + 1][0], path[i + 1][2]) < 0.8 + margin) return true;
    }
  }
  return false;
}

function buildTrees(): TreeSpec[] {
  const rand = seeded(101);
  const candidates = scatter(140, 77, [{ center: [0, 0], radius: 10.2 }], (x, z) => blockedOnMain(x, z, 0.4));
  const trees: TreeSpec[] = [];
  for (const p of candidates) {
    if (trees.length >= 22) break;
    if (trees.some((t) => Math.hypot(t.p[0] - p[0], t.p[2] - p[2]) < 2.1)) continue;
    // Pines toward the back (behind the castle), blossoms toward the gardens.
    const back = p[0] + p[2] < -6;
    const front = p[0] + p[2] > 6;
    const kind = back ? (rand() > 0.35 ? "pine" : "round") : front && rand() > 0.5 ? "blossom" : "round";
    trees.push({ p, s: 0.8 + rand() * 0.45, kind });
  }
  return trees;
}

const TREES = buildTrees();
const BUSHES = scatter(18, 41, [{ center: [0, 0], radius: 10 }], (x, z) => blockedOnMain(x, z, 0.1));
const ROCKS = scatter(12, 55, [{ center: [0, 0], radius: 10.4 }], (x, z) => blockedOnMain(x, z, -0.3));
const PLATEAU_FLOWERS = scatter(18, 61, [{ center: CASTLE_PLATEAU.center, radius: 3.0, y: CASTLE_PLATEAU.height }], (x, z) =>
  Math.hypot(x + 6.0, z + 5.4) < 2.3 || distToSegmentXZ(x, z, STAIR_TO[0], STAIR_TO[2], -5.1, -4.5) < 0.6,
);

/* --------------------------------------------------------------------- */

export function WorldScene({ quality, animate }: { quality: SceneQuality; animate: boolean }) {
  const high = quality.level === "high";
  const flowers = useMemo(
    () => scatter(high ? 170 : 80, 13, [{ center: [0, 0], radius: 10.3 }], (x, z) => blockedOnMain(x, z, -0.35)),
    [high],
  );
  const tufts = useMemo(
    () => scatter(high ? 110 : 40, 29, [{ center: [0, 0], radius: 10.3 }], (x, z) => blockedOnMain(x, z, -0.4)),
    [high],
  );

  return (
    <>
      {/* Lighting: one warm sun with soft shadows + sky/ground fill. */}
      <hemisphereLight args={["#E3EEF6", "#C9A584", 1.35]} />
      <ambientLight intensity={0.25} color={PALETTE.cloudCream} />
      <directionalLight
        position={[14, 26, 10]}
        intensity={2.3}
        color="#FFF1DA"
        castShadow={quality.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      <Atmosphere animate={animate} quality={quality.level} />

      {/* Main island */}
      <FloatingIsland radius={MAIN_ISLAND.radius} seed={MAIN_ISLAND.seed} depth={8.5}>
        <Forest trees={TREES} shadows={quality.shadows} />
        <Bushes points={BUSHES} shadows={quality.shadows} />
        <Rocks points={ROCKS} />
        <Flowers points={flowers} />
        <GrassTufts points={tufts} />
        <StonePath paths={PATHS} />
        <StonePath paths={PLATEAU_PATH} />
        <Flowers points={PLATEAU_FLOWERS} seed={8} />
        <Pond position={POND} radius={1.0} />
        <Stream points={[POND, ...STREAM]} />
        <Waterfall position={FALL_LIP} angle={FALL_ANGLE} animate={animate} height={10} />
        <Staircase from={STAIR_FROM} to={STAIR_TO} steps={6} />
        {/* signpost toward the future island */}
        <group position={[DF[0] * 10.3, 0, DF[1] * 10.3 + 0.9]}>
          <mesh position={[0, 0.55, 0]} material={mat(WORLD_SHADES.woodDark)} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />
          </mesh>
          <mesh position={[-0.15, 0.95, 0]} rotation={[0, 0.5, 0]} material={mat(WORLD_SHADES.wood)}>
            <boxGeometry args={[0.6, 0.2, 0.05]} />
          </mesh>
        </group>
        {/* floating rocks under the island for depth */}
        {[
          [6, -4.5, 6, 0.8],
          [-7, -6, 2, 1.1],
          [2, -9, -5, 0.7],
          [-3, -11, 3, 0.5],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={s} material={mat(WORLD_SHADES.rockDark, { flatShading: true })}>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </FloatingIsland>

      <WoodenBridge from={BRIDGE_FROM} to={BRIDGE_TO} />
      <SkyStones points={SKY_STONES} animate={animate} />
      <FutureIsland animate={animate} showLabel />

      {/* Interactive locations */}
      <LocationHotspot location={LOCATIONS.haven} animate={animate}>
        <CentralHaven animate={animate} />
      </LocationHotspot>
      <LocationHotspot location={LOCATIONS.castle} animate={animate}>
        <KnowledgeCastle animate={animate} />
      </LocationHotspot>
      <LocationHotspot location={LOCATIONS.workshop} animate={animate}>
        <InventorWorkshop animate={animate} />
      </LocationHotspot>
      <LocationHotspot location={LOCATIONS.gardens} animate={animate}>
        <SacredGardens animate={animate} shadows={quality.shadows} />
      </LocationHotspot>

      <DragonCompanion animate={animate} />
    </>
  );
}

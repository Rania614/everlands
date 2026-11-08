"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import { seeded } from "@/lib/utils";
import type { Vec3 } from "@/types/world";
import { mat } from "./materials";

/* ------------------------------------------------------------------ */
/* Trees                                                               */
/* ------------------------------------------------------------------ */

export interface TreeSpec {
  p: Vec3;
  s?: number;
  kind?: "round" | "pine" | "blossom";
}

const CROWN_COLORS = [WORLD_SHADES.foliage, WORLD_SHADES.foliageLight, WORLD_SHADES.foliageDark];

/** All trees in the world share three instanced draw calls. */
export function Forest({ trees, shadows }: { trees: TreeSpec[]; shadows: boolean }) {
  const parts = useMemo(() => {
    const rand = seeded(7);
    const trunks: { p: Vec3; s: number }[] = [];
    const crowns: { p: Vec3; s: number; c: string }[] = [];
    const pines: { p: Vec3; s: number; c: string }[] = [];
    for (const t of trees) {
      const s = t.s ?? 1;
      const [x, y, z] = t.p;
      trunks.push({ p: [x, y + 0.45 * s, z], s });
      if (t.kind === "pine") {
        const c = rand() > 0.5 ? WORLD_SHADES.foliageDark : WORLD_SHADES.foliage;
        pines.push({ p: [x, y + 1.2 * s, z], s: s * 1.05, c });
        pines.push({ p: [x, y + 1.75 * s, z], s: s * 0.78, c });
        pines.push({ p: [x, y + 2.25 * s, z], s: s * 0.52, c });
      } else {
        const base =
          t.kind === "blossom"
            ? rand() > 0.5
              ? PALETTE.coral
              : PALETTE.softPurple
            : CROWN_COLORS[Math.floor(rand() * CROWN_COLORS.length)];
        crowns.push({ p: [x, y + 1.45 * s, z], s: s * 0.9, c: base });
        crowns.push({ p: [x + 0.35 * s, y + 1.2 * s, z + 0.2 * s], s: s * 0.6, c: base });
        crowns.push({ p: [x - 0.3 * s, y + 1.85 * s, z - 0.15 * s], s: s * 0.55, c: base });
      }
    }
    return { trunks, crowns, pines };
  }, [trees]);

  return (
    <group>
      <Instances limit={parts.trunks.length} castShadow={shadows} material={mat(WORLD_SHADES.wood)}>
        <cylinderGeometry args={[0.12, 0.18, 0.9, 7]} />
        {parts.trunks.map((t, i) => (
          <Instance key={i} position={t.p} scale={t.s} />
        ))}
      </Instances>
      <Instances limit={parts.crowns.length} castShadow={shadows} receiveShadow>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
        {parts.crowns.map((c, i) => (
          <Instance key={i} position={c.p} scale={c.s} color={c.c} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, parts.pines.length)} castShadow={shadows}>
        <coneGeometry args={[0.8, 1.0, 8]} />
        <meshStandardMaterial roughness={0.95} flatShading />
        {parts.pines.map((c, i) => (
          <Instance key={i} position={c.p} scale={c.s} color={c.c} />
        ))}
      </Instances>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scatter helpers                                                     */
/* ------------------------------------------------------------------ */

export interface ScatterArea {
  center: [number, number];
  radius: number;
  y?: number;
}

export function scatter(
  count: number,
  seed: number,
  areas: ScatterArea[],
  isBlocked: (x: number, z: number) => boolean,
) {
  const rand = seeded(seed);
  const out: Vec3[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 30) {
    guard++;
    const area = areas[Math.floor(rand() * areas.length)];
    const r = Math.sqrt(rand()) * area.radius;
    const a = rand() * Math.PI * 2;
    const x = area.center[0] + Math.cos(a) * r;
    const z = area.center[1] + Math.sin(a) * r;
    if (isBlocked(x, z)) continue;
    out.push([x, area.y ?? 0, z]);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Flowers, tufts, bushes, rocks                                       */
/* ------------------------------------------------------------------ */

const FLOWER_COLORS = [PALETTE.coral, PALETTE.softPurple, PALETTE.warmGold, PALETTE.cloudCream, "#F2C4D0"];

export function Flowers({ points, seed = 3 }: { points: Vec3[]; seed?: number }) {
  const items = useMemo(() => {
    const rand = seeded(seed);
    return points.map((p) => ({
      p: [p[0], p[1] + 0.12, p[2]] as Vec3,
      s: 0.7 + rand() * 0.6,
      c: FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)],
    }));
  }, [points, seed]);
  return (
    <Instances limit={Math.max(1, items.length)}>
      <icosahedronGeometry args={[0.11, 0]} />
      <meshStandardMaterial roughness={0.8} />
      {items.map((f, i) => (
        <Instance key={i} position={f.p} scale={f.s} color={f.c} />
      ))}
    </Instances>
  );
}

export function GrassTufts({ points }: { points: Vec3[] }) {
  return (
    <Instances limit={Math.max(1, points.length)} material={mat(WORLD_SHADES.grassDark)}>
      <coneGeometry args={[0.09, 0.32, 4]} />
      {points.map((p, i) => (
        <group key={i} position={[p[0], p[1] + 0.14, p[2]]}>
          <Instance position={[0, 0, 0]} />
          <Instance position={[0.08, -0.03, 0.04]} scale={0.8} rotation={[0, 0, 0.3]} />
          <Instance position={[-0.07, -0.03, -0.03]} scale={0.75} rotation={[0, 0, -0.3]} />
        </group>
      ))}
    </Instances>
  );
}

export function Bushes({ points, shadows }: { points: Vec3[]; shadows: boolean }) {
  const items = useMemo(() => {
    const rand = seeded(11);
    return points.map((p) => ({ p, s: 0.45 + rand() * 0.35, c: rand() > 0.5 ? WORLD_SHADES.foliageLight : WORLD_SHADES.foliage }));
  }, [points]);
  return (
    <Instances limit={Math.max(1, items.length * 2)} castShadow={shadows}>
      <sphereGeometry args={[0.6, 10, 8]} />
      <meshStandardMaterial roughness={0.95} />
      {items.map((b, i) => (
        <group key={i} position={b.p}>
          <Instance position={[0, 0.25 * b.s, 0]} scale={[b.s, b.s * 0.8, b.s]} color={b.c} />
          <Instance position={[0.4 * b.s, 0.18 * b.s, 0.2 * b.s]} scale={b.s * 0.65} color={b.c} />
        </group>
      ))}
    </Instances>
  );
}

export function Rocks({ points }: { points: Vec3[] }) {
  const items = useMemo(() => {
    const rand = seeded(19);
    return points.map((p) => ({ p, s: 0.25 + rand() * 0.35, r: rand() * Math.PI }));
  }, [points]);
  return (
    <Instances limit={Math.max(1, items.length)} material={mat(WORLD_SHADES.rock, { flatShading: true })}>
      <dodecahedronGeometry args={[0.6, 0]} />
      {items.map((r, i) => (
        <Instance key={i} position={[r.p[0], r.p[1] + r.s * 0.25, r.p[2]]} scale={[r.s, r.s * 0.7, r.s]} rotation={[0, r.r, 0]} />
      ))}
    </Instances>
  );
}

/* ------------------------------------------------------------------ */
/* Stone paths                                                         */
/* ------------------------------------------------------------------ */

/** Places flat stepping stones along polylines. */
export function StonePath({ paths, spacing = 0.62, width = 0.55 }: { paths: Vec3[][]; spacing?: number; width?: number }) {
  const stones = useMemo(() => {
    const rand = seeded(23);
    const out: { p: Vec3; s: number; r: number; c: string }[] = [];
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const [ax, ay, az] = path[i];
        const [bx, by, bz] = path[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const steps = Math.max(1, Math.floor(len / spacing));
        const nx = -(bz - az) / (len || 1);
        const nz = (bx - ax) / (len || 1);
        for (let k = 0; k < steps; k++) {
          const t = (k + rand() * 0.3) / steps;
          const side = (rand() - 0.5) * width;
          out.push({
            p: [ax + (bx - ax) * t + nx * side, ay + (by - ay) * t + 0.03, az + (bz - az) * t + nz * side],
            s: 0.22 + rand() * 0.12,
            r: rand() * Math.PI,
            c: rand() > 0.4 ? WORLD_SHADES.stone : WORLD_SHADES.stoneDark,
          });
        }
      }
    }
    return out;
  }, [paths, spacing, width]);

  return (
    <Instances limit={Math.max(1, stones.length)} receiveShadow>
      <cylinderGeometry args={[1, 1, 0.08, 7]} />
      <meshStandardMaterial roughness={0.95} />
      {stones.map((s, i) => (
        <Instance key={i} position={s.p} scale={[s.s * 1.25, 1, s.s]} rotation={[0, s.r, 0]} color={s.c} />
      ))}
    </Instances>
  );
}

/* ------------------------------------------------------------------ */
/* Small props                                                         */
/* ------------------------------------------------------------------ */

export function Lantern({ position, glow = true }: { position: Vec3; glow?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} material={mat(WORLD_SHADES.woodDark)}>
        <cylinderGeometry args={[0.04, 0.05, 0.9, 6]} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial
          color={WORLD_SHADES.window}
          emissive={PALETTE.warmGold}
          emissiveIntensity={glow ? 1.4 : 0.3}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 1.12, 0]} material={mat(WORLD_SHADES.woodDark)}>
        <coneGeometry args={[0.15, 0.12, 6]} />
      </mesh>
    </group>
  );
}

export function Bench({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.28, 0]} material={mat(WORLD_SHADES.wood)} castShadow>
        <boxGeometry args={[1.0, 0.08, 0.32]} />
      </mesh>
      <mesh position={[0, 0.48, -0.14]} material={mat(WORLD_SHADES.wood)}>
        <boxGeometry args={[1.0, 0.24, 0.06]} />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.13, 0]} material={mat(WORLD_SHADES.woodDark)}>
          <boxGeometry args={[0.08, 0.26, 0.28]} />
        </mesh>
      ))}
    </group>
  );
}

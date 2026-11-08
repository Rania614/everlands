"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FUTURE_ISLAND } from "@/data/locations";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { Forest, Flowers } from "./Decorations";
import { FloatingIsland } from "./FloatingIsland";
import { mat } from "./materials";

/** Plank bridge with rope rails between two points at the same height. */
export function WoodenBridge({ from, to, width = 1.3 }: { from: Vec3; to: Vec3; width?: number }) {
  const { mid, len, rot, planks } = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const len = Math.hypot(dx, dz);
    const n = Math.round(len / 0.32);
    return {
      mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2] as Vec3,
      len,
      rot: Math.atan2(dx, dz),
      planks: Array.from({ length: n }, (_, i) => -len / 2 + (i + 0.5) * (len / n)),
    };
  }, [from, to]);

  return (
    <group position={mid} rotation={[0, rot, 0]}>
      {planks.map((z, i) => {
        // gentle arch
        const t = z / (len / 2);
        const y = 0.1 + (1 - t * t) * 0.18;
        return (
          <mesh key={i} position={[0, y, z]} material={mat(i % 3 ? WORLD_SHADES.wood : WORLD_SHADES.woodDark)} castShadow receiveShadow>
            <boxGeometry args={[width, 0.08, 0.27]} />
          </mesh>
        );
      })}
      {[-1, 1].map((side) => (
        <group key={side} position={[(side * width) / 2, 0, 0]}>
          {[-len / 2 + 0.15, -len / 6, len / 6, len / 2 - 0.15].map((z, i) => {
            const t = z / (len / 2);
            const y = 0.1 + (1 - t * t) * 0.18;
            return (
              <mesh key={i} position={[0, y + 0.32, z]} material={mat(WORLD_SHADES.woodDark)} castShadow>
                <cylinderGeometry args={[0.06, 0.07, 0.62, 6]} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(PALETTE.warmGold)}>
            <cylinderGeometry args={[0.025, 0.025, len - 0.2, 5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Stone staircase rising from `from` (ground) to `to` (top). */
export function Staircase({ from, to, steps = 6, width = 1.5 }: { from: Vec3; to: Vec3; steps?: number; width?: number }) {
  const { rot, items } = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const rise = to[1] - from[1];
    const run = Math.hypot(dx, dz);
    const stepRun = run / steps;
    const stepRise = rise / steps;
    return {
      rot: Math.atan2(dx, dz),
      items: Array.from({ length: steps }, (_, i) => {
        const h = stepRise * (i + 1);
        return { z: stepRun * (i + 0.5), h, depth: stepRun + 0.02 };
      }),
    };
  }, [from, to, steps]);
  return (
    <group position={from} rotation={[0, rot, 0]}>
      {items.map((s, i) => (
        <mesh key={i} position={[0, s.h / 2, s.z]} material={mat(i % 2 ? WORLD_SHADES.stone : WORLD_SHADES.stoneDark)} castShadow receiveShadow>
          <boxGeometry args={[width, s.h, s.depth]} />
        </mesh>
      ))}
      {/* side walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 + 0.12), items[items.length - 1].h / 2, items[items.length - 1].z / 2 + items[0].depth / 2]}
          material={mat(WORLD_SHADES.rock)}
          castShadow
        >
          <boxGeometry args={[0.24, items[items.length - 1].h + 0.1, items[items.length - 1].z + items[0].depth]} />
        </mesh>
      ))}
    </group>
  );
}

/** Floating stones that bob gently, leading toward the future island. */
export function SkyStones({ points, animate }: { points: Vec3[]; animate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!animate || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      c.position.y = points[i][1] + Math.sin(t * 1.1 + i * 1.3) * 0.12;
    });
  });
  return (
    <group ref={ref}>
      {points.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={mat(WORLD_SHADES.stone)} castShadow>
            <cylinderGeometry args={[0.55, 0.45, 0.22, 8]} />
          </mesh>
          <mesh position={[0, -0.32, 0]} material={mat(WORLD_SHADES.rock, { flatShading: true })}>
            <coneGeometry args={[0.45, 0.6, 6]} />
          </mesh>
          <mesh position={[0, 0.12, 0]} material={mat(PALETTE.meadowGreen)}>
            <cylinderGeometry args={[0.42, 0.5, 0.06, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The second floating island: visible, gently locked, not yet explorable. */
export function FutureIsland({ animate, showLabel }: { animate: boolean; showLabel: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const crystal = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.position.y = FUTURE_ISLAND.position[1] + Math.sin(t * 0.5) * 0.15;
    if (crystal.current) crystal.current.rotation.y += dt * 0.6;
  });
  const trees = useMemo(
    () => [
      { p: [-1.8, 0, 1.2] as Vec3, s: 0.9, kind: "pine" as const },
      { p: [1.9, 0, -0.9] as Vec3, s: 0.8, kind: "round" as const },
      { p: [-0.9, 0, -2.1] as Vec3, s: 0.7, kind: "pine" as const },
      { p: [2.2, 0, 1.4] as Vec3, s: 0.65, kind: "blossom" as const },
    ],
    [],
  );
  const flowers = useMemo<Vec3[]>(
    () => [
      [0.9, 0, 1.6], [1.3, 0, 2.0], [-0.4, 0, 2.3], [-2.4, 0, -0.3], [0.2, 0, -1.4], [1.6, 0, 0.6],
    ],
    [],
  );
  return (
    <group ref={ref} position={FUTURE_ISLAND.position}>
      <FloatingIsland radius={FUTURE_ISLAND.radius} seed={4.2} grass={WORLD_SHADES.grassLight} depth={3.4}>
        <Forest trees={trees} shadows={false} />
        <Flowers points={flowers} seed={9} />
        {/* unfinished tower */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.9, 0]} material={mat(PALETTE.cloudCream)} castShadow>
            <cylinderGeometry args={[0.7, 0.85, 1.8, 14]} />
          </mesh>
          <mesh position={[0, 2.25, 0]} material={mat(PALETTE.softPurple)} castShadow>
            <coneGeometry args={[0.95, 1.1, 14]} />
          </mesh>
          <mesh ref={crystal} position={[0, 3.4, 0]}>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color={PALETTE.softPurple} emissive={PALETTE.softPurple} emissiveIntensity={0.8} roughness={0.3} />
          </mesh>
          {/* scaffolding */}
          {[-0.95, 0.95].map((x) => (
            <mesh key={x} position={[x, 1.1, 0.6]} material={mat(WORLD_SHADES.woodDark)}>
              <boxGeometry args={[0.08, 2.2, 0.08]} />
            </mesh>
          ))}
          <mesh position={[0, 1.6, 0.6]} material={mat(WORLD_SHADES.wood)}>
            <boxGeometry args={[2.0, 0.08, 0.3]} />
          </mesh>
        </group>
        {showLabel && (
          <Html position={[0, 4.4, 0]} center zIndexRange={[20, 0]}>
            <div className="label-pill rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-ink-soft shadow-soft backdrop-blur">
              {FUTURE_ISLAND.name} · coming soon
            </div>
          </Html>
        )}
      </FloatingIsland>
    </group>
  );
}

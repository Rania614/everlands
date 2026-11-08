"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/constants";
import { seeded } from "@/lib/utils";
import type { Vec3 } from "@/types/world";
import { mat } from "./materials";

const cloudMat = () => mat("#FFFFFF", { roughness: 1, transparent: true, opacity: 0.94, emissive: "#FFFFFF", emissiveIntensity: 0.45 });
const cloudShadeMat = () => mat("#F4F1F6", { roughness: 1, transparent: true, opacity: 0.9, emissive: "#FFFFFF", emissiveIntensity: 0.3 });

function Cloud({ seed, scale = 1 }: { seed: number; scale?: number }) {
  const puffs = useMemo(() => {
    const rand = seeded(seed);
    const n = 4 + Math.floor(rand() * 3);
    return Array.from({ length: n }, (_, i) => {
      const x = (i - (n - 1) / 2) * 0.9 + (rand() - 0.5) * 0.4;
      const r = 0.7 + rand() * 0.6 - Math.abs(i - (n - 1) / 2) * 0.12;
      return { p: [x, (rand() - 0.3) * 0.4, (rand() - 0.5) * 0.7] as Vec3, r };
    });
  }, [seed]);
  return (
    <group scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.p} material={i % 2 ? cloudShadeMat() : cloudMat()}>
          <sphereGeometry args={[p.r, 14, 10]} />
        </mesh>
      ))}
    </group>
  );
}

const CLOUDS: { p: Vec3; s: number; speed: number }[] = [
  { p: [-18, 7, -14], s: 1.1, speed: 0.25 },
  { p: [10, 9, -18], s: 0.9, speed: 0.18 },
  { p: [22, 6, 0], s: 0.8, speed: 0.22 },
  { p: [-26, 5, -2], s: 1.0, speed: 0.2 },
  { p: [2, -9, 22], s: 1.3, speed: 0.12 },
  { p: [-12, -11, 4], s: 1.5, speed: 0.1 },
  { p: [18, -12, -8], s: 1.4, speed: 0.1 },
  { p: [26, -6, 20], s: 1.1, speed: 0.16 },
];

/** Drifting clouds above and below the islands, plus floating motes of light. */
export function Atmosphere({ animate, quality }: { animate: boolean; quality: "high" | "low" }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!animate || !groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      const cfg = CLOUDS[i];
      c.position.x += cfg.speed * dt;
      if (c.position.x > 32) c.position.x = -32;
    });
  });
  return (
    <>
      <group ref={groupRef}>
        {CLOUDS.map((c, i) => (
          <group key={i} position={c.p}>
            <Cloud seed={i * 13 + 5} scale={c.s} />
          </group>
        ))}
      </group>
      {quality === "high" && (
        <>
          <Sparkles count={60} scale={[30, 6, 30]} position={[0, 3, 2]} size={4} speed={animate ? 0.3 : 0} color={PALETTE.warmGold} opacity={0.8} />
          <Sparkles count={24} scale={[8, 4, 8]} position={[12.6, 2, 12.6]} size={5} speed={animate ? 0.2 : 0} color="#ffffff" opacity={0.7} />
        </>
      )}
    </>
  );
}

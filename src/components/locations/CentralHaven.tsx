"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LOCATIONS } from "@/data/locations";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { Bench, Lantern } from "../world/Decorations";
import { mat } from "../world/materials";
import { waterMaterial } from "../world/Water";

const DROPS = 10;

/** Central garden plaza with the Everspring fountain and its floating crystal landmark. */
export function CentralHaven({ animate }: { animate: boolean }) {
  const loc = LOCATIONS.haven;
  const crystal = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const drops = useRef<THREE.Group>(null);

  const dropSeeds = useMemo(() => Array.from({ length: DROPS }, (_, i) => (i / DROPS) * Math.PI * 2), []);

  useFrame((state, dt) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    if (crystal.current) {
      crystal.current.position.y = 3.35 + Math.sin(t * 1.2) * 0.15;
      crystal.current.rotation.y += dt * 0.5;
    }
    if (orbit.current) orbit.current.rotation.y -= dt * 0.35;
    if (drops.current) {
      drops.current.children.forEach((d, i) => {
        const phase = (t * 0.9 + i / DROPS) % 1;
        const a = dropSeeds[i];
        const r = 0.15 + phase * 0.75;
        d.position.set(Math.cos(a) * r, 1.95 + Math.sin(phase * Math.PI) * 0.45 - phase * 0.65, Math.sin(a) * r);
      });
    }
  });

  const lanterns: Vec3[] = [
    [2.6, 0, -1.4],
    [-1.4, 0, 2.6],
    [-2.3, 0, -2.6],
  ];

  return (
    <group position={loc.position}>
      {/* plaza */}
      <mesh position={[0, 0.03, 0]} material={mat(WORLD_SHADES.stone)} receiveShadow>
        <cylinderGeometry args={[3.2, 3.25, 0.08, 40]} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat(WORLD_SHADES.stoneDark)} receiveShadow>
        <torusGeometry args={[2.35, 0.06, 6, 40]} />
      </mesh>

      {/* flower rings */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const color = [PALETTE.coral, PALETTE.softPurple, PALETTE.warmGold][i % 3];
        return (
          <mesh key={i} position={[Math.cos(a) * 2.8, 0.18, Math.sin(a) * 2.8]} material={mat(color)}>
            <icosahedronGeometry args={[0.12, 0]} />
          </mesh>
        );
      })}

      {/* fountain */}
      <mesh position={[0, 0.25, 0]} material={mat(WORLD_SHADES.stone)} castShadow receiveShadow>
        <cylinderGeometry args={[1.45, 1.6, 0.45, 32]} />
      </mesh>
      <mesh position={[0, 0.48, 0]} material={waterMaterial()}>
        <cylinderGeometry args={[1.25, 1.25, 0.06, 32]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} material={mat(WORLD_SHADES.stoneDark)} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 1.1, 14]} />
      </mesh>
      <mesh position={[0, 1.58, 0]} material={mat(WORLD_SHADES.stone)} castShadow>
        <cylinderGeometry args={[0.7, 0.35, 0.3, 24]} />
      </mesh>
      <mesh position={[0, 1.72, 0]} material={waterMaterial()}>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 1.9, 0]} material={mat(WORLD_SHADES.stoneDark)}>
        <sphereGeometry args={[0.14, 12, 10]} />
      </mesh>
      <group ref={drops}>
        {dropSeeds.map((_, i) => (
          <mesh key={i} material={mat("#D6ECF6", { emissive: "#9FCBE2", emissiveIntensity: 0.4 })}>
            <sphereGeometry args={[0.06, 6, 5]} />
          </mesh>
        ))}
      </group>

      {/* landmark: the Everspring crystal */}
      <group ref={crystal} position={[0, 3.35, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={PALETTE.softPurple}
            emissive={PALETTE.softPurple}
            emissiveIntensity={0.55}
            roughness={0.25}
            flatShading
          />
        </mesh>
        <mesh scale={[0.6, 1.25, 0.6]} position={[0, 0, 0]}>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
      </group>
      <group ref={orbit} position={[0, 3.35, 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.0, Math.sin(a) * 0.2, Math.sin(a) * 1.0]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color={PALETTE.warmGold} emissive={PALETTE.warmGold} emissiveIntensity={1.1} />
            </mesh>
          );
        })}
      </group>

      {lanterns.map((p, i) => (
        <Lantern key={i} position={p} />
      ))}
      <Bench position={[-2.75, 0.04, 1.0]} rotation={Math.PI / 2 + 0.35} />
      <Bench position={[1.0, 0.04, -2.75]} rotation={-0.35} />
    </group>
  );
}

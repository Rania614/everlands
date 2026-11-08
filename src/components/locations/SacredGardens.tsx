"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LOCATIONS } from "@/data/locations";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { Bushes, Flowers, Forest, Lantern, type TreeSpec } from "../world/Decorations";
import { FloatingIsland } from "../world/FloatingIsland";
import { mat } from "../world/materials";
import { waterMaterial } from "../world/Water";

export const GARDENS_ISLET = { radius: 4.4, seed: 2.9 };

function Arch({ position, rotation = 0, width = 1.2, height = 1.5 }: { position: Vec3; rotation?: number; width?: number; height?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * width) / 2, height / 2, 0]} material={mat(PALETTE.cloudCream)} castShadow>
          <cylinderGeometry args={[0.1, 0.12, height, 10]} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} material={mat(PALETTE.cloudCream)} castShadow>
        <torusGeometry args={[width / 2, 0.09, 8, 20, Math.PI]} />
      </mesh>
      <mesh position={[0, height + width / 2 + 0.08, 0]} material={mat(PALETTE.warmGold)}>
        <sphereGeometry args={[0.07, 8, 6]} />
      </mesh>
    </group>
  );
}

/** A calm pavilion of arches, columns and still water on its own islet. */
export function SacredGardens({ animate, shadows }: { animate: boolean; shadows: boolean }) {
  const loc = LOCATIONS.gardens;
  const ripple = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!animate || !ripple.current) return;
    const t = (state.clock.elapsedTime * 0.35) % 1;
    ripple.current.scale.setScalar(0.3 + t * 1.1);
    (ripple.current.material as THREE.MeshStandardMaterial).opacity = 0.45 * (1 - t);
  });

  const columns = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return { p: [Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25] as Vec3, a };
      }),
    [],
  );

  const trees = useMemo<TreeSpec[]>(
    () => [
      { p: [-2.6, 0, -1.0], s: 1.0, kind: "blossom" },
      { p: [-1.0, 0, -3.0], s: 0.9, kind: "round" },
      { p: [2.4, 0, -2.2], s: 1.05, kind: "blossom" },
      { p: [-3.1, 0, 1.4], s: 0.8, kind: "round" },
      { p: [3.2, 0, 0.6], s: 0.8, kind: "pine" },
    ],
    [],
  );
  const bushes = useMemo<Vec3[]>(() => [[-1.8, 0, 2.3], [2.6, 0, 1.9], [-3.2, 0, -0.4], [0.6, 0, -3.2], [3.3, 0, -0.9]], []);
  const flowers = useMemo<Vec3[]>(() => {
    const out: Vec3[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 3.3 + Math.sin(i * 2.3) * 0.35;
      out.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
    return out;
  }, []);

  return (
    <FloatingIsland position={loc.position} radius={GARDENS_ISLET.radius} seed={GARDENS_ISLET.seed} depth={3.6} grass={WORLD_SHADES.grassLight}>
      <Forest trees={trees} shadows={shadows} />
      <Bushes points={bushes} shadows={shadows} />
      <Flowers points={flowers} seed={21} />

      {/* platform */}
      <mesh position={[0, 0.08, 0]} material={mat(WORLD_SHADES.stone)} receiveShadow castShadow>
        <cylinderGeometry args={[1.85, 1.95, 0.16, 6]} />
      </mesh>
      <mesh position={[0, 0.22, 0]} material={mat(PALETTE.cloudCream)} receiveShadow castShadow>
        <cylinderGeometry args={[1.55, 1.6, 0.14, 6]} />
      </mesh>

      {/* columns */}
      {columns.map((c, i) => (
        <mesh key={i} position={[c.p[0], 1.1, c.p[2]]} material={mat(PALETTE.cloudCream)} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 1.65, 10]} />
        </mesh>
      ))}
      {/* arches between columns */}
      {columns.map((c, i) => {
        const n = columns[(i + 1) % columns.length];
        const mx = (c.p[0] + n.p[0]) / 2;
        const mz = (c.p[2] + n.p[2]) / 2;
        const rot = -Math.atan2(n.p[2] - c.p[2], n.p[0] - c.p[0]);
        return (
          <mesh key={i} position={[mx, 1.92, mz]} rotation={[0, rot, 0]} material={mat(PALETTE.cloudCream)}>
            <torusGeometry args={[0.62, 0.07, 6, 16, Math.PI]} />
          </mesh>
        );
      })}
      {/* ring beam + dome */}
      <mesh position={[0, 2.6, 0]} material={mat(WORLD_SHADES.stone)} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.16, 24]} />
      </mesh>
      <mesh position={[0, 2.68, 0]} material={mat(PALETTE.cloudCream)} castShadow>
        <sphereGeometry args={[1.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 3.98, 0]} material={mat(PALETTE.warmGold, { roughness: 0.5, metalness: 0.2 })}>
        <cylinderGeometry args={[0.04, 0.1, 0.35, 8]} />
      </mesh>
      <mesh position={[0, 4.2, 0]} material={mat(PALETTE.warmGold, { roughness: 0.5, metalness: 0.2 })}>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
      {/* reading stand in the centre */}
      <mesh position={[0, 0.55, 0]} material={mat(WORLD_SHADES.wood)}>
        <cylinderGeometry args={[0.06, 0.1, 0.55, 8]} />
      </mesh>
      <mesh position={[0, 0.84, 0]} rotation={[-0.45, Math.PI / 4, 0]} material={mat(WORLD_SHADES.woodDark)}>
        <boxGeometry args={[0.45, 0.04, 0.32]} />
      </mesh>

      {/* reflecting pool, toward the camera */}
      <group position={[1.9, 0, 1.9]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 0.04, 0]} material={mat(WORLD_SHADES.stoneDark)} receiveShadow>
          <boxGeometry args={[1.5, 0.12, 1.1]} />
        </mesh>
        <mesh position={[0, 0.08, 0]} material={waterMaterial()}>
          <boxGeometry args={[1.3, 0.06, 0.9]} />
        </mesh>
        <mesh ref={ripple} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.36, 28]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        {/* lotus */}
        <mesh position={[-0.35, 0.13, 0.15]} material={mat(PALETTE.coral)}>
          <sphereGeometry args={[0.07, 8, 6]} />
        </mesh>
        <mesh position={[-0.35, 0.115, 0.15]} rotation={[-Math.PI / 2, 0, 0]} material={mat(PALETTE.meadowGreen)}>
          <circleGeometry args={[0.14, 10]} />
        </mesh>
      </group>

      {/* entry arch from the bridge */}
      <Arch position={[-2.25, 0, -2.25]} rotation={Math.PI / 4} width={1.25} height={1.4} />
      <Lantern position={[-1.35, 0, -2.75]} />
      <Lantern position={[-2.75, 0, -1.35]} />
      <Lantern position={[2.9, 0, 0.0]} />
      <Lantern position={[0.0, 0, 2.9]} />
    </FloatingIsland>
  );
}

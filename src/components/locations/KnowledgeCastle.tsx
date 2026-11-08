"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { makeIslandLayer } from "../world/geometry";
import { mat } from "../world/materials";

export const CASTLE_PLATEAU = { center: [-5.6, -5.0] as [number, number], radius: 3.4, height: 1.2, seed: 0.7 };

function Tower({ position, radius, height, roofHeight, roof = WORLD_SHADES.roofBlue }: {
  position: Vec3; radius: number; height: number; roofHeight: number; roof?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={mat(PALETTE.cloudCream)} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.06, height, 18]} />
      </mesh>
      <mesh position={[0, height + 0.06, 0]} material={mat(WORLD_SHADES.stoneDark)}>
        <cylinderGeometry args={[radius * 1.14, radius * 1.14, 0.14, 18]} />
      </mesh>
      <mesh position={[0, height + 0.13 + roofHeight / 2, 0]} material={mat(roof)} castShadow>
        <coneGeometry args={[radius * 1.22, roofHeight, 18]} />
      </mesh>
      <mesh position={[0, height + 0.2 + roofHeight, 0]} material={mat(PALETTE.warmGold)}>
        <sphereGeometry args={[0.08, 8, 6]} />
      </mesh>
      {/* arched window facing the camera */}
      <mesh position={[0, height * 0.65, radius * 0.98]} material={mat(WORLD_SHADES.window, { emissive: PALETTE.warmGold, emissiveIntensity: 0.35 })}>
        <boxGeometry args={[0.2, 0.34, 0.05]} />
      </mesh>
    </group>
  );
}

function BookStack({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const colors = [PALETTE.coral, PALETTE.softPurple, PALETTE.skyBlue, PALETTE.warmGold];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {colors.map((c, i) => (
        <mesh key={i} position={[(i % 2) * 0.04, 0.07 + i * 0.13, 0]} rotation={[0, i * 0.25, 0]} material={mat(c)} castShadow>
          <boxGeometry args={[0.5 - i * 0.04, 0.12, 0.36]} />
        </mesh>
      ))}
    </group>
  );
}

/** Library-castle on a raised terrace. World position comes from LOCATIONS.castle. */
export function KnowledgeCastle({ animate }: { animate: boolean }) {
  const book = useRef<THREE.Group>(null);
  const flag = useRef<THREE.Mesh>(null);
  const plateau = useMemo(() => {
    const top = makeIslandLayer(CASTLE_PLATEAU.radius, CASTLE_PLATEAU.radius * 0.98, 0.3, CASTLE_PLATEAU.seed, 36);
    top.translate(0, CASTLE_PLATEAU.height - 0.15, 0);
    const cliff = makeIslandLayer(CASTLE_PLATEAU.radius * 0.98, CASTLE_PLATEAU.radius * 1.06, CASTLE_PLATEAU.height - 0.3, CASTLE_PLATEAU.seed, 36);
    cliff.translate(0, (CASTLE_PLATEAU.height - 0.3) / 2, 0);
    return { top, cliff };
  }, []);

  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    if (book.current) {
      book.current.position.y = 2.1 + Math.sin(t * 1.5) * 0.12;
      book.current.rotation.y = Math.sin(t * 0.6) * 0.4;
    }
    if (flag.current) flag.current.rotation.y = Math.sin(t * 2.2) * 0.25;
  });

  return (
    <group>
      {/* raised terrace */}
      <group position={[CASTLE_PLATEAU.center[0], 0, CASTLE_PLATEAU.center[1]]}>
        <mesh geometry={plateau.cliff} material={mat(WORLD_SHADES.rock, { flatShading: true })} castShadow receiveShadow />
        <mesh geometry={plateau.top} material={mat(WORLD_SHADES.grassLight)} receiveShadow />
      </group>

      {/* castle, rotated to face the isometric camera */}
      <group position={[-6.0, 1.2, -5.4]} rotation={[0, Math.PI / 4, 0]}>
        {/* courtyard */}
        <mesh position={[0, 0.03, 0.4]} material={mat(WORLD_SHADES.stone)} receiveShadow>
          <cylinderGeometry args={[2.3, 2.3, 0.06, 28]} />
        </mesh>
        {/* main hall */}
        <mesh position={[0, 1.0, -0.2]} material={mat(PALETTE.cloudCream)} castShadow receiveShadow>
          <boxGeometry args={[2.3, 2.0, 1.7]} />
        </mesh>
        {/* battlements */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-1.0 + i * 0.4, 2.12, 0.62]} material={mat(PALETTE.cloudCream)} castShadow>
            <boxGeometry args={[0.22, 0.24, 0.22]} />
          </mesh>
        ))}
        <mesh position={[0, 2.55, -0.45]} rotation={[0, Math.PI / 4, 0]} material={mat(WORLD_SHADES.roofBlueDark)} castShadow>
          <coneGeometry args={[1.2, 1.1, 4]} />
        </mesh>
        {/* door */}
        <mesh position={[0, 0.5, 0.66]} material={mat(WORLD_SHADES.ink)}>
          <boxGeometry args={[0.62, 1.0, 0.06]} />
        </mesh>
        <mesh position={[0, 1.0, 0.66]} rotation={[Math.PI / 2, 0, 0]} material={mat(WORLD_SHADES.ink)}>
          <cylinderGeometry args={[0.31, 0.31, 0.06, 16, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[0, 1.0, 0.7]} rotation={[0, 0, 0]} material={mat(PALETTE.warmGold)}>
          <torusGeometry args={[0.36, 0.05, 6, 16, Math.PI]} />
        </mesh>
        {/* windows */}
        {[-0.75, 0.75].map((x) => (
          <mesh key={x} position={[x, 1.25, 0.66]} material={mat(WORLD_SHADES.window, { emissive: PALETTE.warmGold, emissiveIntensity: 0.35 })}>
            <boxGeometry args={[0.26, 0.42, 0.04]} />
          </mesh>
        ))}
        {/* towers */}
        <Tower position={[-1.35, 0, 0.75]} radius={0.5} height={2.7} roofHeight={1.4} />
        <Tower position={[1.35, 0, 0.75]} radius={0.5} height={2.7} roofHeight={1.4} />
        <Tower position={[0, 0, -1.25]} radius={0.62} height={3.9} roofHeight={1.8} roof={WORLD_SHADES.roofBlueDark} />
        {/* flag on the tall tower */}
        <mesh position={[0, 6.15, -1.25]} material={mat(WORLD_SHADES.woodDark)}>
          <cylinderGeometry args={[0.025, 0.025, 0.8, 5]} />
        </mesh>
        <mesh ref={flag} position={[0.22, 6.35, -1.25]} material={mat(PALETTE.coral, { side: THREE.DoubleSide })}>
          <planeGeometry args={[0.42, 0.26]} />
        </mesh>
        {/* banners */}
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 1.55, 0.67]} material={mat(PALETTE.softPurple)}>
            <boxGeometry args={[0.18, 0.6, 0.03]} />
          </mesh>
        ))}
        {/* learning decorations */}
        <BookStack position={[-1.4, 0.06, 1.75]} rotation={0.4} />
        <BookStack position={[1.55, 0.06, 1.55]} rotation={-0.3} />
        <group ref={book} position={[0, 2.1, 1.75]}>
          <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.25]} material={mat(PALETTE.cloudCream)}>
            <boxGeometry args={[0.4, 0.03, 0.5]} />
          </mesh>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.25]} material={mat(PALETTE.cloudCream)}>
            <boxGeometry args={[0.4, 0.03, 0.5]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={mat(WORLD_SHADES.roofBlue)}>
            <boxGeometry args={[0.84, 0.03, 0.54]} />
          </mesh>
        </group>
        {/* scroll lectern */}
        <group position={[0.9, 0.06, 2.0]}>
          <mesh position={[0, 0.3, 0]} material={mat(WORLD_SHADES.wood)} castShadow>
            <cylinderGeometry args={[0.05, 0.08, 0.6, 6]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[-0.5, 0, 0]} material={mat(WORLD_SHADES.woodDark)}>
            <boxGeometry args={[0.4, 0.04, 0.3]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

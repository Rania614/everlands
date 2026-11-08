"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { LOCATIONS } from "@/data/locations";
import { PALETTE, WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { mat } from "../world/materials";

function Gear({ radius, teeth, thickness = 0.14, color }: { radius: number; teeth: number; thickness?: number; color: string }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat(color, { metalness: 0.2, roughness: 0.6 })} castShadow>
        <cylinderGeometry args={[radius, radius, thickness, 20]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]} material={mat(WORLD_SHADES.woodDark)}>
        <cylinderGeometry args={[radius * 0.32, radius * 0.32, thickness + 0.02, 12]} />
      </mesh>
      {Array.from({ length: teeth }, (_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * (radius + 0.07), Math.sin(a) * (radius + 0.07), 0]}
            rotation={[0, 0, a]}
            material={mat(color, { metalness: 0.2, roughness: 0.6 })}
          >
            <boxGeometry args={[0.16, 0.13, thickness]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Crate({ position, size = 0.5, rotation = 0 }: { position: Vec3; size?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, size / 2, 0]} material={mat(WORLD_SHADES.wood)} castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
      </mesh>
      <mesh position={[0, size / 2, size / 2 + 0.005]} rotation={[0, 0, Math.PI / 4]} material={mat(WORLD_SHADES.woodDark)}>
        <boxGeometry args={[size * 1.25, 0.06, 0.02]} />
      </mesh>
    </group>
  );
}

/** Timber workshop with turning gears, a roof propeller and a puffing chimney. */
export function InventorWorkshop({ animate }: { animate: boolean }) {
  const loc = LOCATIONS.workshop;
  const bigGear = useRef<THREE.Group>(null);
  const smallGear = useRef<THREE.Group>(null);
  const prop = useRef<THREE.Group>(null);
  const smoke = useRef<THREE.Group>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, dt) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    if (bigGear.current) bigGear.current.rotation.z += dt * 0.6;
    if (smallGear.current) smallGear.current.rotation.z -= dt * 1.1;
    if (prop.current) prop.current.rotation.z += dt * 2.4;
    if (smoke.current) {
      smoke.current.children.forEach((c, i) => {
        const phase = (t * 0.25 + i / 3) % 1;
        c.position.set(Math.sin(phase * 4 + i) * 0.15, phase * 1.6, 0);
        c.scale.setScalar(0.4 + phase * 0.9);
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.opacity = 0.75 * (1 - phase);
      });
    }
    if (bulb.current) bulb.current.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.5;
  });

  return (
    <group position={loc.position} rotation={[0, Math.PI / 4, 0]}>
      {/* yard */}
      <mesh position={[0, 0.03, 0.3]} material={mat(WORLD_SHADES.stoneDark)} receiveShadow>
        <cylinderGeometry args={[2.4, 2.4, 0.05, 24]} />
      </mesh>
      {/* stone foundation */}
      <mesh position={[0, 0.15, -0.2]} material={mat(WORLD_SHADES.rock)} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.3, 2.1]} />
      </mesh>
      {/* timber walls */}
      <mesh position={[0, 1.05, -0.2]} material={mat(WORLD_SHADES.wood)} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.5, 1.9]} />
      </mesh>
      {/* beams */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 1.05, 0.76]} material={mat(WORLD_SHADES.woodDark)}>
          <boxGeometry args={[0.12, 1.5, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 1.78, 0.76]} material={mat(WORLD_SHADES.woodDark)}>
        <boxGeometry args={[2.5, 0.1, 0.08]} />
      </mesh>
      {/* pitched roof (triangular prism) */}
      <group position={[0, 2.35, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={mat(PALETTE.coral)} castShadow>
          <cylinderGeometry args={[1.25, 1.25, 2.8, 3]} />
        </mesh>
      </group>
      {/* chimney + smoke */}
      <mesh position={[0.75, 2.95, -0.55]} material={mat(WORLD_SHADES.rock)} castShadow>
        <boxGeometry args={[0.36, 0.9, 0.36]} />
      </mesh>
      <group ref={smoke} position={[0.75, 3.45, -0.55]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={1} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* door + windows */}
      <mesh position={[-0.35, 0.82, 0.76]} material={mat(WORLD_SHADES.woodDark)}>
        <boxGeometry args={[0.6, 1.05, 0.06]} />
      </mesh>
      <mesh position={[-0.15, 0.8, 0.8]} material={mat(PALETTE.warmGold)}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>
      <mesh position={[0.6, 1.15, 0.76]} material={mat(WORLD_SHADES.window, { emissive: PALETTE.warmGold, emissiveIntensity: 0.45 })}>
        <boxGeometry args={[0.55, 0.45, 0.05]} />
      </mesh>
      <mesh position={[0.6, 1.15, 0.79]} material={mat(WORLD_SHADES.woodDark)}>
        <boxGeometry args={[0.04, 0.45, 0.02]} />
      </mesh>
      {/* gears on the side wall */}
      <group ref={bigGear} position={[1.32, 1.2, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <Gear radius={0.5} teeth={10} color={PALETTE.warmGold} />
      </group>
      <group position={[1.34, 0.55, -0.62]} rotation={[0, Math.PI / 2, 0]}>
        <group ref={smallGear}>
          <Gear radius={0.3} teeth={7} color={PALETTE.twilightBlue} />
        </group>
      </group>
      {/* roof propeller */}
      <group position={[-0.8, 3.25, 0.2]}>
        <mesh position={[0, -0.35, 0]} material={mat(WORLD_SHADES.woodDark)}>
          <cylinderGeometry args={[0.04, 0.05, 0.7, 6]} />
        </mesh>
        <group ref={prop} position={[0, 0, 0.08]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.9, 0.03]} />
              <meshStandardMaterial color={i % 2 ? PALETTE.cloudCream : PALETTE.skyBlue} roughness={0.8} />
            </mesh>
          ))}
          <mesh material={mat(PALETTE.coral)}>
            <sphereGeometry args={[0.08, 8, 6]} />
          </mesh>
        </group>
      </group>
      {/* antenna with blinking bulb */}
      <group position={[-1.05, 2.0, -0.9]}>
        <mesh position={[0, 0.5, 0]} material={mat(WORLD_SHADES.woodDark)}>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 4]} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial ref={bulb} color={PALETTE.skyBlue} emissive={PALETTE.skyBlue} emissiveIntensity={1} />
        </mesh>
      </group>
      {/* workbench */}
      <group position={[1.3, 0.05, 1.5]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.48, 0]} material={mat(WORLD_SHADES.wood)} castShadow>
          <boxGeometry args={[1.0, 0.08, 0.5]} />
        </mesh>
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.22, 0]} material={mat(WORLD_SHADES.woodDark)}>
            <boxGeometry args={[0.07, 0.44, 0.42]} />
          </mesh>
        ))}
        <mesh position={[-0.2, 0.58, 0]} rotation={[0, 0.3, 0]} material={mat(PALETTE.twilightBlue)}>
          <boxGeometry args={[0.3, 0.12, 0.2]} />
        </mesh>
        <group position={[0.25, 0.62, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={0.35}>
          <Gear radius={0.4} teeth={8} color={PALETTE.warmGold} />
        </group>
      </group>
      <Crate position={[-1.55, 0.05, 1.2]} rotation={0.3} />
      <Crate position={[-1.9, 0.05, 0.6]} size={0.4} rotation={-0.2} />
      <Crate position={[-1.6, 0.55, 1.15]} size={0.35} rotation={0.8} />
    </group>
  );
}

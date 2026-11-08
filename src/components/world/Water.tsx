"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { makeWaterfallTexture } from "./geometry";
import { mat } from "./materials";

export const waterMaterial = () =>
  mat(WORLD_SHADES.water, { roughness: 0.25, transparent: true, opacity: 0.88, emissive: "#5d93b3", emissiveIntensity: 0.15 });

/** Flat water ribbon following a polyline (sits just above the grass). */
export function Stream({ points, width = 0.75 }: { points: Vec3[]; width?: number }) {
  const segments = useMemo(() => {
    const out: { p: Vec3; len: number; rot: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, ay, az] = points[i];
      const [bx, by, bz] = points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      out.push({ p: [(ax + bx) / 2, (ay + by) / 2 + 0.02, (az + bz) / 2], len, rot: Math.atan2(bx - ax, bz - az) });
    }
    return out;
  }, [points]);
  return (
    <group>
      {segments.map((s, i) => (
        <group key={i} position={s.p} rotation={[0, s.rot, 0]}>
          <mesh material={waterMaterial()}>
            <boxGeometry args={[width, 0.05, s.len + width * 0.6]} />
          </mesh>
          <mesh position={[width / 2 + 0.06, 0, 0]} material={mat(WORLD_SHADES.stoneDark)}>
            <boxGeometry args={[0.12, 0.1, s.len + 0.2]} />
          </mesh>
          <mesh position={[-width / 2 - 0.06, 0, 0]} material={mat(WORLD_SHADES.stoneDark)}>
            <boxGeometry args={[0.12, 0.1, s.len + 0.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Pond({ position, radius, scaleZ = 1 }: { position: Vec3; radius: number; scaleZ?: number }) {
  return (
    <group position={position} scale={[1, 1, scaleZ]}>
      <mesh position={[0, 0.02, 0]} material={mat(WORLD_SHADES.stoneDark)} receiveShadow>
        <cylinderGeometry args={[radius + 0.18, radius + 0.22, 0.1, 28]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} material={waterMaterial()}>
        <cylinderGeometry args={[radius, radius, 0.06, 28]} />
      </mesh>
    </group>
  );
}

/**
 * Waterfall pouring off an island edge. `position` is the lip of the edge and
 * `angle` the outward direction (radians, in the XZ plane).
 */
export function Waterfall({
  position,
  angle,
  height = 9,
  width = 0.9,
  animate,
}: {
  position: Vec3;
  angle: number;
  height?: number;
  width?: number;
  animate: boolean;
}) {
  const texture = useMemo(() => makeWaterfallTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const mistRef = useRef<THREE.Group>(null);
  const fallMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, dt) => {
    if (!animate) return;
    const map = fallMat.current?.map;
    if (map) map.offset.y += dt * 0.9;
    if (mistRef.current) {
      const t = state.clock.elapsedTime;
      mistRef.current.children.forEach((c, i) => {
        const s = 1 + Math.sin(t * 1.4 + i * 1.7) * 0.12;
        c.scale.setScalar(s);
      });
    }
  });

  // Rotate the plane so its normal faces outward.
  const rotY = Math.PI / 2 - angle;
  const out: [number, number] = [Math.cos(angle), Math.sin(angle)];
  return (
    <group position={position}>
      {/* curl over the lip */}
      <mesh position={[out[0] * 0.15, -0.05, out[1] * 0.15]} rotation={[0, rotY, 0]} material={waterMaterial()}>
        <boxGeometry args={[width, 0.16, 0.5]} />
      </mesh>
      <mesh position={[out[0] * 0.42, -height / 2 - 0.1, out[1] * 0.42]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          ref={fallMat}
          map={texture}
          transparent
          depthWrite={false}
          roughness={0.3}
          emissive="#9fcbe2"
          emissiveIntensity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={mistRef} position={[out[0] * 0.5, -height - 0.2, out[1] * 0.5]}>
        {[
          [0, 0, 0, 0.7],
          [0.5, 0.2, 0.2, 0.5],
          [-0.45, 0.1, -0.1, 0.55],
          [0.1, -0.35, 0.3, 0.6],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} material={mat("#ffffff", { transparent: true, opacity: 0.75 })}>
            <sphereGeometry args={[r, 12, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

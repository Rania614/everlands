"use client";

import { useMemo, type ReactNode } from "react";
import { WORLD_SHADES } from "@/lib/constants";
import type { Vec3 } from "@/types/world";
import { makeIslandLayer, makeIslandUnderside } from "./geometry";
import { mat } from "./materials";

interface FloatingIslandProps {
  position?: Vec3;
  radius: number;
  seed: number;
  depth?: number;
  grass?: string;
  children?: ReactNode;
}

/**
 * A floating island: grass cap, earth band and a lumpy rock underside.
 * The grass surface sits at local y = 0 so children can be placed on it.
 */
export function FloatingIsland({
  position = [0, 0, 0],
  radius,
  seed,
  depth = radius * 0.75,
  grass = WORLD_SHADES.grass,
  children,
}: FloatingIslandProps) {
  const { top, lip, earth, under } = useMemo(() => {
    const top = makeIslandLayer(radius, radius * 0.99, 0.4, seed);
    top.translate(0, -0.2, 0);
    const lip = makeIslandLayer(radius * 1.005, radius * 0.97, 0.22, seed);
    lip.translate(0, -0.48, 0);
    const earth = makeIslandLayer(radius * 0.97, radius * 0.86, 1.1, seed);
    earth.translate(0, -1.14, 0);
    const under = makeIslandUnderside(radius * 0.86, depth, seed);
    under.translate(0, -1.69, 0);
    return { top, lip, earth, under };
  }, [radius, seed, depth]);

  return (
    <group position={position}>
      <mesh geometry={top} material={mat(grass)} receiveShadow />
      <mesh geometry={lip} material={mat(WORLD_SHADES.grassDark)} receiveShadow />
      <mesh geometry={earth} material={mat(WORLD_SHADES.earth)} castShadow />
      <mesh geometry={under} material={mat(WORLD_SHADES.rock, { flatShading: true })} />
      {children}
    </group>
  );
}

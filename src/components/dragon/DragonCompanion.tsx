"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DRAGON, PALETTE } from "@/lib/constants";
import { seeded } from "@/lib/utils";
import { selectReducedMotion, useWorldStore } from "@/stores/worldStore";
import { DragonController } from "./DragonController";
import { DragonModel, type DragonRig } from "./DragonModel";

const SPARK_COUNT = 12;
const SPARK_VELOCITY = (() => {
  const r = seeded(5);
  return Array.from({ length: SPARK_COUNT }, (_, i) => {
    const a = (i / SPARK_COUNT) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * (0.8 + r()), 2 + r() * 1.5, Math.sin(a) * (0.8 + r()));
  });
})();

/**
 * Connects the dragon's behaviour (DragonController) and look (DragonModel)
 * to the app. Store changes arrive via subscriptions, so the dragon never
 * re-renders while it animates.
 */
export function DragonCompanion({ animate }: { animate: boolean }) {
  const root = useRef<THREE.Group>(null);
  const rig = useRef<DragonRig | null>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null);
  const sparks = useRef<THREE.Group>(null);
  const [controller] = useState(() => new DragonController((s) => useWorldStore.getState().setDragonState(s)));

  useEffect(() => {
    return useWorldStore.subscribe((s, prev) => {
      const reduced = selectReducedMotion(s);
      if (s.dragonTarget !== prev.dragonTarget || (s.selectedLocationId && s.selectedLocationId !== prev.selectedLocationId)) {
        controller.travelTo(s.dragonTarget, reduced);
      }
      if (s.celebrationTick !== prev.celebrationTick) controller.celebrate();
    });
  }, [controller]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const r = rig.current;
    const g = root.current;
    if (!r || !g) return;
    const reduced = selectReducedMotion(useWorldStore.getState());
    controller.update({ time: state.clock.elapsedTime, dt, reduced, ambient: animate }, r);

    g.position.copy(controller.pos);
    g.rotation.y = controller.heading;

    if (shadow.current && shadowMat.current) {
      const alt = Math.max(0, controller.pos.y - controller.groundY);
      shadow.current.position.set(controller.pos.x, controller.groundY + 0.04, controller.pos.z);
      const s = Math.max(0.35, 1 - alt * 0.12);
      shadow.current.scale.setScalar(s);
      shadowMat.current.opacity = 0.22 * s;
    }

    const sp = sparks.current;
    if (sp) {
      const on = controller.state === "celebrate" && !reduced;
      sp.visible = on;
      if (on) {
        const k = controller.stateTime;
        sp.children.forEach((child, i) => {
          const vel = SPARK_VELOCITY[i];
          child.position.set(vel.x * k, 0.8 + vel.y * k - 3.2 * k * k, vel.z * k);
          child.rotation.y += dt * 6;
          child.scale.setScalar(Math.max(0, 1 - k / DRAGON.celebrateSeconds));
        });
      }
    }
  });

  const onPet = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    controller.pet();
  };

  return (
    <>
      <group
        ref={root}
        scale={1.5}
        onClick={onPet}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <DragonModel ref={rig} />
        <group ref={sparks} visible={false}>
          {Array.from({ length: SPARK_COUNT }, (_, i) => (
            <mesh key={i}>
              <octahedronGeometry args={[0.06, 0]} />
              <meshStandardMaterial
                color={i % 2 ? PALETTE.warmGold : PALETTE.coral}
                emissive={i % 2 ? PALETTE.warmGold : PALETTE.coral}
                emissiveIntensity={1.2}
              />
            </mesh>
          ))}
        </group>
        <SleepBubble />
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial ref={shadowMat} color="#2F3A56" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </>
  );
}

/** Low-frequency UI bit: only re-renders when the dragon falls asleep or wakes. */
function SleepBubble() {
  const sleeping = useWorldStore((s) => s.dragonState === "sleep");
  if (!sleeping) return null;
  return (
    <Html position={[0.35, 1.25, 0]} center zIndexRange={[25, 5]}>
      <div className="label-pill animate-pulse font-display text-sm font-semibold text-ink-soft" aria-hidden="true">
        z<span className="text-xs">z</span>
        <span className="text-[10px]">z</span>
      </div>
    </Html>
  );
}

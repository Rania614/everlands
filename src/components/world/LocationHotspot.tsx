"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useWorldStore } from "@/stores/worldStore";
import type { WorldLocation } from "@/types/world";
import { cn } from "@/lib/utils";

interface LocationHotspotProps {
  location: WorldLocation;
  animate: boolean;
  children: ReactNode;
}

/** Pointer travel (px) above which a press counts as a pan, not a click. */
const CLICK_TOLERANCE = 6;

/**
 * Wraps a location's meshes with hover/click handling, a ground highlight
 * ring, a floating marker and an accessible DOM label button.
 */
export function LocationHotspot({ location, animate, children }: LocationHotspotProps) {
  const selected = useWorldStore((s) => s.selectedLocationId === location.id);
  const hovered = useWorldStore((s) => s.hoveredLocationId === location.id);
  const showLabels = useWorldStore((s) => s.settings.showLabels);
  const setHovered = useWorldStore((s) => s.setHovered);
  const selectLocation = useWorldStore((s) => s.selectLocation);

  const ring = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Group>(null);
  const [x, y, z] = location.position;
  const active = selected || hovered;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      const m = ring.current.material as THREE.MeshStandardMaterial;
      const targetOpacity = selected ? 0.85 : hovered ? 0.5 : 0;
      m.opacity += (targetOpacity - m.opacity) * Math.min(1, dt * 8);
      ring.current.visible = m.opacity > 0.01;
      const pulse = animate && selected ? 1 + Math.sin(t * 3) * 0.035 : 1;
      ring.current.scale.setScalar(pulse);
    }
    if (marker.current) {
      marker.current.position.y = y + location.markerHeight + (animate ? Math.sin(t * 1.6 + x) * 0.18 : 0);
      if (animate) marker.current.rotation.y += dt * (selected ? 1.6 : 0.6);
      const s = selected ? 1.35 : hovered ? 1.15 : 1;
      const cur = marker.current.scale.x;
      marker.current.scale.setScalar(cur + (s - cur) * Math.min(1, dt * 10));
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(location.id);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    if (useWorldStore.getState().hoveredLocationId === location.id) setHovered(null);
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_TOLERANCE) return;
    selectLocation(location.id);
  };

  return (
    <group>
      <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        {children}
        {/* generous invisible hit volume so the whole area is easy to tap */}
        <mesh position={[x, y + 1.5, z]}>
          <cylinderGeometry args={[location.hotspotRadius, location.hotspotRadius, 3.2, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <group ref={marker} position={[x, y + location.markerHeight, z]}>
          <mesh>
            <octahedronGeometry args={[0.36, 0]} />
            <meshStandardMaterial
              color={location.accent}
              emissive={location.accent}
              emissiveIntensity={active ? 0.9 : 0.45}
              roughness={0.35}
              flatShading
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.55, 0.035, 6, 28]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transparent opacity={0.8} />
          </mesh>
        </group>
      </group>

      <mesh ref={ring} position={[x, y + 0.09, z]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[location.hotspotRadius - 0.22, location.hotspotRadius, 64]} />
        <meshStandardMaterial
          color={location.accent}
          emissive={location.accent}
          emissiveIntensity={0.8}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {showLabels && (
        <Html position={[x, y + location.markerHeight + 0.95, z]} center zIndexRange={[30, 10]}>
          <button
            type="button"
            // The canvas container also receives bubbled DOM events; stop them so
            // R3F doesn't treat this as a "missed" click and clear the selection.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              selectLocation(location.id);
            }}
            onMouseEnter={() => setHovered(location.id)}
            onMouseLeave={() => setHovered(null)}
            aria-pressed={selected}
            aria-label={`Select ${location.name}`}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 font-display text-xs font-semibold shadow-soft backdrop-blur transition-colors sm:text-sm",
              selected ? "bg-ink text-cream" : "bg-white/85 text-ink hover:bg-white",
            )}
          >
            {location.name}
          </button>
        </Html>
      )}
    </group>
  );
}

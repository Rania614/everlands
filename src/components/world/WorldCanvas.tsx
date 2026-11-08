"use client";

import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/useEnvironment";
import { selectReducedMotion, useWorldStore } from "@/stores/worldStore";
import { WorldCamera } from "./WorldCamera";
import { WorldLoaderStatic } from "./WorldLoaderStatic";
import { WorldScene, type SceneQuality } from "./WorldScene";

class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[Everlands] 3D world failed to render", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function useSceneQuality(): SceneQuality {
  const setting = useWorldStore((s) => s.settings.quality);
  const mobile = useIsMobile();
  return useMemo(() => {
    const weak = typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4;
    const level = setting === "auto" ? (mobile || weak ? "low" : "high") : setting;
    return { level, shadows: level === "high" };
  }, [setting, mobile]);
}

interface WorldCanvasProps {
  /** Pause rendering while a productivity view covers the world. */
  active: boolean;
  fallback: ReactNode;
}

export default function WorldCanvas({ active, fallback }: WorldCanvasProps) {
  const quality = useSceneQuality();
  const reduced = useWorldStore(selectReducedMotion);
  const clearSelection = useWorldStore((s) => s.clearSelection);
  const [ready, setReady] = useState(false);

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <div className="absolute inset-0" aria-label="Interactive 3D map of the Everlands island" role="application">
        <Canvas
          key={quality.shadows ? "shadows" : "flat"}
          flat
          shadows={quality.shadows ? { type: THREE.PCFSoftShadowMap } : false}
          dpr={quality.level === "high" ? [1, 1.75] : [1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          frameloop={active ? "always" : "never"}
          onCreated={() => setReady(true)}
          onPointerMissed={(e) => {
            if (e.type === "click") clearSelection();
          }}
          style={{ touchAction: "none" }}
        >
          <Suspense fallback={null}>
            <WorldCamera />
            <WorldScene quality={quality} animate={!reduced} />
            <Preload all />
          </Suspense>
          <AdaptiveDpr pixelated={false} />
        </Canvas>
        {!ready && <WorldLoaderStatic />}
      </div>
    </CanvasErrorBoundary>
  );
}

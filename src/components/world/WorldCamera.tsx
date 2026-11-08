"use client";

import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { LOCATIONS } from "@/data/locations";
import { CAMERA } from "@/lib/constants";
import { clamp, easeInOutCubic } from "@/lib/utils";
import { selectReducedMotion, useWorldStore } from "@/stores/worldStore";

/** Ground point the overview frames: centre of the whole archipelago. */
export const OVERVIEW_TARGET = new THREE.Vector3(-1, 0, 4.2);
/** Ground-plane direction that moves right on screen in the isometric view. */
const SCREEN_RIGHT = new THREE.Vector3(1, 0, -1).normalize();

/**
 * On wide screens the nav rail (left) and quest panel (right) cover part of the
 * canvas. Offset the camera target so framed content sits in the visible gap.
 */
function panelShift(width: number, zoom: number) {
  if (width < 768) return new THREE.Vector3();
  const rail = 110;
  const panel = width >= 1024 ? 390 : 360;
  const px = (panel - rail) / 2;
  return SCREEN_RIGHT.clone().multiplyScalar(px / zoom);
}

function overviewTarget(width: number, zoom: number) {
  return OVERVIEW_TARGET.clone().add(panelShift(width, zoom));
}

const OFFSET = new THREE.Vector3(...CAMERA.direction).normalize().multiplyScalar(CAMERA.distance);

interface FocusAnim {
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromZoom: number;
  toZoom: number;
  t: number;
  duration: number;
}

/**
 * Orthographic isometric camera. Rotation is locked to keep the composition;
 * the user can pan (drag) and zoom (wheel / pinch) within clamped bounds.
 * Selecting a location eases the camera toward it; any user input cancels it.
 */
export function WorldCamera() {
  const controls = useRef<OrbitControlsImpl>(null);
  const camRef = useRef<THREE.OrthographicCamera>(null);
  const anim = useRef<FocusAnim | null>(null);
  const userMoved = useRef(false);
  const size = useThree((s) => s.size);

  const baseZoom = useMemo(() => {
    const narrow = size.width < 768;
    const units = narrow ? CAMERA.fitUnits * 0.68 : CAMERA.fitUnits * 1.2;
    return Math.max(6, Math.min(size.width / units, size.height / (CAMERA.fitUnits * 0.86)));
  }, [size.width, size.height]);

  const focus = useCallback(
    (target: THREE.Vector3, zoom: number) => {
      const cam = camRef.current;
      const ctl = controls.current;
      if (!cam || !ctl) return;
      const reduced = selectReducedMotion(useWorldStore.getState());
      anim.current = {
        fromTarget: ctl.target.clone(),
        toTarget: target.clone(),
        fromZoom: cam.zoom,
        toZoom: zoom,
        t: 0,
        duration: reduced ? 0.0001 : CAMERA.focusDuration,
      };
    },
    [],
  );

  // React to selection / recenter requests without re-rendering this component.
  useEffect(() => {
    return useWorldStore.subscribe((s, prev) => {
      if (s.selectedLocationId && s.selectedLocationId !== prev.selectedLocationId) {
        const loc = LOCATIONS[s.selectedLocationId];
        const narrow = window.innerWidth < 768;
        const zoom = baseZoom * CAMERA.focusZoomFactor;
        const t = new THREE.Vector3(...loc.position).add(panelShift(window.innerWidth, zoom));
        // On phones the preview card covers the bottom; nudge the focus down-screen.
        if (narrow) t.add(new THREE.Vector3(1.4, 0, 1.4));
        focus(t, zoom);
      }
      if (s.recenterTick !== prev.recenterTick) {
        userMoved.current = false;
        focus(overviewTarget(window.innerWidth, baseZoom), baseZoom);
      }
    });
  }, [focus, baseZoom]);

  // Fit the overview on first layout and on resize (unless the user zoomed).
  useEffect(() => {
    const cam = camRef.current;
    if (!cam || userMoved.current) return;
    cam.zoom = baseZoom;
    cam.updateProjectionMatrix();
  }, [baseZoom]);

  useEffect(() => {
    const ctl = controls.current;
    const cam = camRef.current;
    if (!ctl || !cam) return;
    const onStart = () => {
      anim.current = null;
      userMoved.current = true;
    };
    const onChange = () => {
      const t = ctl.target;
      const { minX, maxX, minZ, maxZ } = CAMERA.bounds;
      const cx = clamp(t.x, minX, maxX);
      const cz = clamp(t.z, minZ, maxZ);
      if (cx !== t.x || cz !== t.z) {
        cam.position.x += cx - t.x;
        cam.position.z += cz - t.z;
        t.x = cx;
        t.z = cz;
      }
    };
    ctl.addEventListener("start", onStart);
    ctl.addEventListener("change", onChange);
    return () => {
      ctl.removeEventListener("start", onStart);
      ctl.removeEventListener("change", onChange);
    };
  }, []);

  useFrame((_, dt) => {
    const a = anim.current;
    const cam = camRef.current;
    const ctl = controls.current;
    if (!a || !cam || !ctl) return;
    a.t = Math.min(1, a.t + dt / a.duration);
    const e = easeInOutCubic(a.t);
    ctl.target.lerpVectors(a.fromTarget, a.toTarget, e);
    cam.position.copy(ctl.target).add(OFFSET);
    cam.zoom = THREE.MathUtils.lerp(a.fromZoom, a.toZoom, e);
    cam.updateProjectionMatrix();
    ctl.update();
    if (a.t >= 1) anim.current = null;
  });

  // Initial framing only; later framing is driven by focus()/recenter.
  const [initialTarget] = useState(() => overviewTarget(size.width, baseZoom));
  const initialPosition = useMemo(() => initialTarget.clone().add(OFFSET).toArray(), [initialTarget]);

  return (
    <>
      <OrthographicCamera
        ref={camRef}
        makeDefault
        position={initialPosition}
        zoom={baseZoom}
        near={0.1}
        far={400}
      />
      <OrbitControls
        ref={controls}
        target={initialTarget}
        enableRotate={false}
        enableDamping
        dampingFactor={0.12}
        screenSpacePanning={false}
        minZoom={baseZoom * CAMERA.minZoomFactor}
        maxZoom={baseZoom * CAMERA.maxZoomFactor}
        zoomSpeed={0.8}
        panSpeed={0.9}
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </>
  );
}

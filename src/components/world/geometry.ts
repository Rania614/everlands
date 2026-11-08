import * as THREE from "three";
import { seeded } from "@/lib/utils";

/** Organic radius multiplier for an island outline at a given angle. */
export function islandRadiusFactor(angle: number, seed: number) {
  return (
    1 +
    0.055 * Math.sin(3 * angle + seed) +
    0.035 * Math.sin(5 * angle + seed * 1.7) +
    0.02 * Math.sin(9 * angle + seed * 0.3)
  );
}

/** Distance from an island centre to its grass edge in direction (dx, dz). */
export function islandEdge(radius: number, seed: number, dx: number, dz: number) {
  return radius * islandRadiusFactor(Math.atan2(dz, dx), seed);
}

/** A cylinder whose outline follows `islandRadiusFactor`, giving soft organic edges. */
export function makeIslandLayer(
  rTop: number,
  rBottom: number,
  height: number,
  seed: number,
  segments = 48,
) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, segments, 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (x === 0 && z === 0) continue;
    const f = islandRadiusFactor(Math.atan2(z, x), seed);
    pos.setX(i, x * f);
    pos.setZ(i, z * f);
  }
  g.computeVertexNormals();
  return g;
}

/** Lumpy inverted cone for the rocky underside of a floating island. */
export function makeIslandUnderside(radius: number, depth: number, seed: number) {
  const g = new THREE.ConeGeometry(radius, depth, 14, 5, true);
  g.rotateX(Math.PI);
  g.translate(0, -depth / 2, 0);
  const rand = seeded(Math.floor(seed * 1000));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const jitter = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const key = `${Math.round(a * 100)}:${Math.round(y * 100)}`;
    if (!jitter.has(key)) jitter.set(key, 0.82 + rand() * 0.3);
    const top = y > -0.01;
    const f = top ? islandRadiusFactor(a, seed) : islandRadiusFactor(a, seed) * jitter.get(key)!;
    pos.setX(i, x * f);
    pos.setZ(i, z * f);
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  g.dispose();
  return flat;
}

/** Simple vertical-stripe texture used for falling water. */
export function makeWaterfallTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 64, 0);
  grad.addColorStop(0, "rgba(159,203,226,0.0)");
  grad.addColorStop(0.15, "rgba(176,214,234,0.85)");
  grad.addColorStop(0.5, "rgba(214,236,246,0.95)");
  grad.addColorStop(0.85, "rgba(176,214,234,0.85)");
  grad.addColorStop(1, "rgba(159,203,226,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);
  const rand = seeded(42);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.5})`;
    const x = 8 + rand() * 48;
    const y = rand() * 256;
    ctx.fillRect(x, y, 2 + rand() * 3, 14 + rand() * 40);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Distance from point to segment in the XZ plane. */
export function distToSegmentXZ(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const vx = bx - ax;
  const vz = bz - az;
  const len2 = vx * vx + vz * vz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / len2));
  const cx = ax + vx * t;
  const cz = az + vz * t;
  return Math.hypot(px - cx, pz - cz);
}

import * as THREE from "three";

/**
 * Shared matte materials. Re-using one material per colour keeps draw-call
 * state changes and GPU memory low across hundreds of decorative meshes.
 */
const cache = new Map<string, THREE.MeshStandardMaterial>();

interface MatOptions {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  flatShading?: boolean;
  side?: THREE.Side;
}

export function mat(color: string, opts: MatOptions = {}) {
  const key = color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.92,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? "#000000",
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      flatShading: opts.flatShading ?? false,
      side: opts.side ?? THREE.FrontSide,
    });
    cache.set(key, m);
  }
  return m;
}

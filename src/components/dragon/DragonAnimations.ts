import { damp } from "@/lib/utils";
import type { DragonState } from "@/types/world";
import type { DragonRig } from "./DragonModel";

/** Per-instance animation memory (blink timing, celebration progress...). */
export interface AnimMemory {
  nextBlink: number;
  blinkUntil: number;
  /** 0..1 progress of the current celebration. */
  celebrate: number;
  /** Extra head yaw requested by the controller (look-at). */
  lookYaw: number;
}

export function createAnimMemory(): AnimMemory {
  return { nextBlink: 1.5, blinkUntil: 0, celebrate: 0, lookYaw: 0 };
}

interface Pose {
  bobY: number;
  squash: number;
  spin: number;
  bodyPitch: number;
  bodyRoll: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  eyeOpen: number;
  wingFlap: number;
  wingFold: number;
  tailYaw: number;
  tailPitch: number;
  legSwing: number;
  legTuck: number;
}

/**
 * Procedural animation for every behaviour state. Poses are computed from
 * time, then the rig eases toward them so state changes blend smoothly.
 * Works purely on refs: no React state, no re-renders.
 */
export function animateDragon(
  rig: DragonRig,
  state: DragonState,
  t: number,
  dt: number,
  mem: AnimMemory,
  reduced: boolean,
) {
  const k = reduced ? 0.35 : 1; // motion amplitude
  const p: Pose = {
    bobY: 0,
    squash: 1,
    spin: 0,
    bodyPitch: 0,
    bodyRoll: 0,
    headPitch: 0,
    headYaw: mem.lookYaw,
    headRoll: 0,
    eyeOpen: 1,
    wingFlap: 0,
    wingFold: 0.9,
    tailYaw: 0,
    tailPitch: 0,
    legSwing: 0,
    legTuck: 0,
  };

  switch (state) {
    case "idle": {
      const breath = Math.sin(t * 2.1);
      p.squash = 1 + breath * 0.025 * k;
      p.bobY = breath * 0.01 * k;
      p.headPitch = Math.sin(t * 0.8) * 0.06 * k;
      p.headRoll = Math.sin(t * 0.55) * 0.08 * k;
      p.tailYaw = Math.sin(t * 1.6) * 0.3 * k;
      p.wingFlap = Math.sin(t * 1.3) * 0.08 * k;
      p.bodyRoll = Math.sin(t * 0.9) * 0.025 * k;
      break;
    }
    case "walk": {
      const ph = t * 10;
      p.bobY = Math.abs(Math.sin(ph)) * 0.06 * k;
      p.bodyRoll = Math.sin(ph) * 0.06 * k;
      p.bodyPitch = 0.05;
      p.headPitch = Math.sin(ph * 2) * 0.04 * k;
      p.legSwing = Math.sin(ph) * 0.7 * k;
      p.tailYaw = Math.sin(ph * 0.5) * 0.4 * k;
      p.wingFlap = 0.1;
      break;
    }
    case "fly": {
      const ph = t * (reduced ? 6 : 13);
      p.wingFold = 0;
      p.wingFlap = Math.sin(ph) * 0.85 * (reduced ? 0.5 : 1);
      p.bobY = Math.sin(ph) * 0.06 * k;
      p.bodyPitch = 0.22;
      p.headPitch = -0.18;
      p.legTuck = 0.7;
      p.tailPitch = 0.25;
      p.tailYaw = Math.sin(t * 3) * 0.2 * k;
      break;
    }
    case "celebrate": {
      const c = mem.celebrate;
      const hop = Math.abs(Math.sin(c * Math.PI * 2)) * (reduced ? 0.12 : 0.5);
      p.bobY = hop;
      p.squash = hop < 0.05 ? 0.9 : 1.06;
      p.spin = reduced ? 0 : easeOut(c) * Math.PI * 2;
      p.wingFold = 0.1;
      p.wingFlap = Math.sin(t * 18) * 0.7 * k;
      p.headPitch = -0.25;
      p.eyeOpen = 0.45; // happy squint
      p.tailYaw = Math.sin(t * 14) * 0.5 * k;
      p.legTuck = hop > 0.1 ? 0.4 : 0;
      break;
    }
    case "sleep": {
      const breath = Math.sin(t * 1.1);
      p.bobY = -0.1;
      p.squash = 0.88 + breath * 0.035;
      p.headPitch = 0.42;
      p.headRoll = 0.12;
      p.eyeOpen = 0.06;
      p.tailYaw = 0.9;
      p.wingFold = 1;
      p.legTuck = 0.25;
      break;
    }
    case "explore": {
      p.headYaw = mem.lookYaw + Math.sin(t * 1.7) * 0.55 * k;
      p.headPitch = -0.1 + Math.sin(t * 1.1) * 0.08 * k;
      p.headRoll = Math.sin(t * 1.3) * 0.15 * k;
      p.tailYaw = Math.sin(t * 5) * 0.45 * k;
      p.bobY = Math.max(0, Math.sin(t * 3.4)) * 0.03 * k;
      p.wingFlap = Math.sin(t * 2.4) * 0.12 * k;
      break;
    }
  }

  // Blinking (skipped while asleep / squinting).
  if (state !== "sleep" && state !== "celebrate") {
    if (t > mem.nextBlink) {
      mem.blinkUntil = t + 0.12;
      mem.nextBlink = t + 2.2 + Math.random() * 3.2;
    }
    if (t < mem.blinkUntil) p.eyeOpen = 0.08;
  }

  apply(rig, p, dt, state === "celebrate");
}

function easeOut(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function apply(rig: DragonRig, p: Pose, dt: number, snapSpin: boolean) {
  const L = 14; // blend speed
  const b = rig.bob;
  b.position.y = damp(b.position.y, p.bobY, L, dt);
  const sq = damp(b.scale.y, p.squash, L, dt);
  b.scale.set(1 + (1 - sq) * 0.5, sq, 1 + (1 - sq) * 0.5);
  b.rotation.y = snapSpin ? p.spin : damp(b.rotation.y, 0, L, dt);

  rig.body.rotation.x = damp(rig.body.rotation.x, p.bodyPitch, L, dt);
  rig.body.rotation.z = damp(rig.body.rotation.z, p.bodyRoll, L, dt);

  rig.head.rotation.x = damp(rig.head.rotation.x, p.headPitch, 10, dt);
  rig.head.rotation.y = damp(rig.head.rotation.y, p.headYaw, 8, dt);
  rig.head.rotation.z = damp(rig.head.rotation.z, p.headRoll, 10, dt);

  for (const e of rig.eyes) e.scale.y = damp(e.scale.y, p.eyeOpen, 30, dt);

  // Wings: fold sweeps them back along the body, flap rotates around z.
  const foldY = p.wingFold * 0.9;
  rig.wingL.rotation.y = damp(rig.wingL.rotation.y, foldY, L, dt);
  rig.wingR.rotation.y = damp(rig.wingR.rotation.y, -foldY, L, dt);
  rig.wingL.rotation.z = damp(rig.wingL.rotation.z, 0.25 + p.wingFlap, 20, dt);
  rig.wingR.rotation.z = damp(rig.wingR.rotation.z, -0.25 - p.wingFlap, 20, dt);

  rig.tail.forEach((seg, i) => {
    seg.rotation.y = damp(seg.rotation.y, p.tailYaw * (0.6 + i * 0.3), 10, dt);
    seg.rotation.x = damp(seg.rotation.x, -p.tailPitch * 0.6 + (i === 0 ? -0.15 : 0.1), 10, dt);
  });

  const [fl, fr, bl, br] = rig.legs;
  fl.rotation.x = damp(fl.rotation.x, p.legSwing - p.legTuck * 0.6, 20, dt);
  br.rotation.x = damp(br.rotation.x, p.legSwing + p.legTuck, 20, dt);
  fr.rotation.x = damp(fr.rotation.x, -p.legSwing - p.legTuck * 0.6, 20, dt);
  bl.rotation.x = damp(bl.rotation.x, -p.legSwing + p.legTuck, 20, dt);
}

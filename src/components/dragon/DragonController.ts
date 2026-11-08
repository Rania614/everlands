import * as THREE from "three";
import { HAVEN_DRAGON_SPOT, LOCATIONS } from "@/data/locations";
import { DRAGON } from "@/lib/constants";
import { damp } from "@/lib/utils";
import type { DragonState, LocationId, Vec3 } from "@/types/world";
import { animateDragon, createAnimMemory, type AnimMemory } from "./DragonAnimations";
import type { DragonRig } from "./DragonModel";

const v = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);
/** Heading that faces the isometric camera. */
export const FACE_CAMERA = Math.PI / 4;

type Motion =
  | { kind: "walk"; points: THREE.Vector3[]; seg: number; segT: number }
  | {
      kind: "fly";
      from: THREE.Vector3;
      ctrl: THREE.Vector3;
      to: THREE.Vector3;
      t: number;
      duration: number;
      groundFrom: number;
      groundTo: number;
    };

/** Waypoints from one location's dragon spot to another's, via the Central Haven. */
export function buildRoute(from: LocationId, to: LocationId, start: THREE.Vector3) {
  const pts: THREE.Vector3[] = [start.clone()];
  if (from !== "haven") {
    const back = [...LOCATIONS[from].pathFromHaven].reverse().slice(1).map(v);
    pts.push(...back, v(HAVEN_DRAGON_SPOT));
  }
  if (to !== "haven") pts.push(...LOCATIONS[to].pathFromHaven.map(v));
  if (to === "haven" && from === "haven") pts.push(v(HAVEN_DRAGON_SPOT));
  return pts;
}

function routeLength(pts: THREE.Vector3[]) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
  return len;
}

function angleDamp(current: number, target: number, lambda: number, dt: number) {
  const d = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + d * (1 - Math.exp(-lambda * dt));
}

function headingTo(from: THREE.Vector3, to: THREE.Vector3) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

function clampAngle(a: number, max: number) {
  const n = Math.atan2(Math.sin(a), Math.cos(a));
  return Math.max(-max, Math.min(max, n));
}

export interface FrameContext {
  time: number;
  dt: number;
  reduced: boolean;
  /** Decorative/ambient behaviours (wandering) allowed. */
  ambient: boolean;
}

/**
 * Dragon behaviour: a small state machine plus predefined-path navigation.
 * Pure TypeScript (no React), so it runs every frame without re-renders and
 * can be unit-tested or reused with a different model.
 */
export class DragonController {
  readonly pos = v(HAVEN_DRAGON_SPOT);
  heading = FACE_CAMERA;
  state: DragonState = "idle";
  stateTime = 0;
  groundY = 0;
  readonly anim: AnimMemory = createAnimMemory();

  private targetHeading = FACE_CAMERA;
  private location: LocationId = "haven";
  private destination: LocationId = "haven";
  private motion: Motion | null = null;
  private wandering = false;
  private idleTime = 0;
  private sinceExplore = 0;
  private pendingCelebrate = false;

  constructor(private onStateChange: (s: DragonState) => void) {}

  get isTravelling() {
    return !!this.motion && !this.wandering;
  }

  private setState(s: DragonState) {
    if (this.state === s) return;
    this.state = s;
    this.stateTime = 0;
    if (s === "celebrate") this.anim.celebrate = 0;
    this.onStateChange(s);
  }

  travelTo(to: LocationId, reduced: boolean) {
    const target = v(LOCATIONS[to].dragonSpot);
    const wasTravelling = this.isTravelling;
    this.wandering = false;
    this.destination = to;
    this.idleTime = 0;

    if (this.location === to && !this.motion) {
      this.targetHeading = headingTo(this.pos, v(LOCATIONS[to].lookAt));
      this.setState("explore");
      return;
    }
    if (this.location === to && this.motion) {
      // Wandering at the destination already: walk back to the spot.
      this.motion = { kind: "walk", points: [this.pos.clone(), target], seg: 1, segT: 0 };
      this.setState("walk");
      return;
    }

    const pts = buildRoute(this.location, to, this.pos);
    const len = routeLength(pts);
    const ys = pts.map((p) => p.y);
    const elevation = Math.max(...ys) - Math.min(...ys);
    const fly = wasTravelling || len > DRAGON.flyDistanceThreshold || elevation > DRAGON.flyElevationThreshold;

    if (fly) {
      const dist = this.pos.distanceTo(target);
      const ctrl = this.pos.clone().lerp(target, 0.5);
      ctrl.y = Math.max(this.pos.y, target.y) + 2.5 + dist * 0.15;
      this.motion = {
        kind: "fly",
        from: this.pos.clone(),
        ctrl,
        to: target,
        t: 0,
        duration: reduced ? 0.45 : Math.max(1.3, dist / DRAGON.flySpeed),
        groundFrom: this.groundY,
        groundTo: target.y,
      };
      this.setState("fly");
    } else {
      this.motion = { kind: "walk", points: pts, seg: 1, segT: 0 };
      this.setState("walk");
    }
  }

  celebrate() {
    if (this.isTravelling) {
      this.pendingCelebrate = true;
      return;
    }
    if (this.wandering) {
      this.motion = null;
      this.wandering = false;
    }
    this.idleTime = 0;
    this.setState("celebrate");
  }

  /** Tap on the dragon: wake it up, or a happy hop. */
  pet() {
    if (this.motion) return;
    this.idleTime = 0;
    this.setState(this.state === "sleep" ? "explore" : "celebrate");
  }

  update(ctx: FrameContext, rig: DragonRig) {
    const { dt, reduced } = ctx;
    this.stateTime += dt;
    const m = this.motion;

    if (m?.kind === "walk") {
      const speed = DRAGON.walkSpeed * (reduced ? 2.5 : 1) * (this.wandering ? 0.55 : 1);
      let remaining = speed * dt;
      while (remaining > 0 && m.seg < m.points.length) {
        const a = m.points[m.seg - 1];
        const b = m.points[m.seg];
        const segLen = a.distanceTo(b) || 0.0001;
        const left = (1 - m.segT) * segLen;
        if (remaining >= left) {
          remaining -= left;
          m.seg++;
          m.segT = 0;
        } else {
          m.segT += remaining / segLen;
          remaining = 0;
        }
      }
      if (m.seg >= m.points.length) {
        this.pos.copy(m.points[m.points.length - 1]);
        this.arrive();
      } else {
        const a = m.points[m.seg - 1];
        const b = m.points[m.seg];
        this.pos.lerpVectors(a, b, m.segT);
        this.targetHeading = Math.atan2(b.x - a.x, b.z - a.z);
      }
      this.groundY = this.pos.y;
    } else if (m?.kind === "fly") {
      m.t = Math.min(1, m.t + dt / m.duration);
      const u = m.t < 0.5 ? 2 * m.t * m.t : 1 - Math.pow(-2 * m.t + 2, 2) / 2;
      const px = this.pos.x;
      const pz = this.pos.z;
      const a = 1 - u;
      this.pos.set(
        a * a * m.from.x + 2 * a * u * m.ctrl.x + u * u * m.to.x,
        a * a * m.from.y + 2 * a * u * m.ctrl.y + u * u * m.to.y,
        a * a * m.from.z + 2 * a * u * m.ctrl.z + u * u * m.to.z,
      );
      if (Math.hypot(this.pos.x - px, this.pos.z - pz) > 0.0005) {
        this.targetHeading = Math.atan2(this.pos.x - px, this.pos.z - pz);
      }
      this.groundY = THREE.MathUtils.lerp(m.groundFrom, m.groundTo, u);
      if (m.t >= 1) this.arrive();
    } else if (this.state === "celebrate") {
      this.anim.celebrate = Math.min(1, this.stateTime / (reduced ? 0.8 : DRAGON.celebrateSeconds));
      if (this.anim.celebrate >= 1) {
        this.targetHeading = FACE_CAMERA;
        this.setState("idle");
      }
    } else if (this.state === "explore") {
      if (this.stateTime > 2.8) {
        this.targetHeading = FACE_CAMERA;
        this.setState("idle");
      }
    } else if (this.state === "idle") {
      this.idleTime += dt;
      this.sinceExplore += dt;
      if (this.idleTime > DRAGON.sleepAfterSeconds) this.setState("sleep");
      else if (ctx.ambient && !reduced && this.sinceExplore > DRAGON.exploreEverySeconds) this.wander();
    }

    this.heading = angleDamp(this.heading, this.targetHeading, 7, dt);
    const look = headingTo(this.pos, v(LOCATIONS[this.location].lookAt)) - this.heading;
    this.anim.lookYaw = damp(this.anim.lookYaw, this.state === "explore" ? clampAngle(look, 0.7) : 0, 4, dt);

    animateDragon(rig, this.state, ctx.time, dt, this.anim, reduced || !ctx.ambient);
  }

  private arrive() {
    this.motion = null;
    this.idleTime = 0;
    this.sinceExplore = 0;
    if (!this.wandering) this.location = this.destination;
    this.wandering = false;
    if (this.pendingCelebrate) {
      this.pendingCelebrate = false;
      this.setState("celebrate");
      return;
    }
    this.targetHeading = headingTo(this.pos, v(LOCATIONS[this.location].lookAt));
    this.setState("explore");
  }

  private wander() {
    const spot = v(LOCATIONS[this.location].dragonSpot);
    const a = Math.random() * Math.PI * 2;
    const r = 0.4 + Math.random() * 0.6;
    const to = new THREE.Vector3(spot.x + Math.cos(a) * r, spot.y, spot.z + Math.sin(a) * r);
    this.sinceExplore = 0;
    this.wandering = true;
    this.motion = { kind: "walk", points: [this.pos.clone(), to], seg: 1, segT: 0 };
    this.setState("walk");
  }
}

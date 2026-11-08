"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/constants";
import { mat } from "../world/materials";

/**
 * The rig contract between the dragon's look and its behaviour. Any model
 * (this procedural one, or a future GLB with bones mapped to these groups)
 * only has to expose these pivots for DragonAnimations to drive it.
 */
export interface DragonRig {
  /** Vertical bob, squash/stretch and celebration spin. */
  bob: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  eyes: THREE.Group[];
  wingL: THREE.Group;
  wingR: THREE.Group;
  tail: THREE.Group[];
  /** Front-left, front-right, back-left, back-right. */
  legs: THREE.Group[];
}

export const DRAGON_COLORS = {
  body: "#8FB58B",
  bodyLight: "#A9CBA3",
  belly: PALETTE.cloudCream,
  horn: "#F0DDB4",
  wing: "#B8D3B0",
  wingInner: PALETTE.softPurple,
  eye: "#2F3A56",
  blush: PALETTE.coral,
};

const skin = () => mat(DRAGON_COLORS.body, { roughness: 0.95 });
const skinLight = () => mat(DRAGON_COLORS.bodyLight, { roughness: 0.95 });
const belly = () => mat(DRAGON_COLORS.belly, { roughness: 0.95 });
const horn = () => mat(DRAGON_COLORS.horn, { roughness: 0.8 });

function Wing({ side }: { side: 1 | -1 }) {
  return (
    <group>
      {/* membrane lobes extend outward along local x */}
      <mesh position={[side * 0.2, 0.06, -0.02]} rotation={[0, 0, side * 0.35]} scale={[0.26, 0.17, 0.035]} material={mat(DRAGON_COLORS.wing)} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <mesh position={[side * 0.33, -0.02, -0.04]} rotation={[0, 0, side * -0.2]} scale={[0.17, 0.12, 0.03]} material={mat(DRAGON_COLORS.wing)}>
        <sphereGeometry args={[1, 14, 8]} />
      </mesh>
      <mesh position={[side * 0.2, 0.05, 0.012]} rotation={[0, 0, side * 0.35]} scale={[0.19, 0.11, 0.02]} material={mat(DRAGON_COLORS.wingInner)}>
        <sphereGeometry args={[1, 14, 8]} />
      </mesh>
      {/* leading-edge bone */}
      <mesh position={[side * 0.2, 0.17, -0.02]} rotation={[0, 0, Math.PI / 2 + side * 0.35]} material={skin()}>
        <capsuleGeometry args={[0.025, 0.36, 4, 8]} />
      </mesh>
    </group>
  );
}

function Leg({ front }: { front: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.06, 0]} scale={[0.85, 1, 0.9]} material={skin()} castShadow>
        <capsuleGeometry args={[0.075, 0.08, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.14, front ? 0.03 : 0.02]} scale={[1.05, 0.65, 1.25]} material={skinLight()}>
        <sphereGeometry args={[0.085, 12, 8]} />
      </mesh>
    </group>
  );
}

export function DragonModel({ ref }: { ref?: Ref<DragonRig | null> }) {
  const bob = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const tail0 = useRef<THREE.Group>(null);
  const tail1 = useRef<THREE.Group>(null);
  const tail2 = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Group>(null);
  const legFR = useRef<THREE.Group>(null);
  const legBL = useRef<THREE.Group>(null);
  const legBR = useRef<THREE.Group>(null);

  useImperativeHandle<DragonRig | null, DragonRig | null>(
    ref,
    () =>
      bob.current
        ? {
            bob: bob.current,
            body: body.current!,
            head: head.current!,
            eyes: [eyeL.current!, eyeR.current!],
            wingL: wingL.current!,
            wingR: wingR.current!,
            tail: [tail0.current!, tail1.current!, tail2.current!],
            legs: [legFL.current!, legFR.current!, legBL.current!, legBR.current!],
          }
        : null,
    [],
  );

  return (
    <group ref={bob}>
      <group ref={body} position={[0, 0.4, 0]}>
        {/* torso */}
        <mesh scale={[1, 0.95, 1.12]} material={skin()} castShadow>
          <sphereGeometry args={[0.33, 24, 18]} />
        </mesh>
        <mesh position={[0, -0.03, 0.17]} scale={[0.78, 0.86, 0.55]} material={belly()}>
          <sphereGeometry args={[0.3, 20, 14]} />
        </mesh>
        {/* back spines */}
        {[0.18, 0.02, -0.15].map((z, i) => (
          <mesh key={i} position={[0, 0.3 - i * 0.03, z]} rotation={[-0.5 - i * 0.2, 0, 0]} material={horn()}>
            <coneGeometry args={[0.045 - i * 0.008, 0.11, 8]} />
          </mesh>
        ))}

        {/* legs */}
        <group ref={legFL} position={[0.17, -0.18, 0.15]}>
          <Leg front />
        </group>
        <group ref={legFR} position={[-0.17, -0.18, 0.15]}>
          <Leg front />
        </group>
        <group ref={legBL} position={[0.2, -0.18, -0.13]}>
          <Leg front={false} />
        </group>
        <group ref={legBR} position={[-0.2, -0.18, -0.13]}>
          <Leg front={false} />
        </group>

        {/* wings pivot at the shoulders */}
        <group ref={wingL} position={[0.18, 0.18, -0.08]}>
          <Wing side={1} />
        </group>
        <group ref={wingR} position={[-0.18, 0.18, -0.08]}>
          <Wing side={-1} />
        </group>

        {/* short rounded tail, three pivots */}
        <group ref={tail0} position={[0, -0.08, -0.32]}>
          <mesh position={[0, 0, -0.06]} scale={[1, 0.9, 1.3]} material={skin()} castShadow>
            <sphereGeometry args={[0.12, 14, 10]} />
          </mesh>
          <group ref={tail1} position={[0, 0.02, -0.15]}>
            <mesh position={[0, 0.01, -0.05]} scale={[1, 0.9, 1.3]} material={skin()}>
              <sphereGeometry args={[0.085, 12, 8]} />
            </mesh>
            <group ref={tail2} position={[0, 0.03, -0.11]}>
              <mesh position={[0, 0.02, -0.03]} rotation={[-1.1, 0, 0]} material={horn()}>
                <coneGeometry args={[0.06, 0.13, 8]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* head pivots at the neck; oversized for a baby look */}
        <group ref={head} position={[0, 0.34, 0.1]}>
          <mesh position={[0, 0.12, 0]} scale={[1.08, 0.96, 1]} material={skin()} castShadow>
            <sphereGeometry args={[0.31, 26, 20]} />
          </mesh>
          {/* snout */}
          <mesh position={[0, 0.03, 0.24]} scale={[1.2, 0.78, 0.92]} material={skinLight()}>
            <sphereGeometry args={[0.15, 18, 12]} />
          </mesh>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, 0.07, 0.375]} material={mat(DRAGON_COLORS.eye)}>
              <sphereGeometry args={[0.014, 6, 5]} />
            </mesh>
          ))}
          {/* smile */}
          <mesh position={[0, -0.02, 0.355]} rotation={[0.25, 0, Math.PI]} material={mat(DRAGON_COLORS.eye)}>
            <torusGeometry args={[0.045, 0.009, 6, 12, Math.PI]} />
          </mesh>
          {/* big expressive eyes */}
          {[
            { ref: eyeL, x: 0.135 },
            { ref: eyeR, x: -0.135 },
          ].map(({ ref: r, x }) => (
            <group key={x} ref={r} position={[x, 0.16, 0.24]}>
              <mesh scale={[0.9, 1.1, 0.6]} material={mat(DRAGON_COLORS.eye, { roughness: 0.3 })}>
                <sphereGeometry args={[0.085, 16, 12]} />
              </mesh>
              <mesh position={[x > 0 ? 0.02 : 0.02, 0.035, 0.045]} material={mat("#ffffff", { roughness: 0.2 })}>
                <sphereGeometry args={[0.026, 10, 8]} />
              </mesh>
              <mesh position={[-0.02, -0.03, 0.045]} material={mat("#ffffff", { roughness: 0.2 })}>
                <sphereGeometry args={[0.012, 8, 6]} />
              </mesh>
            </group>
          ))}
          {/* blush */}
          {[0.2, -0.2].map((x) => (
            <mesh key={x} position={[x, 0.04, 0.22]} scale={[1, 0.6, 0.4]} material={mat(DRAGON_COLORS.blush, { transparent: true, opacity: 0.85 })}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
          ))}
          {/* two tiny horns */}
          {[0.12, -0.12].map((x) => (
            <mesh key={x} position={[x, 0.4, -0.04]} rotation={[-0.45, 0, x > 0 ? -0.25 : 0.25]} material={horn()} castShadow>
              <coneGeometry args={[0.05, 0.17, 10]} />
            </mesh>
          ))}
          {/* little ear frills */}
          {[0.27, -0.27].map((x) => (
            <mesh key={x} position={[x, 0.2, -0.04]} rotation={[0, 0, x > 0 ? -0.9 : 0.9]} scale={[0.5, 1, 0.25]} material={mat(DRAGON_COLORS.wing)}>
              <coneGeometry args={[0.08, 0.16, 8]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

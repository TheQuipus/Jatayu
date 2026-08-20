"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, PointLight } from "three/webgpu";
import * as THREE from "three/webgpu";
import { DOOR_HEIGHT, LIGHT_Z } from "@/lib/three/serene/constants";
import { getSereneOpenT, sereneDebug } from "@/lib/three/serene/debug";
import { isSereneDebugEnabled } from "@/lib/three/serene/inspector";

const FIXTURE_Y = DOOR_HEIGHT * 0.52;
const FIXTURE_Z = LIGHT_Z + 0.15;

const TUBE_HEIGHT = 0.92;
const TUBE_RADIUS = 0.028;

type DoorLightFixtureProps = {
  lightRef: React.RefObject<PointLight | null>;
  progressRef: React.RefObject<number>;
};

export default function DoorLightFixture({ lightRef, progressRef }: DoorLightFixtureProps) {
  const groupRef = useRef<Group>(null);
  const tubeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const housingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x1c1c1c,
        metalness: 0.55,
        roughness: 0.45,
      }),
    []
  );

  const capMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.7,
        roughness: 0.35,
      }),
    []
  );

  useFrame(() => {
    const group = groupRef.current;
    const light = lightRef.current;
    if (!group || !light) return;

    const debugEnabled = isSereneDebugEnabled();
    if (debugEnabled && !sereneDebug.driveSceneFromScroll) {
      group.position.set(sereneDebug.lightX, sereneDebug.lightY, sereneDebug.lightZ);
    } else {
      group.position.set(0, FIXTURE_Y, FIXTURE_Z);
    }

    const openT = getSereneOpenT(progressRef);
    const rayT = Math.max(0, Math.min(1, (openT - 0.05) / 0.5));
    const glow = 0.35 + rayT * 2.8;

    light.intensity =
      sereneDebug.lightIntensityMin +
      rayT * (sereneDebug.lightIntensityMax - sereneDebug.lightIntensityMin);

    if (tubeMatRef.current) {
      tubeMatRef.current.emissiveIntensity = glow;
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = 0.08 + rayT * 0.42;
    }
  });

  const halfTube = TUBE_HEIGHT / 2;

  return (
    <group ref={groupRef} position={[0, FIXTURE_Y, FIXTURE_Z]}>
      {/* Ceiling mount bracket */}
      <mesh position={[0, halfTube + 0.06, 0]} material={housingMat} castShadow>
        <boxGeometry args={[0.16, 0.045, 0.1]} />
      </mesh>
      <mesh position={[0, halfTube + 0.02, 0]} material={housingMat}>
        <cylinderGeometry args={[0.018, 0.018, 0.05, 12]} />
      </mesh>

      {/* End caps */}
      <mesh position={[0, halfTube, 0]} material={capMat}>
        <cylinderGeometry args={[TUBE_RADIUS * 1.15, TUBE_RADIUS * 1.15, 0.03, 16]} />
      </mesh>
      <mesh position={[0, -halfTube, 0]} material={capMat}>
        <cylinderGeometry args={[TUBE_RADIUS * 1.15, TUBE_RADIUS * 1.15, 0.03, 16]} />
      </mesh>

      {/* Glowing tube glass */}
      <mesh>
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_HEIGHT, 20]} />
        <meshStandardMaterial
          ref={tubeMatRef}
          color={0xffffff}
          emissive={0xfff4d6}
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      {/* Soft bloom halo around tube */}
      <mesh>
        <cylinderGeometry args={[TUBE_RADIUS * 2.8, TUBE_RADIUS * 2.8, TUBE_HEIGHT * 1.02, 16]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={0xffe8c0}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Actual point light at tube center — drives shadows + god rays */}
      <pointLight
        ref={lightRef}
        color={0xfff0d0}
        intensity={0.5}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.002}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
    </group>
  );
}

export { FIXTURE_Y, FIXTURE_Z };

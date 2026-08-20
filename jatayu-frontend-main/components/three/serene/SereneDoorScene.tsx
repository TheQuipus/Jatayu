"use client";

import { OrbitControls, Stats } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { PointLight } from "three/webgpu";
import * as THREE from "three/webgpu";
import {
  DOOR_HEIGHT,
  DOOR_WIDTH,
  FRAME,
  LIGHT_Z,
  SCROLL_ROOT_ID,
} from "@/lib/three/serene/constants";
import {
  getSereneOpenT,
  sereneDebug,
} from "@/lib/three/serene/debug";
import { isSereneDebugEnabled } from "@/lib/three/serene/inspector";
import { useScrollProgress } from "@/lib/three/serene/useScrollProgress";
import GodraysPipeline from "./GodraysPipeline";
import DoorLightFixture from "./DoorLightFixture";

function DoorAssembly({ progressRef }: { progressRef: React.RefObject<number> }) {
  const pivotRef = useRef<THREE.Group>(null);
  const edgeMaterials = useMemo(
    () =>
      Array.from({ length: 4 }, () =>
        new THREE.MeshBasicMaterial({
          color: 0xffd090,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      ),
    []
  );

  useFrame(({ camera }) => {
    const scrollOpenT = getSereneOpenT(progressRef);
    const useScrollScene =
      !isSereneDebugEnabled() || sereneDebug.driveSceneFromScroll;

    if (useScrollScene) {
      if (!sereneDebug.freeCamera) {
        camera.position.set(
          0,
          DOOR_HEIGHT * 0.42,
          THREE.MathUtils.lerp(4.5, 3.6, scrollOpenT)
        );
        camera.lookAt(0, DOOR_HEIGHT * 0.45, 0);
      }

      if (pivotRef.current) {
        pivotRef.current.rotation.y = scrollOpenT * (Math.PI / 2 + 0.04);
      }

      const edgeFade = THREE.MathUtils.lerp(1, 0.15, scrollOpenT);
      edgeMaterials.forEach((mat) => {
        mat.opacity = 0.45 + edgeFade * 0.45;
      });
      return;
    }

    if (!sereneDebug.freeCamera) {
      camera.position.set(
        sereneDebug.cameraX,
        sereneDebug.cameraY,
        sereneDebug.cameraZ
      );
      camera.lookAt(sereneDebug.lookAtX, sereneDebug.lookAtY, sereneDebug.lookAtZ);
    }

    if (pivotRef.current) {
      pivotRef.current.rotation.y = sereneDebug.doorRotationY;
    }
  });

  const gap = 0.02;

  return (
    <group>
      <mesh
        position={[-DOOR_WIDTH / 2 - FRAME / 2, (DOOR_HEIGHT + FRAME * 2) / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[FRAME, DOOR_HEIGHT + FRAME * 2, 0.12]} />
        <meshStandardMaterial color={0x1a1614} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh
        position={[DOOR_WIDTH / 2 + FRAME / 2, (DOOR_HEIGHT + FRAME * 2) / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[FRAME, DOOR_HEIGHT + FRAME * 2, 0.12]} />
        <meshStandardMaterial color={0x1a1614} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, DOOR_HEIGHT + FRAME / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DOOR_WIDTH + FRAME * 2, FRAME, 0.12]} />
        <meshStandardMaterial color={0x1a1614} roughness={0.85} metalness={0.05} />
      </mesh>

      <group ref={pivotRef} position={[-DOOR_WIDTH / 2, 0, 0]}>
        <mesh position={[DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, 0.08]} />
          <meshStandardMaterial color={0x2a2420} roughness={0.75} metalness={0.08} />
        </mesh>
      </group>

      <mesh position={[0, DOOR_HEIGHT + gap / 2, 0.04]} material={edgeMaterials[0]}>
        <boxGeometry args={[DOOR_WIDTH + gap * 2, gap, 0.03]} />
      </mesh>
      <mesh position={[0, gap / 2, 0.04]} material={edgeMaterials[1]}>
        <boxGeometry args={[DOOR_WIDTH + gap * 2, gap, 0.03]} />
      </mesh>
      <mesh position={[-DOOR_WIDTH / 2 - gap / 2, DOOR_HEIGHT / 2, 0.04]} material={edgeMaterials[2]}>
        <boxGeometry args={[gap, DOOR_HEIGHT, 0.03]} />
      </mesh>
      <mesh position={[DOOR_WIDTH / 2 + gap / 2, DOOR_HEIGHT / 2, 0.04]} material={edgeMaterials[3]}>
        <boxGeometry args={[gap, DOOR_HEIGHT, 0.03]} />
      </mesh>

      <mesh position={[0, DOOR_HEIGHT / 2, LIGHT_Z - 0.35]} receiveShadow>
        <planeGeometry args={[DOOR_WIDTH * 2.5, DOOR_HEIGHT * 2]} />
        <meshStandardMaterial color={0x121010} roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={0x0a0a0a} roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function SereneDoorScene() {
  const progressRef = useScrollProgress(SCROLL_ROOT_ID);
  const godLightRef = useRef<PointLight>(null);
  const debugEnabled = isSereneDebugEnabled();

  return (
    <>
      <color attach="background" args={[0x050505]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[0, 2, 5]} intensity={0.55} color={0xffeedd} />

      <DoorLightFixture lightRef={godLightRef} progressRef={progressRef} />

      {debugEnabled && sereneDebug.freeCamera && (
        <OrbitControls makeDefault target={[0, DOOR_HEIGHT * 0.45, 0]} />
      )}

      <DoorAssembly progressRef={progressRef} />
      <GodraysPipeline lightRef={godLightRef} progressRef={progressRef} />

      {debugEnabled && <Stats />}
    </>
  );
}

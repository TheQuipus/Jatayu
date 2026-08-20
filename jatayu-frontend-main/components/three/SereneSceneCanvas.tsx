"use client";

import { Canvas, advance } from "@react-three/fiber";
import { Suspense, useState } from "react";
import * as THREE from "three/webgpu";
import {
  attachSereneInspector,
  isSereneDebugEnabled,
  mountSereneInspectorUI,
} from "@/lib/three/serene/inspector";
import SereneDoorScene from "./serene/SereneDoorScene";
import styles from "./SereneSceneCanvas.module.css";

export default function SereneSceneCanvas() {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  return (
    <div
      className={`${styles.wrap} ${isSereneDebugEnabled() ? styles.wrapInteractive : ""}`}
    >
      <Canvas
        className={styles.canvasHost}
        shadows
        dpr={[1, 2]}
        frameloop="never"
        camera={{ position: [0, 1.03, 4.5], fov: 42, near: 0.1, far: 50 }}
        gl={async (props) => {
          try {
            if (!("gpu" in navigator)) {
              throw new Error("WebGPU is not supported in this browser.");
            }

            const { canvas, alpha, depth, stencil, antialias } = props;
            const renderer = new THREE.WebGPURenderer({
              canvas: canvas as HTMLCanvasElement,
              alpha,
              depth,
              stencil,
              antialias: antialias ?? true,
            });
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            attachSereneInspector(renderer);
            await renderer.init();
            mountSereneInspectorUI(renderer);

            return renderer;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to initialize WebGPU scene";
            setError(message);
            throw err;
          }
        }}
        onCreated={(state) => {
          setReady(true);

          void state.gl.setAnimationLoop((time) => {
            advance(time, true, state);
          });
        }}
      >
        <Suspense fallback={null}>
          <SereneDoorScene />
        </Suspense>
      </Canvas>

      {!ready && !error && (
        <div className={styles.overlay}>
          <span className={styles.loader} />
        </div>
      )}
      {error && (
        <div className={styles.overlay}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PointLight, WebGPURenderer } from "three/webgpu";
import { RenderPipeline } from "three/webgpu";
import { color, pass } from "three/tsl";
import { godrays } from "three/addons/tsl/display/GodraysNode.js";
import { bilateralBlur } from "three/addons/tsl/display/BilateralBlurNode.js";
import { depthAwareBlend } from "three/addons/tsl/display/depthAwareBlend.js";
import {
  getSereneProgress,
  sereneDebug,
  setupSereneInspector,
} from "@/lib/three/serene/debug";
import { isSereneDebugEnabled } from "@/lib/three/serene/inspector";

type GodraysPipelineProps = {
  lightRef: React.RefObject<PointLight | null>;
  progressRef: React.RefObject<number>;
};

type PipelineResources = {
  pipeline: RenderPipeline;
  godraysPass: ReturnType<typeof godrays>;
  scenePass: ReturnType<typeof pass>;
  dispose: () => void;
};

function buildPipeline(
  renderer: WebGPURenderer,
  scene: Parameters<typeof pass>[0],
  camera: Parameters<typeof pass>[1],
  light: PointLight
): PipelineResources {
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const scenePassDepth = scenePass.getTextureNode("depth");

  const godraysPass = godrays(scenePassDepth, camera, light);
  godraysPass.resolutionScale = 0.5;
  godraysPass.density.value = 0;
  godraysPass.maxDensity.value = 0.55;
  godraysPass.distanceAttenuation.value = 2.2;

  const blurPass = bilateralBlur(godraysPass);
  const blurPassColor = blurPass.getTextureNode();

  const output = depthAwareBlend(scenePassColor, blurPassColor, scenePassDepth, camera, {
    blendColor: color(0xffd090),
    edgeRadius: 2,
    edgeStrength: 2,
  });

  const pipeline = new RenderPipeline(renderer, output);

  return {
    pipeline,
    godraysPass,
    scenePass,
    dispose: () => {
      godraysPass.dispose();
      blurPass.dispose();
      pipeline.dispose();
    },
  };
}

export default function GodraysPipeline({ lightRef, progressRef }: GodraysPipelineProps) {
  const { gl, scene, camera } = useThree();
  const renderer = gl as unknown as WebGPURenderer;

  const resourcesRef = useRef<PipelineResources | null>(null);
  const readyRef = useRef(false);
  const initStartedRef = useRef(false);
  const guiReadyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    initStartedRef.current = false;
    readyRef.current = false;

    return () => {
      mountedRef.current = false;
      readyRef.current = false;
      initStartedRef.current = false;

      const resources = resourcesRef.current;
      resourcesRef.current = null;

      // Defer disposal so an in-flight WebGPU submit can finish first.
      queueMicrotask(() => {
        resources?.dispose();
      });
    };
  }, [renderer]);

  useFrame(() => {
    const light = lightRef.current;
    if (!light || !mountedRef.current) return;

    if (!resourcesRef.current && !initStartedRef.current) {
      initStartedRef.current = true;

      const resources = buildPipeline(renderer, scene, camera, light);
      resourcesRef.current = resources;

      void resources.scenePass.compileAsync(renderer).then(() => {
        if (mountedRef.current && resourcesRef.current === resources) {
          readyRef.current = true;

          if (isSereneDebugEnabled() && !guiReadyRef.current) {
            guiReadyRef.current = true;
            setupSereneInspector({
              renderer,
              godraysPass: resources.godraysPass,
              progressRef,
              lightRef,
            });
          }
        }
      });

      return;
    }

    if (!readyRef.current || !resourcesRef.current) return;

    const t = getSereneProgress(progressRef);
    const openT = 1 - Math.pow(1 - t, 3);
    const rayT = Math.max(0, Math.min(1, (openT - 0.06) / 0.79));

    const { godraysPass, pipeline } = resourcesRef.current;

    if (!isSereneDebugEnabled() || sereneDebug.driveGodraysFromScroll) {
      godraysPass.density.value = rayT * 0.85;
      godraysPass.maxDensity.value = 0.15 + rayT * 0.45;
    }

    pipeline.render();
  }, 1);

  return null;
}

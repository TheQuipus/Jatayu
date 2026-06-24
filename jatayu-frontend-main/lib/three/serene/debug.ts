import type { RefObject } from "react";
import type { PointLight, WebGPURenderer } from "three/webgpu";
import { Inspector } from "three/addons/inspector/Inspector.js";
import { godrays } from "three/addons/tsl/display/GodraysNode.js";
import { DOOR_HEIGHT, LIGHT_Z } from "./constants";
import {
  focusSereneParametersTab,
  isSereneDebugEnabled,
} from "./inspector";

export const sereneDebug = {
  overrideScroll: true,
  manualProgress: 0.35,
  driveGodraysFromScroll: false,
  driveSceneFromScroll: false,
  freeCamera: true,

  cameraX: 0,
  cameraY: DOOR_HEIGHT * 0.42,
  cameraZ: 4.5,
  lookAtX: 0,
  lookAtY: DOOR_HEIGHT * 0.45,
  lookAtZ: 0,
  doorRotationY: 0.8,

  lightX: 0,
  lightY: DOOR_HEIGHT * 0.52,
  lightZ: LIGHT_Z + 0.15,
  lightIntensityMin: 0.5,
  lightIntensityMax: 28,
  toneMappingExposure: 1.15,
};

export function getSereneProgress(progressRef: RefObject<number>): number {
  if (isSereneDebugEnabled() && sereneDebug.overrideScroll) {
    return sereneDebug.manualProgress;
  }
  return progressRef.current ?? 0;
}

export function getSereneOpenT(progressRef: RefObject<number>) {
  const t = getSereneProgress(progressRef);
  return 1 - Math.pow(1 - t, 3);
}

export type SereneInspectorTargets = {
  renderer: WebGPURenderer;
  godraysPass: ReturnType<typeof godrays>;
  progressRef: RefObject<number>;
  lightRef: RefObject<PointLight | null>;
};

declare global {
  interface Window {
    __serene?: {
      debug: typeof sereneDebug;
      getProgress: () => number;
      renderer: WebGPURenderer;
      godraysPass: ReturnType<typeof godrays>;
      light: PointLight | null;
    };
  }
}

export function bindSereneDebugWindow(targets: SereneInspectorTargets) {
  if (!isSereneDebugEnabled()) return;

  window.__serene = {
    debug: sereneDebug,
    getProgress: () => getSereneProgress(targets.progressRef),
    renderer: targets.renderer,
    godraysPass: targets.godraysPass,
    light: targets.lightRef.current,
  };
}

export function setupSereneInspector(targets: SereneInspectorTargets) {
  if (!isSereneDebugEnabled()) return;

  const { renderer, godraysPass, lightRef } = targets;
  focusSereneParametersTab(renderer);

  const inspector = renderer.inspector as Inspector | undefined;
  if (!inspector?.createParameters) return;

  bindSereneDebugWindow(targets);

  const scrollGui = inspector.createParameters("Scroll");
  scrollGui.add(sereneDebug, "overrideScroll").name("override scroll");
  scrollGui.add(sereneDebug, "manualProgress", 0, 1).name("manual progress");
  scrollGui.add(sereneDebug, "driveSceneFromScroll").name("drive scene from scroll");

  const cameraGui = inspector.createParameters("Camera");
  cameraGui.add(sereneDebug, "freeCamera").name("orbit controls");
  cameraGui.add(sereneDebug, "cameraX", -6, 6).name("camera x");
  cameraGui.add(sereneDebug, "cameraY", 0, 4).name("camera y");
  cameraGui.add(sereneDebug, "cameraZ", 1, 12).name("camera z");
  cameraGui.add(sereneDebug, "lookAtX", -3, 3).name("look at x");
  cameraGui.add(sereneDebug, "lookAtY", 0, 4).name("look at y");
  cameraGui.add(sereneDebug, "lookAtZ", -3, 3).name("look at z");

  const doorGui = inspector.createParameters("Door");
  doorGui.add(sereneDebug, "doorRotationY", 0, Math.PI * 0.6).name("door rotation y");

  const godraysGui = inspector.createParameters("God rays");
  godraysGui.add(sereneDebug, "driveGodraysFromScroll").name("drive from scroll");
  godraysGui.add(godraysPass.density, "value", 0, 1).name("density");
  godraysGui.add(godraysPass.maxDensity, "value", 0, 1).name("max density");
  godraysGui
    .add(godraysPass.distanceAttenuation, "value", 0, 6)
    .name("distance attenuation");
  godraysGui.add(godraysPass, "resolutionScale", 0.25, 1).name("resolution scale");

  const lightGui = inspector.createParameters("Light");
  lightGui.add(sereneDebug, "lightX", -3, 3).name("light x");
  lightGui.add(sereneDebug, "lightY", 0, 4).name("light y");
  lightGui.add(sereneDebug, "lightZ", -5, 2).name("light z");
  lightGui.add(sereneDebug, "lightIntensityMin", 0, 10).name("intensity min");
  lightGui.add(sereneDebug, "lightIntensityMax", 0, 60).name("intensity max");

  const renderGui = inspector.createParameters("Renderer");
  renderGui
    .add(sereneDebug, "toneMappingExposure", 0.5, 3)
    .name("tone mapping exposure")
    .onChange((value: number) => {
      renderer.toneMappingExposure = value;
    });

  if (lightRef.current) {
    lightGui
      .add(lightRef.current, "intensity", 0, 60)
      .name("current intensity")
      .listen();
  }
}

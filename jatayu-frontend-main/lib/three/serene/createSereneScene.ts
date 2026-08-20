import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createVolumetricGodRays, type VolumetricGodRays } from "./godRays";
import type { SereneSceneHandle, SereneSceneOptions } from "./types";

const DOOR_WIDTH = 1.35;
const DOOR_HEIGHT = 2.45;
const FRAME = 0.1;
const LIGHT_Z = -1.85;

type SceneObjects = {
  doorPivot: THREE.Group;
  edgeGlows: THREE.Group;
  lightPortal: THREE.Mesh;
  godRays: VolumetricGodRays;
  bloomPass: UnrealBloomPass;
};

function createEdgeGlows(): THREE.Group {
  const group = new THREE.Group();
  const warm = 0xffd090;
  const gap = 0.02;
  const mat = () =>
    new THREE.MeshBasicMaterial({
      color: warm,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_WIDTH + gap * 2, gap, 0.03),
    mat()
  );
  top.position.set(0, DOOR_HEIGHT + gap / 2, 0.04);

  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_WIDTH + gap * 2, gap, 0.03),
    mat()
  );
  bottom.position.set(0, gap / 2, 0.04);

  const left = new THREE.Mesh(new THREE.BoxGeometry(gap, DOOR_HEIGHT, 0.03), mat());
  left.position.set(-DOOR_WIDTH / 2 - gap / 2, DOOR_HEIGHT / 2, 0.04);

  const right = new THREE.Mesh(new THREE.BoxGeometry(gap, DOOR_HEIGHT, 0.03), mat());
  right.position.set(DOOR_WIDTH / 2 + gap / 2, DOOR_HEIGHT / 2, 0.04);

  group.add(top, bottom, left, right);
  return group;
}

function createDoor(): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(-DOOR_WIDTH / 2, 0, 0);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x2a2420,
      roughness: 0.75,
      metalness: 0.08,
    })
  );
  panel.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0);
  pivot.add(panel);

  return pivot;
}

function createFrame(): THREE.Group {
  const frame = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a1614,
    roughness: 0.85,
    metalness: 0.05,
  });

  const h = DOOR_HEIGHT + FRAME * 2;
  const side = new THREE.Mesh(new THREE.BoxGeometry(FRAME, h, 0.12), mat);
  side.position.set(-DOOR_WIDTH / 2 - FRAME / 2, h / 2, 0);
  const sideR = side.clone();
  sideR.position.x = DOOR_WIDTH / 2 + FRAME / 2;

  const top = new THREE.Mesh(new THREE.BoxGeometry(DOOR_WIDTH + FRAME * 2, FRAME, 0.12), mat);
  top.position.set(0, DOOR_HEIGHT + FRAME / 2, 0);

  frame.add(side, sideR, top);
  return frame;
}

function createSceneObjects(): SceneObjects {
  const lightPortal = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_WIDTH * 1.08, DOOR_HEIGHT * 1.05),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
  );
  lightPortal.position.set(0, DOOR_HEIGHT / 2, LIGHT_Z);

  const godRays = createVolumetricGodRays({
    doorWidth: DOOR_WIDTH,
    doorHeight: DOOR_HEIGHT,
    lightZ: LIGHT_Z,
    sourceY: DOOR_HEIGHT * 0.52,
  });

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    0,
    0.5,
    0.85
  );

  return {
    doorPivot: createDoor(),
    edgeGlows: createEdgeGlows(),
    lightPortal,
    godRays,
    bloomPass,
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function applyScrollProgress(
  progress: number,
  camera: THREE.PerspectiveCamera,
  objects: SceneObjects
) {
  const openT = easeOutCubic(THREE.MathUtils.clamp(progress, 0, 1));

  camera.position.set(0, DOOR_HEIGHT * 0.42, THREE.MathUtils.lerp(4.5, 3.6, openT));
  camera.lookAt(0, DOOR_HEIGHT * 0.45, 0);

  objects.doorPivot.rotation.y = openT * (Math.PI / 2 + 0.04);

  const portalMat = objects.lightPortal.material as THREE.MeshBasicMaterial;
  portalMat.opacity = THREE.MathUtils.smoothstep(openT, 0.05, 0.5);

  const rayT = THREE.MathUtils.smoothstep(openT, 0.06, 0.85);
  objects.godRays.setIntensity(rayT * 1.4);
  objects.bloomPass.strength = THREE.MathUtils.lerp(0, 0.95, rayT);

  const edgeFade = THREE.MathUtils.lerp(1, 0.15, openT);
  objects.edgeGlows.children.forEach((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      child.material.opacity = 0.45 + edgeFade * 0.45;
    }
  });
}

export async function createSereneScene(
  container: HTMLElement,
  _options: SereneSceneOptions = {}
): Promise<SereneSceneHandle> {
  const getSize = () => ({
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
  });

  const { width, height } = getSize();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffeedd, 0.55);
  key.position.set(0, 2, 5);
  scene.add(key);

  const objects = createSceneObjects();
  scene.add(
    createFrame(),
    objects.doorPivot,
    objects.edgeGlows,
    objects.lightPortal,
    objects.godRays.group
  );

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(objects.godRays.pass);
  composer.addPass(objects.bloomPass);

  let scrollProgress = 0;
  let raf = 0;

  applyScrollProgress(0, camera, objects);

  const onResize = () => {
    const { width: w, height: h } = getSize();
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    applyScrollProgress(scrollProgress, camera, objects);
    objects.godRays.update(camera);
    composer.render();
  };

  raf = requestAnimationFrame(tick);
  onResize();
  requestAnimationFrame(onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  return {
    setScrollProgress: (progress) => {
      scrollProgress = progress;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      composer.dispose();
      objects.godRays.dispose();
      renderer.dispose();
      renderer.domElement.remove();

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((m) => m.dispose());
        }
      });
    },
  };
}

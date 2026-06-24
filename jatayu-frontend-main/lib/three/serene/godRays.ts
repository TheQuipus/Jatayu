import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

const MAX_SAMPLES = 64;

const GodRaysScreenShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
    intensity: { value: 0 },
    exposure: { value: 0.28 },
    decay: { value: 0.965 },
    density: { value: 0.95 },
    weight: { value: 0.14 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 lightPosition;
    uniform float intensity;
    uniform float exposure;
    uniform float decay;
    uniform float density;
    uniform float weight;
    varying vec2 vUv;

    void main() {
      vec4 original = texture2D(tDiffuse, vUv);
      if (intensity < 0.001) {
        gl_FragColor = original;
        return;
      }

      vec2 delta = (lightPosition - vUv) * density / float(${MAX_SAMPLES});
      vec2 coord = vUv;
      vec3 accum = vec3(0.0);
      float illum = 1.0;

      for (int i = 0; i < ${MAX_SAMPLES}; i++) {
        coord += delta;
        accum += texture2D(tDiffuse, coord).rgb * illum * weight;
        illum *= decay;
      }

      gl_FragColor = vec4(original.rgb + accum * exposure * intensity, original.a);
    }
  `,
};

export class GodRaysPass extends Pass {
  uniforms: typeof GodRaysScreenShader.uniforms;
  material: THREE.ShaderMaterial;
  private fsQuad: FullScreenQuad;
  readonly lightWorld = new THREE.Vector3();

  constructor() {
    super();
    this.uniforms = THREE.UniformsUtils.clone(GodRaysScreenShader.uniforms);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: GodRaysScreenShader.vertexShader,
      fragmentShader: GodRaysScreenShader.fragmentShader,
    });
    this.fsQuad = new FullScreenQuad(this.material);
  }

  setIntensity(value: number) {
    this.uniforms.intensity.value = value;
  }

  updateLightScreenPosition(camera: THREE.PerspectiveCamera) {
    const p = this.lightWorld.clone().project(camera);
    this.uniforms.lightPosition.value.set((p.x + 1) * 0.5, (p.y + 1) * 0.5);
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    this.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}

const beamVertexShader = /* glsl */ `
  varying float vBeam;
  void main() {
    vBeam = position.y * 0.5 + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  varying float vBeam;

  void main() {
    float alpha = pow(vBeam, 0.5) * pow(1.0 - vBeam, 0.4) * 3.2 * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export type VolumetricGodRays = {
  group: THREE.Group;
  pass: GodRaysPass;
  setIntensity: (value: number) => void;
  update: (camera: THREE.PerspectiveCamera) => void;
  dispose: () => void;
};

export function createVolumetricGodRays(options: {
  doorWidth: number;
  doorHeight: number;
  lightZ: number;
  sourceY: number;
}): VolumetricGodRays {
  const { doorWidth, doorHeight, lightZ, sourceY } = options;
  const group = new THREE.Group();
  const source = new THREE.Vector3(0, sourceY, lightZ);
  const up = new THREE.Vector3(0, 1, 0);

  const beamMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(0xfff4e6) },
    },
    vertexShader: beamVertexShader,
    fragmentShader: beamFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const yaw = THREE.MathUtils.lerp(-0.65, 0.65, t);
    const pitch = -0.05 + (i % 4) * 0.05;
    const length = 5.2 + (i % 3) * 0.5;
    const radius = 0.45 + (i % 3) * 0.15;

    const dir = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch) + 0.06,
      Math.cos(yaw) * Math.cos(pitch)
    ).normalize();

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, radius, length, 8, 1, true),
      beamMaterial
    );
    beam.position.copy(source.clone().add(dir.clone().multiplyScalar(length * 0.5)));
    beam.quaternion.setFromUnitVectors(up, dir);
    group.add(beam);
  }

  const pass = new GodRaysPass();
  pass.lightWorld.set(0, sourceY, lightZ + 0.1);

  const setIntensity = (value: number) => {
    beamMaterial.uniforms.uIntensity.value = value;
    pass.setIntensity(value);
  };

  return {
    group,
    pass,
    setIntensity,
    update: (camera) => {
      pass.updateLightScreenPosition(camera);
    },
    dispose: () => {
      pass.dispose();
      beamMaterial.dispose();
      group.traverse((c) => {
        if (c instanceof THREE.Mesh) c.geometry.dispose();
      });
    },
  };
}

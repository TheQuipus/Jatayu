"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import styles from "./TopNavbar.module.css";

interface PageTurnFlapProps {
  isOpen: boolean;
  onLinkClick?: () => void;
  onPeelChange?: (isPeeled: boolean) => void;
}

const FLAP_POSITION_GLSL = `
  uniform vec2 uSize;
  attribute float aDistRatio;
  attribute float aAxisRatio;

  void computeFlapPositions(out vec3 flatPos, out vec3 peeledPos, out vec2 peelUv) {
    float w = max(uSize.x, 1.0);
    float h = max(uSize.y, 1.0);
    // 2.5px overlap beyond .blackWedge boundary eliminates resting seams & peeled gaps
    float yA = h * 0.609 - 2.5;
    float xB = w * 0.915 + 2.5;
    float xApex = w * 0.53;
    float yApex = h * 0.45;

    flatPos = vec3(
      aAxisRatio * xB,
      -yA + aDistRatio * (-h + yA) + aAxisRatio * (-h + yA),
      0.0
    );
    peeledPos = vec3(
      aDistRatio * xApex + aAxisRatio * xB,
      -yA + aDistRatio * (-yApex + yA) + aAxisRatio * (-h + yA),
      8.0
    );
    peelUv = clamp(vec2(peeledPos.x / w, 1.0 - (-peeledPos.y / h)), 0.0, 1.0);
  }
`;

export default function PageTurnFlap({ isOpen, onPeelChange }: PageTurnFlapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isMobileToggled, setIsMobileToggled] = useState(false);

  // References for Three.js lifecycle
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const shadowMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const backingMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Animation state values
  const peelRef = useRef(0.0);
  const targetPeelRef = useRef(0.0);
  const peelVelRef = useRef(0.0);
  const timeRef = useRef(0.0);

  // Update target peel based on hover or mobile toggle and notify parent
  useEffect(() => {
    const peeled = isHovered || isMobileToggled;
    targetPeelRef.current = peeled ? 1.0 : 0.0;
    onPeelChange?.(peeled);
  }, [isHovered, isMobileToggled, onPeelChange]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsHovered(false);
      setIsMobileToggled(false);
      peelRef.current = 0.0;
      targetPeelRef.current = 0.0;
      peelVelRef.current = 0.0;
    }
  }, [isOpen]);

  // Smooth global pointer tracking when peeled open
  useEffect(() => {
    if (!isHovered) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      // Lower active region boundary (bottom 54% of drawerContent)
      const isInsideLower =
        x >= rect.left - 15 &&
        x <= rect.right + 15 &&
        y >= rect.bottom - rect.height * 0.54 &&
        y <= rect.bottom + 15;

      if (!isInsideLower) {
        setIsHovered(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isHovered]);

  // Handle mobile / touch toggle
  const handleTouchToggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Only toggle on touch/small devices or when explicitly tapped
    if (window.matchMedia("(max-width: 768px), (hover: none)").matches) {
      e.stopPropagation();
      setIsMobileToggled((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !isOpen) return;

    let width = container.clientWidth || 420;
    let height = container.clientHeight || 900;

    // 1. Scene & Camera Setup (1 Three.js unit = 1 screen pixel)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(0, width, 0, -height, -500, 500);
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    rendererRef.current = renderer;

    // 2. Offscreen Texture Generation for Charcoal Flap Underside (#2D2D2D + 5 Birds)
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 1024;
    textureCanvas.height = 1024;
    const ctx = textureCanvas.getContext("2d");

    const backTexture = new THREE.CanvasTexture(textureCanvas);
    // Custom ShaderMaterial outputs sRGB bytes directly; NoColorSpace avoids gamma-crushing #2D2D2D to near-black
    backTexture.colorSpace = THREE.NoColorSpace;

    // Load Jatayu Bird Image for the 5 emblems
    let birdImgLoaded = false;
    const birdImg = new window.Image();
    birdImg.crossOrigin = "anonymous";
    birdImg.src = "/assets/img/jatayu-bird-black.png";

    const renderTexturePattern = () => {
      if (!ctx) return;
      ctx.fillStyle = "#2D2D2D";
      ctx.fillRect(0, 0, 1024, 1024);

      // Subtle paper grain texture overlay
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.03)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.06)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      if (birdImgLoaded) {
        // Compute aspect ratio to compensate for non-uniform UV stretching
        // On screen: screen_x = u * width, screen_y = (1-v) * height
        // Scaling Y by (width / height) on the texture ensures the bird is completely
        // unskewed, isotropic 1:1 aspect ratio and perfectly horizontal on the screen.
        const aspect = width / Math.max(height, 1);

        const drawBird = (xRatio: number, yRatio: number, scaleRatio: number, opacity: number, rotationDeg: number) => {
          ctx.save();
          ctx.globalAlpha = opacity;
          const x = xRatio * 1024;
          const y = yRatio * 1024;
          const w = scaleRatio * 1024;
          const h = (w * birdImg.height) / birdImg.width;

          ctx.translate(x, y);
          ctx.scale(1.0, aspect);
          ctx.rotate((rotationDeg * Math.PI) / 180);
          ctx.drawImage(birdImg, -w / 2, -h / 2, w, h);
          ctx.restore();
        };

        // 5 Jatayu Birds positioned and oriented to match Figma image exactly:
        // 1. Hero Bird (upper-left of flap, large and dominant)
        drawBird(0.292, 0.636, 0.35, 0.88, 0);
        // 2. Upper-right bird (smaller, level with hero bird)
        drawBird(0.517, 0.637, 0.14, 0.82, 0);
        // 3. Mid-left bird (below hero bird)
        drawBird(0.455, 0.756, 0.14, 0.76, 0);
        // 4. Mid-right bird (medium size, lower-center)
        drawBird(0.634, 0.797, 0.18, 0.82, 0);
        // 5. Bottom-right bird (near tip)
        drawBird(0.741, 0.898, 0.12, 0.70, 0);
      }

      backTexture.needsUpdate = true;
    };

    renderTexturePattern();

    birdImg.onload = () => {
      birdImgLoaded = true;
      renderTexturePattern();
    };

    // 3. Geometry Construction: Resolution-Independent Subdivided Triangular Flap
    // Normalized (aDistRatio, aAxisRatio) attributes stay static while uSize drives exact
    // menu-anchored pixel positions in the vertex shader across zoom & viewport changes.
    const sizeVec = new THREE.Vector2(width, height);

    const N = 48; // Subdivisions for ultra-smooth flexible sticker bending
    const numVerts = ((N + 1) * (N + 2)) / 2;

    const positions = new Float32Array(numVerts * 3);
    const distRatios = new Float32Array(numVerts);
    const axisRatios = new Float32Array(numVerts);

    let vIdx = 0;
    const vertMap: number[][] = [];

    for (let i = 0; i <= N; i++) {
      vertMap[i] = [];
      const u = i / N; // Along AC (from line AB toward corner C)
      for (let j = 0; j <= N - i; j++) {
        const v = j / N; // Along AB (from left A toward right B)

        vertMap[i][j] = vIdx;

        // Placeholder position attribute (actual menu-anchored coords come from uSize in shader)
        positions[vIdx * 3] = v * width;
        positions[vIdx * 3 + 1] = -height * (0.609 + (1.0 - 0.609) * Math.max(u, v));
        positions[vIdx * 3 + 2] = 0.0;

        // Normalized distance from crease line AB (0 at crease, 1 at corner)
        distRatios[vIdx] = u;
        // Normalized position along crease line AB (0 at Point A, 1 at Point B)
        axisRatios[vIdx] = v;

        vIdx++;
      }
    }

    // Build indices for the triangular grid
    const indices: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) {
        const p00 = vertMap[i][j];
        const p10 = vertMap[i + 1][j];
        const p01 = vertMap[i][j + 1];

        // Upward triangle
        indices.push(p00, p10, p01);

        // Downward triangle
        if (j < N - 1 - i) {
          const p11 = vertMap[i + 1][j + 1];
          indices.push(p10, p11, p01);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aDistRatio", new THREE.BufferAttribute(distRatios, 1));
    geometry.setAttribute("aAxisRatio", new THREE.BufferAttribute(axisRatios, 1));
    geometry.setIndex(indices);

    // 4. Custom Double-Sided Shader Material for Flexible Sticker Peeling
    const flapMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0.0 },
        uPeel: { value: 0.0 },
        uSize: { value: sizeVec },
        uFrontColor: { value: new THREE.Vector3(1.0, 92.0 / 255.0, 1.0 / 255.0) },
        uBackTexture: { value: backTexture },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPeel;
        ${FLAP_POSITION_GLSL}

        varying vec2 vUv;
        varying float vDistRatio;
        varying float vBendProgress;

        void main() {
          vec3 aFlatPosition;
          vec3 aPeeledPosition;
          vec2 peelUv;
          computeFlapPositions(aFlatPosition, aPeeledPosition, peelUv);

          vUv = peelUv;
          vDistRatio = aDistRatio;

          float xScale = clamp(uSize.x / 500.0, 0.75, 1.8);
          float yScale = clamp(uSize.y / 900.0, 0.75, 1.8);

          // 1. Idle breeze dynamics at rest: fresh, stiff paper floating up and down
          // Clean, smooth power curve (pow 2.2) ensures C2 continuous planar stiffness
          // floating smoothly without any unnatural ripples, kinks, or curls
          float breeze = 0.5 + 0.38 * sin(uTime * 2.0) + 0.12 * sin(uTime * 3.4 + 1.2);
          float cornerWeight = pow(aDistRatio, 2.2);

          float liftY = (34.0 + 20.0 * breeze) * yScale * cornerWeight;
          float curlX = (16.0 + 10.0 * breeze) * xScale * cornerWeight;
          float liftZ = (28.0 + 16.0 * breeze) * cornerWeight;

          vec3 restPos = aFlatPosition + vec3(curlX, liftY, liftZ);

          // 2. Progressive Wave & Lag along the peeling edge:
          // Corner lifts ahead of the inner fold on hover-in and settles back with wave on hover-out
          float leadDistance = (1.0 - aDistRatio);
          float lagFactor = leadDistance * 0.46 + aAxisRatio * 0.08;
          float clampedPeel = clamp(uPeel, 0.0, 1.0);
          float localActivation = clamp((clampedPeel - lagFactor) / (1.0 - lagFactor + 0.0001), 0.0, 1.0);

          // 3. Smooth Curved Bend Profile:
          // Smooth cubic Hermite curve for flexible progressive peel
          float bendProgress = smoothstep(0.0, 1.0, localActivation);
          vBendProgress = bendProgress;

          // 4. Flexible peel position displacement
          // Every vertex folds across crease line AB completely as bendProgress reaches 1.0
          vec3 foldDelta = aPeeledPosition - aFlatPosition;
          vec3 bentPos = aFlatPosition + foldDelta * bendProgress;

          // 5. Out-of-plane 3D Cylindrical Roll (Z-displacement):
          // At the rolling bend front, the paper arches out like a peeled sticker tube
          float rollCrest = sin(bendProgress * 3.14159265);
          float rollHeight = rollCrest * (52.0 + 32.0 * aDistRatio) * (1.0 - 0.35 * clampedPeel);

          // Permanent flexible curvature across the peeled sheet at full open
          float permanentCrown = sin(aDistRatio * 3.14159265) * 16.0 * (1.0 - aDistRatio * 0.4);
          float zArch = mix(0.0, permanentCrown, clampedPeel) + rollHeight;
          bentPos.z += zArch;

          // 6. Dynamic elastic flex ripple along the sticker during transitions
          float flexAmplitude = sin(clampedPeel * 3.14159265) * 12.0 * pow(aDistRatio, 1.3);
          float flexRipple = sin(uTime * 4.5 - aDistRatio * 5.5 + aAxisRatio * 2.0) * flexAmplitude;
          bentPos.x += flexRipple * 0.3 * xScale;
          bentPos.y += flexRipple * 0.5 * yScale;
          bentPos.z += flexRipple;

          // 7. Blend smoothly from resting wind-flutter into flexible peeled pose
          vec3 pos = mix(restPos, bentPos, smoothstep(0.0, 0.15, clampedPeel));

          // Ensure exact convergence to target reference pose at full peel
          if (clampedPeel > 0.85) {
            float settleFactor = smoothstep(0.85, 1.0, clampedPeel);
            vec3 finalPeeledTarget = aPeeledPosition + vec3(0.0, 0.0, permanentCrown);
            pos = mix(pos, finalPeeledTarget, settleFactor);
          }

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uFrontColor;
        uniform sampler2D uBackTexture;
        uniform float uPeel;
        uniform float uTime;

        varying vec2 vUv;
        varying float vDistRatio;
        varying float vBendProgress;

        void main() {
          // When the flap has folded over (vBendProgress > 0.45 or !gl_FrontFacing),
          // it displays the charcoal flap underside with 5 bird emblems smoothly without glitches.
          bool isUnderside = (!gl_FrontFacing) || (vBendProgress > 0.45);

          if (!isUnderside) {
            // Front face: Exact, pure, seamless solid orange matching CSS #FF5C01
            // Free of any artificial crease troughs, dark lines, or curvature shadows
            gl_FragColor = vec4(1.0, 92.0 / 255.0, 1.0 / 255.0, 1.0);
          } else {
            // Flap underside: Dark charcoal #2D2D2D with 5 Jatayu bird emblems
            vec4 backColor = texture2D(uBackTexture, vUv);
            
            // Underside shading: soft concave occlusion near crease, catching light toward outer free edge
            float backTrough = 1.0 - 0.18 * smoothstep(0.0, 0.08, vDistRatio) * smoothstep(0.32, 0.12, vDistRatio);
            float backAmbient = 0.94 + 0.10 * sin(vUv.x * 3.14159) + 0.06 * vDistRatio;
            gl_FragColor = vec4(backColor.rgb * backTrough * backAmbient, backColor.a);
          }
        }
      `,
    });
    materialRef.current = flapMaterial;

    // 5. Drop Shadow Plane Beneath the Lifting Flap (z = -1.0)
    const shadowMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0.0 },
        uPeel: { value: 0.0 },
        uSize: { value: sizeVec },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPeel;
        ${FLAP_POSITION_GLSL}

        varying float vDistRatio;
        varying float vBendProgress;

        void main() {
          vec3 aFlatPosition;
          vec3 aPeeledPosition;
          vec2 peelUv;
          computeFlapPositions(aFlatPosition, aPeeledPosition, peelUv);

          vDistRatio = aDistRatio;

          float xScale = clamp(uSize.x / 500.0, 0.75, 1.8);
          float yScale = clamp(uSize.y / 900.0, 0.75, 1.8);

          // Follow the same progressive wave timing as the flap
          float leadDistance = (1.0 - aDistRatio);
          float lagFactor = leadDistance * 0.46 + aAxisRatio * 0.08;
          float clampedPeel = clamp(uPeel, 0.0, 1.0);
          float localActivation = clamp((clampedPeel - lagFactor) / (1.0 - lagFactor + 0.0001), 0.0, 1.0);
          float bendProgress = smoothstep(0.0, 1.0, localActivation);
          vBendProgress = bendProgress;

          // Resting shadow stays flat at base position so zero black silhouettes protrude
          vec3 restShadowPos = aFlatPosition;
          restShadowPos.z = -1.0;

          // Peeled shadow offset follows progressive bend
          vec3 foldDelta = aPeeledPosition - aFlatPosition;
          vec3 activeShadowPos = aFlatPosition + foldDelta * bendProgress;
          activeShadowPos.x += 10.0 * xScale * bendProgress;
          activeShadowPos.y -= 12.0 * yScale * bendProgress;
          activeShadowPos.z = -1.0;

          vec3 pos = mix(restShadowPos, activeShadowPos, smoothstep(0.0, 0.20, clampedPeel));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uPeel;
        varying float vDistRatio;
        varying float vBendProgress;

        void main() {
          // Rolling peel contact shadow (darkest under the rolling bend front)
          float rollShadow = exp(-pow((vBendProgress - 0.42) / 0.26, 2.0)) * 0.55;
          float bodyShadow = 0.48 * (1.0 - vDistRatio * 0.35);
          float activeShadow = mix(bodyShadow, rollShadow, sin(uPeel * 3.14159265) * 0.55);

          // Strictly 0.0 at rest (uPeel < 0.04) - eliminates all black shadow artifacts/bumps under the resting edge!
          float alpha = activeShadow * smoothstep(0.04, 0.30, uPeel);
          gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
        }
      `,
    });
    shadowMaterialRef.current = shadowMaterial;

    const shadowMesh = new THREE.Mesh(geometry, shadowMaterial);
    shadowMesh.renderOrder = 0;
    shadowMesh.frustumCulled = false;
    scene.add(shadowMesh);

    const flapMesh = new THREE.Mesh(geometry, flapMaterial);
    flapMesh.renderOrder = 1;
    flapMesh.frustumCulled = false;
    scene.add(flapMesh);

    // 6. Backing Depth Mesh: Kept for reference but not added to scene so that
    // the real HTML footer (.blackCard on .blackWedge) is visible directly beneath
    // the transparent WebGL canvas through the curled fluttering corner.
    const backingMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPeel: { value: 0.0 },
        uSize: { value: sizeVec },
      },
      vertexShader: `
        ${FLAP_POSITION_GLSL}
        varying float vDistRatio;

        void main() {
          vec3 aFlatPosition;
          vec3 aPeeledPosition;
          vec2 peelUv;
          computeFlapPositions(aFlatPosition, aPeeledPosition, peelUv);

          vDistRatio = aDistRatio;
          vec3 pos = aFlatPosition;
          pos.z = -2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
    });
    backingMaterialRef.current = backingMaterial;

    // 7. Animation Loop with Damped Spring Physics & Organic Settling Wave
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      timeRef.current += dt;

      // Damped spring physics with organic settling wave for flexible paper/sticker
      const target = targetPeelRef.current;
      const current = peelRef.current;

      // Asymmetric spring constants:
      // Pulling open: crisp, responsive acceleration (k = 65, c = 14)
      // Closing down: organic elastic flex with gentle settling wave (k = 48, c = 12)
      const k = target > 0.5 ? 65.0 : 48.0;
      const c = target > 0.5 ? 14.0 : 12.0;

      const force = -k * (current - target) - c * peelVelRef.current;
      peelVelRef.current += force * dt;
      peelRef.current += peelVelRef.current * dt;

      // Allow slight spring settling around target, clamp cleanly when settled
      if (target === 0.0 && Math.abs(peelRef.current) < 0.001 && Math.abs(peelVelRef.current) < 0.01) {
        peelRef.current = 0.0;
        peelVelRef.current = 0.0;
      } else if (target === 1.0 && Math.abs(peelRef.current - 1.0) < 0.001 && Math.abs(peelVelRef.current) < 0.01) {
        peelRef.current = 1.0;
        peelVelRef.current = 0.0;
      }

      // Pass uniforms to shaders
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = timeRef.current;
        materialRef.current.uniforms.uPeel.value = peelRef.current;
      }
      if (shadowMaterialRef.current) {
        shadowMaterialRef.current.uniforms.uTime.value = timeRef.current;
        shadowMaterialRef.current.uniforms.uPeel.value = peelRef.current;
      }
      if (backingMaterialRef.current) {
        backingMaterialRef.current.uniforms.uPeel.value = peelRef.current;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // 7. Resize & Browser Zoom Sync (keeps flap anchored to .drawerContent across zoom/resize)
    const syncViewportSize = (nextW?: number, nextH?: number) => {
      const newW = nextW ?? container.clientWidth;
      const newH = nextH ?? container.clientHeight;
      if (newW <= 0 || newH <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sizeChanged = newW !== width || newH !== height;
      const dprChanged = renderer.getPixelRatio() !== dpr;
      if (!sizeChanged && !dprChanged) return;

      width = newW;
      height = newH;
      camera.right = width;
      camera.bottom = -height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      sizeVec.set(width, height);
      renderTexturePattern();
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        syncViewportSize(entry.contentRect.width, entry.contentRect.height);
      }
    });

    const handleViewportResize = () => {
      syncViewportSize();
    };

    resizeObserver.observe(container);
    window.addEventListener("resize", handleViewportResize);
    window.visualViewport?.addEventListener("resize", handleViewportResize);

    // 8. Lifecycle Disposal Cleanup
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleViewportResize);
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
      geometry.dispose();
      flapMaterial.dispose();
      shadowMaterial.dispose();
      backingMaterial.dispose();
      backTexture.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  const isPeeled = isHovered || isMobileToggled;

  return (
    <div
      ref={containerRef}
      className={styles.peelContainer}
    >
      {/* 3D WebGL Canvas Layer (pointer-events: none) */}
      <canvas ref={canvasRef} className={styles.peelCanvas} aria-hidden="true" />

      {/* Interactive Hit-Zones */}
      {/* 1. Resting Hit-Zone: Bottom-left corner (180px x 180px) */}
      {!isPeeled && (
        <button
          type="button"
          className={styles.restingHitZone}
          onMouseEnter={() => setIsHovered(true)}
          onClick={handleTouchToggle}
          aria-label="Peel corner to reveal join options"
        />
      )}

      {/* 2. Expanded Active Hit-Zone: Covers lower region when open */}
      {isPeeled && (
        <div
          className={styles.activeHitZone}
          onClick={handleTouchToggle}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

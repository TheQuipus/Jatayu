"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./HeroScrollSequence.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FRAME_COUNT = 300;
const FRAME_PAD = 3;
const DECODE_RADIUS = 6;
const READY_THRESHOLD = 24;
const SCROLL_VH = 2.5;

type HeroScrollSequenceProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

function frameUrl(index: number) {
  const n = String(index + 1).padStart(FRAME_PAD, "0");
  return `/assets/hero-sequence/frame-${n}.jpg`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldSubsample() {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData) return true;
  if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") {
    return true;
  }
  return false;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  canvasWidth: number,
  canvasHeight: number,
  sourceWidth: number,
  sourceHeight: number
) {
  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const dx = (canvasWidth - drawWidth) / 2;
  const dy = (canvasHeight - drawHeight) / 2;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
}

export default function HeroScrollSequence({ sectionRef }: HeroScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const frameRef = useRef(0);
  const bitmapsRef = useRef<(ImageBitmap | null)[]>(
    Array.from({ length: FRAME_COUNT }, () => null)
  );
  const blobsRef = useRef<(Blob | null)[]>(
    Array.from({ length: FRAME_COUNT }, () => null)
  );
  const inflightRef = useRef<Map<number, Promise<ImageBitmap | null>>>(new Map());
  const subsampleRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let isDisposed = false;
    let trigger: ScrollTrigger | null = null;
    let resizeObserver: ResizeObserver | null = null;
    subsampleRef.current = shouldSubsample();
    const step = subsampleRef.current ? 2 : 1;
    const reduceMotion = prefersReducedMotion();

    const sizeCanvas = () => {
      const rect = section.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const releaseOutsideWindow = (center: number) => {
      const bitmaps = bitmapsRef.current;
      for (let i = 0; i < FRAME_COUNT; i += 1) {
        if (Math.abs(i - center) > DECODE_RADIUS && bitmaps[i]) {
          bitmaps[i]?.close();
          bitmaps[i] = null;
        }
      }
    };

    const ensureBlob = async (index: number) => {
      if (blobsRef.current[index]) return blobsRef.current[index];
      const response = await fetch(frameUrl(index));
      if (!response.ok) throw new Error(`Failed to load frame ${index + 1}`);
      const blob = await response.blob();
      blobsRef.current[index] = blob;
      return blob;
    };

    const ensureBitmap = async (index: number) => {
      const existing = bitmapsRef.current[index];
      if (existing) return existing;

      const inflight = inflightRef.current.get(index);
      if (inflight) return inflight;

      const promise = (async () => {
        try {
          const blob = await ensureBlob(index);
          if (!blob || isDisposed) return null;
          const bitmap = await createImageBitmap(blob);
          if (isDisposed) {
            bitmap.close();
            return null;
          }
          bitmapsRef.current[index] = bitmap;
          return bitmap;
        } catch {
          return null;
        } finally {
          inflightRef.current.delete(index);
        }
      })();

      inflightRef.current.set(index, promise);
      return promise;
    };

    const drawFrame = async (rawIndex: number) => {
      const index = Math.max(
        0,
        Math.min(FRAME_COUNT - 1, Math.round(rawIndex / step) * step)
      );
      frameRef.current = index;
      releaseOutsideWindow(index);

      const bitmap = await ensureBitmap(index);
      if (!bitmap || isDisposed || !ctx) return;
      if (frameRef.current !== index) return;

      sizeCanvas();
      drawCover(
        ctx,
        bitmap,
        canvas.width,
        canvas.height,
        bitmap.width,
        bitmap.height
      );

      // Prefetch nearby frames so scrubbing stays smooth.
      for (let offset = -DECODE_RADIUS; offset <= DECODE_RADIUS; offset += 1) {
        const neighbor = index + offset * step;
        if (neighbor < 0 || neighbor >= FRAME_COUNT) continue;
        void ensureBitmap(neighbor);
      }
    };

    const preloadBlobs = async () => {
      let loaded = 0;
      const concurrency = 8;
      let cursor = 0;

      const worker = async () => {
        while (!isDisposed) {
          const index = cursor;
          cursor += step;
          if (index >= FRAME_COUNT) return;
          try {
            await ensureBlob(index);
          } catch {
            // Keep going; draw path will retry individual frames.
          }
          loaded += 1;
          if (!isDisposed) {
            setLoadProgress(Math.min(1, loaded / Math.ceil(FRAME_COUNT / step)));
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    };

    let tween: gsap.core.Tween | null = null;

    const setupScroll = () => {
      if (reduceMotion) {
        void drawFrame(0);
        setIsReady(true);
        return;
      }

      const scrollDistance = Math.round(window.innerHeight * SCROLL_VH);
      const proxy = { frame: 0 };

      // Pin the section itself (same pattern as Problem) so pinSpacing works.
      // Keep Hero above later sections (Problem cards) while the sequence is pinned.
      tween = gsap.to(proxy, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${scrollDistance}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            gsap.set(section, { zIndex: self.isActive ? 20 : "" });
          },
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
        onUpdate: () => {
          const nextFrame = proxy.frame;
          if (Math.round(nextFrame) === Math.round(frameRef.current)) return;
          void drawFrame(nextFrame);
        },
      });

      trigger = tween.scrollTrigger ?? null;
      void drawFrame(0);
      // Hero's pin spacer shifts every fold below it. Refresh so their starts
      // are measured after that spacer exists.
      ScrollTrigger.refresh();
    };

    sizeCanvas();

    const handleWindowResize = () => {
      sizeCanvas();
      void drawFrame(frameRef.current);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleWindowResize);

    // Only redraw on section size changes — never refresh ScrollTrigger here,
    // or pin spacing collapses in a resize feedback loop.
    resizeObserver = new ResizeObserver(() => {
      sizeCanvas();
      void drawFrame(frameRef.current);
    });
    resizeObserver.observe(section);

    const boot = async () => {
      // Decode the first frame immediately so the fold is never blank.
      await ensureBitmap(0);
      if (isDisposed) return;
      await drawFrame(0);
      setIsReady(true);
      setupScroll();

      // Warm the first window, then fetch the rest of the compressed blobs.
      const warm = Array.from({ length: READY_THRESHOLD }, (_, i) => i * step)
        .filter((i) => i < FRAME_COUNT)
        .map((i) => ensureBitmap(i));
      await Promise.all(warm);
      if (isDisposed) return;
      void preloadBlobs();
    };

    void boot();

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", handleWindowResize);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      trigger?.kill();
      resizeObserver?.disconnect();
      bitmapsRef.current.forEach((bitmap) => bitmap?.close());
      bitmapsRef.current = Array.from({ length: FRAME_COUNT }, () => null);
      blobsRef.current = Array.from({ length: FRAME_COUNT }, () => null);
      inflightRef.current.clear();
    };
  }, [sectionRef]);

  return (
    <div className={styles.wrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div
        className={`${styles.fallback} ${isReady ? styles.fallbackHidden : ""}`}
      />
      {!isReady && (
        <div className={styles.loader} role="presentation">
          <span
            className={styles.loaderBar}
            style={{ width: `${Math.max(8, loadProgress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

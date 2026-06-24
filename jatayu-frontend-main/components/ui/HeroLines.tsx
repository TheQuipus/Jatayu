"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HeroLines.module.css";

type HeroLinesProps = {
  className?: string;
  rotate180?: boolean;
  color?: string;
};

const LINE_HEIGHTS = [10, 8, 6, 4, 2] as const;

import { usePathname } from "next/navigation";

export default function HeroLines({ className, rotate180 = false, color }: HeroLinesProps) {
  const linesRef = useRef<HTMLDivElement>(null);
  const [isRetracted, setIsRetracted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;

    const updateRetraction = () => {
      frame = 0;
      const node = linesRef.current;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;

      setIsRetracted(elementCenter < viewportCenter);
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateRetraction);
    };

    // Force updates with fallback timeouts to handle layout changes
    updateRetraction();
    const t1 = setTimeout(updateRetraction, 50);
    const t2 = setTimeout(updateRetraction, 300);

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [pathname]);

  const classes = [
    styles.heroLines,
    isRetracted ? styles.retracted : "",
    rotate180 ? styles.rotated : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={linesRef} className={classes} aria-hidden="true">
      {LINE_HEIGHTS.map((height) => (
        <span key={height} className={styles.line} style={{ height, color }} />
      ))}
    </div>
  );
}

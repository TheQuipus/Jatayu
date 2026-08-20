"use client";

import { useEffect, useRef } from "react";

function getScrollProgress(trigger: HTMLElement): number {
  const range = trigger.scrollHeight - window.innerHeight;
  if (range <= 0) return 0;
  const scrolled = -trigger.getBoundingClientRect().top;
  return Math.min(1, Math.max(0, scrolled / range));
}

export function useScrollProgress(rootId: string) {
  const progressRef = useRef(0);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const update = () => {
      progressRef.current = getScrollProgress(root);
    };

    update();
    requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [rootId]);

  return progressRef;
}

"use client";

import { useEffect } from "react";

const LERP = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMaxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function setScrollTop(value: number) {
  // The smoothing loop owns interpolation. Never let the browser add a
  // second CSS smooth-scroll animation on top of it.
  window.scrollTo({ top: value, left: 0, behavior: "auto" });
}

export default function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches) return;

    let currentY = window.scrollY;
    let targetY = currentY;
    let lastTime = performance.now();
    let animationFrame = 0;
    let isAnimating = false;

    root.classList.add("lenis", "lenis-smooth");

    const syncFromNativeScroll = () => {
      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = currentY;
      }
    };

    const wake = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    };

    const addDelta = (delta: number) => {
      targetY = clamp(targetY + delta, 0, getMaxScroll());
      wake();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return;
      event.preventDefault();
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      addDelta(event.deltaY * multiplier);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;

      let nextY: number | null = null;
      if (event.key === "Home") nextY = 0;
      if (event.key === "End") nextY = getMaxScroll();
      if (event.key === "PageDown" || (event.key === " " && !event.shiftKey)) nextY = targetY + window.innerHeight * 0.9;
      if (event.key === "PageUp" || (event.key === " " && event.shiftKey)) nextY = targetY - window.innerHeight * 0.9;
      if (event.key === "ArrowDown") nextY = targetY + 80;
      if (event.key === "ArrowUp") nextY = targetY - 80;
      if (nextY === null) return;

      event.preventDefault();
      targetY = clamp(nextY, 0, getMaxScroll());
      wake();
    };

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href^='#']")
        : null;
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const destination = document.querySelector(hash);
      if (!destination) return;

      event.preventDefault();
      targetY = clamp(destination.getBoundingClientRect().top + window.scrollY, 0, getMaxScroll());
      history.pushState(null, "", hash);
      wake();
    };

    const animate = (time: number) => {
      animationFrame = 0;
      const delta = Math.min(64, time - lastTime);
      lastTime = time;
      const amount = 1 - Math.pow(1 - LERP, delta / 16.67);
      const difference = targetY - currentY;

      if (Math.abs(difference) < 0.1) {
        currentY = targetY;
        isAnimating = false;
        setScrollTop(currentY);
        return;
      }

      currentY += difference * amount;
      isAnimating = true;
      setScrollTop(currentY);
      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", syncFromNativeScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onAnchorClick);

    return () => {
      window.removeEventListener("scroll", syncFromNativeScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onAnchorClick);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      root.classList.remove("lenis", "lenis-smooth");
    };
  }, []);

  return null;
}

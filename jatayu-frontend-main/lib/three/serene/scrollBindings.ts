import type { SereneSceneHandle } from "./types";

export type ScrollBindingCleanup = () => void;

function getScrollProgress(trigger: HTMLElement): number {
  const range = trigger.scrollHeight - window.innerHeight;
  if (range <= 0) return 0;
  const scrolled = -trigger.getBoundingClientRect().top;
  return Math.min(1, Math.max(0, scrolled / range));
}

/**
 * Drive scene progress from native window scroll — reliable on isolated demo routes.
 */
export function bindSereneScroll(
  scene: SereneSceneHandle,
  trigger: HTMLElement
): ScrollBindingCleanup {
  const update = () => {
    scene.setScrollProgress(getScrollProgress(trigger));
  };

  update();
  requestAnimationFrame(update);
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}

export function disposeSereneScroll(cleanup?: ScrollBindingCleanup) {
  cleanup?.();
}

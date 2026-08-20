import type { WebGPURenderer } from "three/webgpu";
import { Inspector } from "three/addons/inspector/Inspector.js";

export function isSereneDebugEnabled() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }

  return (
    process.env.NODE_ENV === "development" ||
    new URLSearchParams(window.location.search).has("debug")
  );
}

export function attachSereneInspector(renderer: WebGPURenderer) {
  if (!isSereneDebugEnabled()) return null;

  const inspector = new Inspector();
  renderer.inspector = inspector;
  return inspector;
}

function enableInspectorPointerEvents(shell: HTMLElement) {
  shell.style.pointerEvents = "none";

  const selectors = [
    "#profiler-toggle",
    "#profiler-panel",
    "#profiler-mini-panel",
    ".detached-window",
  ];

  for (const selector of selectors) {
    shell.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      node.style.pointerEvents = "auto";
    });
  }
}

export function mountSereneInspectorUI(renderer: WebGPURenderer) {
  const inspector = renderer.inspector as Inspector | undefined;
  if (!inspector?.domElement) return;

  const shell = inspector.domElement;
  if (shell.parentElement !== document.body) {
    shell.parentElement?.removeChild(shell);
    document.body.appendChild(shell);
  }

  shell.style.position = "fixed";
  shell.style.inset = "0";
  shell.style.zIndex = "100000";
  enableInspectorPointerEvents(shell);

  const panel = shell.querySelector<HTMLElement>("#profiler-panel");
  const toggle = shell.querySelector<HTMLElement>("#profiler-toggle");

  if (panel && !panel.classList.contains("visible")) {
    toggle?.click();
  }
}

export function focusSereneParametersTab(renderer: WebGPURenderer) {
  const inspector = renderer.inspector as Inspector | undefined;
  if (!inspector) return;

  mountSereneInspectorUI(renderer);

  const parameters = (inspector as Inspector & { parameters?: { id: string } }).parameters;
  if (parameters) {
    inspector.setActiveTab(parameters as never);
  }
}

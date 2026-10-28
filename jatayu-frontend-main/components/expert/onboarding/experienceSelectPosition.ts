const MENU_MAX_HEIGHT = 220;
const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;
export const MIN_USABLE_MENU_HEIGHT = 120;

type ExperienceSelectAnchor = {
  top: number;
  bottom: number;
  left: number;
  width: number;
};

type ExperienceSelectViewport = {
  width: number;
  height: number;
};

export function getExperienceSelectMenuPosition(
  anchor: ExperienceSelectAnchor,
  viewport: ExperienceSelectViewport,
  menuContentHeight: number,
): {
  left: number;
  width: number;
  maxHeight: number;
  top: number;
} {
  const spaceBelow = Math.max(
    0,
    viewport.height - VIEWPORT_PADDING - anchor.bottom - MENU_GAP,
  );
  const width = Math.min(anchor.width, Math.max(0, viewport.width - VIEWPORT_PADDING * 2));
  const left = Math.min(
    Math.max(VIEWPORT_PADDING, anchor.left),
    Math.max(VIEWPORT_PADDING, viewport.width - width - VIEWPORT_PADDING),
  );

  return {
    left,
    width,
    maxHeight: Math.min(MENU_MAX_HEIGHT, Math.max(0, menuContentHeight), spaceBelow),
    top: anchor.bottom + MENU_GAP,
  };
}

export function shouldScrollExperienceSelectAnchor(
  anchor: ExperienceSelectAnchor,
  viewport: ExperienceSelectViewport,
): boolean {
  const spaceBelow = viewport.height - VIEWPORT_PADDING - anchor.bottom - MENU_GAP;
  return spaceBelow < MIN_USABLE_MENU_HEIGHT;
}

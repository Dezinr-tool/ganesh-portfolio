/** Cursor, clock and pause rules for the hero gradient. */

export type Vec2 = { x: number; y: number };

type Box = { left: number; top: number; width: number; height: number };

/** Share of the gap to the cursor closed per 60fps frame. */
const POINTER_FOLLOW = 1 / 8;
const FLOW_TIME_START = 0.95;
const FLOW_TIME_PER_SECOND = 0.05976;
/** Flow buffer size as a share of the canvas: the gradient is soft enough to upscale. */
const FLOW_SCALE_START = 0.25;
const FLOW_SCALE_MIN = 0.125;
/** Average frame time, measured over each window, that counts as too slow. */
const SLOW_FRAME_MS = 40;
const GOVERNOR_WINDOW_MS = 1000;
/** A gap this long is a hidden tab or a stall, not a slow frame. */
const IGNORED_GAP_MS = 500;
/** Share of the first screen scrolled before content has covered the sticky hero. */
const STICKY_COVERED_AT = 0.92;
const STICKY_HERO_QUERY = "(min-width: 768px)";
const SHEEN_SWAY_REACH = 45;
const SHEEN_SWAY_SPEED = 0.5;

/** Cursor position in shader space: 0–1, with y pointing up. */
export function pointerToFlowUv(
  clientX: number,
  clientY: number,
  box: Box,
): Vec2 | null {
  if (box.width <= 0 || box.height <= 0) return null;
  const x = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
  const y = Math.max(0, Math.min(1, (clientY - box.top) / box.height));
  return { x, y: 1 - y };
}

/** Eases toward the cursor at the same speed on any frame rate. */
export function followPointer(
  current: Vec2,
  target: Vec2,
  deltaRatio: number,
): void {
  const step = 1 - Math.pow(1 - POINTER_FOLLOW, deltaRatio);
  current.x += (target.x - current.x) * step;
  current.y += (target.y - current.y) * step;
}

export function flowTime(seconds: number): number {
  return FLOW_TIME_START + seconds * FLOW_TIME_PER_SECOND;
}

export function flowBufferSize(
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
) {
  return {
    width: Math.max(1, Math.floor(canvasWidth * scale)),
    height: Math.max(1, Math.floor(canvasHeight * scale)),
  };
}

export type FlowDecision = "keep" | "resize" | "stop";

/** Trades buffer size for frame rate, then gives up on animating rather than slow the page. */
export function createFlowGovernor() {
  let elapsed = 0;
  let frames = 0;

  return {
    scale: FLOW_SCALE_START,
    frame(deltaMs: number): FlowDecision {
      if (deltaMs > IGNORED_GAP_MS) return "keep";
      elapsed += deltaMs;
      frames += 1;
      if (elapsed < GOVERNOR_WINDOW_MS) return "keep";

      const average = elapsed / frames;
      elapsed = 0;
      frames = 0;
      if (average <= SLOW_FRAME_MS) return "keep";
      if (this.scale <= FLOW_SCALE_MIN) return "stop";
      this.scale /= 2;
      return "resize";
    },
  };
}

export function isHeroFlowActive({
  loaderActive,
  sticky,
  scrollY,
  viewportHeight,
  top,
  bottom,
}: {
  loaderActive: boolean;
  sticky: boolean;
  scrollY: number;
  viewportHeight: number;
  top: number;
  bottom: number;
}): boolean {
  if (loaderActive) return false;
  if (sticky) return scrollY < viewportHeight * STICKY_COVERED_AT;
  return bottom > 0 && top < viewportHeight;
}

/** Reads the page for the pause rule. The sticky rule never needs the box, so it skips that layout read. */
export function isHeroOnScreen(hero: Element): boolean {
  const sticky = window.matchMedia(STICKY_HERO_QUERY).matches;
  const box = sticky ? { top: 0, bottom: 0 } : hero.getBoundingClientRect();
  return isHeroFlowActive({
    loaderActive: document.documentElement.classList.contains("page-loader-active"),
    sticky,
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    top: box.top,
    bottom: box.bottom,
  });
}

/** Cursor position as percentages of the headline box, kept on the headline. */
export function pointerToSheen(
  clientX: number,
  clientY: number,
  box: Box,
): Vec2 | null {
  if (box.width <= 0 || box.height <= 0) return null;
  const share = (value: number) => Math.max(0, Math.min(1, value)) * 100;
  return {
    x: share((clientX - box.left) / box.width),
    y: share((clientY - box.top) / box.height),
  };
}

/** Where the sheen rests when there is no cursor: a slow drift along the headline. */
export function sheenSway(seconds: number): Vec2 {
  return { x: 50 + SHEEN_SWAY_REACH * Math.sin(seconds * SHEEN_SWAY_SPEED), y: 50 };
}

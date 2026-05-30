import gsap from "gsap";

export function isMobileNameViewport() {
  return window.innerWidth <= 768;
}

export function getNameExitOffset() {
  return isMobileNameViewport() ? 35 : 55;
}

/** Footer position via Y offset — lukebaffait.fr placeIntroNameAtBottom */
export function placeNameAtFooter(nameContent: HTMLElement) {
  const vh = window.innerHeight;
  const bottomPad = isMobileNameViewport() ? Math.max(vh * 0.12, 80) : 80;
  const contentH = nameContent.offsetHeight;
  const targetBottom = vh - bottomPad;
  const offsetY = targetBottom - contentH / 2 - vh / 2;

  gsap.set(nameContent, {
    x: 0,
    y: offsetY,
    transformOrigin: "50% 50%",
    force3D: true,
  });

  return { introXvw: "0vw", introSettledY: offsetY };
}

export function syncNameLayerRevealMode(
  layer: HTMLElement | null,
  scrollProgress: number,
  revealStart: number,
) {
  if (!layer) return;
  layer.classList.toggle("hero-name-layer--reveal", scrollProgress >= revealStart - 0.001);
}

/** Scale delta reduced 4× from the original hero zoom (e.g. 1.48 → 1.12) */
function heroPhotoZoomScale(mobile: boolean) {
  const peak = mobile ? 1.3 : 1.48;
  return 1 + (peak - 1) / 4;
}

/** Portrait parallax + zoom targets while scrubbing the hero */
export function getHeroPhotoScrollMotion() {
  const vh = window.innerHeight;
  const mobile = isMobileNameViewport();

  return {
    /** Outer wrapper — slower drift downward as user scrolls down */
    outerY: mobile ? vh * 0.11 : vh * 0.15,
    /** Inner layer — faster downward drift + subtle zoom (parallax depth) */
    layerY: mobile ? vh * 0.07 : vh * 0.1,
    layerScale: heroPhotoZoomScale(mobile),
    layerX: mobile ? 0 : -vh * 0.008,
    dissolveBlur: mobile ? 6 : 12,
  };
}

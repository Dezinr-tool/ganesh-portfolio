/** Match value-scroll / footer mobile guards (≤900px). */
export const MOBILE_VIEWPORT_MQ = "(max-width: 56.25rem)";

export const COARSE_POINTER_MQ = "(pointer: coarse)";

export function isMobileViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_VIEWPORT_MQ).matches
  );
}

export function isCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(COARSE_POINTER_MQ).matches
  );
}

/** Touch phones + tablets: use native scroll, skip Lenis + heavy scroll FX. */
export function shouldUseNativeScroll(): boolean {
  return isCoarsePointer() || isMobileViewport();
}

export function getScrollY(): number {
  if (typeof window === "undefined") return 0;
  const lenis = (
    window as unknown as { __lenis?: { scroll?: number } }
  ).__lenis;
  return lenis?.scroll ?? window.scrollY;
}

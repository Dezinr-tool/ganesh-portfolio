import type Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export const LENIS_READY_EVENT = "lenis:ready";

export function setLenisInstance(instance: Lenis | null) {
  lenisInstance = instance;
  if (typeof window !== "undefined" && instance) {
    window.dispatchEvent(new CustomEvent(LENIS_READY_EVENT));
  }
}

export function getLenisInstance() {
  return lenisInstance;
}

type SmoothScrollOptions = {
  duration?: number;
  immediate?: boolean;
  lock?: boolean;
};

/** Scroll via Lenis when active, otherwise native smooth scroll */
export function smoothScrollTo(
  target: number | string | HTMLElement,
  options: SmoothScrollOptions = {},
) {
  const { duration = 1.2, immediate = false } = options;
  const lenis = lenisInstance;

  if (lenis) {
    lenis.scrollTo(target, { duration, immediate });
    return;
  }

  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
    return;
  }

  if (typeof target === "string") {
    document.querySelector(target)?.scrollIntoView({
      behavior: immediate ? "auto" : "smooth",
      block: "start",
    });
    return;
  }

  target.scrollIntoView({
    behavior: immediate ? "auto" : "smooth",
    block: "center",
  });
}

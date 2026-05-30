import { ScrollTrigger } from "gsap/ScrollTrigger";

let refreshScheduled = false;
let refreshCallbacks: Array<() => void> = [];

/** Batch layout-driven ScrollTrigger refreshes to avoid hero/reveal flicker */
export function scheduleScrollTriggerRefresh(afterRefresh?: () => void) {
  if (afterRefresh) refreshCallbacks.push(afterRefresh);
  if (refreshScheduled) return;
  refreshScheduled = true;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      refreshScheduled = false;
      const callbacks = refreshCallbacks;
      refreshCallbacks = [];
      callbacks.forEach((cb) => cb());
    });
  });
}

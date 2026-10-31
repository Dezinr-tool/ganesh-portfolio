import gsap from "gsap";
import { useEffect, type RefObject } from "react";
import {
  followPointer,
  isHeroOnScreen,
  pointerToSheen,
  sheenSway,
  type Vec2,
} from "./hero-mesh-motion";

/** Below this, a change in position (in percent) cannot be seen, so nothing is repainted. */
const SETTLED = 0.01;

/** Moves the headline's teal spot toward the cursor, or lets it drift when there is no mouse. */
export function useHeadlineSheen(headlineRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let seconds = 0;
    let cursor: Vec2 | null = null;
    const current = sheenSway(seconds);
    const painted: Vec2 = { x: Number.NaN, y: Number.NaN };

    const paint = () => {
      if (Math.abs(current.x - painted.x) < SETTLED && Math.abs(current.y - painted.y) < SETTLED) {
        return;
      }
      painted.x = current.x;
      painted.y = current.y;
      headline.style.setProperty("--sheen-x", `${current.x.toFixed(2)}%`);
      headline.style.setProperty("--sheen-y", `${current.y.toFixed(2)}%`);
    };

    const tick = (_time: number, deltaMs: number) => {
      if (!isHeroOnScreen(headline)) return;
      seconds += deltaMs / 1000;
      followPointer(current, cursor ?? sheenSway(seconds), gsap.ticker.deltaRatio(60));
      paint();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      cursor = pointerToSheen(event.clientX, event.clientY, headline.getBoundingClientRect()) ?? cursor;
    };

    paint();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      gsap.ticker.remove(tick);
    };
  }, [headlineRef]);
}

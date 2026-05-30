/** Frame-rate independent smoothing (matches GSAP ticker / Lenis cadence) */

export type Vec2 = { x: number; y: number };

/** Exponential decay toward target — stable at any FPS */
export function smoothToward(
  current: number,
  target: number,
  smoothTime: number,
  deltaRatio: number,
): number {
  if (smoothTime <= 0) return target;
  const t = 1 - Math.exp((-deltaRatio * 16.67) / (smoothTime * 1000));
  return current + (target - current) * t;
}

export function smoothTowardVec2(
  current: Vec2,
  target: Vec2,
  smoothTime: number,
  deltaRatio: number,
): void {
  current.x = smoothToward(current.x, target.x, smoothTime, deltaRatio);
  current.y = smoothToward(current.y, target.y, smoothTime, deltaRatio);
}

/** Auto orbit + pointer blend (Luke-style ambient + cursor) */
export function getAutoTargets(time: number, pointer: Vec2) {
  const orbitX = 0.5 + Math.sin(time * 0.5) * 0.11;
  const orbitY = 0.5 + Math.cos(time * 0.42) * 0.09;

  return {
    focus: {
      x: orbitX + (pointer.x - 0.5) * 0.36,
      y: orbitY + (pointer.y - 0.5) * 0.36,
    },
    drift: {
      x: Math.sin(time * 0.6) * 0.1 + Math.sin(time * 0.23) * 0.04,
      y: Math.cos(time * 0.55) * 0.08 + Math.cos(time * 0.19) * 0.035,
    },
  };
}

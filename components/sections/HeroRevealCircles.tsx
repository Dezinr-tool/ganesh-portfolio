"use client";

import type { RefObject } from "react";

const VIEWBOX = { width: 1000, height: 900 } as const;
const FULL_ROTATION = Math.PI * 2;
const CIRCLE_RADIUS = 115;

export const HERO_REVEAL_RING_OPACITY = { min: 0.34, max: 0.52 } as const;

export const HERO_REVEAL_CIRCLES = [
  { id: "top", cx: 500, cy: 393, r: CIRCLE_RADIUS, phase: 0 },
  { id: "left", cx: 420, cy: 518, r: CIRCLE_RADIUS, phase: Math.PI * 0.45 },
  { id: "right", cx: 580, cy: 518, r: CIRCLE_RADIUS, phase: Math.PI * 0.9 },
] as const;

/** Sync dot positions + ring visibility to scroll progress (p may exceed 1 during copy reveal) */
export function syncHeroRevealOrbit(svg: SVGSVGElement | null, progress: number) {
  if (!svg) return;
  const p = Math.max(0, progress);

  for (const { id, cx, cy, r, phase } of HERO_REVEAL_CIRCLES) {
    const dot = svg.querySelector<SVGCircleElement>(`[data-orbit-dot="${id}"]`);
    if (!dot) continue;
    const angle = p * FULL_ROTATION + phase;
    dot.setAttribute("cx", String(cx + r * Math.sin(angle)));
    dot.setAttribute("cy", String(cy - r * Math.cos(angle)));
  }

  const rings = svg.querySelectorAll<SVGCircleElement>("[data-orbit-ring]");
  const fadeT = Math.min(1, p);
  const ringOpacity =
    p <= 0
      ? 0
      : HERO_REVEAL_RING_OPACITY.min +
        (HERO_REVEAL_RING_OPACITY.max - HERO_REVEAL_RING_OPACITY.min) * fadeT;

  rings.forEach((ring) => ring.setAttribute("stroke-opacity", String(ringOpacity)));
}

type HeroRevealCirclesProps = {
  svgRef?: RefObject<SVGSVGElement | null>;
};

export function HeroRevealCircles({ svgRef }: HeroRevealCirclesProps) {
  return (
    <svg
      ref={svgRef}
      className="hero-reveal-circles__svg h-full w-full"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      {HERO_REVEAL_CIRCLES.map(({ id, cx, cy, r, phase }) => {
        const angle = phase;
        const dotX = cx + r * Math.sin(angle);
        const dotY = cy - r * Math.cos(angle);

        return (
          <g key={id}>
            <circle
              data-orbit-ring
              cx={cx}
              cy={cy}
              r={r}
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.25"
              strokeOpacity="0"
            />
            <circle
              data-orbit-dot={id}
              cx={dotX}
              cy={dotY}
              r={3}
              fill="#f0f0f0"
              fillOpacity="0.95"
            />
          </g>
        );
      })}
    </svg>
  );
}

"use client";

import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

const VIEWBOX = { width: 1000, height: 900 } as const;
const FULL_ROTATION = Math.PI * 2;

const CIRCLES = [
  { id: "about-circle-top", cx: 500, cy: 393, r: 145, phase: 0 },
  { id: "about-circle-left", cx: 420, cy: 518, r: 145, phase: Math.PI * 0.45 },
  { id: "about-circle-right", cx: 580, cy: 518, r: 145, phase: Math.PI * 0.9 },
] as const;

function OrbitDot({
  cx,
  cy,
  r,
  phase,
  progress,
}: {
  cx: number;
  cy: number;
  r: number;
  phase: number;
  progress: MotionValue<number>;
}) {
  const dotCx = useTransform(
    progress,
    (p) => cx + r * Math.sin(p * FULL_ROTATION + phase),
  );
  const dotCy = useTransform(
    progress,
    (p) => cy - r * Math.cos(p * FULL_ROTATION + phase),
  );

  return (
    <motion.circle
      r={4}
      fill="rgba(255, 255, 255, 0.85)"
      style={{ cx: dotCx, cy: dotCy }}
    />
  );
}

type AboutCircleBackgroundProps = {
  progress: MotionValue<number>;
};

export function AboutCircleBackground({ progress }: AboutCircleBackgroundProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {CIRCLES.map(({ id, cx, cy, r, phase }) => (
          <g key={id}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              stroke="rgba(255, 255, 255, 0.10)"
              strokeWidth="1"
            />
            {reducedMotion ? (
              <circle
                cx={cx}
                cy={cy - r}
                r={4}
                fill="rgba(255, 255, 255, 0.85)"
              />
            ) : (
              <OrbitDot
                cx={cx}
                cy={cy}
                r={r}
                phase={phase}
                progress={progress}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

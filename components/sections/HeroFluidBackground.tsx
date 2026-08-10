"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createHeroFluidSim } from "./hero-fluid-sim";

type HeroFluidBackgroundProps = {
  className?: string;
};

export function HeroFluidBackground({ className }: HeroFluidBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = () => {
      if (disposed || !containerRef.current) return;
      if (containerRef.current.clientWidth < 2 || containerRef.current.clientHeight < 2) {
        return;
      }

      const isMobile = window.innerWidth <= 768;

      try {
        cleanup = createHeroFluidSim(THREE, containerRef.current, {
          mouseForce: isMobile ? 16 : 20,
          cursorSize: isMobile ? 130 : 160,
          resolution: isMobile ? 0.4 : 0.5,
          iterationsPoisson: isMobile ? 8 : 10,
          dissipation: 0.985,
          mouseSmoothing: 0.09,
          bgColor: "#0a0a0a",
          displayMix: 3.6,
          colors: ["#e6320f", "#e6320f", "#ff2d00"],
        });
      } catch (error) {
        console.warn("[HeroFluidBackground] init failed:", error);
      }
    };

    const ro = new ResizeObserver(() => {
      if (!cleanup) start();
    });
    ro.observe(container);

    requestAnimationFrame(start);

    return () => {
      disposed = true;
      ro.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
    />
  );
}

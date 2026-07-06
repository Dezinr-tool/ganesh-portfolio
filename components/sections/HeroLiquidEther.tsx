"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __vmLiquidEtherLoaded?: boolean;
  }
}

function isHeroFluidActive(hero: HTMLElement): boolean {
  const stickyHero = window.matchMedia("(min-width: 768px)").matches;

  if (stickyHero) {
    // Sticky hero stays pinned; hide fluid once content scrolls over it.
    return window.scrollY < window.innerHeight * 0.92;
  }

  const rect = hero.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function syncHeroFluidVisibility() {
  const hero = document.getElementById("hero");
  const target = document.getElementById("liquid-ether-1");
  if (!hero || !target) return;

  const active = isHeroFluidActive(hero);
  target.dataset.fluidActive = active ? "true" : "false";
  target.style.visibility = active ? "visible" : "hidden";
}

export function HeroLiquidEther() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const target = document.getElementById("liquid-ether-1");
    if (!target) return;

    syncHeroFluidVisibility();
    const onScrollOrResize = () => syncHeroFluidVisibility();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    let cancelled = false;

    const loadScript = () => {
      if (cancelled) return;

      if (window.__vmLiquidEtherLoaded) {
        syncHeroFluidVisibility();
        return;
      }

      const script = document.createElement("script");
      script.src = "/vm-liquid-ether.js";
      script.async = true;
      script.onload = () => {
        window.__vmLiquidEtherLoaded = true;
        syncHeroFluidVisibility();
      };
      document.body.appendChild(script);
    };

    const timer = window.requestIdleCallback
      ? window.requestIdleCallback(loadScript, { timeout: 2000 })
      : window.setTimeout(loadScript, 300);

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (typeof timer === "number") {
        window.clearTimeout(timer);
      } else if (typeof timer === "object" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(timer);
      }
    };
  }, []);

  return null;
}

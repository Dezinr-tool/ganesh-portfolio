"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __vmLiquidEtherLoaded?: boolean;
  }
}

export function HeroLiquidEther() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (window.__vmLiquidEtherLoaded) {
      return;
    }

    if (!document.querySelector("#liquid-ether-1")) {
      return;
    }

    let cancelled = false;

    const loadScript = () => {
      if (cancelled) return;

      const script = document.createElement("script");
      script.src = "/vm-liquid-ether.js";
      script.async = true;
      script.onload = () => {
        window.__vmLiquidEtherLoaded = true;
      };
      document.body.appendChild(script);
    };

    const timer = window.requestIdleCallback
      ? window.requestIdleCallback(loadScript, { timeout: 2000 })
      : window.setTimeout(loadScript, 300);

    return () => {
      cancelled = true;
      if (typeof timer === "number") {
        window.clearTimeout(timer);
      } else if (typeof timer === "object" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(timer);
      }
    };
  }, []);

  return null;
}

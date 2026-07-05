"use client";

import { useEffect, useRef, useState } from "react";
import "./hero-motion.css";

/** Same Unicorn Studio scene as [lambda.ai](https://lambda.ai/) hero */
export const HERO_MOTION_URL =
  "https://lambda.ai/hubfs/web-static/motion/superintelligence-II-1.json";

const UNICORN_SDK =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js";

type UnicornScene = { destroy?: () => void };

declare global {
  interface Window {
    UnicornStudio?: {
      addScene: (opts: {
        elementId: string;
        filePath: string;
        scale?: number;
        dpi?: number;
        fps?: number;
        lazyLoad?: boolean;
        production?: boolean;
        altText?: string;
      }) => Promise<UnicornScene>;
    };
  }
}

function loadUnicornSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${UNICORN_SDK}"]`);
    if (existing?.getAttribute("data-loaded") === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unicorn SDK failed")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = UNICORN_SDK;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.setAttribute("data-loaded", "true");
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("Unicorn SDK failed")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

export function HeroMotionBackground({ idPrefix = "hero-motion" }: { idPrefix?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<UnicornScene | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    const elementId =
      mount.id || `${idPrefix}-${Math.random().toString(36).slice(2, 9)}`;
    mount.id = elementId;

    void (async () => {
      try {
        await loadUnicornSdk();
        if (cancelled || !window.UnicornStudio?.addScene) return;

        const scene = await window.UnicornStudio.addScene({
          elementId,
          filePath: HERO_MOTION_URL,
          scale: 1,
          dpi: 1.5,
          fps: 30,
          lazyLoad: true,
          production: true,
          altText: "Abstract motion background",
        });

        if (cancelled) {
          scene.destroy?.();
          return;
        }

        sceneRef.current = scene;
        window.setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 400);
      } catch (error) {
        console.error("[hero-motion-background]", error);
      }
    })();

    return () => {
      cancelled = true;
      sceneRef.current?.destroy?.();
      sceneRef.current = null;
    };
  }, [idPrefix]);

  return (
    <div className="hero-motion-bg" aria-hidden>
      <div
        ref={mountRef}
        className={`hero-motion-canvas ${ready ? "hero-motion-canvas--in" : ""}`}
      />
      <div className="hero-motion-vignette" />
      <div className="hero-motion-warm" />
    </div>
  );
}

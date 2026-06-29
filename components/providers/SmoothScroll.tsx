"use client";

import { setLenisInstance } from "@/lib/lenis-scroll";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import "lenis/dist/lenis.css";

function isHomepage(pathname: string) {
  return pathname === "/";
}

/** Wait until page loader is gone — no changes to PageLoader itself. */
function waitForLoaderExit(): Promise<void> {
  const done = () =>
    !document.documentElement.classList.contains("page-loader-active") &&
    !document.querySelector("[data-page-loader]");

  if (done()) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      if (!done()) return;
      observer.disconnect();
      clearInterval(poll);
      resolve();
    };

    const observer = new MutationObserver(finish);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const poll = window.setInterval(finish, 100);
  });
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  const homepage = isHomepage(pathname);

  useEffect(() => {
    if (reducedMotion || !homepage) {
      setLenisInstance(null);
      return;
    }

    let lenis: Lenis | null = null;
    let cancelled = false;

    const init = async () => {
      await waitForLoaderExit();
      if (cancelled) return;

      registerGsapPlugins();

      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

      lenis = new Lenis({
        lerp: isCoarsePointer ? 0.085 : 0.055,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: isCoarsePointer ? 1.65 : 1.2,
        syncTouch: isCoarsePointer,
        autoRaf: false,
      });

      setLenisInstance(lenis);
      (window as unknown as Record<string, unknown>).__lenis = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      const ticker = (time: number) => {
        lenis?.raf(time * 1000);
      };

      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.scrollerProxy(window, {
        scrollTop(value) {
          if (arguments.length && typeof value === "number") {
            lenis?.scrollTo(value, { immediate: true });
          }
          return lenis?.scroll ?? 0;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
      });

      const onRefresh = () => {
        lenis?.resize();
      };

      ScrollTrigger.addEventListener("refresh", onRefresh);

      requestAnimationFrame(() => {
        lenis?.resize();
        scheduleScrollTriggerRefresh();
      });

      cleanup = () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        gsap.ticker.remove(ticker);
        lenis?.destroy();
        delete (window as unknown as Record<string, unknown>).__lenis;
        setLenisInstance(null);
        ScrollTrigger.scrollerProxy(window, {});
        ScrollTrigger.clearScrollMemory();
      };
    };

    let cleanup: (() => void) | undefined;

    void init();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reducedMotion, homepage]);

  return children;
}

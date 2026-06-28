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

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  const isEaRoute = pathname.startsWith("/ea");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const disableSmoothScroll = isEaRoute || isDashboardRoute;

  useEffect(() => {
    if (reducedMotion || disableSmoothScroll) {
      setLenisInstance(null);
      return;
    }

    registerGsapPlugins();

    const lenis = new Lenis({
      lerp: 0.06,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      syncTouch: false, // Let iOS native scroll handle touch — syncTouch:true intercepts touch and causes GSAP ScrollTrigger to not fire on iOS Chrome
    });

    setLenisInstance(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    // GSAP ticker time is in seconds; Lenis.raf expects milliseconds (like requestAnimationFrame)
    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(window, {
      scrollTop(value) {
        if (arguments.length && typeof value === "number") {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
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
      lenis.resize();
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    requestAnimationFrame(() => {
      lenis.resize();
      scheduleScrollTriggerRefresh();
    });

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(ticker);
      lenis.destroy();
      setLenisInstance(null);
      ScrollTrigger.scrollerProxy(window, {});
      ScrollTrigger.clearScrollMemory();
    };
  }, [reducedMotion, disableSmoothScroll]);

  return children;
}

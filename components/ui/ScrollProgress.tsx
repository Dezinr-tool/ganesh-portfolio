"use client";

import { getLenisInstance, LENIS_READY_EVENT } from "@/lib/lenis-scroll";
import { getScrollY, shouldUseNativeScroll } from "@/lib/mobile-viewport";
import { useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ScrollProgress() {
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reducedMotion || pathname !== "/") return;

    let detach: (() => void) | undefined;

    const updateNative = () => {
      const limit =
        document.documentElement.scrollHeight - window.innerHeight;
      const scroll = getScrollY();
      setProgress(limit > 0 ? scroll / limit : 0);
    };

    const attach = () => {
      detach?.();
      detach = undefined;

      if (shouldUseNativeScroll()) {
        updateNative();
        const onScroll = () => updateNative();
        window.addEventListener("scroll", onScroll, { passive: true });
        detach = () => window.removeEventListener("scroll", onScroll);
        return;
      }

      const lenis = getLenisInstance();
      if (!lenis) return;

      const onScroll = () => {
        const limit = lenis.limit;
        setProgress(limit > 0 ? lenis.scroll / limit : 0);
      };

      onScroll();
      lenis.on("scroll", onScroll);
      detach = () => lenis.off("scroll", onScroll);
    };

    attach();
    window.addEventListener(LENIS_READY_EVENT, attach);

    return () => {
      window.removeEventListener(LENIS_READY_EVENT, attach);
      detach?.();
    };
  }, [reducedMotion, pathname]);

  if (reducedMotion || pathname !== "/") return null;

  return (
    <div
      className="scroll-progress"
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  );
}

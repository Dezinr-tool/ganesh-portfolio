"use client";

import { smoothScrollTo } from "@/lib/lenis-scroll";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useCallback, useState } from "react";

const SHOW_AFTER_PX = 720;

export function BackToTop() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > SHOW_AFTER_PX);
  });

  const scrollToTop = useCallback(() => {
    smoothScrollTo(0, {
      duration: reducedMotion ? 0 : 1.1,
      immediate: Boolean(reducedMotion),
    });
  }, [reducedMotion]);

  if (!visible) return null;

  return (
    <div className="back-to-top-wrap">
      <button
        type="button"
        className="back-to-top"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 12.5V3.5M8 3.5L4 7.5M8 3.5l4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

type WorksCarouselArrowsProps = {
  visible: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M11 4L6 9L11 14" : "M7 4L12 9L7 14"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WorksCarouselArrows({
  visible,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: WorksCarouselArrowsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      gsap.to(root, {
        autoAlpha: visible ? 1 : 0,
        duration: 0.28,
        ease: "power2.out",
        pointerEvents: visible ? "auto" : "none",
      });
    },
    { scope: rootRef, dependencies: [visible] },
  );

  return (
    <div
      ref={rootRef}
      className="works-gallery__carousel-arrows"
      aria-hidden={!visible}
    >
      <button
        type="button"
        className="works-gallery__carousel-arrow works-gallery__carousel-arrow--prev"
        aria-label="Previous project"
        disabled={!canGoPrev}
        onClick={onPrev}
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        className="works-gallery__carousel-arrow works-gallery__carousel-arrow--next"
        aria-label="Next project"
        disabled={!canGoNext}
        onClick={onNext}
      >
        <ArrowIcon direction="right" />
      </button>
    </div>
  );
}

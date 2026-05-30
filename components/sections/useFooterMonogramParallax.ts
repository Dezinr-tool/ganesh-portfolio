import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { RefObject } from "react";

type FooterMonogramParallaxOptions = {
  scopeRef: RefObject<HTMLElement | null>;
  monogramRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
};

export function useFooterMonogramParallax({
  scopeRef,
  monogramRef,
  reducedMotion,
}: FooterMonogramParallaxOptions) {
  useGSAP(
    () => {
      if (reducedMotion) return;

      const monogram = monogramRef.current;
      const scope = scopeRef.current;
      if (!monogram || !scope) return;

      const letters = gsap.utils.toArray<HTMLElement>(
        monogram.querySelectorAll("[data-footer-letter]"),
      );
      if (!letters.length) return;

      const mm = gsap.matchMedia();

      mm.add("(hover: hover) and (pointer: fine)", () => {
        const quickSets = letters.map((letter, index) => ({
          x: gsap.quickTo(letter, "x", {
            duration: 0.75 + index * 0.08,
            ease: "power3.out",
          }),
          y: gsap.quickTo(letter, "y", {
            duration: 0.75 + index * 0.08,
            ease: "power3.out",
          }),
        }));

        const strength = [0.18, 0.28];
        const reset = () => {
          quickSets.forEach(({ x, y }) => {
            x(0);
            y(0);
          });
          gsap.to(letters, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        const onMove = (event: MouseEvent) => {
          const rect = monogram.getBoundingClientRect();
          const offsetX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
          const offsetY = (event.clientY - (rect.top + rect.height / 2)) / rect.height;

          letters.forEach((letter, index) => {
            const power = strength[index] ?? strength[strength.length - 1];
            quickSets[index].x(offsetX * rect.width * power);
            quickSets[index].y(offsetY * rect.height * power * 0.65);
          });
        };

        const onEnter = () => {
          gsap.to(letters, {
            scale: 1.015,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.04,
            overwrite: "auto",
          });
        };

        scope.addEventListener("mousemove", onMove);
        scope.addEventListener("mouseleave", reset);
        monogram.addEventListener("mouseenter", onEnter);

        return () => {
          scope.removeEventListener("mousemove", onMove);
          scope.removeEventListener("mouseleave", reset);
          monogram.removeEventListener("mouseenter", onEnter);
          reset();
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [reducedMotion] },
  );
}

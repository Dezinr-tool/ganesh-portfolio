"use client";

import { machine } from "@/app/fonts";
import { placeNameAtFooter } from "@/components/sections/hero-name-placement";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export function HeroNameLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const layer = layerRef.current;
      const content = contentRef.current;
      const parts = layer?.querySelectorAll<HTMLElement>("[data-name-part]");

      if (!layer || !content) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduced) {
        placeNameAtFooter(content);
        gsap.set(layer, { opacity: 1 });
        gsap.set([content, ...(parts ?? [])], { clearProps: "all" });
        return;
      }

      gsap.set(layer, { opacity: 0 });
      gsap.set(content, { opacity: 0, y: 28, filter: "blur(10px)" });
      if (parts?.length) {
        gsap.set(parts, { opacity: 0, y: 20, filter: "blur(8px)" });
      }

      const tl = gsap.timeline({
        delay: 0.35,
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set(layer, { mixBlendMode: "difference" });
          placeNameAtFooter(content);
          layer.dataset.namePlaced = "true";
          window.dispatchEvent(new CustomEvent("hero-name-placed"));
        },
      });

      tl.to(layer, { opacity: 1, duration: 0.4 });
      tl.to(
        content,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
        },
        0,
      );
      if (parts?.length) {
        tl.to(
          parts,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
          },
          0.15,
        );
      }
    },
    { scope: layerRef },
  );

  return (
    <div
      ref={layerRef}
      id="name-layer"
      className="hero-name-layer"
      aria-hidden={false}
    >
      <h1 ref={contentRef} data-name-content className="hero-name-content">
        <span
          data-name-left
          className="hero-display-name__first"
        >
          <span
            className="hero-display-name__first-letter"
            data-name-part
          >
            G
          </span>
          <span data-name-part>anesh</span>
        </span>
        <span
          data-name-right
          className="hero-display-name__right"
        >
          <span
            className={`${machine.className} hero-display-name__accent`}
            data-name-part
          >
            Das
          </span>
          <span
            className={`${machine.className} hero-display-name__dot`}
            data-name-part
          >
            .
          </span>
        </span>
      </h1>
    </div>
  );
}

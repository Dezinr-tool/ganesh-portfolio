"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { HeroMeshBackground } from "@/components/sections/HeroMeshBackground";
import Image from "next/image";
import { useRef } from "react";

const blurSteps = [
  "hero-photo-blur-step-1",
  "hero-photo-blur-step-2",
  "hero-photo-blur-step-3",
] as const;

const portraitImageProps = {
  src: "/ganesh.avif",
  fill: true as const,
  sizes: "(max-width: 768px) 100vw, 900px",
  style: {
    objectFit: "contain" as const,
    objectPosition: "bottom center" as const,
  },
};

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const photo = photoRef.current;
      if (!photo) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduced) {
        gsap.set(photo, { clearProps: "all" });
        return;
      }

      gsap.set(photo, {
        opacity: 0,
        scale: 1.08,
        y: 12,
        transformOrigin: "center bottom",
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(photo, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="sticky top-0 z-0 relative h-dvh max-h-dvh min-h-0 w-full overflow-x-clip overflow-y-hidden bg-[#0a0a0a] text-[#f0f0f0] [--hero-shader-bg-x:55%] [--hero-shader-bg-y:36%] [--hero-merge:0]"
      aria-label="Introduction"
    >
      <HeroMeshBackground />

      <div
        aria-hidden="true"
        data-hero-edge-fade
        className="hero-edge-fade pointer-events-none absolute inset-x-0 bottom-0 z-[3]"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-end justify-center overflow-visible">
        <div className="w-full will-change-transform">
          <div
            ref={photoRef}
            data-hero-photo
            className="relative mx-auto h-[min(92dvh,1080px)] w-full max-w-[900px] overflow-visible will-change-transform max-md:h-[min(78dvh,640px)]"
          >
            <div
              data-hero-photo-layer
              className="hero-photo-parallax relative h-full w-full will-change-transform"
            >
              <div className="hero-photo-stack relative h-full w-full">
                <div className="relative h-full w-full">
                  <Image
                    {...portraitImageProps}
                    alt="Ganesh Das"
                    priority
                    fetchPriority="high"
                  />
                  {blurSteps.map((step) => (
                    <div
                      key={step}
                      aria-hidden="true"
                      className={`hero-photo-blur-step ${step} pointer-events-none absolute inset-0`}
                    >
                      <Image
                        {...portraitImageProps}
                        alt=""
                        loading="lazy"
                        fetchPriority="low"
                      />
                    </div>
                  ))}
                  <div
                    aria-hidden="true"
                    data-hero-photo-glass
                    className="hero-photo-glass pointer-events-none absolute inset-0"
                  />
                  <div
                    aria-hidden="true"
                    data-hero-photo-merge
                    className="hero-photo-merge pointer-events-none absolute inset-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

"use client";

import { mohave } from "@/app/fonts";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const portraitImageProps = {
  src: "/ganesh.avif",
  fill: true as const,
  sizes: "100vw",
  style: {
    objectFit: "contain" as const,
    objectPosition: "bottom center" as const,
  },
};

const blurSteps = [
  "hero-photo-blur-step-1",
  "hero-photo-blur-step-2",
  "hero-photo-blur-step-3",
] as const;

const SCROLL_SPRING = { stiffness: 100, damping: 30 } as const;

function GreenDot({ animated = false }: { animated?: boolean }) {
  if (animated) {
    return (
      <span
        className="relative inline-flex size-2 shrink-0 items-center justify-center overflow-visible"
        aria-hidden="true"
      >
        <span className="hero-status-dot-ring absolute inset-0 rounded-full" />
        <span className="hero-status-dot-core relative z-[1] size-full rounded-full" />
      </span>
    );
  }

  return (
    <span
      className="hero-status-dot-core size-1.5 shrink-0 rounded-full"
      aria-hidden="true"
    />
  );
}

const badgeLabelClass = "text-consultant-label leading-tight";

export type HeroContent = {
  headlineLines: string[];
  subtext: string;
  badgeLines: string[];
};

type HeroProps = {
  content: HeroContent;
};

export function Hero({ content }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const ganeshRef = useRef<HTMLSpanElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [foldHeight, setFoldHeight] = useState(900);

  useEffect(() => {
    const syncFoldHeight = () => setFoldHeight(window.innerHeight);
    syncFoldHeight();
    window.addEventListener("resize", syncFoldHeight);
    return () => window.removeEventListener("resize", syncFoldHeight);
  }, []);

  const ganeshScaleRaw = useTransform(scrollY, [0, 400], [1, 1.15]);
  const ganeshOpacityRaw = useTransform(scrollY, [0, 400], [1, 0]);
  const photoYRaw = useTransform(scrollY, [0, 600], [0, -150]);
  const photoScaleRaw = useTransform(scrollY, [0, 600], [1, 1.06]);
  /** Fade portrait out during the second fold (About section). */
  const photoOpacityRaw = useTransform(
    scrollY,
    [foldHeight, foldHeight * 2],
    [1, 0],
  );
  const bottomYRaw = useTransform(scrollY, [0, 350], [0, -60]);
  const bottomOpacityRaw = useTransform(scrollY, [0, 350], [1, 0]);

  const staticOne = useMotionValue(1);
  const staticZero = useMotionValue(0);
  const ganeshOpacityStatic = useMotionValue(1);

  const ganeshScale = useSpring(
    reducedMotion ? staticOne : ganeshScaleRaw,
    SCROLL_SPRING,
  );
  const ganeshOpacity = useSpring(
    reducedMotion ? ganeshOpacityStatic : ganeshOpacityRaw,
    SCROLL_SPRING,
  );
  const photoY = useSpring(reducedMotion ? staticZero : photoYRaw, SCROLL_SPRING);
  const photoScale = useSpring(
    reducedMotion ? staticOne : photoScaleRaw,
    SCROLL_SPRING,
  );
  const photoOpacity = useSpring(
    reducedMotion ? staticOne : photoOpacityRaw,
    SCROLL_SPRING,
  );
  const bottomY = useSpring(
    reducedMotion ? staticZero : bottomYRaw,
    SCROLL_SPRING,
  );
  const bottomOpacity = useSpring(
    reducedMotion ? staticOne : bottomOpacityRaw,
    SCROLL_SPRING,
  );

  useGSAP(
    () => {
      const ganesh = ganeshRef.current;
      const photo = photoRef.current;
      const badge = badgeRef.current;
      const subtext = subtextRef.current;

      if (!ganesh || !photo) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduced) {
        gsap.set([ganesh, photo, badge, subtext, headlineRef.current].filter(Boolean), {
          clearProps: "all",
        });
        return;
      }

      gsap.set(ganesh, { opacity: 0, scale: 0.97 });
      gsap.set(photo, {
        opacity: 0,
        scale: 1.08,
        y: 12,
        transformOrigin: "center bottom",
      });
      if (badge) gsap.set(badge, { opacity: 0, y: 18, filter: "blur(6px)" });
      if (subtext) gsap.set(subtext, { opacity: 0, y: 22, filter: "blur(8px)" });
      if (headlineRef.current) {
        gsap.set(headlineRef.current, { opacity: 1, y: 0, clearProps: "filter" });
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(ganesh, {
        opacity: 0.1,
        scale: 1,
        duration: 0.85,
        ease: "power2.out",
      }).to(
        photo,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
        },
        0.45,
      );

      if (badge) {
        tl.to(
          badge,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.6,
            ease: "power2.out",
          },
          0.85,
        );
      }

      if (subtext) {
        tl.to(
          subtext,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.55,
            ease: "power2.out",
          },
          1.0,
        );
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="sticky top-0 z-0 relative h-dvh min-h-[700px] w-full overflow-x-clip overflow-y-hidden bg-background text-foreground"
      aria-label="Introduction"
    >
      {/* GANESH watermark — behind portrait torso/chest */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="w-full will-change-transform">
          <motion.div style={{ scale: ganeshScale, opacity: ganeshOpacity }}>
          <span
            ref={ganeshRef}
            className={`${mohave.className} hero-ganesh-watermark block w-full whitespace-nowrap text-center font-bold leading-[0.82] text-[var(--color-text)] will-change-transform`}
            style={{
              fontSize: "clamp(16rem, 38vw, 34rem)",
              letterSpacing: "0.02em",
            }}
          >
            GANESH
          </span>
          </motion.div>
        </div>
      </div>

      {/* Portrait — bottom-aligned, full-bleed width */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-end justify-center overflow-visible">
        <div className="w-full will-change-transform">
          <motion.div
            style={{
              y: photoY,
              scale: photoScale,
              opacity: photoOpacity,
              transformOrigin: "center bottom",
            }}
          >
          <div
            ref={photoRef}
            className="relative h-[min(94vh,1080px)] min-h-[86vh] w-full overflow-visible will-change-transform"
          >
            {/* Badges beside head — positioned relative to portrait frame */}
            <header
              ref={badgeRef}
              className="pointer-events-auto absolute top-[13%] left-[51%] z-[3] sm:top-[12%] sm:left-[54%] md:top-[11%] md:left-[57%] lg:top-[10%] lg:left-[61%]"
            >
              <div className="flex flex-col items-start gap-1">
                {content.badgeLines.map((line, index) => (
                  <p key={`${line}-${index}`} className={badgeLabelClass}>
                    {index === 0 ? (
                      <GreenDot animated />
                    ) : (
                      <span className="size-2 shrink-0" aria-hidden="true" />
                    )}
                    <span className={index === 0 ? "uppercase" : "font-semibold uppercase"}>
                      {line}
                    </span>
                  </p>
                ))}
              </div>
            </header>

            <div className="hero-photo-stack relative h-full w-full overflow-hidden">
              <div className="relative h-full w-full">
                <Image {...portraitImageProps} alt="Ganesh Das" priority />
                {blurSteps.map((step) => (
                  <div
                    key={step}
                    aria-hidden="true"
                    className={`hero-photo-blur-step ${step} pointer-events-none absolute inset-0`}
                  >
                    <Image {...portraitImageProps} alt="" />
                  </div>
                ))}
                <div
                  aria-hidden="true"
                  className="hero-photo-glass pointer-events-none absolute inset-0"
                />
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      </div>

      {/* Headline — bottom left, visible on load */}
      <div
        ref={bottomRef}
        className="pointer-events-none absolute bottom-0 left-0 z-[2] max-w-[min(100%,42rem)] px-8 pb-10 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14"
      >
        <motion.div style={{ y: bottomY, opacity: bottomOpacity }}>
          <h1
            ref={headlineRef}
            data-hero-headline
            className="text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.04] font-medium tracking-[-0.02em] text-foreground"
          >
            {content.headlineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
        </motion.div>
      </div>

      {/* Subtext — bottom right, separate from headline */}
      <div className="pointer-events-none absolute right-0 bottom-0 z-[2] max-w-[min(100%,22rem)] px-8 pb-10 text-right sm:max-w-[24rem] sm:px-10 sm:pb-12 lg:max-w-[26rem] lg:px-14 lg:pb-14">
        <motion.div style={{ y: bottomY, opacity: bottomOpacity }}>
          <p
            ref={subtextRef}
            data-hero-reveal
            className="text-[15px] leading-[1.48] font-normal text-foreground lg:text-[16px] lg:leading-[1.5]"
          >
            {content.subtext}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

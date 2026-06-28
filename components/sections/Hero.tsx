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
  className: "hero-portrait-img",
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

      if (!photo) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduced) {
        gsap.set([ganesh, photo, badge, subtext, headlineRef.current].filter(Boolean), {
          clearProps: "all",
        });
        return;
      }

      if (ganesh) gsap.set(ganesh, { opacity: 0, scale: 0.97 });
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

      if (ganesh) {
        tl.to(ganesh, {
          opacity: 0.1,
          scale: 1,
          duration: 0.85,
          ease: "power2.out",
        });
      }

      tl.to(
        photo,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
        },
        ganesh ? 0.45 : 0,
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
      className="sticky top-0 z-0 relative h-dvh min-h-svh w-full overflow-x-clip overflow-y-hidden bg-[var(--color-bg)] text-[var(--color-text)] md:min-h-[700px]"
      aria-label="Introduction"
    >
      {/* GANESH watermark — hidden on mobile where it renders poorly, visible sm+ */}
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden sm:flex items-center justify-center overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="w-full will-change-transform">
          <motion.div style={{ scale: ganeshScale, opacity: ganeshOpacity }}>
            <span
              ref={ganeshRef}
              className={`${mohave.className} hero-ganesh-watermark block w-full whitespace-nowrap text-center font-bold leading-[0.82] text-[var(--color-text)] will-change-transform`}
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
            className="relative h-[min(82vh,640px)] min-h-[70vh] w-full overflow-visible will-change-transform md:h-[min(94vh,1080px)] md:min-h-[86vh]"
          >
            {/* Badges — hidden on mobile (shown above H1 instead), beside head on sm+ */}
            <header
              ref={badgeRef}
              className="pointer-events-auto hidden sm:absolute sm:top-[12%] sm:right-auto sm:left-[54%] sm:z-[3] sm:block sm:text-left sm:max-w-none md:top-[11%] md:left-[57%] lg:top-[10%] lg:left-[61%]"
            >
              <div className="flex flex-col items-end gap-1 sm:items-start sm:text-left">
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

      {/* Bottom section — mobile: stacked (badge → h1 → subtext). sm+: row layout */}
      <div
        ref={bottomRef}
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] px-5 pb-6 sm:flex sm:items-start sm:justify-between sm:px-10 sm:pb-12 lg:px-14 lg:pb-14"
      >
        <motion.div style={{ y: bottomY, opacity: bottomOpacity }}>
          {/* Badge — mobile only, above H1 */}
          <div className="mb-2 flex flex-col items-start gap-1 sm:hidden">
            {content.badgeLines.map((line, index) => (
              <p key={`mob-${line}-${index}`} className={badgeLabelClass}>
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
          <h1
            ref={headlineRef}
            data-hero-headline
            className="text-[clamp(28px,6vw,56px)] leading-[1.08] font-medium tracking-[-0.02em] text-[var(--color-text)] pr-14 sm:pr-0 md:text-[clamp(2rem,4vw,3.5rem)]"
          >
            {content.headlineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {/* Subtext — mobile only, below H1 */}
          <p className="mt-2 pr-14 text-[max(13px,0.8125rem)] leading-[1.48] font-normal text-[var(--color-text)] sm:hidden">
            {content.subtext}
          </p>
        </motion.div>

        {/* Subtext — desktop only, right side */}
        {/* @ts-expect-error framer-motion className type mismatch */}
        <motion.div style={{ y: bottomY, opacity: bottomOpacity }} className={"hidden sm:block max-w-[22rem] sm:max-w-[24rem] lg:max-w-[26rem] text-right shrink-0"}>
          <p
            ref={subtextRef}
            data-hero-reveal
            className="text-[max(16px,1rem)] leading-[1.48] font-normal text-[var(--color-text)] md:text-[15px] lg:text-[16px] lg:leading-[1.5]"
          >
            {content.subtext}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

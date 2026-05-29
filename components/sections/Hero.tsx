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
import { GlassButton } from "@/components/ui/GlassButton";
import Image from "next/image";
import { useRef } from "react";

const SCROLL_SPRING = { stiffness: 100, damping: 30 } as const;

function GreenDot({ animated = false }: { animated?: boolean }) {
  if (animated) {
    return (
      <span
        className="relative inline-flex size-2 shrink-0 items-center justify-center overflow-visible"
        aria-hidden="true"
      >
        <span className="hero-status-dot-ring absolute inset-0 rounded-full" />
        <span className="relative z-[1] size-full rounded-full bg-success" />
      </span>
    );
  }

  return (
    <span
      className="size-1.5 shrink-0 rounded-full bg-success"
      aria-hidden="true"
    />
  );
}

const badgeLabelClass = "text-consultant-label leading-tight";

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

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const ganeshRef = useRef<HTMLSpanElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const ganeshScaleRaw = useTransform(scrollY, [0, 400], [1, 1.15]);
  const ganeshOpacityRaw = useTransform(scrollY, [0, 400], [1, 0]);
  const photoYRaw = useTransform(scrollY, [0, 600], [0, -150]);
  const photoScaleRaw = useTransform(scrollY, [0, 600], [1, 1.06]);
  const bottomLeftYRaw = useTransform(scrollY, [0, 350], [0, -60]);
  const bottomLeftOpacityRaw = useTransform(scrollY, [0, 350], [1, 0]);
  const bottomRightYRaw = useTransform(scrollY, [100, 400], [0, -40]);
  const bottomRightOpacityRaw = useTransform(scrollY, [100, 400], [1, 0]);

  const staticOne = useMotionValue(1);
  const staticZero = useMotionValue(0);

  const ganeshScale = useSpring(
    reducedMotion ? staticOne : ganeshScaleRaw,
    SCROLL_SPRING,
  );
  const ganeshOpacity = useSpring(
    reducedMotion ? staticOne : ganeshOpacityRaw,
    SCROLL_SPRING,
  );
  const photoY = useSpring(reducedMotion ? staticZero : photoYRaw, SCROLL_SPRING);
  const photoScale = useSpring(
    reducedMotion ? staticOne : photoScaleRaw,
    SCROLL_SPRING,
  );
  const bottomLeftY = useSpring(
    reducedMotion ? staticZero : bottomLeftYRaw,
    SCROLL_SPRING,
  );
  const bottomLeftOpacity = useSpring(
    reducedMotion ? staticOne : bottomLeftOpacityRaw,
    SCROLL_SPRING,
  );
  const bottomRightY = useSpring(
    reducedMotion ? staticZero : bottomRightYRaw,
    SCROLL_SPRING,
  );
  const bottomRightOpacity = useSpring(
    reducedMotion ? staticOne : bottomRightOpacityRaw,
    SCROLL_SPRING,
  );

  useGSAP(
    () => {
      const ganesh = ganeshRef.current;
      const photo = photoRef.current;
      const badge = badgeRef.current;
      const bottomItems = bottomRef.current?.querySelectorAll<HTMLElement>(
        "[data-hero-reveal]",
      );

      if (!ganesh || !photo) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduced) {
        gsap.set([ganesh, photo, badge, ...(bottomItems ?? [])], {
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
      if (bottomItems?.length) {
        gsap.set(bottomItems, { opacity: 0, y: 22, filter: "blur(8px)" });
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(ganesh, {
        opacity: 1,
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

      if (bottomItems?.length) {
        tl.to(
          bottomItems,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.55,
            stagger: 0.12,
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
            className={`${mohave.className} block w-full whitespace-nowrap text-center leading-[0.82] text-[#E8D9CF] will-change-transform`}
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
                <p className={badgeLabelClass}>
                  <GreenDot animated />
                  <span className="uppercase">Design Manager</span>
                </p>
                <p className={badgeLabelClass}>
                  <span className="size-2 shrink-0" aria-hidden="true" />
                  <span className="font-semibold uppercase">@BRUCIRA</span>
                </p>
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

      {/* Bottom copy */}
      <div
        ref={bottomRef}
        className="absolute inset-x-0 bottom-0 z-[2] px-8 pb-10 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14"
      >
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-16">
          <div className="max-w-[min(100%,640px)] shrink-0 will-change-transform">
            <motion.div style={{ y: bottomLeftY, opacity: bottomLeftOpacity }}>
            <p
              data-hero-reveal
              className="text-consultant-label mb-4 sm:mb-5"
            >
              <GreenDot />
              <span className="uppercase">Consultant</span>
            </p>
            <h1
              data-hero-reveal
              className="text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.04] font-medium tracking-[-0.02em] text-foreground"
            >
              Design &amp; Strategy
              <br />
              Partner for Startups
            </h1>
            </motion.div>
          </div>

          <div className="w-full max-w-[280px] shrink-0 will-change-transform md:w-[26%] md:min-w-[240px] md:max-w-[300px]">
            <motion.div style={{ y: bottomRightY, opacity: bottomRightOpacity }}>
            <p
              data-hero-reveal
              className="mb-5 text-[15px] leading-[1.48] font-normal text-foreground lg:text-[16px] lg:leading-[1.5]"
            >
              I help founders build products people love — from zero to launch
              and beyond. D2C, B2B &amp; B2B2C specialist with 14+ years across
              funded Indian startups.
            </p>
            <div data-hero-reveal className="flex justify-end">
              <GlassButton href="#calendar" variant="glass">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <rect
                    x="2"
                    y="3.5"
                    width="12"
                    height="10.5"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                  <path
                    d="M2 6.5h12M5.25 2v2M10.75 2v2"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </svg>
                Block my calendar
              </GlassButton>
            </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

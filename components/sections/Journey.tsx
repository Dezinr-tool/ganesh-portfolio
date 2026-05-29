"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { cssVar } from "@/lib/tokens";
import { useRef, type RefObject } from "react";

const COLUMN_COUNT = 6;
const STAGGER_DELAYS = [0, 0.08, 0.16, 0.24, 0.32, 0.4];
const PANEL_DURATION = 0.6;
const PANEL_EASE = [0.76, 0, 0.24, 1] as const;
const CONTENT_DELAY =
  STAGGER_DELAYS[COLUMN_COUNT - 1] + PANEL_DURATION + 0.5;

const SKILLS = [
  {
    icon: "🧠",
    title: "Product Thinking",
    description: "From user research to roadmaps",
  },
  {
    icon: "🎨",
    title: "UI/UX Design",
    description: "Interfaces that feel effortless",
  },
  {
    icon: "📊",
    title: "Product Strategy",
    description: "D2C, B2B & B2B2C expertise",
  },
  {
    icon: "✦",
    title: "Branding & Identity",
    description: "Visual systems that last",
  },
  {
    icon: "🎬",
    title: "Motion Design",
    description: "Micro-interactions & After Effects",
  },
  {
    icon: "📑",
    title: "Investor Decks",
    description: "Pitch decks that raise money",
  },
] as const;

export function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef as RefObject<HTMLElement>, {
    once: true,
    amount: 0.3,
  });
  const reducedMotion = useReducedMotion() ?? false;

  const panelsAnimate = isInView && !reducedMotion;

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="relative isolate z-20 min-h-screen overflow-hidden bg-background text-white"
      aria-label="My journey"
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden="true"
      >
        {STAGGER_DELAYS.map((delay, index) => (
          <motion.div
            key={index}
            style={{
              position: "absolute",
              bottom: 0,
              backgroundColor: cssVar.colorBgDark,
              left: `${(index / COLUMN_COUNT) * 100}%`,
              width: `${100 / COLUMN_COUNT}%`,
            }}
            initial={{ height: reducedMotion ? "100%" : "0%" }}
            animate={{
              height: panelsAnimate || reducedMotion ? "100%" : "0%",
            }}
            transition={{
              duration: PANEL_DURATION,
              ease: PANEL_EASE,
              delay: panelsAnimate ? delay : 0,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-24 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0 }}
          animate={{ opacity: reducedMotion || isInView ? 1 : 0 }}
          transition={{
            duration: 0.6,
            ease: PANEL_EASE,
            delay: reducedMotion ? 0 : isInView ? CONTENT_DELAY : 0,
          }}
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p className="text-section-label-on-dark mt-0 text-center">
            What I Bring
          </p>

          <h2 className="text-section-heading-inverse mt-4 text-center">
            Skills that drive results
          </h2>

          <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {SKILLS.map((skill, index) => (
              <motion.div
                key={skill.title}
                initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 16 }}
                animate={{
                  opacity: reducedMotion || isInView ? 1 : 0,
                  y: reducedMotion || isInView ? 0 : 16,
                }}
                transition={{
                  duration: 0.5,
                  ease: PANEL_EASE,
                  delay: reducedMotion
                    ? 0
                    : isInView
                      ? CONTENT_DELAY + 0.15 + index * 0.08
                      : 0,
                }}
              >
                <div className="rounded-lg border border-[var(--color-bg-card-dark-hover)] bg-[var(--color-bg-card-dark)] p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent">
                  <p className="text-lg font-medium text-white">
                    <span aria-hidden="true">{skill.icon} </span>
                    {skill.title}
                  </p>
                  <p className="mt-2 text-[15px] leading-[1.5] text-[var(--color-text-subtle)]">
                    {skill.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

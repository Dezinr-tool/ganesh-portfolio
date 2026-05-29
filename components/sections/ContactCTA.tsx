"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { useRef, type RefObject } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

const HEADING_WORDS = [
  "Let's",
  "build",
  "something",
  "remarkable",
  "together",
] as const;

/** Pulsing green availability dot — reuses Hero pulse CSS */
function GreenDot() {
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

function AnimatedHeading({
  isInView,
  reducedMotion,
}: {
  isInView: boolean;
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return (
      <h2
        className="text-white"
        style={{
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          fontWeight: 800,
          lineHeight: 1.1,
        }}
      >
        Let&apos;s build something remarkable together
      </h2>
    );
  }

  return (
    <h2
      className="text-white"
      style={{
        fontSize: "clamp(2.5rem, 5vw, 4rem)",
        fontWeight: 800,
        lineHeight: 1.1,
      }}
    >
      {HEADING_WORDS.map((word, index) => (
        <span key={word} className="mr-[0.25em] inline-block last:mr-0">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: isInView ? 1 : 0,
              y: isInView ? 0 : 12,
            }}
            transition={{
              duration: 0.45,
              ease: EASE,
              delay: isInView ? 0.08 + index * 0.07 : 0,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

export function ContactCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef as RefObject<HTMLElement>, {
    once: true,
    amount: 0.35,
  });
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="section-padding-contact relative z-10 bg-bg-dark text-white"
      aria-label="Contact"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:items-center md:justify-between md:gap-16">
        {/* Left — copy */}
        <div className="max-w-xl text-center md:text-left">
          <motion.div
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: reducedMotion || isInView ? 1 : 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ display: "flex" }}
          >
            <p className="text-section-label-on-dark flex items-center justify-center gap-2 md:justify-start">
              <GreenDot />
              Available for Projects
            </p>
          </motion.div>

          <div className="mt-6">
            <AnimatedHeading isInView={isInView} reducedMotion={reducedMotion} />
          </div>

          <motion.div
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
            animate={{
              opacity: reducedMotion || isInView ? 1 : 0,
              y: reducedMotion || isInView ? 0 : 12,
            }}
            transition={{ duration: 0.5, ease: EASE, delay: reducedMotion ? 0 : 0.4 }}
          >
            <p className="mt-5 text-[16px] leading-[1.6] text-text-muted">
              Open to consulting, design leadership, and product strategy engagements.
              Let&apos;s talk about your next big idea.
            </p>
          </motion.div>
        </div>

        {/* Right — action buttons */}
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 24 }}
          animate={{
            opacity: reducedMotion || isInView ? 1 : 0,
            y: reducedMotion || isInView ? 0 : 24,
          }}
          transition={{
            duration: 0.55,
            ease: EASE,
            delay: reducedMotion ? 0 : isInView ? 0.35 : 0,
          }}
          style={{ width: "100%" }}
        >
          <div className="flex w-full shrink-0 flex-col items-center gap-4 sm:flex-row sm:justify-center md:w-auto md:flex-col md:items-stretch">
          <GlassButton href="mailto:hello@designbyganesh.com" variant="primary">
            Get in Touch →
          </GlassButton>
          <GlassButton href="/cv.pdf" variant="outline-light" download>
            Download CV
          </GlassButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

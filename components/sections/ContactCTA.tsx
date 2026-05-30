"use client";

import { useGSAP } from "@gsap/react";
import {
  animateRevealOnScroll,
  registerGsapPlugins,
  SCROLL_START,
  setRevealVisible,
} from "@/lib/gsap-scroll";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { useRef } from "react";

const HEADING_WORDS = [
  "Let's",
  "build",
  "something",
  "remarkable",
  "together",
] as const;

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

export function ContactCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const label = labelRef.current;
      const heading = headingRef.current;
      const body = bodyRef.current;
      const actions = actionsRef.current;
      const words = heading?.querySelectorAll("[data-heading-word]");

      if (!section) return;

      if (label) {
        animateRevealOnScroll(label, {
          trigger: section,
          y: 24,
          reducedMotion,
        });
      }

      if (words?.length) {
        if (reducedMotion) {
          setRevealVisible(words);
        } else {
          registerGsapPlugins();
          gsap.set(words, { opacity: 0, y: 24 });
          gsap.to(words, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: section,
              start: SCROLL_START,
              once: true,
            },
          });
        }
      }

      if (body) {
        animateRevealOnScroll(body, {
          trigger: section,
          y: 24,
          delay: 0.15,
          reducedMotion,
        });
      }

      if (actions) {
        animateRevealOnScroll(actions, {
          trigger: section,
          y: 32,
          delay: 0.25,
          reducedMotion,
        });
      }
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="section-padding-contact relative z-10 bg-bg-dark text-white"
      aria-label="Contact"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:items-center md:justify-between md:gap-16">
        <div className="max-w-xl text-center md:text-left">
          <div ref={labelRef}>
            <p className="text-section-label-on-dark flex items-center justify-center gap-2 md:justify-start">
              <GreenDot />
              Available for Projects
            </p>
          </div>

          <div className="mt-6">
            <h2
              ref={headingRef}
              className="text-white"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              {HEADING_WORDS.map((word) => (
                <span
                  key={word}
                  data-heading-word
                  className="mr-[0.25em] inline-block last:mr-0"
                >
                  {word}
                </span>
              ))}
            </h2>
          </div>

          <p
            ref={bodyRef}
            className="mt-5 text-[16px] leading-[1.6] text-text-muted"
          >
            Open to consulting, design leadership, and product strategy engagements.
            Let&apos;s talk about your next big idea.
          </p>
        </div>

        <div ref={actionsRef} className="w-full">
          <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:justify-center md:w-auto md:flex-col">
            <GlassButton
              href="mailto:hello@designbyganesh.com"
              variant="dark"
              className="w-full justify-center sm:w-auto"
            >
              Get in Touch →
            </GlassButton>
            <GlassButton
              href="/cv.pdf"
              variant="dark"
              download
              className="w-full justify-center sm:w-auto"
            >
              Download CV
            </GlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import { animateCardsOnScroll } from "@/lib/gsap-scroll";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";

const FEATURED_TESTIMONIAL = {
  quote:
    "Ganesh's design expertise goes beyond aesthetics—he crafts experiences that truly connect with users. A great collaborator and a problem-solver at heart.",
  name: "Arjun Kapoor",
  role: "Founder at Think9",
  initials: "AK",
} as const;

const AWARD = {
  title: "Awwwards Nominee",
  description:
    "Recognized for excellence in web design and innovative digital experiences.",
} as const;

function MedalIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="14" cy="11" r="6" stroke="#EAB308" strokeWidth="1.5" />
      <path
        d="M10.5 16.5 8 24l6-3.5L14 24l6-3.5L17.5 16.5"
        stroke="#EAB308"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckBadge() {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]"
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M3.5 7.25 5.75 9.5 10.5 4.75"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function AwardPreviewMock() {
  return (
    <div
      className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      aria-hidden="true"
    >
      <div className="relative aspect-[16/10] bg-[#1a1a1a] p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d3a2e] to-[#0f1410]" />
        <div className="relative flex h-full items-end gap-3">
          <div className="h-full w-[38%] rounded-lg bg-gradient-to-t from-black/30 to-white/10" />
          <div className="flex flex-1 flex-col justify-end gap-2 pb-1">
            <p className="text-[11px] font-semibold leading-tight text-white">
              Your trusted partner for extraordinary events
            </p>
            <div className="h-2 w-16 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
      <div className="h-10 bg-white" />
    </div>
  );
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const cards = cardsRef.current?.children;

      if (!section || !cards?.length) return;

      animateCardsOnScroll(cards, section, reducedMotion, 0.15);
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="section-padding relative z-10 bg-background text-foreground"
      aria-label="Testimonials and awards"
    >
      <div className="mx-auto max-w-[1400px]">
        <ul
          ref={cardsRef}
          className="grid grid-cols-1 items-stretch gap-5 md:gap-6 lg:grid-cols-3 lg:gap-7"
          style={{ margin: 0, padding: 0 }}
        >
          <li style={{ height: "100%", listStyle: "none" }}>
            <article className="flex h-full min-h-[380px] flex-col rounded-[1.75rem] bg-[#f5f5f5] p-8 md:p-10">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-tight text-foreground">w.</span>
                <MedalIcon />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-[-0.02em] text-foreground md:text-[1.35rem]">
                {AWARD.title}
              </h3>
              <p className="mt-3 max-w-[28ch] text-[15px] leading-relaxed text-[#666666]">
                {AWARD.description}
              </p>
              <AwardPreviewMock />
            </article>
          </li>

          <li style={{ height: "100%", listStyle: "none" }}>
            <article className="relative flex h-full min-h-[400px] flex-col rounded-[1.75rem] bg-[#111111] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:min-h-[420px] md:p-10 lg:min-h-[440px] lg:scale-[1.03] lg:shadow-[0_28px_70px_rgba(0,0,0,0.22)]">
              <span
                className="pointer-events-none select-none font-serif leading-none text-[#2a2a2a]"
                style={{ fontSize: "clamp(4rem, 8vw, 5.5rem)" }}
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <blockquote className="relative z-10 mt-2 flex-1 text-[clamp(1rem,1.6vw,1.125rem)] leading-[1.65] text-white">
                {FEATURED_TESTIMONIAL.quote}
              </blockquote>
              <footer className="relative z-10 mt-8 flex items-center gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {FEATURED_TESTIMONIAL.initials}
                </div>
                <div>
                  <p className="font-semibold text-white">{FEATURED_TESTIMONIAL.name}</p>
                  <p className="text-sm text-[#999999]">{FEATURED_TESTIMONIAL.role}</p>
                </div>
              </footer>
            </article>
          </li>

          <li style={{ height: "100%", listStyle: "none" }}>
            <article className="flex h-full min-h-[380px] items-center justify-center rounded-[1.75rem] bg-[#f5f5f5] p-8 md:p-10">
              <div className="relative w-full max-w-[280px]">
                <div
                  className="absolute left-1/2 top-[55%] h-14 w-[88%] -translate-x-1/2 rounded-full bg-white/50 shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
                  aria-hidden="true"
                />
                <div
                  className="absolute left-1/2 top-[48%] h-14 w-[92%] -translate-x-1/2 rounded-full bg-white/75 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  aria-hidden="true"
                />
                <div className="relative flex items-center justify-between gap-4 rounded-full bg-white px-6 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
                  <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground md:text-base">
                    20+ projects completed
                  </p>
                  <CheckBadge />
                </div>
              </div>
            </article>
          </li>
        </ul>
      </div>
    </section>
  );
}

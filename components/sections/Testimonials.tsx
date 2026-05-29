"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState, type RefObject } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

const TESTIMONIALS = [
  {
    quote:
      "Ganesh has a rare ability to translate complex business problems into clear, actionable product experiences. His strategic thinking and design craft were instrumental in shaping our D2C startup from the ground up.",
    name: "Startup Founder",
    role: "Founder, D2C Startup",
    company: "Think9 Ventures",
    initials: "T9",
  },
  {
    quote:
      "Working with Ganesh was a game-changer for our product team. He brought structure to chaotic flows, elevated our design standards, and consistently delivered solutions that moved key metrics.",
    name: "Product Leadership",
    role: "Senior Product Manager",
    company: "Testbook",
    initials: "TB",
  },
  {
    quote:
      "Ganesh elevated our product experience across every touchpoint. His eye for detail, user empathy, and ability to align cross-functional teams made him an invaluable partner in building at scale.",
    name: "Co-founder",
    role: "Co-founder",
    company: "Paisabazaar",
    initials: "PB",
  },
] as const;

const LINKEDIN_RECOMMENDATIONS = [
  {
    name: "Rahul Sharma",
    title: "Senior PM, Testbook",
    relationship: "Managed Ganesh directly",
    text: "Ganesh is one of the most thoughtful designers I've worked with. He consistently brought clarity to ambiguous product problems, ran effective design critiques, and helped the team ship faster without compromising quality. His ability to connect user research insights to business outcomes made a measurable difference on our core learning flows.",
  },
  {
    name: "Priya Mehta",
    title: "Head of Design, Paisabazaar",
    relationship: "Worked on the same team",
    text: "Ganesh raised the bar for design execution across our fintech products. He built scalable patterns, improved handoff quality, and collaborated seamlessly with engineering and product. His work on loan comparison and onboarding flows directly improved conversion and reduced support tickets.",
  },
  {
    name: "Arjun Kapoor",
    title: "Founder, Think9",
    relationship: "Ganesh reported to me",
    text: "Ganesh combines product thinking with exceptional design craft. From early-stage positioning to feature prioritization, he helped us navigate critical decisions with confidence. He is proactive, detail-oriented, and someone I'd trust to lead design on any high-stakes product initiative.",
  },
] as const;

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TestimonialCard({
  testimonial,
  index,
  isInView,
  reducedMotion,
  className,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  index: number;
  isInView: boolean;
  reducedMotion: boolean;
  className?: string;
}) {
  return (
    <li className={className} style={{ height: "100%" }}>
      <motion.div
        style={{ height: "100%" }}
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 32 }}
        animate={{
          opacity: reducedMotion || isInView ? 1 : 0,
          y: reducedMotion || isInView ? 0 : 32,
        }}
        transition={{
          duration: 0.55,
          ease: EASE,
          delay: reducedMotion ? 0 : isInView ? 0.15 + index * 0.12 : 0,
        }}
      >
        <article className="relative flex h-full flex-col rounded-2xl border border-[var(--color-border-subtle)] bg-muted p-8">
        <span
          className="pointer-events-none absolute left-6 top-4 select-none font-serif leading-none text-accent opacity-30"
          style={{ fontSize: "4rem" }}
          aria-hidden="true"
        >
          &ldquo;
        </span>

        <blockquote className="relative z-10 mt-6 flex-1 text-[1rem] leading-[1.7] text-[var(--color-text-on-dark-muted)]">
          {testimonial.quote}
        </blockquote>

        <footer className="relative z-10 mt-8 flex items-center gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, #F97316 100%)",
            }}
            aria-hidden="true"
          >
            {testimonial.initials}
          </div>
          <div>
            <p className="font-bold text-foreground">{testimonial.name}</p>
            <p className="text-sm text-text-muted">
              {testimonial.role} · {testimonial.company}
            </p>
          </div>
        </footer>
      </article>
      </motion.div>
    </li>
  );
}

function LinkedInCard({
  recommendation,
  index,
  isInView,
  reducedMotion,
}: {
  recommendation: (typeof LINKEDIN_RECOMMENDATIONS)[number];
  index: number;
  isInView: boolean;
  reducedMotion: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cardId = `linkedin-rec-${index}`;

  return (
    <li className="w-[min(100%,340px)] shrink-0 snap-start md:w-[360px]">
      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : 48 }}
        animate={{
          opacity: reducedMotion || isInView ? 1 : 0,
          x: reducedMotion || isInView ? 0 : 48,
        }}
        transition={{
          duration: 0.55,
          ease: EASE,
          delay: reducedMotion ? 0 : isInView ? 0.2 + index * 0.14 : 0,
        }}
      >
      <article className="relative rounded-xl border border-border border-l-4 border-l-linkedin bg-background p-7">
        <LinkedInIcon className="absolute right-5 top-5 size-5 text-linkedin" />

        <div className="pr-8">
          <h3 className="text-base font-bold text-foreground">
            {recommendation.name}
          </h3>
          <p className="mt-0.5 text-sm text-text-muted">
            {recommendation.title}
          </p>
          <span className="mt-3 inline-block rounded-full bg-[var(--color-linkedin-soft)] px-3 py-1 text-xs font-medium text-linkedin">
            {recommendation.relationship}
          </span>
        </div>

        <p
          id={cardId}
          className={`mt-5 text-[15px] leading-[1.6] text-[var(--color-text-on-dark-muted)] ${
            expanded ? "" : "line-clamp-3"
          }`}
        >
          {recommendation.text}
        </p>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-sm font-medium text-linkedin transition-colors hover:text-[var(--color-linkedin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-linkedin"
          aria-expanded={expanded}
          aria-controls={cardId}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </article>
      </motion.div>
    </li>
  );
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const linkedInRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef as RefObject<HTMLElement>, {
    once: true,
    amount: 0.2,
  });
  const isLinkedInInView = useInView(linkedInRef as RefObject<HTMLDivElement>, {
    once: true,
    amount: 0.2,
  });
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="section-padding relative z-10 bg-background text-foreground"
      aria-label="Testimonials and recommendations"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 }}
          animate={{
            opacity: reducedMotion || isInView ? 1 : 0,
            y: reducedMotion || isInView ? 0 : 20,
          }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-section-label">Kind Words</p>
          <h2 className="text-section-heading mt-4">What people say</h2>
        </motion.div>

        {/* Testimonial cards — grid on desktop, marquee on mobile */}
        <div className="mt-14">
          {/* Desktop grid */}
          <ul className="hidden grid-cols-3 gap-6 md:grid md:gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.company}
                testimonial={testimonial}
                index={index}
                isInView={isInView}
                reducedMotion={reducedMotion}
              />
            ))}
          </ul>

          {/* Mobile marquee */}
          <div
            className={`md:hidden ${
              reducedMotion
                ? "overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                : "testimonials-marquee overflow-hidden"
            }`}
          >
            <ul
              className={
                reducedMotion
                  ? "flex snap-x snap-mandatory gap-4"
                  : "testimonials-marquee-track flex w-max gap-4"
              }
              aria-label="Scrolling testimonials"
            >
              {(reducedMotion ? TESTIMONIALS : [...TESTIMONIALS, ...TESTIMONIALS]).map(
                (testimonial, index) => (
                  <TestimonialCard
                    key={`${testimonial.company}-${index}`}
                    testimonial={testimonial}
                    index={index % TESTIMONIALS.length}
                    isInView={isInView}
                    reducedMotion={reducedMotion}
                    className={
                      reducedMotion
                        ? "w-[min(85vw,320px)] shrink-0 snap-center"
                        : "w-[min(85vw,320px)] shrink-0"
                    }
                  />
                ),
              )}
            </ul>
          </div>
        </div>

        {/* LinkedIn Recommendations */}
        <div ref={linkedInRef} className="mt-20 md:mt-24">
          <motion.div
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 16 }}
            animate={{
              opacity: reducedMotion || isLinkedInInView ? 1 : 0,
              y: reducedMotion || isLinkedInInView ? 0 : 16,
            }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
          >
            <LinkedInIcon className="size-6 text-linkedin" />
            <h3 className="text-foreground text-2xl font-bold leading-tight">
              LinkedIn Recommendations
            </h3>
          </motion.div>

          <ul
            className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="LinkedIn recommendations"
          >
            {LINKEDIN_RECOMMENDATIONS.map((recommendation, index) => (
              <LinkedInCard
                key={recommendation.name}
                recommendation={recommendation}
                index={index}
                isInView={isLinkedInInView}
                reducedMotion={reducedMotion}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

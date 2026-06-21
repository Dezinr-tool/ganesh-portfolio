"use client";

import { useGSAP } from "@gsap/react";
import { bindTypographyScrollReveal } from "@/lib/typography-scroll-reveal";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { useCallback, useRef } from "react";
import "./testimonials.css";
import "./section-stage.css";
import "./typography-scroll.css";

const TESTIMONIALS_HEADING = "Trusted by the people I've built with";

function TestimonialsHeading() {
  return (
    <>
      {TESTIMONIALS_HEADING.split(" ").map((word) => (
        <span key={word} className="typography-scroll__word">
          {word.split("").map((letter, index) => (
            <span key={`${word}-${index}`} className="typography-scroll__letter">
              {letter}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "deepesh-yadav",
    quote:
      "Ganesh consistently demonstrated exceptional design skills, creativity, and a deep understanding of user experience that made a significant impact on our product development.",
    name: "DEEPESH YADAV",
    role: "PRODUCT MANAGER",
    company: "TESTBOOK",
  },
  {
    id: "narendra-tripathi",
    quote:
      "Ganesh is an incredibly talented and dedicated designer who consistently demonstrates a deep understanding of user experience design principles. His ability to translate complex design concepts into simple and elegant solutions is truly remarkable.",
    name: "NARENDRA TRIPATHI",
    role: "PRODUCT LEADER",
    company: "Toothsi",
  },
  {
    id: "hanoze-boga",
    quote:
      "Ganesh is a very soft-spoken individual & meticulous in whatever he does. I recommend him to any organisation that wants creative thinkers and not just executors in their product design teams. He is a gem to have.",
    name: "HANOZE BOGA",
    role: "DESIGN HEAD",
    company: "JIOSAAVN",
  },
  {
    id: "anuj-kapur",
    quote:
      "Ganesh is a skillful designer. He takes his work seriously and is personally invested in the design solutions he provides. I was consistently pleasantly surprised with the quality of work he brought to the table.",
    name: "ANUJ KAPUR",
    role: "BUSINESS HEAD — APP & GROWTH",
    company: "PAISABAZAAR",
  },
];

/** Continuous ticker scroll — slightly faster than MWG reference */
const MARQUEE_SPEED_PX_PER_SEC = 38;

function testimonialInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

type TestimonialCardProps = {
  item: Testimonial;
};

function TestimonialCard({ item }: TestimonialCardProps) {
  const initials = testimonialInitials(item.name);

  return (
    <article className="testimonials-card" role="listitem">
      <blockquote className="testimonials-card__quote">
        <p>{item.quote}</p>
      </blockquote>

      <div className="testimonials-card__avatar" aria-hidden="true">
        <span className="testimonials-card__initials">{initials}</span>
      </div>

      <p className="testimonials-card__name">{item.name}</p>
      <p className="testimonials-card__meta">
        {item.role}
        <br />
        {item.company}
      </p>

      <span className="testimonials-card__dot" aria-hidden="true" />
    </article>
  );
}

function useTestimonialsMarquee(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  trackRef: React.RefObject<HTMLDivElement | null>,
  reducedMotion: boolean,
) {
  const pausedRef = useRef(false);
  const xRef = useRef(0);
  const loopWidthRef = useRef(0);
  const tickerRef = useRef<((time: number, deltaTime: number) => void) | null>(
    null,
  );

  useGSAP(
    () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track || reducedMotion) return;

      const measureLoop = () => {
        loopWidthRef.current = track.scrollWidth / 2;
      };

      const startMarquee = () => {
        if (tickerRef.current) {
          gsap.ticker.remove(tickerRef.current);
        }

        measureLoop();
        xRef.current = 0;
        gsap.set(track, { x: 0, force3D: true });

        const loopWidth = loopWidthRef.current;
        if (loopWidth <= 0) return;

        const tick = (_time: number, deltaTime: number) => {
          if (pausedRef.current || loopWidthRef.current <= 0) return;

          xRef.current -= (MARQUEE_SPEED_PX_PER_SEC * deltaTime) / 1000;

          if (xRef.current <= -loopWidthRef.current) {
            xRef.current += loopWidthRef.current;
          }

          gsap.set(track, { x: xRef.current, force3D: true });
        };

        tickerRef.current = tick;
        gsap.ticker.add(tick);
      };

      startMarquee();

      const ro = new ResizeObserver(() => {
        measureLoop();
        const loopWidth = loopWidthRef.current;
        if (loopWidth <= 0) return;

        while (xRef.current <= -loopWidth) xRef.current += loopWidth;
        while (xRef.current > 0) xRef.current -= loopWidth;
      });
      ro.observe(track);

      return () => {
        ro.disconnect();
        if (tickerRef.current) {
          gsap.ticker.remove(tickerRef.current);
          tickerRef.current = null;
        }
        gsap.set(track, { clearProps: "transform" });
      };
    },
    { scope: viewportRef, dependencies: [reducedMotion] },
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  return { pause, resume };
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const { pause, resume } = useTestimonialsMarquee(
    viewportRef,
    trackRef,
    reducedMotion,
  );

  const loopedItems = reducedMotion ? TESTIMONIALS : [...TESTIMONIALS, ...TESTIMONIALS];

  useGSAP(
    () => {
      const section = sectionRef.current;
      const inner = innerRef.current;
      const heading = headingRef.current;
      if (!section || !inner) return;

      const cleanups: Array<() => void> = [];

      if (heading && !reducedMotion) {
        cleanups.push(
          bindTypographyScrollReveal(heading, ".typography-scroll__letter", {
            id: "testimonials-heading-letters",
            start: "top 100%",
            end: "bottom 40%",
            scrub: 1,
          }),
        );
      }

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="testimonials-section section-stage"
      aria-labelledby="testimonials-heading"
    >
      <div ref={innerRef} className="section-stage__inner">
      <h2
        ref={headingRef}
        id="testimonials-heading"
        className="testimonials-section__heading"
      >
        <TestimonialsHeading />
      </h2>

      <div
        ref={viewportRef}
        className={`testimonials-section__viewport${reducedMotion ? " testimonials-section__viewport--static" : ""}`}
        onMouseEnter={reducedMotion ? undefined : pause}
        onMouseLeave={reducedMotion ? undefined : resume}
      >
        <div
          ref={trackRef}
          className="testimonials-section__track"
          role="list"
          aria-label="Client testimonials"
        >
          {loopedItems.map((item, index) => (
            <TestimonialCard
              key={`${item.id}-${index}`}
              item={item}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { bindTypographyScrollReveal } from "@/lib/typography-scroll-reveal";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import {
  VALUE_SCROLL_CARDS,
  VALUE_SCROLL_DESKTOP_MQ,
  VALUE_SCROLL_LAYOUT,
  VALUE_SCROLL_TEXT,
  type ValueScrollCard,
} from "@/lib/value-scroll/constants";
import "./value-scroll.css";
import "./typography-scroll.css";

function SplitLine({
  text,
  accent,
}: {
  text: string;
  accent?: boolean;
}) {
  return (
    <p
      className={`value-scroll__paragraph${accent ? " value-scroll__paragraph--accent" : ""}`}
    >
      {[...text].map((char, index) => (
        <span key={`${char}-${index}`} className="value-scroll__char" aria-hidden="true">
          <span className="value-scroll__char-inner">
            {char === " " ? " " : char}
          </span>
        </span>
      ))}
    </p>
  );
}

function ValueCard({ card }: { card: ValueScrollCard }) {
  return (
    <div className="value-scroll__circle">
      <div className={`value-scroll__media value-scroll__media--${card.tone}`}>
        <p className="value-scroll__card-title">{card.title}</p>
        <span className="value-scroll__card-index" aria-hidden="true">
          {card.index}
        </span>
        <p className="value-scroll__card-body">{card.body}</p>
      </div>
    </div>
  );
}

/** Scatter ALL chars at once — fires once when first card hits the headline. */
function scatterChars(charEls: HTMLElement[]) {
  charEls.forEach((char) => {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 250 + Math.random() * 550;   // fly to screen edges
    gsap.to(char, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 80,
      rotation: (Math.random() - 0.5) * 420,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.in",
      overwrite: true,
    });
  });
}

/** Restore chars back to original positions (on scroll-back). */
function restoreChars(charEls: HTMLElement[]) {
  gsap.to(charEls, {
    x: 0,
    y: 0,
    rotation: 0,
    autoAlpha: 1,
    stagger: { each: 0.007, from: "random" },
    ease: "expo.out",
    duration: 0.5,
    overwrite: true,
  });
}

export function ValueScrollSection() {
  const rootRef          = useRef<HTMLDivElement>(null);
  const textSectionRef   = useRef<HTMLElement>(null);
  const textPinRef       = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const cardsSectionRef  = useRef<HTMLElement>(null);
  const cardsPinRef      = useRef<HTMLDivElement>(null);
  const cardsContainerRef= useRef<HTMLDivElement>(null);
  const circlesRef       = useRef<HTMLDivElement>(null);
  const reducedMotion    = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const root           = rootRef.current;
      const textSection    = textSectionRef.current;
      const textPin        = textPinRef.current;
      const textContainer  = textContainerRef.current;
      const cardsSection   = cardsSectionRef.current;
      const cardsPin       = cardsPinRef.current;
      const cardsContainer = cardsContainerRef.current;
      const circles        = circlesRef.current;

      if (
        !root || !textSection || !textPin || !textContainer ||
        !cardsSection || !cardsPin || !cardsContainer || !circles
      ) return;

      registerGsapPlugins();

      const isMobile = window.matchMedia(VALUE_SCROLL_DESKTOP_MQ).matches;
      const headlineSelector = isMobile
        ? ".value-scroll__headline--mobile"
        : ".value-scroll__headline--desktop";
      const headline = textContainer.querySelector<HTMLElement>(headlineSelector);
      if (!headline) return;

      const chars = gsap.utils.toArray<HTMLElement>(
        headline.querySelectorAll(".value-scroll__char-inner"),
      );
      const charWrappers = gsap.utils.toArray<HTMLElement>(
        headline.querySelectorAll(".value-scroll__char"),
      );
      const cardEls = gsap.utils.toArray<HTMLElement>(
        circles.querySelectorAll(".value-scroll__circle"),
      );
      const CARD_COUNT = cardEls.length;

      // ── Mobile: simple reveal, no scroll-pin ──
      if (isMobile) {
        gsap.set(chars, { autoAlpha: 0 });
        gsap.to(chars, {
          autoAlpha: 1,
          stagger: { each: 0.015, from: "random" },
          ease: "power2.out",
          duration: 0.6,
          scrollTrigger: {
            id: "value-scroll-text-mobile",
            trigger: textSection,
            start: "top 75%",
            once: true,
          },
        });
        return;
      }

      // ── Desktop ──

      // Fix paragraph heights so pin doesn't collapse them
      const paragraphs = gsap.utils.toArray<HTMLElement>(
        headline.querySelectorAll(".value-scroll__paragraph"),
      );
      paragraphs.forEach((p) => { p.style.height = `${p.clientHeight}px`; });

      // Letters start visible; scroll-reveal as headline enters viewport
      gsap.set(chars, { autoAlpha: 1 });
      let headlineRevealCleanup: (() => void) | undefined;
      if (charWrappers.length) {
        headlineRevealCleanup = bindTypographyScrollReveal(
          headline,
          ".value-scroll__char",
          { id: "value-scroll-headline-letters", start: "top 85%", end: "top 25%", scrub: 1, stagger: 0.04 },
        );
      }

      // ── Text pin: stays visible while cards rise over it ──
      const textPinTrigger = ScrollTrigger.create({
        id: "value-scroll-text-pin",
        trigger: textPin,
        start: "top top",
        endTrigger: cardsPin,
        end: "bottom top",
        pin: textContainer,
        anticipatePin: 1,
      });

      // ── All cards start hidden below viewport ──
      const riseOffset = window.innerHeight * 1.2;
      cardEls.forEach((card) => {
        gsap.set(card, { autoAlpha: 0, y: riseOffset, rotation: 0, x: 0, scale: 1 });
      });

      const { cardFanRotations, cardFanX } = VALUE_SCROLL_LAYOUT;

      // ── Single scatter: ALL letters at once when card 1 hits the headline ──
      // Fires at 8% into the cardsPin scroll space (card 1 is fully risen by then)
      let scatterFired = false;
      const scatterTrigger = ScrollTrigger.create({
        id: "value-scroll-scatter",
        trigger: cardsPin,
        start: "top+=8% top",
        once: true,
        onEnter: () => {
          scatterFired = true;
          scatterChars(chars);
        },
      });

      // ── Cards scrub timeline ──
      // Each card occupies 1/CARD_COUNT of the total scroll space.
      // Card rises in the first 60% of its stage; remaining 40% is hold.
      // As each new card rises, all previous cards fan into deck position.
      const cardsTl = gsap.timeline({ paused: true });

      cardEls.forEach((card, i) => {
        const stageStart = i / CARD_COUNT;          // 0, 0.25, 0.5, 0.75
        const riseEnd    = stageStart + 0.15;        // rise completes at 15% of stage

        // Show and rise card
        cardsTl
          .set(card, { autoAlpha: 1 }, stageStart)
          .fromTo(
            card,
            { y: riseOffset, scale: 0.9 },
            { y: 0, scale: 1, ease: "power3.out" },
            stageStart,
          )
          .to(card, { y: 0, ease: "none" }, riseEnd); // hold

        // Fan all previous cards as this one arrives
        for (let j = 0; j < i; j++) {
          // Each previous card fans more as depth increases
          const fanDepth = i - j;   // 1 = directly behind front card
          const fanR = cardFanRotations[CARD_COUNT - 1 - (i - j)] ?? cardFanRotations[0] ?? -20;
          const fanX = cardFanX[CARD_COUNT - 1 - (i - j)] ?? cardFanX[0] ?? -60;
          cardsTl.to(
            cardEls[j]!,
            {
              rotation: fanR,
              x: fanX,
              scale: 1 - fanDepth * 0.04,
              ease: "power2.out",
            },
            stageStart,
          );
        }
      });

      // ── Cards pin with scrubbed timeline ──
      let prevCardIndex = -1;
      const cardsPinTrigger = ScrollTrigger.create({
        id: "value-scroll-cards-pin",
        trigger: cardsPin,
        start: "top top",
        end: "bottom bottom",
        pin: cardsContainer,
        animation: cardsTl,
        scrub: 0.6,
        anticipatePin: 1,
        onLeaveBack: () => {
          prevCardIndex = -1;
          scatterFired = false;
          cardEls.forEach((card) => {
            card.classList.remove("is-on");
            gsap.set(card, { autoAlpha: 0, y: riseOffset, rotation: 0, x: 0, scale: 1 });
          });
          restoreChars(chars);
        },
      });

      // Track active card for visibility class
      ScrollTrigger.create({
        id: "value-scroll-cards-track",
        trigger: cardsPin,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const idx = Math.min(CARD_COUNT - 1, Math.floor(self.progress * CARD_COUNT));
          if (idx !== prevCardIndex) {
            for (let i = prevCardIndex + 1; i <= idx; i++) {
              cardEls[i]?.classList.add("is-on");
            }
            prevCardIndex = idx;
          }
        },
      });

      scheduleScrollTriggerRefresh();

      return () => {
        headlineRevealCleanup?.();
        textPinTrigger.kill();
        cardsPinTrigger.kill();
        scatterTrigger.kill();
        ScrollTrigger.getById("value-scroll-cards-track")?.kill();
        cardsTl.kill();
      };
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  const srText = [...VALUE_SCROLL_TEXT.desktop].join(" ");

  return (
    <div ref={rootRef} className="value-scroll">
      <section
        ref={textSectionRef}
        className="value-scroll__text"
        aria-labelledby="value-scroll-heading"
      >
        <h2 id="value-scroll-heading" className="sr-only">{srText}</h2>
        <div ref={textPinRef} className="value-scroll__text-pin">
          <div ref={textContainerRef} className="value-scroll__text-container">
            <div className="value-scroll__headline value-scroll__headline--desktop">
              {VALUE_SCROLL_TEXT.desktop.map((line) => (
                <SplitLine key={line} text={line} />
              ))}
            </div>
            <div className="value-scroll__headline value-scroll__headline--mobile" aria-hidden="true">
              {VALUE_SCROLL_TEXT.mobile.map((line, index) => (
                <SplitLine
                  key={line}
                  text={line}
                  accent={index >= VALUE_SCROLL_TEXT.mobileAccentFromLine}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={cardsSectionRef}
        className="value-scroll__cards"
        aria-label="Capabilities"
      >
        <div ref={cardsPinRef} className="value-scroll__cards-pin">
          <div ref={cardsContainerRef} className="value-scroll__cards-container">
            <div ref={circlesRef} className="value-scroll__circles">
              {VALUE_SCROLL_CARDS.map((card) => (
                <ValueCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

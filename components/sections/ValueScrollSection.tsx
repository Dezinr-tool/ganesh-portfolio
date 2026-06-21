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
import {
  buildCharPhysics,
  clearCharPhysics,
  launchCharExplosion,
  restoreCharPhysics,
  type CharPhysicsRuntime,
} from "@/lib/value-scroll/physics";
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
            {char === " " ? "\u00a0" : char}
          </span>
        </span>
      ))}
    </p>
  );
}

function ValueCard({
  card,
  titleWidth,
}: {
  card: ValueScrollCard;
  titleWidth: string;
}) {
  return (
    <div className="value-scroll__circle">
      <div className={`value-scroll__media value-scroll__media--${card.tone}`}>
        <p className="value-scroll__card-title" style={{ width: titleWidth }}>
          {card.title}
        </p>
        <span className="value-scroll__card-index" aria-hidden="true">
          {card.index}
        </span>
        <p className="value-scroll__card-body">{card.body}</p>
      </div>
    </div>
  );
}

const CARD_TITLE_WIDTHS = ["77.2%", "80%", "70.4%", "62%"];

export function ValueScrollSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const textSectionRef = useRef<HTMLElement>(null);
  const textPinRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const cardsSectionRef = useRef<HTMLElement>(null);
  const cardsPinRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const root = rootRef.current;
      const textSection = textSectionRef.current;
      const textPin = textPinRef.current;
      const textContainer = textContainerRef.current;
      const cardsSection = cardsSectionRef.current;
      const cardsPin = cardsPinRef.current;
      const cardsContainer = cardsContainerRef.current;
      const circles = circlesRef.current;

      if (
        !root ||
        !textSection ||
        !textPin ||
        !textContainer ||
        !cardsSection ||
        !cardsPin ||
        !cardsContainer ||
        !circles
      ) {
        return;
      }

      registerGsapPlugins();

      const isMobile = window.matchMedia(VALUE_SCROLL_DESKTOP_MQ).matches;
      const headlineSelector = isMobile
        ? ".value-scroll__headline--mobile"
        : ".value-scroll__headline--desktop";
      const headline = textContainer.querySelector<HTMLElement>(headlineSelector);
      if (!headline) return;

      const paragraphs = gsap.utils.toArray<HTMLElement>(
        headline.querySelectorAll(".value-scroll__paragraph"),
      );
      const chars = gsap.utils.toArray<HTMLElement>(
        headline.querySelectorAll(".value-scroll__char-inner"),
      );
      const charWrappers = gsap.utils.toArray<HTMLElement>(
        headline.querySelectorAll(".value-scroll__char"),
      );
      const cardEls = gsap.utils.toArray<HTMLElement>(
        circles.querySelectorAll(".value-scroll__circle"),
      );

      cardEls.forEach((card) => {
        const media = card.querySelector<HTMLElement>(".value-scroll__media");
        if (media) gsap.set(media, { clearProps: "transform" });
      });

      if (reducedMotion) {
        gsap.set(chars, { autoAlpha: 1 });
        gsap.set(cardEls, { autoAlpha: 1, scale: 1, rotation: 0 });
        circles.style.transform = "";
        return;
      }

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

      paragraphs.forEach((paragraph) => {
        paragraph.style.height = `${paragraph.clientHeight}px`;
      });

      gsap.set(chars, { autoAlpha: 1 });

      let headlineRevealCleanup: (() => void) | undefined;

      if (charWrappers.length) {
        headlineRevealCleanup = bindTypographyScrollReveal(
          headline,
          ".value-scroll__char",
          {
            id: "value-scroll-headline-letters",
            start: "top 85%",
            end: "top 25%",
            scrub: 1,
            stagger: 0.04,
          },
        );
      }

      const textPinTrigger = ScrollTrigger.create({
        id: "value-scroll-text-pin",
        trigger: textPin,
        start: "top top",
        endTrigger: cardsSection,
        end: "top top",
        pin: textContainer,
        anticipatePin: 1,
      });

      const rotationStep = VALUE_SCROLL_LAYOUT.cardRotationStep;
      let activeCardIndex = -1;
      const firstCard = cardEls[0];

      const setActiveCard = (nextIndex: number) => {
        if (nextIndex === activeCardIndex) return;

        if (nextIndex > activeCardIndex) {
          const card = cardEls[nextIndex];
          if (card) {
            card.classList.add("is-on");
            gsap.set(card, { rotation: nextIndex * rotationStep });
            if (nextIndex > 0) {
              gsap.fromTo(
                card,
                { scale: 0.94 },
                { scale: 1, ease: "elastic.out(0.6, 0.3)", duration: 0.5 },
              );
            }
          }
        } else if (nextIndex < activeCardIndex) {
          cardEls[activeCardIndex]?.classList.remove("is-on");
        }

        gsap.to(circles, {
          rotation: -nextIndex * rotationStep + (rotationStep / 2) * nextIndex,
          ease: "elastic.out(0.6, 0.3)",
          duration: 0.5,
        });

        activeCardIndex = nextIndex;
      };

      let firstCardRiseTween: gsap.core.Tween | null = null;

      if (firstCard) {
        const riseOffset = window.innerHeight * 0.55;
        gsap.set(firstCard, { y: riseOffset });

        firstCardRiseTween = gsap.to(firstCard, {
          y: 0,
          ease: "none",
          scrollTrigger: {
            id: "value-scroll-first-card-rise",
            trigger: cardsPin,
            start: "top bottom",
            end: "top top",
            scrub: true,
            onEnter: () => firstCard.classList.add("is-on"),
            onLeaveBack: () => {
              firstCard.classList.remove("is-on");
              gsap.set(firstCard, { y: riseOffset });
            },
          },
        });
      }

      const cardIndexFromProgress = (progress: number) =>
        Math.min(cardEls.length - 1, Math.floor(progress * cardEls.length));

      const cardsPinTrigger = ScrollTrigger.create({
        id: "value-scroll-cards-pin",
        trigger: cardsPin,
        start: "top top",
        end: "bottom bottom",
        pin: cardsContainer,
        scrub: true,
        anticipatePin: 1,
        onEnter: (self) => setActiveCard(cardIndexFromProgress(self.progress)),
        onUpdate: (self) => setActiveCard(cardIndexFromProgress(self.progress)),
        onLeaveBack: () => {
          activeCardIndex = -1;
          cardEls.forEach((card) => card.classList.remove("is-on"));
          gsap.set(circles, { rotation: 0 });
          if (firstCard) {
            gsap.set(firstCard, { y: window.innerHeight * 0.55 });
          }
        },
      });

      let physicsRuntime: CharPhysicsRuntime | null = null;
      let physicsActive = false;

      const cardsHandoffTrigger = ScrollTrigger.create({
        id: "value-scroll-text-handoff",
        trigger: cardsPin,
        start: "top top",
        onEnter: async () => {
          if (physicsActive) return;
          physicsActive = true;

          gsap.set(textContainer, { pointerEvents: "none" });

          const Matter = await import("matter-js");
          const desktopHeadline = textContainer.querySelector<HTMLElement>(
            ".value-scroll__headline--desktop",
          );
          if (!desktopHeadline) return;

          physicsRuntime = buildCharPhysics(
            Matter,
            desktopHeadline,
            ".value-scroll__char-inner",
          );
          launchCharExplosion(Matter, physicsRuntime, gsap);
          gsap.ticker.add(physicsRuntime.tick);

          gsap.to(textContainer, {
            autoAlpha: 0,
            duration: 0.35,
            delay: 0.2,
            ease: "power2.in",
          });

          if (firstCard) {
            gsap.fromTo(
              firstCard,
              { scale: 0.94 },
              { scale: 1, ease: "elastic.out(0.6, 0.3)", duration: 0.5 },
            );
          }
        },
        onLeaveBack: async () => {
          if (!physicsActive || !physicsRuntime) return;
          physicsActive = false;
          gsap.ticker.remove(physicsRuntime.tick);

          gsap.set(textContainer, { pointerEvents: "auto", autoAlpha: 1 });

          const Matter = await import("matter-js");
          restoreCharPhysics(Matter, physicsRuntime, gsap);
          clearCharPhysics(Matter, physicsRuntime);
          physicsRuntime = null;
        },
      });

      scheduleScrollTriggerRefresh();

      return () => {
        headlineRevealCleanup?.();
        textPinTrigger.kill();
        cardsPinTrigger.kill();
        cardsHandoffTrigger.kill();
        firstCardRiseTween?.scrollTrigger?.kill();
        firstCardRiseTween?.kill();
        if (physicsRuntime) {
          gsap.ticker.remove(physicsRuntime.tick);
          import("matter-js").then((Matter) => {
            clearCharPhysics(Matter, physicsRuntime);
          });
        }
      };
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  const srText = [...VALUE_SCROLL_TEXT.desktop].join(" ");

  return (
    <div ref={rootRef} className="value-scroll overflow-x-clip text-[#111111]">
      <section
        ref={textSectionRef}
        className="value-scroll__text"
        aria-labelledby="value-scroll-heading"
      >
        <h2 id="value-scroll-heading" className="sr-only">
          {srText}
        </h2>
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
        style={{ marginTop: VALUE_SCROLL_LAYOUT.cardsMarginTop }}
        aria-label="Capabilities"
      >
        <div ref={cardsPinRef} className="value-scroll__cards-pin">
          <div
            ref={cardsContainerRef}
            className="value-scroll__cards-container overflow-hidden"
          >
            <div ref={circlesRef} className="value-scroll__circles">
              {VALUE_SCROLL_CARDS.map((card, index) => (
                <ValueCard
                  key={card.id}
                  card={card}
                  titleWidth={CARD_TITLE_WIDTHS[index] ?? "100%"}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

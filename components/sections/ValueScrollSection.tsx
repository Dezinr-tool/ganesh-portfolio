"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import {
  formatOnScreenIndex,
  hideOnScreen,
  showOnScreen,
} from "@/lib/on-screen-counter";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import {
  buildCharPhysics,
  clearCharPhysics,
  launchCharExplosion,
  restoreCharPhysics,
  type CharPhysicsRuntime,
} from "@/lib/value-scroll/physics";
import {
  bindMwgCharReveal,
  lockParagraphHeights,
} from "@/lib/value-scroll/mwg-char-reveal";
import { bindMwgCardsCarousel } from "@/lib/value-scroll/mwg-cards-carousel";
import {
  VALUE_SCROLL_CARDS,
  VALUE_SCROLL_DESKTOP_MQ,
  VALUE_SCROLL_LAYOUT,
  VALUE_SCROLL_TEXT,
  type ValueScrollCard,
} from "@/lib/value-scroll/constants";
import "./value-scroll.css";

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
        <span key={`${index}-${char}`} className="value-scroll__char" aria-hidden="true">
          <span className="value-scroll__char-inner">
            {char === " " ? "\u00a0" : char}
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
      const cardEls = gsap.utils.toArray<HTMLElement>(
        circles.querySelectorAll(".value-scroll__circle"),
      );
      const { carouselRotationStep } = VALUE_SCROLL_LAYOUT;

      let charRevealCleanup: (() => void) | undefined;
      let cardsCarouselCleanup: (() => void) | undefined;
      let physicsRuntime: CharPhysicsRuntime | null = null;
      let matterModule: typeof import("matter-js") | null = null;
      let activeCardIndex = -1;
      let onScreenVisible = false;

      const syncOnScreen = (index: number) => {
        const label = formatOnScreenIndex(index + 1);
        if (!onScreenVisible) {
          showOnScreen(label);
          onScreenVisible = true;
          return;
        }
        showOnScreen(label);
      };

      if (isMobile) {
        gsap.set(headline.querySelectorAll(".value-scroll__char-inner"), {
          autoAlpha: 0,
        });
        gsap.to(headline.querySelectorAll(".value-scroll__char-inner"), {
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

      lockParagraphHeights(paragraphs);

      charRevealCleanup = bindMwgCharReveal(textSection, ".value-scroll__char-inner", {
        id: "value-scroll-headline-chars",
        isMobile: false,
        endExtraViewports: 4,
      });

      ScrollTrigger.create({
        id: "value-scroll-text-pin",
        trigger: textPin,
        start: "top top",
        end: "bottom bottom",
        pin: textContainer,
        anticipatePin: 1,
      });

      ScrollTrigger.create({
        id: "value-scroll-on-screen-enter",
        trigger: textSection,
        start: "top 60%",
        endTrigger: cardsSection,
        end: "bottom bottom",
        onEnter: () => syncOnScreen(0),
        onEnterBack: () => syncOnScreen(Math.max(0, activeCardIndex)),
        onLeave: () => {
          if (onScreenVisible) hideOnScreen();
          onScreenVisible = false;
        },
        onLeaveBack: () => {
          if (onScreenVisible) hideOnScreen();
          onScreenVisible = false;
        },
      });

      const loadMatter = async () => {
        if (!matterModule) {
          matterModule = await import("matter-js");
        }
        return matterModule;
      };

      ScrollTrigger.create({
        id: "value-scroll-matter-burst",
        trigger: cardsSection,
        start: "top top",
        onEnter: () => {
          charRevealCleanup?.();
          charRevealCleanup = undefined;

          void loadMatter().then((Matter) => {
            if (physicsRuntime) return;
            physicsRuntime = buildCharPhysics(
              Matter,
              headline,
              ".value-scroll__char-inner",
            );
            launchCharExplosion(Matter, physicsRuntime, gsap);
            gsap.ticker.add(physicsRuntime.tick);
          });
        },
        onLeave: () => {
          if (physicsRuntime) {
            gsap.ticker.remove(physicsRuntime.tick);
          }
        },
        onEnterBack: () => {
          if (physicsRuntime) {
            gsap.ticker.add(physicsRuntime.tick);
          }
        },
        onLeaveBack: () => {
          if (physicsRuntime && matterModule) {
            gsap.ticker.remove(physicsRuntime.tick);
            restoreCharPhysics(matterModule, physicsRuntime, gsap);
            clearCharPhysics(matterModule, physicsRuntime);
            physicsRuntime = null;
          }

          charRevealCleanup = bindMwgCharReveal(
            textSection,
            ".value-scroll__char-inner",
            {
              id: "value-scroll-headline-chars",
              isMobile: false,
              endExtraViewports: 4,
            },
          );
        },
      });

      cardsCarouselCleanup = bindMwgCardsCarousel({
        pinHeight: cardsPin,
        container: cardsContainer,
        circles,
        cards: cardEls,
        rotationStep: carouselRotationStep,
        onIndexChange: (idx) => {
          activeCardIndex = idx;
          syncOnScreen(idx);
        },
      });

      scheduleScrollTriggerRefresh();

      return () => {
        charRevealCleanup?.();
        cardsCarouselCleanup?.();
        if (physicsRuntime && matterModule) {
          gsap.ticker.remove(physicsRuntime.tick);
          clearCharPhysics(matterModule, physicsRuntime);
          physicsRuntime = null;
        }
        if (onScreenVisible) hideOnScreen();
        ScrollTrigger.getById("value-scroll-text-pin")?.kill();
        ScrollTrigger.getById("value-scroll-on-screen-enter")?.kill();
        ScrollTrigger.getById("value-scroll-matter-burst")?.kill();
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
            <div
              className="value-scroll__headline value-scroll__headline--mobile"
              aria-hidden="true"
            >
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

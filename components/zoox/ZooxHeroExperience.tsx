"use client";

import "./zoox-hero.css";
import { useRef } from "react";
import {
  useZooxHeroAnimations,
  type ZooxHeroRefs,
} from "./useZooxHeroAnimations";

const HERO_TITLE = "It's not a car";

const ROBOTAXI_COPY =
  "Zoox is a purpose-built autonomous vehicle designed for riders, not drivers. Scroll to reveal the robotaxi and experience the horizontal text parallax.";

function ZooxLogo() {
  return (
    <svg viewBox="0 0 33 34" fill="none" aria-hidden="true">
      <path
        d="M16.5 2L30 9v16l-13.5 7L3 25V9L16.5 2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="11" cy="14" r="1.5" fill="currentColor" />
      <circle cx="22" cy="14" r="1.5" fill="currentColor" />
      <circle cx="11" cy="20" r="1.5" fill="currentColor" />
      <circle cx="22" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 6h14M2 12h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type ZooxHeroExperienceProps = {
  /** Set false to skip GSAP (SSR-safe placeholder) */
  animate?: boolean;
  className?: string;
};

/**
 * Drop-in Zoox homepage header + hero recreation.
 * Structure mirrors zoox.com: Nav → HomepageHeroBespoke → HomepageContentBespoke.
 */
export function ZooxHeroExperience({
  animate = true,
  className,
}: ZooxHeroExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navMainRef = useRef<HTMLElement>(null);
  const navCollapsedRef = useRef<HTMLDivElement>(null);
  const navShadowRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleWordsRef = useRef<HTMLElement[]>([]);
  const heroVideoShellRef = useRef<HTMLDivElement>(null);
  const heroVideoInnerRef = useRef<HTMLDivElement>(null);
  const contentPinRef = useRef<HTMLDivElement>(null);
  const textRailRef = useRef<HTMLDivElement>(null);
  const textCopyRef = useRef<HTMLParagraphElement>(null);
  const clipContainerRef = useRef<HTMLDivElement>(null);
  const clipInnerRef = useRef<HTMLDivElement>(null);
  const robotaxiImageRef = useRef<HTMLDivElement>(null);

  const refs: ZooxHeroRefs = {
    root: rootRef,
    navMain: navMainRef,
    navCollapsed: navCollapsedRef,
    navShadow: navShadowRef,
    hero: heroRef,
    heroTitleWords: heroTitleWordsRef,
    heroVideoShell: heroVideoShellRef,
    heroVideoInner: heroVideoInnerRef,
    contentPin: contentPinRef,
    textRail: textRailRef,
    textCopy: textCopyRef,
    clipContainer: clipContainerRef,
    clipInner: clipInnerRef,
    robotaxiImage: robotaxiImageRef,
  };

  useZooxHeroAnimations(refs, animate);

  const titleWords = HERO_TITLE.split(" ");

  return (
    <div
      ref={rootRef}
      className={className ? `zoox-exp ${className}` : "zoox-exp"}
      data-zoox-experience
    >
      {/* ── NAV: Zoox Nav_root + scrollingLogoContainer ── */}
      <nav className="zoox-nav" aria-label="Zoox navigation">
        <div className="zoox-nav__wrapper">
          <header ref={navMainRef} className="zoox-nav__main">
            <button
              type="button"
              className="zoox-nav__hamburger"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>

            <ul className="zoox-nav__routes">
              <li>
                <span className="zoox-nav__logo zoox-nav__logo-mobile">
                  <ZooxLogo />
                </span>
              </li>
              <li>
                <a className="zoox-nav__link" href="#vehicle">
                  Vehicle
                </a>
                <a className="zoox-nav__link" href="#autonomy">
                  Autonomy
                </a>
              </li>
              <li>
                <a className="zoox-nav__link" href="#careers">
                  Careers
                </a>
                <a className="zoox-nav__link" href="#news">
                  News
                </a>
              </li>
            </ul>
          </header>

          <div ref={navCollapsedRef} className="zoox-nav__collapsed">
            <div ref={navShadowRef} className="zoox-nav__collapsed-shadow" />
            <div className="zoox-nav__collapsed-pill">
              <button
                type="button"
                className="zoox-nav__hamburger"
                aria-label="Open menu"
              >
                <HamburgerIcon />
              </button>
              <span className="zoox-nav__logo">
                <ZooxLogo />
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO: Zoox HomepageHeroBespoke ── */}
      <section ref={heroRef} className="zoox-hero" aria-label="Hero">
        <h1 className="zoox-hero__title">
          {titleWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              ref={(node) => {
                if (node) heroTitleWordsRef.current[index] = node;
              }}
              className="zoox-hero__word"
            >
              {word}
              {index < titleWords.length - 1 ? "\u00a0" : ""}
            </span>
          ))}
        </h1>

        <div ref={heroVideoShellRef} className="zoox-hero__video-shell">
          <div ref={heroVideoInnerRef} className="zoox-hero__video-inner">
            {/* Placeholder: Zoox uses Mux MP4 hero loop — swap for licensed asset */}
            <div className="zoox-hero__poster" role="img" aria-label="Zoox robotaxi placeholder" />
          </div>
        </div>
      </section>

      {/* ── CONTENT: Zoox HomepageContentBespoke (desktop pin + clip) ── */}
      <section className="zoox-content" aria-label="Robotaxi story">
        <div ref={contentPinRef} className="zoox-content__pin">
          <div ref={textRailRef} className="zoox-content__text-rail">
            <div className="zoox-content__text-panel">
              <p ref={textCopyRef} className="zoox-content__copy">
                {ROBOTAXI_COPY}
              </p>
            </div>
          </div>

          <div ref={clipContainerRef} className="zoox-content__clip">
            <div ref={clipInnerRef} className="zoox-content__clip-inner">
              <div ref={robotaxiImageRef} className="zoox-content__image-wrap">
                {/* Placeholder: Zoox robotaxi PNG from CMS — gradient stand-in */}
                <div
                  className="zoox-content__image"
                  role="img"
                  aria-label="Zoox robotaxi side view placeholder"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

/** Zoox custom eases (from _app bundle: customEaseOut, customEaseIn, vinnieInOut) */
const EASE_OUT = "power3.out";
const EASE_IN_OUT = "power2.inOut";

export type ZooxHeroRefs = {
  root: RefObject<HTMLDivElement | null>;
  navMain: RefObject<HTMLElement | null>;
  navCollapsed: RefObject<HTMLElement | null>;
  navShadow: RefObject<HTMLElement | null>;
  hero: RefObject<HTMLElement | null>;
  heroTitleWords: RefObject<HTMLElement[]>;
  heroVideoShell: RefObject<HTMLElement | null>;
  heroVideoInner: RefObject<HTMLElement | null>;
  contentPin: RefObject<HTMLElement | null>;
  textRail: RefObject<HTMLElement | null>;
  textCopy: RefObject<HTMLElement | null>;
  clipContainer: RefObject<HTMLElement | null>;
  clipInner: RefObject<HTMLElement | null>;
  robotaxiImage: RefObject<HTMLElement | null>;
};

function percentageToRem(pct: number, offsetPx = 0) {
  if (typeof window === "undefined") return `${pct / 10}rem`;
  return `${(window.innerWidth * (pct / 100) + offsetPx) / 10}rem`;
}

/**
 * Zoox HomepageHeroBespoke load timeline:
 * - Page opacity 0 → 1
 * - Video clip-path --clip-top 100% → 0%
 * - Video inner y: 50px → 0
 * - Title words stagger fade/slide (SplitText equivalent)
 */
function buildHeroIntroTimeline(refs: ZooxHeroRefs) {
  const words = refs.heroTitleWords.current?.filter(Boolean) ?? [];

  const tl = gsap.timeline({
    delay: 0.5,
    defaults: { ease: EASE_OUT },
  });

  tl.set(refs.hero.current, { opacity: 1 })
    .to(
      refs.heroVideoShell.current,
      { "--clip-top": "0%", duration: 0.7, ease: EASE_OUT },
      0,
    )
    .from(
      refs.heroVideoInner.current,
      { y: 50, duration: 0.5, ease: EASE_OUT },
      "<",
    )
    .from(
      words,
      {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.067,
        ease: EASE_OUT,
      },
      "<",
    );

  return tl;
}

/**
 * Zoox Nav scroll collapse (desktop):
 * mainNav clip-path shrinks to center; collapsed pill scales/fades in.
 * Maps to GSAP fromTo on --clip-left/right in _app bundle.
 */
function buildNavScrollTimeline(refs: ZooxHeroRefs) {
  return gsap.timeline({
    scrollTrigger: {
      id: "zoox-nav-collapse",
      trigger: refs.contentPin.current,
      start: "top 80%",
      end: "top 20%",
      scrub: 0.4,
    },
  })
    .fromTo(
      refs.navMain.current,
      {
        "--clip-left": "0%",
        "--clip-right": "0%",
        "--clip-top": "0%",
        "--clip-bottom": "0%",
      },
      {
        "--clip-left": "42%",
        "--clip-right": "42%",
        "--clip-top": "8%",
        "--clip-bottom": "8%",
        ease: EASE_IN_OUT,
        duration: 1,
      },
      0,
    )
    .fromTo(
      refs.navCollapsed.current,
      { autoAlpha: 0, scale: 0.6 },
      { autoAlpha: 1, scale: 1, duration: 0.334, ease: EASE_OUT },
      0.2,
    )
    .fromTo(
      refs.navShadow.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.1 },
      "<",
    );
}

/**
 * Zoox Homepage-Content-Animate-In (scrub):
 * Asymmetric clip + horizontal text parallax before pin.
 */
function buildContentAnimateInTimeline(refs: ZooxHeroRefs) {
  const rightClip = percentageToRem(75, 20);
  const leftClip = percentageToRem(-25);

  return gsap
    .timeline({
      scrollTrigger: {
        id: "zoox-content-animate-in",
        trigger: refs.contentPin.current,
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    })
    .addLabel("start", 0)
    .set(refs.textRail.current, { zIndex: 1 })
    .set(refs.clipContainer.current, {
      "--clip-top": "2rem",
      "--clip-right": rightClip,
      "--clip-bottom": "2rem",
      "--clip-left": leftClip,
      "--clip-border-radius": "3.6rem",
    })
    .set(refs.clipInner.current, { xPercent: -25 })
    .set(refs.textRail.current, { xPercent: -25, x: 40 })
    .set(refs.robotaxiImage.current, { opacity: 0 })
    .set(refs.robotaxiImage.current, { opacity: 1 })
    .to(
      refs.clipContainer.current,
      {
        "--clip-top": "2rem",
        "--clip-right": percentageToRem(50, 20),
        "--clip-bottom": "2rem",
        "--clip-left": "2rem",
        "--clip-border-radius": "3.6rem",
        duration: 1,
      },
      0,
    )
    .to(refs.clipInner.current, { xPercent: 0, duration: 1 }, 0)
    .to(refs.textRail.current, { xPercent: 25, x: 0, duration: 1 }, 0)
    .to(
      refs.textCopy.current,
      { opacity: 1, xPercent: 0, ease: "none", duration: 1 },
      0,
    )
    .addLabel("robotaxi-cta-1", ">+0.5");
}

/**
 * Zoox Homepage-Content-Scroll-Pinning (scrub + pin):
 * Text rail slides off; clip expands to full viewport.
 */
function buildContentPinTimeline(refs: ZooxHeroRefs) {
  return gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "zoox-content-scroll-pinning",
        trigger: refs.contentPin.current,
        start: "top top",
        end: "+=120%",
        scrub: true,
        pin: true,
      },
    })
    .to(refs.textRail.current, { xPercent: 75, x: -40, duration: 0.2 }, ">")
    .to(
      refs.clipContainer.current,
      { "--clip-border-radius": "3.6rem", duration: 0.1 },
      "<",
    )
    .to(
      refs.clipContainer.current,
      {
        "--clip-top": "2rem",
        "--clip-right": "2rem",
        "--clip-bottom": "2rem",
        "--clip-left": "2rem",
        duration: 0.2,
      },
      "<",
    )
    .addLabel("robotaxi-cta-2")
    .addLabel("end");
}

/**
 * Zoox Homepage-Content-Animate-Out (scrub):
 * Fades hero stack as user exits pinned section.
 */
function buildContentAnimateOutTimeline(refs: ZooxHeroRefs) {
  return gsap.timeline({
    scrollTrigger: {
      id: "zoox-content-animate-out",
      trigger: refs.contentPin.current,
      start: "top -1%",
      end: "top -80%",
      scrub: true,
    },
  });
}

/** Mobile: clip reveal on robotaxi image (Homepage-Mobile-Robotaxi) */
function buildMobileClipTimeline(refs: ZooxHeroRefs) {
  return gsap.timeline({
    scrollTrigger: {
      id: "zoox-mobile-robotaxi",
      trigger: refs.clipContainer.current,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  }).fromTo(
    refs.clipContainer.current,
    { "--hoz-clip": "25%", "--vert-clip": "12%" },
    { "--hoz-clip": "0%", "--vert-clip": "0%", duration: 1.5 },
    0,
  );
}

export function useZooxHeroAnimations(
  refs: ZooxHeroRefs,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    gsap.set(refs.root.current, { opacity: 1 });
    gsap.set(refs.hero.current, { opacity: reduced ? 1 : 0 });

    if (reduced) {
      gsap.set(refs.heroVideoShell.current, { "--clip-top": "0%" });
      gsap.set(refs.textCopy.current, { opacity: 1 });
      gsap.set(refs.robotaxiImage.current, { opacity: 1 });
      return;
    }

    const timelines: gsap.core.Timeline[] = [];

    timelines.push(buildHeroIntroTimeline(refs));

    if (mobile) {
      timelines.push(buildMobileClipTimeline(refs));
    } else {
      timelines.push(buildNavScrollTimeline(refs));
      timelines.push(buildContentAnimateInTimeline(refs));
      timelines.push(buildContentPinTimeline(refs));
      timelines.push(buildContentAnimateOutTimeline(refs));
    }

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      timelines.forEach((tl) => {
        tl.scrollTrigger?.kill();
        tl.kill();
      });
      ScrollTrigger.getAll().forEach((st) => {
        if (String(st.vars.id ?? "").startsWith("zoox-")) st.kill();
      });
    };
    // refs are stable RefObjects; animation runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

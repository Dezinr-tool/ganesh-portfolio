import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginsRegistered = false;

export function registerGsapPlugins() {
  if (pluginsRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

export const SCROLL_START = "top 85%";

export type RevealOptions = {
  trigger?: Element | null;
  stagger?: number;
  y?: number;
  duration?: number;
  delay?: number;
  reducedMotion?: boolean;
};

export function setRevealVisible(target: gsap.TweenTarget) {
  gsap.set(target, { opacity: 1, y: 0, clearProps: "transform" });
}

export function animateRevealOnScroll(
  targets: gsap.TweenTarget,
  options: RevealOptions = {},
) {
  registerGsapPlugins();

  const {
    trigger,
    stagger = 0,
    y = 24,
    duration = 0.7,
    delay = 0,
    reducedMotion = false,
  } = options;

  if (reducedMotion) {
    setRevealVisible(targets);
    return;
  }

  const scrollTrigger = trigger
    ? {
        trigger,
        start: SCROLL_START,
        once: true as const,
      }
    : undefined;

  gsap.set(targets, { opacity: 0, y });

  gsap.to(targets, {
    opacity: 1,
    y: 0,
    duration,
    delay,
    ease: "power3.out",
    stagger: stagger > 0 ? stagger : undefined,
    scrollTrigger,
  });
}

export function animateHeadingOnScroll(
  target: gsap.TweenTarget,
  trigger: Element | null,
  reducedMotion = false,
) {
  animateRevealOnScroll(target, { trigger, y: 24, reducedMotion });
}

export function animateCardsOnScroll(
  targets: gsap.TweenTarget,
  trigger: Element | null,
  reducedMotion = false,
  stagger = 0.12,
) {
  animateRevealOnScroll(targets, { trigger, y: 32, stagger, reducedMotion });
}

/** Word or line spans — staggered fade/slide on scroll */
export function animateSplitStaggerOnScroll(
  targets: gsap.TweenTarget,
  options: RevealOptions = {},
) {
  const {
    stagger = 0.06,
    y = 20,
    duration = 0.65,
    ...rest
  } = options;

  animateRevealOnScroll(targets, {
    ...rest,
    stagger,
    y,
    duration,
  });
}

export function animateHeadingWordsOnScroll(
  words: gsap.TweenTarget,
  trigger: Element | null,
  reducedMotion = false,
  stagger = 0.08,
) {
  animateSplitStaggerOnScroll(words, {
    trigger,
    stagger,
    y: 24,
    duration: 0.7,
    reducedMotion,
  });
}

export function animateLineStaggerOnScroll(
  lines: gsap.TweenTarget,
  trigger: Element | null,
  reducedMotion = false,
  stagger = 0.12,
) {
  animateSplitStaggerOnScroll(lines, {
    trigger,
    stagger,
    y: 28,
    duration: 0.75,
    reducedMotion,
  });
}

/** Subtle body copy — smaller travel, softer timing */
export function animateBodyCopyOnScroll(
  target: gsap.TweenTarget,
  trigger: Element | null,
  reducedMotion = false,
  delay = 0.1,
) {
  animateRevealOnScroll(target, {
    trigger,
    y: 16,
    duration: 0.6,
    delay,
    reducedMotion,
  });
}

/** Hero / loader timeline — split text reveal (not scroll-triggered) */
export function revealSplitInTimeline(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  position: string | number,
  options: {
    stagger?: number;
    duration?: number;
    y?: number;
    ease?: string;
  } = {},
) {
  const {
    stagger = 0.05,
    duration = 0.55,
    y = 18,
    ease = "power2.out",
  } = options;

  gsap.set(targets, { opacity: 0, y });

  tl.to(
    targets,
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease,
    },
    position,
  );
}

/** Split a string into word tokens for JSX rendering */
export function splitWords(text: string): { word: string; key: string }[] {
  return text.split(/\s+/).filter(Boolean).map((word, index) => ({
    word,
    key: `${word}-${index}`,
  }));
}

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

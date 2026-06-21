import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  registerGsapPlugins,
  setRevealVisible,
} from "@/lib/gsap-scroll";

export const SECTION_REVEAL_START = "top 78%";

export type RevealOnEnterOptions = {
  id?: string;
  reducedMotion?: boolean;
  y?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  start?: string;
  scale?: number;
};

export function revealOnScrollEnter(
  trigger: Element,
  targets: gsap.TweenTarget,
  options: RevealOnEnterOptions = {},
): () => void {
  registerGsapPlugins();

  const {
    id,
    reducedMotion = false,
    y = 44,
    stagger = 0,
    duration = 0.9,
    delay = 0,
    start = SECTION_REVEAL_START,
    scale = 1,
  } = options;

  const elements = gsap.utils.toArray<HTMLElement>(targets);
  if (!elements.length) return () => {};

  if (reducedMotion) {
    setRevealVisible(elements);
    return () => {};
  }

  gsap.set(elements, {
    opacity: 0,
    y,
    scale: scale === 1 ? 1 : scale,
  });

  const tween = gsap.to(elements, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration,
    delay,
    ease: "power3.out",
    stagger: stagger > 0 ? stagger : undefined,
    scrollTrigger: {
      id,
      trigger,
      start,
      once: true,
      invalidateOnRefresh: true,
    },
  });

  return () => {
    if (id) ScrollTrigger.getById(id)?.kill();
    tween.kill();
  };
}

/** Shell fade for a section wrapper, then staggered children */
export function revealSectionMoment(
  section: Element,
  options: {
    id: string;
    reducedMotion?: boolean;
    shell?: Element | null;
    children?: gsap.TweenTarget;
    childStagger?: number;
    childDelay?: number;
  },
): () => void {
  const cleanups: Array<() => void> = [];

  if (options.shell) {
    cleanups.push(
      revealOnScrollEnter(section, options.shell, {
        id: `${options.id}-shell`,
        reducedMotion: options.reducedMotion,
        y: 56,
        duration: 1,
      }),
    );
  }

  if (options.children) {
    cleanups.push(
      revealOnScrollEnter(section, options.children, {
        id: `${options.id}-children`,
        reducedMotion: options.reducedMotion,
        y: 36,
        stagger: options.childStagger ?? 0.1,
        duration: 0.85,
        delay: options.childDelay ?? 0.08,
        start: SECTION_REVEAL_START,
      }),
    );
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

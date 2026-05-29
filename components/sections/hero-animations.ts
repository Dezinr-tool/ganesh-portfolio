import type { Transition, Variants } from "framer-motion";

/** Framer-style smooth ease (matches Luzia / Framer portfolio templates) */
export const framerEase = [0.22, 1, 0.36, 1] as const;

export const framerEaseOut = [0.25, 0.1, 0.25, 1] as const;

export function getHeroTransitions(reduced: boolean | null) {
  if (reduced) {
    return {
      ganesh: { duration: 0 } satisfies Transition,
      photo: { duration: 0 } satisfies Transition,
      text: { duration: 0 } satisfies Transition,
      stagger: 0,
      textDelay: 0,
      badgeDelay: 0,
    };
  }

  return {
    ganesh: { duration: 0.85, ease: framerEase } satisfies Transition,
    photo: { duration: 0.85, delay: 0.55, ease: framerEase } satisfies Transition,
    text: { duration: 0.55, ease: framerEaseOut } satisfies Transition,
    stagger: 0.12,
    textDelay: 1.05,
    badgeDelay: 0.9,
  };
}

export function getGaneshVariants(reduced: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 1, scale: 1 },
      visible: { opacity: 1, scale: 1 },
    };
  }

  return {
    hidden: { opacity: 0, scale: 0.97 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.85, ease: framerEase },
    },
  };
}

export function getPhotoVariants(reduced: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 72 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, delay: 0.55, ease: framerEase },
    },
  };
}

/** Framer-style blur + rise for labels, headings, and body copy */
export function getFadeUpBlurVariants(reduced: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)" },
    };
  }

  return {
    hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.55, ease: framerEaseOut },
    },
  };
}

export const bottomContentVariants = (reduced: boolean | null): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reduced ? 0 : 0.12,
      delayChildren: reduced ? 0 : 1.05,
    },
  },
});

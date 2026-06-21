import gsap from "gsap";
import { registerGsapPlugins } from "@/lib/gsap-scroll";

export type TypographyScrollRevealOptions = {
  id: string;
  start?: string;
  end?: string;
  scrub?: number | boolean;
  stagger?: number;
  yFrom?: string;
};

export function staggerLettersFromCenter(letters: HTMLElement[]) {
  const center = (letters.length - 1) / 2;
  return letters
    .map((letter, index) => ({ letter, index }))
    .sort((a, b) => Math.abs(a.index - center) - Math.abs(b.index - center))
    .map(({ letter }) => letter);
}

export function bindTypographyScrollReveal(
  titleEl: HTMLElement,
  letterSelector: string,
  options: TypographyScrollRevealOptions,
): () => void {
  registerGsapPlugins();

  const letters = gsap.utils.toArray<HTMLElement>(
    titleEl.querySelectorAll(letterSelector),
  );
  if (!letters.length) return () => {};

  const ordered = staggerLettersFromCenter(letters);
  const yFrom = options.yFrom ?? "-120%";

  gsap.set(ordered, { y: yFrom });

  const tween = gsap.to(ordered, {
    y: "0%",
    ease: "none",
    stagger: options.stagger ?? 0.05,
    scrollTrigger: {
      id: options.id,
      trigger: titleEl,
      start: options.start ?? "top 100%",
      end: options.end ?? "bottom 30%",
      scrub: options.scrub ?? 1,
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

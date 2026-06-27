import gsap from "gsap";
import { registerGsapPlugins } from "@/lib/gsap-scroll";

export function lockParagraphHeights(paragraphs: HTMLElement[]) {
  paragraphs.forEach((paragraph) => {
    paragraph.style.height = `${paragraph.clientHeight}px`;
  });
}

/** MWG h-texts: chars appear in random order while scrubbing through the text pin. */
export function bindMwgCharReveal(
  trigger: HTMLElement,
  charSelector: string,
  options: {
    id: string;
    isMobile?: boolean;
    endExtraViewports?: number;
  },
): () => void {
  registerGsapPlugins();

  const chars = gsap.utils.toArray<HTMLElement>(
    trigger.querySelectorAll(charSelector),
  );
  if (!chars.length) return () => {};

  gsap.set(chars, { autoAlpha: 0 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      id: options.id,
      trigger,
      start: options.isMobile ? "60% bottom" : "top -10%",
      end: options.isMobile
        ? "bottom 80%"
        : () =>
            `bottom bottom+=${(options.endExtraViewports ?? 4) * window.innerHeight}`,
      scrub: true,
    },
  });

  timeline.to(chars, {
    autoAlpha: 1,
    stagger: { each: 0.2, from: "random" },
    ease: "none",
  });

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
  };
}

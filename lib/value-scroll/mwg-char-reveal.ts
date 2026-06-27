import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsapPlugins } from "@/lib/gsap-scroll";

export function lockParagraphHeights(paragraphs: HTMLElement[]) {
  paragraphs.forEach((paragraph) => {
    paragraph.style.height = `${paragraph.clientHeight}px`;
  });
}

/**
 * Random char build-up: chars start display:none (zero width), then pop in
 * one-by-one in random order as user scrolls — exactly like the reference effect.
 * Spaces are excluded so word gaps stay intact.
 */
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

  const allInners = Array.from(
    trigger.querySelectorAll<HTMLElement>(charSelector),
  );
  if (!allInners.length) return () => {};

  // Exclude space chars — keep them always visible so word gaps don't collapse
  const chars = allInners.filter(
    (el) => el.textContent !== " " && el.textContent?.trim() !== "",
  );

  // Build a shuffled reveal order
  const revealOrder = [...chars.keys()];
  for (let i = revealOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [revealOrder[i], revealOrder[j]] = [revealOrder[j]!, revealOrder[i]!];
  }
  const orderMap = new Array<number>(chars.length);
  revealOrder.forEach((charIdx, seqPos) => {
    orderMap[charIdx] = seqPos;
  });

  const total = chars.length;

  // Hide all chars initially
  chars.forEach((c) => c.classList.add("is-char-hidden"));

  const st = ScrollTrigger.create({
    id: options.id,
    trigger,
    start: options.isMobile ? "60% bottom" : "top -10%",
    end: options.isMobile
      ? "bottom 80%"
      : () =>
          `bottom bottom+=${(options.endExtraViewports ?? 4) * window.innerHeight}`,
    scrub: true,
    onUpdate(self) {
      const revealCount = Math.round(self.progress * total);
      chars.forEach((charEl, i) => {
        const shouldShow = (orderMap[i] ?? 0) < revealCount;
        const isHidden = charEl.classList.contains("is-char-hidden");
        if (shouldShow && isHidden) {
          charEl.classList.remove("is-char-hidden");
        } else if (!shouldShow && !isHidden) {
          charEl.classList.add("is-char-hidden");
        }
      });
    },
  });

  return () => {
    st.kill();
    chars.forEach((c) => c.classList.remove("is-char-hidden"));
  };
}

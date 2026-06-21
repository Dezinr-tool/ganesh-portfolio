import { ABOUT_TEXT } from "@/components/sections/about-content";
import type { RefObject, HTMLAttributes } from "react";

/** Scroll reveal palette — unrevealed gray / revealed black (no accent) */
const REVEAL_UNREVEALED = "#CCCCCC";
const REVEAL_ACTIVE = "#111111";

/** Trailing unrevealed letters at the reveal frontier get blur (soft edge) */
export const REVEAL_COPY_BLUR_TRAIL = 4;
const REVEAL_MAX_BLUR = 10;

type AboutRevealCopyProps = {
  bodyText?: string;
  className?: string;
  paragraphRef?: RefObject<HTMLParagraphElement | null>;
} & HTMLAttributes<HTMLParagraphElement>;

export function AboutRevealCopy({
  bodyText = ABOUT_TEXT,
  className = "",
  paragraphRef,
  ...rest
}: AboutRevealCopyProps) {
  return (
    <p
      ref={paragraphRef}
      className={`hero-reveal-copy text-body-lg ${className}`.trim()}
      {...rest}
    >
      <span className="hero-reveal-copy__body" data-reveal-line>
        {bodyText}
      </span>
    </p>
  );
}

function appendCharSpan(
  parent: HTMLElement,
  char: string,
  chars: HTMLSpanElement[],
) {
  const span = document.createElement("span");
  span.className = "hero-reveal-copy__char";
  span.setAttribute("aria-hidden", "true");
  span.textContent = char === " " ? "\u00a0" : char;
  parent.appendChild(span);
  chars.push(span);
}

function splitRevealLine(lineEl: HTMLElement) {
  const text = (lineEl.textContent ?? "").trim();
  lineEl.textContent = "";
  const chars: HTMLSpanElement[] = [];
  const words = text.split(/\s+/).filter(Boolean);

  for (const wordText of words) {
    const word = document.createElement("span");
    word.className = "hero-reveal-copy__word";
    for (const char of wordText) {
      appendCharSpan(word, char, chars);
    }
    lineEl.appendChild(word);
  }

  return chars;
}

/** Split paragraph into per-character spans for scroll-driven highlight */
export function splitRevealCopy(root: HTMLElement) {
  const lines = root.querySelectorAll<HTMLElement>("[data-reveal-line]");
  const chars: HTMLElement[] = [];

  lines.forEach((lineEl) => {
    chars.push(...splitRevealLine(lineEl));
  });

  return chars;
}

export type RevealCopyHighlightOptions = {
  blurTrail?: number;
  maxBlur?: number;
};

function setCharRevealStyle(
  el: HTMLElement,
  {
    color,
    opacity,
    blur,
    lit,
  }: {
    color: string;
    opacity: number;
    blur: number;
    lit: boolean;
  },
) {
  el.classList.toggle("is-lit", lit);
  el.classList.remove("is-edge-blur");
  el.style.visibility = "visible";
  el.style.opacity = String(opacity);
  el.style.color = color;
  el.style.filter = blur > 0 ? `blur(${blur.toFixed(1)}px)` : "none";
}

/** Gray unrevealed copy; blur only on the 3–4 chars at the reveal frontier */
export function applyRevealCopyHighlight(
  chars: HTMLElement[],
  progress: number,
  options: RevealCopyHighlightOptions = {},
) {
  const t = Math.min(1, Math.max(0, progress));
  const blurTrail = options.blurTrail ?? REVEAL_COPY_BLUR_TRAIL;
  const maxBlur = options.maxBlur ?? REVEAL_MAX_BLUR;
  const litCount =
    t >= 1 ? chars.length : Math.min(chars.length, Math.ceil(t * chars.length));

  if (t >= 1) {
    chars.forEach((el) => {
      setCharRevealStyle(el, {
        color: REVEAL_ACTIVE,
        opacity: 1,
        blur: 0,
        lit: true,
      });
    });
    return;
  }

  chars.forEach((el, i) => {
    if (i < litCount) {
      setCharRevealStyle(el, {
        color: REVEAL_ACTIVE,
        opacity: 1,
        blur: 0,
        lit: true,
      });
      return;
    }

    const distFromFrontier = i - litCount;
    let blurPx = 0;

    if (distFromFrontier < blurTrail) {
      const trailT = (blurTrail - distFromFrontier) / blurTrail;
      blurPx = trailT * maxBlur;
    }

    setCharRevealStyle(el, {
      color: REVEAL_UNREVEALED,
      opacity: 1,
      blur: blurPx,
      lit: false,
    });
  });
}

export function resetRevealCopyHighlight(
  chars: HTMLElement[],
  options: RevealCopyHighlightOptions = {},
) {
  applyRevealCopyHighlight(chars, 0, options);
}

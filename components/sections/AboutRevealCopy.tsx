import { ABOUT_TEXT } from "@/components/sections/about-content";
import type { RefObject } from "react";

const MUTED = "#3a3a3a";
const LIT = "#f0f0f0";

/** Blurred trailing edge on the highlighted portion (not on unrevealed copy) */
export const REVEAL_COPY_BLUR_TRAIL = 3;

type AboutRevealCopyProps = {
  className?: string;
  paragraphRef?: RefObject<HTMLParagraphElement | null>;
};

export function AboutRevealCopy({
  className = "",
  paragraphRef,
}: AboutRevealCopyProps) {
  return (
    <p
      ref={paragraphRef}
      className={`hero-reveal-copy text-body-lg ${className}`.trim()}
    >
      <span className="hero-reveal-copy__body" data-reveal-line>
        {ABOUT_TEXT}
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
  useBlur?: boolean;
};

function setCharRevealStyle(
  el: HTMLElement,
  {
    color,
    opacity,
    blur,
    lit,
    edgeBlur,
  }: {
    color: string;
    opacity: number;
    blur: number;
    lit: boolean;
    edgeBlur?: boolean;
  },
) {
  el.classList.toggle("is-lit", lit);
  el.classList.toggle("is-edge-blur", Boolean(edgeBlur));
  el.style.visibility = "visible";
  el.style.opacity = String(opacity);
  el.style.color = color;
  el.style.filter = blur > 0 ? `blur(${blur.toFixed(1)}px)` : "blur(0px)";
}

/** White highlight sweep; blur only on last 2–3 lit letters at the frontier */
export function applyRevealCopyHighlight(
  chars: HTMLElement[],
  progress: number,
  options: RevealCopyHighlightOptions = {},
) {
  const t = Math.min(1, Math.max(0, progress));
  const useBlur = options.useBlur ?? true;
  const blurTrail = options.blurTrail ?? REVEAL_COPY_BLUR_TRAIL;
  const maxBlur = options.maxBlur ?? 10;
  const litCount =
    t >= 1 ? chars.length : Math.min(chars.length, Math.ceil(t * chars.length));

  chars.forEach((el, i) => {
    if (i >= litCount) {
      setCharRevealStyle(el, {
        color: MUTED,
        opacity: 1,
        blur: 0,
        lit: false,
      });
      return;
    }

    const distFromFrontier = litCount - 1 - i;

    if (!useBlur || distFromFrontier >= blurTrail) {
      setCharRevealStyle(el, {
        color: LIT,
        opacity: 1,
        blur: 0,
        lit: true,
      });
      return;
    }

    const trailT = (blurTrail - distFromFrontier) / blurTrail;
    const blurPx = 2 + trailT * (maxBlur - 2);

    setCharRevealStyle(el, {
      color: LIT,
      opacity: 1,
      blur: blurPx,
      lit: true,
      edgeBlur: true,
    });
  });
}

export function resetRevealCopyHighlight(
  chars: HTMLElement[],
  options: RevealCopyHighlightOptions = {},
) {
  applyRevealCopyHighlight(chars, 0, options);
}

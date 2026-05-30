"use client";

import { mohave } from "@/app/fonts";
import { useGSAP } from "@gsap/react";
import { animateRevealOnScroll } from "@/lib/gsap-scroll";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

const TAGLINE =
  "Design & strategy partner for founders building products people love.";

const WORK_EMAIL = "hello@designbyganesh.com";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://linkedin.com/in/ganeshdas" },
  { label: "Dribbble", href: "https://dribbble.com/ganeshdas" },
  { label: "X", href: "https://twitter.com/ganeshdas" },
] as const;

const METALLIC_TEXT_STYLE = {
  backgroundImage:
    "linear-gradient(105deg, #5c5c5c 0%, #e8e8e8 14%, #9a9a9a 28%, #f4f4f4 42%, #7a7a7a 56%, #dcdcdc 70%, #8f8f8f 84%, #c8c8c8 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const footer = footerRef.current;
      const content = contentRef.current;

      if (!footer || !content) return;

      animateRevealOnScroll(content, {
        trigger: footer,
        y: 16,
        duration: 0.6,
        reducedMotion,
      });
    },
    { scope: footerRef, dependencies: [reducedMotion] },
  );

  return (
    <footer
      ref={footerRef}
      className="relative z-10 bg-[#000] px-6 py-16 text-white md:px-20 md:py-24"
      aria-label="Site footer"
    >
      <div ref={contentRef} className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 md:flex-row md:items-stretch md:gap-10 lg:gap-16">
          {/* Monogram — left column, bleeds vertically */}
          <div
            className="relative flex shrink-0 items-center justify-center overflow-hidden md:w-[45%] md:max-w-[480px] md:justify-start"
            aria-hidden="true"
          >
            <div
              className={`${mohave.className} relative flex w-full select-none leading-[0.78] tracking-[-0.04em]`}
              style={{ fontSize: "clamp(7rem, 22vw, 14rem)" }}
            >
              <span
                className="relative z-[1] -translate-y-[6%] will-change-transform"
                style={METALLIC_TEXT_STYLE}
              >
                G
              </span>
              <span
                className="relative z-0 -ml-[0.12em] translate-y-[8%] will-change-transform"
                style={METALLIC_TEXT_STYLE}
              >
                D
              </span>
            </div>
          </div>

          {/* Copy + contact — right column */}
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-16 md:gap-20 md:py-2">
            <p className="max-w-md text-left text-[clamp(1.125rem,2.2vw,1.5rem)] font-medium leading-[1.35] text-white">
              {TAGLINE}
            </p>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <a
                href={`mailto:${WORK_EMAIL}`}
                className="text-left text-[15px] font-normal text-white/90 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
              >
                For work:{" "}
                <span className="text-white">{WORK_EMAIL}</span>
              </a>

              <nav
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-white/90 sm:justify-end"
                aria-label="Social links"
              >
                {SOCIAL_LINKS.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
                  >
                    ({social.label})
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-[13px] text-white/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Ganesh Das</p>
          <a
            href="https://designbyganesh.com"
            className="transition-colors duration-200 hover:text-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            designbyganesh.com
          </a>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import {
  animateBodyCopyOnScroll,
  animateHeadingWordsOnScroll,
  animateRevealOnScroll,
  registerGsapPlugins,
  splitWords,
} from "@/lib/gsap-scroll";
import { smoothScrollTo } from "@/lib/lenis-scroll";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChrHoverLink } from "@/components/ui/ChrHoverLink";
import { useReducedMotion } from "framer-motion";
import { useCallback, useRef } from "react";
import { useFooterMonogramParallax } from "./useFooterMonogramParallax";
import "./footer-dome.css";

const TAGLINE =
  "Bridging the gap between founders and the digital experiences they deserve.";

const WORK_EMAIL = "hello@designbyganesh.com";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://linkedin.com/in/ganeshdas" },
  { label: "Dribbble", href: "https://dribbble.com/ganeshdas" },
  { label: "X", href: "https://twitter.com/ganeshdas" },
] as const;

const METALLIC_TEXT_STYLE = {
  backgroundImage:
    "linear-gradient(105deg, #4a4a4a 0%, #e8e8e8 12%, #8a8a8a 24%, #f4f4f4 36%, #6e6e6e 48%, #dcdcdc 60%, #7a7a7a 72%, #c4c4c4 84%, #9a9a9a 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  filter: "drop-shadow(0 2px 24px rgba(0, 0, 0, 0.08))",
} as const;

/** Reference: blob scale 0→1 over first 60% of scrub timeline */
const BLOB_RISE_END = 0.6;
/** Reference: chrome fades at ~10% progress */
const CHROME_FADE_AT = 0.1;
const CHROME_FADE_DUR = 0.08;
/** Reference: title enters at 18% */
const TITLE_REVEAL_AT = 0.18;
const TITLE_REVEAL_DUR = 0.3;
/** Reference: socials clip at 28%, mail at 36% */
const SOCIAL_REVEAL_AT = 0.28;
const SOCIAL_REVEAL_DUR = 0.2;
const CONTACT_REVEAL_AT = 0.36;
const CONTACT_REVEAL_DUR = 0.2;
const TAGLINE_REVEAL_AT = 0.22;
const COPYRIGHT_REVEAL_AT = 0.42;

type FooterContentProps = {
  monogramColumnRef: React.RefObject<HTMLDivElement | null>;
  monogramRef: React.RefObject<HTMLDivElement | null>;
  taglineRef: React.RefObject<HTMLParagraphElement | null>;
  contactRef: React.RefObject<HTMLDivElement | null>;
  socialRef: React.RefObject<HTMLElement | null>;
  copyrightRef: React.RefObject<HTMLParagraphElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

function FooterContent({
  monogramColumnRef,
  monogramRef,
  taglineRef,
  contactRef,
  socialRef,
  copyrightRef,
  contentRef,
}: FooterContentProps) {
  return (
    <div ref={contentRef} className="footer-reveal-content" data-footer-content>
      <div className="grid min-h-[min(78vh,820px)] flex-1 grid-cols-1 md:grid-cols-2">
        <div
          ref={monogramColumnRef}
          className="flex items-center justify-center overflow-hidden px-8 py-14 md:px-12 md:py-20 lg:px-16 xl:px-20"
          aria-hidden="true"
        >
          <div
            ref={monogramRef}
            className="relative flex w-full max-w-[min(100%,520px)] select-none font-bold leading-[0.72] tracking-[-0.05em] will-change-transform md:max-w-none"
            style={{ fontSize: "clamp(7rem, 28vw, 18rem)" }}
          >
            <span
              data-footer-letter
              className="relative z-[1] -translate-y-[8%] will-change-transform"
              style={METALLIC_TEXT_STYLE}
            >
              G
            </span>
            <span
              data-footer-letter
              className="relative z-0 -ml-[0.14em] translate-y-[10%] will-change-transform"
              style={METALLIC_TEXT_STYLE}
            >
              D
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-16 px-8 py-14 md:gap-0 md:px-12 md:py-20 lg:px-16 xl:px-20">
          <p
            ref={taglineRef}
            className="footer-tagline max-w-[28rem] text-left text-[clamp(1.2rem,2.2vw,1.65rem)] font-medium leading-[1.32] tracking-[-0.01em] lg:max-w-[32rem]"
          >
            {splitWords(TAGLINE).map(({ word, key }, index, arr) => (
              <span
                key={key}
                data-split-word
                className="mr-[0.22em] inline-block last:mr-0"
              >
                {word}
                {index < arr.length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </p>

          <div ref={contactRef} className="flex flex-col gap-2" id="footer-contact">
            <p className="footer-meta text-[13px] font-normal tracking-[0.02em]">
              For work:
            </p>
            <ChrHoverLink
              href={`mailto:${WORK_EMAIL}`}
              text={WORK_EMAIL}
              aria-label={`Email ${WORK_EMAIL}`}
              className="footer-email text-left text-[clamp(1rem,1.6vw,1.25rem)] font-normal transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
            />
          </div>

          <nav
            ref={socialRef}
            className="footer-social-nav flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]"
            aria-label="Social links"
          >
            {SOCIAL_LINKS.map((social) => (
              <ChrHoverLink
                key={social.label}
                href={social.href}
                text={`(${social.label})`}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
              />
            ))}
          </nav>
        </div>
      </div>

      <p
        ref={copyrightRef}
        className="footer-copyright px-8 pb-8 text-[12px] md:px-12 lg:px-16 xl:px-20"
      >
        © {new Date().getFullYear()} Ganesh Das
      </p>
    </div>
  );
}

function setStageVisible(
  bg: HTMLElement | null,
  blobWrap: HTMLElement | null,
  visible: boolean,
) {
  bg?.classList.toggle("is-visible", visible);
  blobWrap?.classList.toggle("is-visible", visible);
}

export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const blobWrapRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const monogramColumnRef = useRef<HTMLDivElement>(null);
  const monogramRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLElement>(null);
  const copyrightRef = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const isAnimated = !reducedMotion;

  useFooterMonogramParallax({
    scopeRef: monogramColumnRef,
    monogramRef,
    reducedMotion,
  });

  const scrollToFullReveal = useCallback(() => {
    if (reducedMotion) {
      document.getElementById("footer-contact")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return;
    }

    const st = ScrollTrigger.getById("footer-reveal");
    if (st) {
      const target = Math.max(0, st.end - window.innerHeight * 0.02);
      smoothScrollTo(target, { duration: 1.2 });
      return;
    }

    smoothScrollTo("#footer", { duration: 1.2 });
  }, [reducedMotion]);

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      const bg = bgRef.current;
      const blobWrap = blobWrapRef.current;
      const blob = blobRef.current;
      const chrome = chromeRef.current;
      const content = contentRef.current;
      const monogram = monogramRef.current;
      const taglineWords = taglineRef.current?.querySelectorAll(
        "[data-split-word]",
      );
      const emailLink = contactRef.current?.querySelector(".footer-email");

      if (!section || !blob || !content) return;

      if (reducedMotion) {
        gsap.set(content, { opacity: 1, y: 0 });

        const monogramLetters = monogram?.querySelectorAll("[data-footer-letter]");
        if (monogramLetters?.length) {
          animateRevealOnScroll(monogramLetters, {
            trigger: content,
            y: 28,
            stagger: 0.12,
            duration: 0.75,
            reducedMotion: true,
          });
        }

        if (taglineWords?.length) {
          animateHeadingWordsOnScroll(taglineWords, content, true, 0.05);
        }

        if (contactRef.current) {
          animateBodyCopyOnScroll(contactRef.current, content, true, 0.14);
        }

        if (socialRef.current) {
          animateBodyCopyOnScroll(socialRef.current, content, true, 0.22);
        }

        if (copyrightRef.current) {
          animateBodyCopyOnScroll(copyrightRef.current, content, true, 0.26);
        }

        return;
      }

      setStageVisible(bg, blobWrap, false);

      ScrollTrigger.create({
        id: "footer-stage",
        trigger: section,
        start: "top bottom",
        end: "bottom bottom",
        onEnter: () => setStageVisible(bg, blobWrap, true),
        onLeave: () => setStageVisible(bg, blobWrap, false),
        onEnterBack: () => setStageVisible(bg, blobWrap, true),
        onLeaveBack: () => setStageVisible(bg, blobWrap, false),
      });

      gsap.set(blob, {
        xPercent: -50,
        yPercent: 50,
        scale: 0,
        transformOrigin: "50% 50%",
      });

      if (monogram) {
        gsap.set(monogram, {
          x: () => window.innerWidth * 1.1,
        });
      }

      if (taglineWords?.length) {
        gsap.set(taglineWords, { opacity: 0, y: 24 });
      }

      if (copyrightRef.current) {
        gsap.set(copyrightRef.current, { opacity: 0, y: 12 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "footer-reveal",
          trigger: section,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        blob,
        { scale: 0 },
        { scale: 1, duration: BLOB_RISE_END, ease: "none" },
        0,
      );

      if (chrome) {
        tl.to(
          chrome,
          { opacity: 0, duration: CHROME_FADE_DUR, ease: "none" },
          CHROME_FADE_AT,
        );
      }

      if (monogram) {
        tl.to(
          monogram,
          {
            x: 0,
            duration: TITLE_REVEAL_DUR,
            ease: "power3.out",
          },
          TITLE_REVEAL_AT,
        );
      }

      if (taglineWords?.length) {
        tl.to(
          taglineWords,
          {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            duration: 0.22,
            ease: "power3.out",
          },
          TAGLINE_REVEAL_AT,
        );
      }

      if (socialRef.current) {
        tl.fromTo(
          socialRef.current,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: SOCIAL_REVEAL_DUR,
            ease: "none",
          },
          SOCIAL_REVEAL_AT,
        );
      }

      if (emailLink) {
        tl.fromTo(
          emailLink,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: CONTACT_REVEAL_DUR,
            ease: "none",
          },
          CONTACT_REVEAL_AT,
        );
      }

      if (contactRef.current) {
        gsap.set(contactRef.current.querySelector(".footer-meta"), {
          opacity: 0,
        });
        tl.to(
          contactRef.current.querySelector(".footer-meta"),
          { opacity: 1, duration: 0.12, ease: "none" },
          CONTACT_REVEAL_AT,
        );
      }

      if (copyrightRef.current) {
        tl.to(
          copyrightRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.18,
            ease: "power3.out",
          },
          COPYRIGHT_REVEAL_AT,
        );
      }

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        ScrollTrigger.getById("footer-stage")?.kill();
        ScrollTrigger.getById("footer-reveal")?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <footer
      ref={sectionRef}
      id="footer"
      className={`footer-reveal-section relative w-full ${
        isAnimated
          ? "footer-reveal-section--animated"
          : "footer-reveal-section--static"
      }`}
      aria-label="Site footer"
    >
      {isAnimated ? (
        <>
          <div ref={bgRef} className="footer-reveal-bg" aria-hidden="true" />
          <div ref={blobWrapRef} className="footer-blob-wrap" aria-hidden="true">
            <div ref={blobRef} className="footer-blob" data-footer-blob />
          </div>
        </>
      ) : null}

      <div ref={pinRef} className="footer-reveal-pin">
        {isAnimated ? (
          <div
            ref={chromeRef}
            className="footer-reveal-chrome"
            aria-hidden="true"
          >
            <span className="footer-reveal-label">(07)</span>
            <button
              type="button"
              className="footer-reveal-label footer-reveal-label--interactive"
              onClick={scrollToFullReveal}
              aria-label="Reveal contact section"
            >
              Contact
            </button>
          </div>
        ) : null}

        <FooterContent
          monogramColumnRef={monogramColumnRef}
          monogramRef={monogramRef}
          taglineRef={taglineRef}
          contactRef={contactRef}
          socialRef={socialRef}
          copyrightRef={copyrightRef}
          contentRef={contentRef}
        />
      </div>
    </footer>
  );
}

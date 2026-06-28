"use client";

import { useGSAP } from "@gsap/react";
import { animateRevealOnScroll, registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { SiteSettings, SocialLinks } from "@/lib/content";
import { phoneHref, splitEmailLines, splitLines } from "@/lib/content-utils";
import "./footer-dome.css";

const FOOTER_BLACK = "#111111";

/** Tier 1 — left column (reference: ABOUT ME / SERVICES / WORKS) */
const PRIMARY_NAV_LINKS = [
  { label: "About Me", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Works", href: "#works" },
] as const;

/** Tier 2 — full-width bracket row */
function buildBracketNavLinks(socialLinks: SocialLinks) {
  return [
    socialLinks.dribbble
      ? { label: "[ DRIBBBLE ]", href: socialLinks.dribbble }
      : null,
    socialLinks.behance ? { label: "[ BEHANCE ]", href: socialLinks.behance } : null,
    socialLinks.linkedin
      ? { label: "[ LINKEDIN ]", href: socialLinks.linkedin }
      : null,
    socialLinks.instagram
      ? { label: "[ INSTAGRAM ]", href: socialLinks.instagram }
      : null,
  ].filter(Boolean) as { label: string; href: string }[];
}

export type FooterContent = {
  siteSettings: SiteSettings;
  socialLinks: SocialLinks;
};

const ADDRESS_FALLBACK = [
  "3101, Venus, Forest Enclave, Hiranandani",
  "Fortunecity, Maharashtra 410207",
];

/** Content appears once the circle reaches ~50% expansion. */
const CONTENT_FADE_START = 0.5;
const CONTENT_FADE_DUR = 0.5;
/** ScrollTrigger range — long distance + scrub lag for a slow, intentional reveal. */
const FOOTER_SCROLL_START = "top 70%";
const FOOTER_SCROLL_END = "bottom 20%";
const FOOTER_SCRUB = 3;

function FooterLocationClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    };

    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="footer-location">
      <p className="footer-location__city">Mumbai, India:</p>
      <p className="footer-location__time" aria-live="polite">
        (IST) {time || "—:—"}
      </p>
    </div>
  );
}

function setCircleStageVisible(circle: HTMLElement | null, visible: boolean) {
  circle?.classList.toggle("is-visible", visible);
}

export function Footer({ siteSettings, socialLinks }: FooterContent) {
  const email = siteSettings.email ?? "";
  const [emailLine1, emailLine2] = splitEmailLines(email);
  const phone = siteSettings.phone ?? "";
  const phoneLink = phoneHref(phone);
  const addressLines = splitLines(siteSettings.location, ADDRESS_FALLBACK);
  const siteName = siteSettings.siteName ?? "Ganesh Das";
  const copyrightLines = splitLines(siteSettings.footerCopyright, [
    "All Right Reserved. Ganesh Das.",
    "Any Reproduction, Distribution, Or Use Of The",
    "Materials Without Permission Is Prohibited.",
  ]);
  const bracketNavLinks = buildBracketNavLinks(socialLinks);
  const sectionRef = useRef<HTMLElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const isAnimated = !reducedMotion;

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      const runway = runwayRef.current;
      const circle = circleRef.current;
      const content = contentRef.current;
      const pin = pinRef.current;
      const scrollProgress = document.querySelector<HTMLElement>(".scroll-progress");

      if (!section || !runway || !content || !pin) return;

      if (reducedMotion || !circle) {
        animateRevealOnScroll(content, {
          trigger: runway,
          y: 24,
          duration: 0.7,
          reducedMotion: true,
        });
        return;
      }

      const isMobile = window.matchMedia("(max-width: 56.25rem)").matches;

      // On mobile, the circle clipPath animation + ScrollTrigger scrub is unreliable
      // on iOS (lenis.scroll may not update, leaving content at opacity:0 forever).
      if (isMobile) {
        setCircleStageVisible(circle, true);
        gsap.set(circle, { clipPath: "circle(150% at 50% 100%)", backgroundColor: FOOTER_BLACK });
        gsap.set(content, { opacity: 1, y: 0 });
        return;
      }

      setCircleStageVisible(circle, false);

      ScrollTrigger.create({
        id: "footer-circle-stage",
        trigger: runway,
        start: FOOTER_SCROLL_START,
        end: FOOTER_SCROLL_END,
        onEnter: () => setCircleStageVisible(circle, true),
        onEnterBack: () => setCircleStageVisible(circle, true),
        onLeaveBack: () => setCircleStageVisible(circle, false),
      });

      gsap.set(circle, {
        clipPath: "circle(0% at 50% 100%)",
        backgroundColor: FOOTER_BLACK,
      });
      gsap.set(content, { opacity: 0, y: 36 });

      const contentFadeStart = CONTENT_FADE_START;
      const scrub = FOOTER_SCRUB;

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "footer-circle-reveal",
          trigger: runway,
          start: FOOTER_SCROLL_START,
          end: FOOTER_SCROLL_END,
          pin,
          scrub,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        circle,
        { clipPath: "circle(0% at 50% 100%)" },
        {
          clipPath: "circle(150% at 50% 100%)",
          duration: 1,
          ease: "none",
        },
        0,
      );

      tl.fromTo(
        content,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: CONTENT_FADE_DUR, ease: "none" },
        contentFadeStart,
      );

      if (scrollProgress) {
        tl.fromTo(
          scrollProgress,
          { opacity: 1 },
          { opacity: 0, duration: 0.08, ease: "none" },
          contentFadeStart,
        );
      }

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      requestAnimationFrame(() => scheduleScrollTriggerRefresh());

      return () => {
        window.removeEventListener("resize", onResize);
        ScrollTrigger.getById("footer-circle-stage")?.kill();
        ScrollTrigger.getById("footer-circle-reveal")?.kill();
        tl.kill();
        if (scrollProgress) gsap.set(scrollProgress, { clearProps: "opacity" });
        setCircleStageVisible(circle, false);
        gsap.set(circle, { clearProps: "clipPath" });
        gsap.set(content, { clearProps: "opacity,transform" });
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <footer
      ref={sectionRef}
      id="footer"
      className={`footer-reveal-section ${
        isAnimated ? "footer-reveal-section--animated" : "footer-reveal-section--static"
      }`}
      aria-label="Contact"
    >
      {isAnimated ? (
        <div ref={circleRef} className="footer-circle-reveal" aria-hidden="true" />
      ) : null}

      <div ref={runwayRef} className="footer-runway">
        <div ref={pinRef} className="footer-pin">
          <div ref={contentRef} className="footer-content">
            <div className="footer-top">
              <div className="footer-contact-row">
                <nav className="footer-location footer-contact-row__nav" aria-label="Footer navigation">
                  {PRIMARY_NAV_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="footer-nav-link">
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="footer-location footer-address footer-contact-row__address">
                  {addressLines.map((line) => (
                    <p key={line} className="footer-location__time">
                      {line}
                    </p>
                  ))}
                </div>

                <a href={phoneLink} className="footer-phone footer-contact-row__phone">
                  {phone}
                </a>

                <a
                  href={`mailto:${email}`}
                  className="footer-email footer-contact-row__email-line-1"
                  aria-label={`Email ${email}`}
                >
                  <span className="footer-email__line">{emailLine1}</span>
                </a>

                <a
                  href={`mailto:${email}`}
                  className="footer-email footer-contact-row__email-line-2"
                >
                  <span className="footer-email__line">{emailLine2}</span>
                </a>
              </div>

              <nav className="footer-nav" aria-label="Portfolio links">
                {bracketNavLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="footer-nav-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="footer-bottom">
              <h2 className="footer-name" aria-label={siteName}>
                {siteName.toUpperCase()}
              </h2>

              <div className="footer-meta">
                <FooterLocationClock />
                <p className="footer-copy">
                  {new Date().getFullYear()} {copyrightLines[0]}
                  {copyrightLines.slice(1).map((line) => (
                    <span key={line}>
                      <br />
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import { animateRevealOnScroll, registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import "./footer-dome.css";

const WORK_EMAIL = "hello@designbyganesh.com";
const WORK_EMAIL_LINE_1 = "hello@designby";
const WORK_EMAIL_LINE_2 = "ganesh.com";
const WORK_PHONE = "73044 92888";
const WORK_PHONE_HREF = "tel:+917304492888";
const FOOTER_BLACK = "#111111";

/** Tier 1 — left column (reference: ABOUT ME / SERVICES / WORKS) */
const PRIMARY_NAV_LINKS = [
  { label: "About Me", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Works", href: "#works" },
] as const;

/** Tier 2 — full-width bracket row */
const BRACKET_NAV_LINKS = [
  { label: "[ DRIBBBLE ]", href: "https://dribbble.com/ganeshdas" },
  { label: "[ BEHANCE ]", href: "https://behance.net/ganeshdas" },
  { label: "[ LINKEDIN ]", href: "https://linkedin.com/in/ganeshdas" },
] as const;

const ADDRESS_LINE_1 = "3101, Venus, Forest Enclave, Hiranandani";
const ADDRESS_LINE_2 = "Fortunecity, Maharashtra 410207";

/** Olha-style: content appears once the semicircle covers ~half the viewport. */
const CONTENT_FADE_START = 0.42;
const CONTENT_FADE_DUR = 0.58;
/** Scroll distance for full circle expansion — longer = slower reveal. */
const FOOTER_SCROLL_DISTANCE = "+=80vh";
const FOOTER_CIRCLE_EASE = "power2.inOut";

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

export function Footer() {
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

      const isDesktop = window.matchMedia("(min-width: 901px)").matches;

      if (reducedMotion || !isDesktop || !circle) {
        animateRevealOnScroll(content, {
          trigger: runway,
          y: 24,
          duration: 0.7,
          reducedMotion: true,
        });
        return;
      }

      setCircleStageVisible(circle, false);

      ScrollTrigger.create({
        id: "footer-circle-stage",
        trigger: runway,
        start: "top bottom",
        end: FOOTER_SCROLL_DISTANCE,
        onEnter: () => setCircleStageVisible(circle, true),
        onEnterBack: () => setCircleStageVisible(circle, true),
        onLeaveBack: () => setCircleStageVisible(circle, false),
      });

      gsap.set(circle, {
        clipPath: "circle(0% at 50% 100%)",
        backgroundColor: FOOTER_BLACK,
      });
      gsap.set(content, { opacity: 0, y: 36 });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "footer-circle-reveal",
          trigger: runway,
          start: "top bottom",
          end: FOOTER_SCROLL_DISTANCE,
          pin,
          scrub: true,
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
          ease: FOOTER_CIRCLE_EASE,
        },
        0,
      );

      tl.fromTo(
        content,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: CONTENT_FADE_DUR, ease: "power2.out" },
        CONTENT_FADE_START,
      );

      if (scrollProgress) {
        tl.fromTo(
          scrollProgress,
          { opacity: 1 },
          { opacity: 0, duration: 0.08, ease: "none" },
          CONTENT_FADE_START,
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
                  <p className="footer-location__time">{ADDRESS_LINE_1}</p>
                  <p className="footer-location__time">{ADDRESS_LINE_2}</p>
                </div>

                <a href={WORK_PHONE_HREF} className="footer-phone footer-contact-row__phone">
                  {WORK_PHONE}
                </a>

                <a
                  href={`mailto:${WORK_EMAIL}`}
                  className="footer-email footer-contact-row__email-line-1"
                  aria-label={`Email ${WORK_EMAIL}`}
                >
                  <span className="footer-email__line">{WORK_EMAIL_LINE_1}</span>
                </a>

                <a
                  href={`mailto:${WORK_EMAIL}`}
                  className="footer-email footer-contact-row__email-line-2"
                >
                  <span className="footer-email__line">{WORK_EMAIL_LINE_2}</span>
                </a>
              </div>

              <nav className="footer-nav" aria-label="Portfolio links">
                {BRACKET_NAV_LINKS.map((link) => (
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
              <h2 className="footer-name" aria-label="Ganesh Das">
                GANESH DAS
              </h2>

              <div className="footer-meta">
                <FooterLocationClock />
                <p className="footer-copy">
                  {new Date().getFullYear()} All Right Reserved. Ganesh Das.
                  <br />
                  Any Reproduction, Distribution, Or Use Of The
                  <br />
                  Materials Without Permission Is Prohibited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

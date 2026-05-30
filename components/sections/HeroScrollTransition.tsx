"use client";

import { AboutRevealCopy } from "@/components/sections/AboutRevealCopy";
import { HeroRevealCircles } from "@/components/sections/HeroRevealCircles";
import { buildHeroRevealTimeline } from "@/components/sections/hero-reveal-timeline";
import { placeNameAtFooter } from "@/components/sections/hero-name-placement";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

function waitForStableLayout() {
  return new Promise<void>((resolve) => {
    const done = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    if (document.readyState === "complete") {
      done();
      return;
    }
    window.addEventListener("load", done, { once: true });
  });
}

export function HeroScrollTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const revealPanelRef = useRef<HTMLDivElement>(null);
  const circlesSvgRef = useRef<SVGSVGElement>(null);
  const revealCopyRef = useRef<HTMLParagraphElement>(null);
  const setupDoneRef = useRef(false);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reducedMotion) return;

    let anchored = true;
    const refreshName = () => {
      if (!anchored) return;
      const content = document.querySelector<HTMLElement>("[data-name-content]");
      if (content) placeNameAtFooter(content);
    };

    window.addEventListener("hero-name-placed", refreshName);
    window.addEventListener("hero-scroll-started", () => {
      anchored = false;
    });
    window.addEventListener("resize", refreshName);

    return () => {
      window.removeEventListener("hero-name-placed", refreshName);
      window.removeEventListener("resize", refreshName);
    };
  }, [reducedMotion]);

  useGSAP(
    () => {
      registerGsapPlugins();
      if (reducedMotion) return;

      let cancelled = false;

      const trySetup = async () => {
        if (cancelled || setupDoneRef.current) return;

        await waitForStableLayout();
        if (cancelled || setupDoneRef.current) return;

        const wrap = wrapRef.current;
        const heroStage = heroStageRef.current;
        const aboutSection = aboutSectionRef.current;
        const revealPanel = revealPanelRef.current;
        const nameLayer = document.getElementById("name-layer");
        const nameContent = document.querySelector<HTMLElement>(
          "[data-name-content]",
        );
        const nameLeft = document.querySelector<HTMLElement>("[data-name-left]");
        const nameRight = document.querySelector<HTMLElement>(
          "[data-name-right]",
        );
        const photo = document.querySelector<HTMLElement>("[data-hero-photo]");

        if (
          !wrap ||
          !heroStage ||
          !aboutSection ||
          !revealPanel ||
          !nameContent ||
          !nameLeft ||
          !nameRight ||
          nameLayer?.dataset.namePlaced !== "true"
        ) {
          return;
        }

        buildHeroRevealTimeline({
          wrap,
          heroStage,
          aboutSection,
          revealPanel,
          circlesSvg: circlesSvgRef.current,
          revealCopy: revealCopyRef.current,
          nameContent,
          nameLeft,
          nameRight,
          photo,
          nameLayer,
          heroSection: document.getElementById("hero"),
        });

        setupDoneRef.current = true;
        scheduleScrollTriggerRefresh();
      };

      const onPlaced = () => {
        void trySetup();
      };

      void trySetup();
      window.addEventListener("hero-name-placed", onPlaced);

      const retryTimer = window.setInterval(() => {
        if (cancelled || setupDoneRef.current) {
          window.clearInterval(retryTimer);
          return;
        }
        if (document.getElementById("name-layer")?.dataset.namePlaced === "true") {
          void trySetup();
        }
      }, 250);

      return () => {
        cancelled = true;
        setupDoneRef.current = false;
        window.clearInterval(retryTimer);
        window.removeEventListener("hero-name-placed", onPlaced);
        ScrollTrigger.getById("hero-scroll-transition")?.kill();
        ScrollTrigger.getById("about-scroll-reveal")?.kill();
        ScrollTrigger.getById("about-work-exit")?.kill();
        ScrollTrigger.getById("about-work-phrase-exit")?.kill();
        ScrollTrigger.getById("hero-reveal-hide")?.kill();
      };
    },
    {
      scope: rootRef,
      dependencies: [reducedMotion],
      revertOnUpdate: true,
    },
  );

  if (reducedMotion) {
    return (
      <div ref={rootRef}>
        <div className="relative min-h-dvh">{children}</div>
        <section
          id="about"
          className="hero-about-section hero-about-section--static"
          aria-label="About me"
        >
          <div className="hero-reveal-panel hero-reveal-panel--static">
            <div className="hero-reveal-stack">
              <div className="hero-reveal-circles" aria-hidden="true">
                <HeroRevealCircles svgRef={circlesSvgRef} />
              </div>
              <AboutRevealCopy />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <div ref={wrapRef} id="scroll-wrap" className="hero-scroll-wrap">
        <div ref={heroStageRef} className="hero-scroll-stage">
          {children}

          <section
            ref={aboutSectionRef}
            id="about"
            className="hero-about-section"
            aria-label="About me"
          >
            <div ref={revealPanelRef} className="hero-reveal-panel">
              <div className="hero-reveal-stack">
                <div className="hero-reveal-circles" aria-hidden="true">
                  <HeroRevealCircles svgRef={circlesSvgRef} />
                </div>
                <AboutRevealCopy paragraphRef={revealCopyRef} />
              </div>

              <div className="hero-reveal-frame" aria-hidden="true">
                <span className="hero-reveal-corner tl" />
                <span className="hero-reveal-corner tr" />
                <span className="hero-reveal-corner bl" />
                <span className="hero-reveal-corner br" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

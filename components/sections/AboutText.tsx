"use client";

import {
  AboutRevealCopy,
  applyRevealCopyHighlight,
  splitRevealCopy,
} from "@/components/sections/AboutRevealCopy";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";

type AboutTextProps = {
  sectionLabel: string;
  bodyText: string;
};

export function AboutText({ sectionLabel, bodyText }: AboutTextProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const copyRoot = copyRef.current;
      if (!section || !copyRoot) return;

      registerGsapPlugins();

      if (reducedMotion) {
        return;
      }

      const isMobile = window.matchMedia("(max-width: 48rem)").matches;

      const chars = splitRevealCopy(copyRoot);

      // On mobile: skip the pin (200% extra height locks Lenis scroll on iOS).
      // Just reveal all chars and ensure label is visible.
      if (isMobile) {
        applyRevealCopyHighlight(chars, 1);
        const label = section.querySelector<HTMLElement>(".text-consultant-label");
        if (label) gsap.set(label, { autoAlpha: 1, y: 0 });
        return;
      }

      const pinZIndex = 100;

      const setPinned = (pinned: boolean) => {
        gsap.set(section, { zIndex: pinned ? pinZIndex : 20 });
      };

      ScrollTrigger.create({
        id: "about-copy-highlight",
        trigger: section,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => applyRevealCopyHighlight(chars, self.progress),
        onEnter: () => setPinned(true),
        onEnterBack: () => setPinned(true),
        onLeave: () => {
          setPinned(false);
          applyRevealCopyHighlight(chars, 1);
        },
        onLeaveBack: () => setPinned(false),
      });

      return () => {
        ScrollTrigger.getById("about-copy-highlight")?.kill();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="about-scroll-section relative isolate z-20 flex h-svh min-h-svh w-full items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]"
      aria-label="About me"
    >
      <div className="mx-auto flex w-full max-w-[min(96vw,76rem)] flex-col items-start px-5 text-left sm:items-center sm:text-center sm:px-8 lg:px-12">
        <p className="text-consultant-label mb-6 text-[var(--color-text)]">
          <span className="uppercase">{sectionLabel}</span>
        </p>
        <AboutRevealCopy
          bodyText={bodyText}
          paragraphRef={copyRef}
          className="w-full !max-w-[min(96vw,76rem)]"
        />
      </div>
    </section>
  );
}

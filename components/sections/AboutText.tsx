"use client";

import {
  AboutRevealCopy,
  applyRevealCopyHighlight,
  splitRevealCopy,
} from "@/components/sections/AboutRevealCopy";
import { useGSAP } from "@gsap/react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";

export function AboutText() {
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

      const chars = splitRevealCopy(copyRoot);

      ScrollTrigger.create({
        id: "about-copy-highlight",
        trigger: section,
        start: "top top",
        end: "+=120%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => applyRevealCopyHighlight(chars, self.progress),
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
      className="relative isolate z-10 flex h-svh min-h-svh w-full items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]"
      aria-label="About me"
    >
      <div className="mx-auto flex w-full max-w-[min(94vw,56rem)] flex-col items-center px-8 text-center sm:px-12 lg:px-16">
        <p className="text-consultant-label mb-6 text-[var(--color-text)]">
          <span className="uppercase">I don&apos;t just solve problems</span>
        </p>
        <AboutRevealCopy
          paragraphRef={copyRef}
          className="w-full !max-w-[min(94vw,56rem)]"
        />
      </div>
    </section>
  );
}

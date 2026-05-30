"use client";

import { useGSAP } from "@gsap/react";
import {
  animateHeadingOnScroll,
  animateRevealOnScroll,
} from "@/lib/gsap-scroll";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";

const TOOL_GROUPS = [
  {
    label: "DESIGN TOOLS",
    tools: [
      { name: "Figma", icon: "🎨" },
      { name: "Adobe Illustrator", icon: "✏️" },
      { name: "Photoshop", icon: "🖼️" },
      { name: "After Effects", icon: "🎬" },
    ],
  },
  {
    label: "AI & MODERN TOOLS",
    tools: [
      { name: "Claude", icon: "🤖" },
      { name: "ChatGPT", icon: "💬" },
      { name: "Cursor", icon: "⌨️" },
      { name: "Gemini", icon: "✨" },
      { name: "Figma AI", icon: "⚡" },
    ],
  },
] as const;

export function Tools() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const toolGroupsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const heading = headingRef.current;
      const pills = toolGroupsRef.current?.querySelectorAll("[data-tool-pill]");

      if (!section || !heading) return;

      animateHeadingOnScroll(heading, section, reducedMotion);

      if (pills?.length) {
        animateRevealOnScroll(pills, {
          trigger: section,
          y: 24,
          stagger: 0.1,
          reducedMotion,
        });
      }
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="tools"
      className="section-padding relative z-10 bg-background text-foreground"
      aria-label="Tools I work with"
    >
      <div className="mx-auto max-w-5xl">
        <div ref={headingRef}>
          <p className="text-section-label">My Toolkit</p>
          <h2 className="text-section-heading mt-4">Tools I work with</h2>
        </div>

        <div
          ref={toolGroupsRef}
          className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16"
        >
          {TOOL_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-group-label mb-5">{group.label}</p>
              <ul className="flex flex-wrap gap-3">
                {group.tools.map((tool) => (
                  <li key={tool.name} data-tool-pill>
                    <span className="group inline-flex cursor-default items-center gap-2.5 rounded-full border border-border bg-[#F5F5F5] px-4 py-2.5 text-[15px] font-medium text-foreground transition-[background-color,border-color,box-shadow] duration-300 hover:border-accent hover:bg-background hover:shadow-[0_4px_16px_rgba(124,58,237,0.12)]">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-sm"
                        aria-hidden="true"
                      >
                        {tool.icon}
                      </span>
                      {tool.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

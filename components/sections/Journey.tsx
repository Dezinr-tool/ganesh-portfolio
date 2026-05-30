"use client";

import { useGSAP } from "@gsap/react";
import { animateRevealOnScroll } from "@/lib/gsap-scroll";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";

const SKILL_ROWS = [
  {
    label: "D2C / B2B",
    title: "Product Thinking",
    tenure: "(14+)",
  },
  {
    label: "UI / UX",
    title: "UI & UX Design",
    tenure: "(10+)",
  },
  {
    label: "Brand",
    title: "Visual & Brand",
    tenure: "(8+)",
  },
  {
    label: "Tools",
    title: "Design Tools",
    tenure: "(5+)",
  },
  {
    label: "AI",
    title: "AI & Modern Tools",
    tenure: "(3+)",
  },
] as const;

function SkillListRow({ row }: { row: (typeof SKILL_ROWS)[number] }) {
  return (
    <li className="border-t border-white/10" data-journey-row>
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 items-center gap-3 px-6 py-10 sm:px-10 md:grid-cols-[minmax(5rem,1fr)_minmax(0,2.5fr)_minmax(4rem,1fr)] md:gap-8 md:py-12 lg:px-14 lg:py-14">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white/55 md:text-xs">
          {row.label}
        </p>

        <h3 className="text-[clamp(2.25rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
          {row.title}
        </h3>

        <p className="text-sm tabular-nums text-white/50 md:text-right md:text-base">
          {row.tenure}
        </p>
      </div>
    </li>
  );
}

export function Journey() {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const rows = section.querySelectorAll("[data-journey-row]");

      if (rows.length) {
        animateRevealOnScroll(rows, {
          trigger: section,
          y: 28,
          stagger: 0.08,
          reducedMotion,
        });
      }
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="relative z-20 bg-black pt-24 text-white lg:pt-28"
      aria-label="Skills and expertise"
    >
      <ol className="list-none border-b border-white/10">
        {SKILL_ROWS.map((row) => (
          <SkillListRow key={row.title} row={row} />
        ))}
      </ol>
    </section>
  );
}

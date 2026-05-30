"use client";

import { useGSAP } from "@gsap/react";
import {
  animateCardsOnScroll,
  animateHeadingOnScroll,
} from "@/lib/gsap-scroll";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const PROJECTS = [
  {
    title: "LumeX",
    tags: ["SaaS", "Dashboard Design"],
    image:
      "https://images.unsplash.com/photo-1618005180814-d1db67ed6b6a?w=1400&q=85&auto=format&fit=crop",
    href: "#work",
  },
  {
    title: "Planza",
    tags: ["Framer Website"],
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=85&auto=format&fit=crop",
    href: "#work",
  },
  {
    title: "Horizon Atlas",
    tags: ["Travel", "Web Design"],
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=85&auto=format&fit=crop",
    href: "#work",
  },
  {
    title: "NeuroSync",
    tags: ["Healthcare", "Mobile App"],
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1400&q=85&auto=format&fit=crop",
    href: "#work",
  },
] as const;

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const heading = headingRef.current;
      const cards = cardsRef.current?.children;

      if (!section || !heading) return;

      animateHeadingOnScroll(heading, section, reducedMotion);

      if (cards?.length) {
        animateCardsOnScroll(cards, section, reducedMotion, 0.12);
      }
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="work"
      className="section-padding relative z-10 bg-background text-foreground"
      aria-label="Featured work"
    >
      <div className="mx-auto max-w-[1400px]">
        <div
          ref={headingRef}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            width: "100%",
          }}
        >
          <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-[-0.02em] text-foreground">
            Featured works
          </h2>
          <Link
            href="#work"
            className="inline-flex items-center gap-2 rounded-full bg-[#f0f0f0] px-5 py-2.5 text-[14px] font-medium text-foreground no-underline transition-colors duration-200 hover:bg-[#e5e5e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            All Works
            <ArrowIcon />
          </Link>
        </div>

        <ul
          ref={cardsRef}
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:mt-12 md:gap-7"
        >
          {PROJECTS.map((project) => (
            <li key={project.title}>
              <Link
                href={project.href}
                className="group relative block aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#e8e8e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
              >
                <Image
                  src={project.image}
                  alt={`${project.title} project preview`}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <h3 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
                    {project.title}
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <span className="inline-block rounded-full border border-white/40 bg-black/25 px-3 py-1 text-[13px] font-medium leading-none text-white backdrop-blur-sm">
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

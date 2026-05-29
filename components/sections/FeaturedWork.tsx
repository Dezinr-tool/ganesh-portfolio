"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import Link from "next/link";
import { useRef, type RefObject } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

const PROJECTS = [
  {
    title: "Paisabazaar Design System",
    tags: ["B2B", "Fintech", "Design System"],
    description:
      "Built a scalable design system powering loan comparison flows across web and mobile for India's largest fintech marketplace.",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    title: "Testbook Learning Platform",
    tags: ["D2C", "EdTech", "Mobile"],
    description:
      "Redesigned the mobile learning experience for exam prep — improving engagement and completion rates across core study flows.",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    title: "Think9 SuperU App",
    tags: ["D2C", "Consumer", "Strategy"],
    description:
      "Led product strategy and UX for a consumer wellness app — from positioning and onboarding to feature prioritization.",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
] as const;

function ProjectCard({
  project,
  index,
  isInView,
  reducedMotion,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
  isInView: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.li
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 32 }}
      animate={{
        opacity: reducedMotion || isInView ? 1 : 0,
        y: reducedMotion || isInView ? 0 : 32,
      }}
      transition={{
        duration: 0.55,
        ease: EASE,
        delay: reducedMotion ? 0 : isInView ? 0.15 + index * 0.12 : 0,
      }}
      style={{ height: "100%" }}
    >
      <Link
        href="/work"
        className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
      >
        {/* Gradient thumbnail */}
        <div
          className="h-[240px] w-full shrink-0"
          style={{ background: project.gradient }}
          aria-hidden="true"
        />

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-bold text-foreground">{project.title}</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-soft px-3 py-1 text-[13px] font-medium text-accent"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-body-copy mt-4 flex-1">{project.description}</p>

          <p className="text-accent-link mt-5 group-hover:text-accent-hover">
            View Case Study →
          </p>
        </div>
      </Link>
    </motion.li>
  );
}

export function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef as RefObject<HTMLElement>, {
    once: true,
    amount: 0.2,
  });
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      ref={sectionRef}
      id="work"
      className="section-padding relative z-10 bg-muted text-foreground"
      aria-label="Selected work"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 }}
          animate={{
            opacity: reducedMotion || isInView ? 1 : 0,
            y: reducedMotion || isInView ? 0 : 20,
          }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ textAlign: "center" }}
        >
          <p className="text-section-label">Selected Work</p>
          <h2 className="text-section-heading mt-4">
            Projects that made an impact
          </h2>
        </motion.div>

        {/* Project cards */}
        <ul className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {PROJECTS.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={index}
              isInView={isInView}
              reducedMotion={reducedMotion}
            />
          ))}
        </ul>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 16 }}
          animate={{
            opacity: reducedMotion || isInView ? 1 : 0,
            y: reducedMotion || isInView ? 0 : 16,
          }}
          transition={{
            duration: 0.5,
            ease: EASE,
            delay: reducedMotion ? 0 : isInView ? 0.5 : 0,
          }}
          style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}
        >
          <GlassButton href="/work" variant="outline">
            View All Work →
          </GlassButton>
        </motion.div>
      </div>
    </section>
  );
}

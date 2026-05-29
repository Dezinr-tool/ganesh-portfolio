"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type RefObject } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

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

function ToolPill({
  name,
  icon,
  index,
  isInView,
  reducedMotion,
}: {
  name: string;
  icon: string;
  index: number;
  isInView: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.li
      initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : -16 }}
      animate={{
        opacity: reducedMotion || isInView ? 1 : 0,
        x: reducedMotion || isInView ? 0 : -16,
      }}
      transition={{
        duration: 0.45,
        ease: EASE,
        delay: reducedMotion ? 0 : isInView ? 0.12 + index * 0.06 : 0,
      }}
    >
      <span className="group inline-flex cursor-default items-center gap-2.5 rounded-full border border-border bg-[#F5F5F5] px-4 py-2.5 text-[15px] font-medium text-foreground transition-[background-color,border-color,box-shadow] duration-300 hover:border-accent hover:bg-background hover:shadow-[0_4px_16px_rgba(124,58,237,0.12)]">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-sm"
          aria-hidden="true"
        >
          {icon}
        </span>
        {name}
      </span>
    </motion.li>
  );
}

export function Tools() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef as RefObject<HTMLElement>, {
    once: true,
    amount: 0.25,
  });
  const reducedMotion = useReducedMotion() ?? false;

  let pillIndex = 0;

  return (
    <section
      ref={sectionRef}
      id="tools"
      className="section-padding relative z-10 bg-background text-foreground"
      aria-label="Tools I work with"
    >
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 }}
          animate={{
            opacity: reducedMotion || isInView ? 1 : 0,
            y: reducedMotion || isInView ? 0 : 20,
          }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-section-label">My Toolkit</p>
          <h2 className="text-section-heading mt-4">Tools I work with</h2>
        </motion.div>

        {/* Tool groups — side by side on desktop */}
        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {TOOL_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-group-label mb-5">{group.label}</p>
              <ul className="flex flex-wrap gap-3">
                {group.tools.map((tool) => {
                  const currentIndex = pillIndex++;
                  return (
                    <ToolPill
                      key={tool.name}
                      name={tool.name}
                      icon={tool.icon}
                      index={currentIndex}
                      isInView={isInView}
                      reducedMotion={reducedMotion}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import { animateRevealOnScroll } from "@/lib/gsap-scroll";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import "./tools-experience.css";
import "./section-stage.css";

export type MarqueeImage = {
  src: string;
  alt: string;
};

export type ToolExperienceRow = {
  id: string;
  label: string;
  title: string;
  /** Human-readable tenure, e.g. "10+ yrs" */
  tenureLabel: string;
  marqueeLabels: string[];
  marqueeImages: MarqueeImage[];
};

export const TOOL_EXPERIENCE_ROWS: ToolExperienceRow[] = [
  {
    id: "ui-ux",
    label: "UI / UX",
    title: "UI & UX Design",
    tenureLabel: "10+ yrs",
    marqueeLabels: ["FIGMA", "WIREFRAMES", "PROTOTYPES", "USABILITY"],
    marqueeImages: [
      {
        src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80&auto=format&fit=crop",
        alt: "Interface design workspace",
      },
      {
        src: "https://images.unsplash.com/photo-1586717791821-3f44a599b3c5?w=400&q=80&auto=format&fit=crop",
        alt: "Design mockups on screen",
      },
    ],
  },
  {
    id: "product-strategy",
    label: "Product",
    title: "Product Strategy",
    tenureLabel: "8+ yrs",
    marqueeLabels: ["DISCOVERY", "ROADMAP", "MVP", "METRICS"],
    marqueeImages: [
      {
        src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80&auto=format&fit=crop",
        alt: "Team strategy workshop",
      },
      {
        src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80&auto=format&fit=crop",
        alt: "Collaborative product planning",
      },
    ],
  },
  {
    id: "design-systems",
    label: "Systems",
    title: "Design Systems",
    tenureLabel: "6+ yrs",
    marqueeLabels: ["TOKENS", "COMPONENTS", "PATTERNS", "DOCUMENTATION"],
    marqueeImages: [
      {
        src: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80&auto=format&fit=crop",
        alt: "Design system components",
      },
      {
        src: "https://images.unsplash.com/photo-1618005180814-d1db67ed6b6a?w=400&q=80&auto=format&fit=crop",
        alt: "Abstract gradient system visual",
      },
    ],
  },
  {
    id: "prototyping",
    label: "Build",
    title: "Prototyping",
    tenureLabel: "7+ yrs",
    marqueeLabels: ["MOTION", "FLOWS", "HANDOFF", "ITERATION"],
    marqueeImages: [
      {
        src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80&auto=format&fit=crop",
        alt: "Developer prototyping on laptop",
      },
      {
        src: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80&auto=format&fit=crop",
        alt: "Mobile prototype on desk",
      },
    ],
  },
  {
    id: "ai-tools",
    label: "AI",
    title: "AI & Modern Tools",
    tenureLabel: "3+ yrs",
    marqueeLabels: ["CURSOR", "CLAUDE", "FIGMA AI", "AUTOMATION"],
    marqueeImages: [
      {
        src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80&auto=format&fit=crop",
        alt: "AI-assisted creative workflow",
      },
      {
        src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80&auto=format&fit=crop",
        alt: "Modern tooling on display",
      },
    ],
  },
];

const EXPAND_DURATION = 0.55;
const COLLAPSE_DURATION = 0.4;
const MARQUEE_SPEED = 120;

type MarqueeItem =
  | { kind: "label"; text: string }
  | { kind: "image"; src: string; alt: string };

function buildMarqueeItems(row: ToolExperienceRow): MarqueeItem[] {
  const items: MarqueeItem[] = [];
  const count = Math.max(row.marqueeLabels.length, row.marqueeImages.length);

  for (let i = 0; i < count; i += 1) {
    const label = row.marqueeLabels[i];
    const image = row.marqueeImages[i];
    if (label) items.push({ kind: "label", text: label });
    if (image) items.push({ kind: "image", src: image.src, alt: image.alt });
  }

  return items;
}

function MarqueeSequence({ items }: { items: MarqueeItem[] }) {
  return (
    <>
      {items.map((item, index) =>
        item.kind === "label" ? (
          <span
            key={`label-${item.text}-${index}`}
            className="tools-experience__marquee-label"
          >
            {item.text}
          </span>
        ) : (
          <Image
            key={`img-${item.src}-${index}`}
            src={item.src}
            alt={item.alt}
            width={320}
            height={160}
            className="tools-experience__marquee-pill"
            sizes="(max-width: 768px) 120px, 200px"
          />
        ),
      )}
    </>
  );
}

function prefersFineHover() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function ExperienceRow({
  row,
  isActive,
  onActivate,
  onDeactivate,
  onToggle,
  reducedMotion,
}: {
  row: ToolExperienceRow;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onToggle: () => void;
  reducedMotion: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const marqueeViewportRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);
  const expandTweenRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(
    null,
  );
  const marqueeItems = buildMarqueeItems(row);
  const panelId = useId();

  const killMarquee = useCallback(() => {
    marqueeTweenRef.current?.kill();
    marqueeTweenRef.current = null;
    const track = marqueeTrackRef.current;
    if (track) gsap.set(track, { x: 0 });
  }, []);

  const startMarquee = useCallback(() => {
    const track = marqueeTrackRef.current;
    if (!track || reducedMotion) return;

    killMarquee();

    const halfWidth = track.scrollWidth / 2;
    if (halfWidth <= 0) return;

    marqueeTweenRef.current = gsap.to(track, {
      x: -halfWidth,
      duration: halfWidth / MARQUEE_SPEED,
      ease: "none",
      repeat: -1,
    });
  }, [killMarquee, reducedMotion]);

  const animateOpen = useCallback(() => {
    const band = bandRef.current;
    const marquee = marqueeViewportRef.current;
    const content = contentRef.current;
    if (!band || !marquee || !content) return;

    expandTweenRef.current?.kill();

    if (reducedMotion) {
      gsap.set(band, { scaleY: 1 });
      gsap.set(marquee, { opacity: 1 });
      gsap.set(content, { opacity: 0, paddingTop: "3.5rem", paddingBottom: "3.5rem" });
      return;
    }

    gsap.set(content, { opacity: 1 });

    expandTweenRef.current = gsap.timeline();
    expandTweenRef.current
      .to(
        band,
        { scaleY: 1, duration: EXPAND_DURATION, ease: "power3.out" },
        0,
      )
      .to(marquee, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.12)
      .to(
        content,
        { opacity: 0, duration: 0.28, ease: "power2.out" },
        0.08,
      )
      .to(
        content,
        {
          paddingTop: "3.75rem",
          paddingBottom: "3.75rem",
          duration: EXPAND_DURATION,
          ease: "power3.out",
        },
        0,
      );
  }, [reducedMotion]);

  const animateClose = useCallback(() => {
    const band = bandRef.current;
    const marquee = marqueeViewportRef.current;
    const content = contentRef.current;
    if (!band || !marquee || !content) return;

    expandTweenRef.current?.kill();
    killMarquee();

    if (reducedMotion) {
      gsap.set(band, { scaleY: 0 });
      gsap.set(marquee, { opacity: 0 });
      gsap.set(content, { opacity: 1, clearProps: "padding" });
      return;
    }

    expandTweenRef.current = gsap.timeline();
    expandTweenRef.current
      .to(marquee, { opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
      .to(
        content,
        { opacity: 1, duration: 0.25, ease: "power2.out" },
        0.12,
      )
      .to(
        band,
        { scaleY: 0, duration: COLLAPSE_DURATION, ease: "power3.inOut" },
        0.05,
      )
      .to(
        content,
        {
          paddingTop: "",
          paddingBottom: "",
          duration: COLLAPSE_DURATION,
          ease: "power3.inOut",
          clearProps: "paddingTop,paddingBottom",
        },
        0.05,
      );
  }, [killMarquee, reducedMotion]);

  useEffect(() => {
    if (isActive) {
      animateOpen();
      const frame = requestAnimationFrame(() => startMarquee());
      return () => cancelAnimationFrame(frame);
    }
    animateClose();
    return undefined;
  }, [animateClose, animateOpen, isActive, startMarquee]);

  useEffect(() => {
    return () => {
      expandTweenRef.current?.kill();
      killMarquee();
    };
  }, [killMarquee]);

  const handlePointerEnter = () => {
    if (prefersFineHover()) onActivate();
  };

  const handlePointerLeave = () => {
    if (prefersFineHover()) onDeactivate();
  };

  const handleClick = () => {
    if (!prefersFineHover()) onToggle();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <li className="tools-experience__row" data-active={isActive || undefined} data-tools-row>
      <button
        ref={triggerRef}
        type="button"
        className="tools-experience__trigger"
        aria-expanded={isActive}
        aria-controls={panelId}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={onActivate}
        onBlur={(event) => {
          if (!triggerRef.current?.contains(event.relatedTarget as Node)) {
            onDeactivate();
          }
        }}
      >
        <div ref={bandRef} className="tools-experience__band" aria-hidden="true" />

        <div
          ref={marqueeViewportRef}
          id={panelId}
          className="tools-experience__marquee-viewport"
          aria-hidden={!isActive}
        >
          <div ref={marqueeTrackRef} className="tools-experience__marquee-track">
            <MarqueeSequence items={marqueeItems} />
            <MarqueeSequence items={marqueeItems} />
          </div>
        </div>

        <div ref={contentRef} className="tools-experience__content">
          <p className="tools-experience__label">{row.label}</p>
          <h3 className="tools-experience__title">{row.title}</h3>
          <p className="tools-experience__tenure">
            <span>{row.tenureLabel}</span>
            <span className="tools-experience__tenure-sep" aria-hidden="true">
              ·
            </span>
            <span>Present</span>
          </p>
        </div>
      </button>
    </li>
  );
}

export function Tools() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const handleActivate = (id: string) => {
    setActiveRowId(id);
  };

  const handleDeactivate = () => {
    setActiveRowId(null);
  };

  const handleToggle = (id: string) => {
    setActiveRowId((current) => (current === id ? null : id));
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const rows = section.querySelectorAll("[data-tools-row]");

      if (rows.length) {
        animateRevealOnScroll(rows, {
          trigger: section,
          y: 28,
          stagger: 0.08,
          duration: 0.65,
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
      className="tools-experience section-stage"
      aria-label="Experience and tools"
    >
      <div ref={innerRef} className="section-stage__inner">
      <div className="tools-experience__cta">
        <span className="tools-experience__cta-label">Have a project?</span>
        <a
          href="mailto:hello@designbyganesh.com"
          className="tools-experience__cta-link"
        >
          Let&apos;s Talk
        </a>
      </div>
      <ol className="tools-experience__list">
        {TOOL_EXPERIENCE_ROWS.map((row) => (
          <ExperienceRow
            key={row.id}
            row={row}
            isActive={activeRowId === row.id}
            onActivate={() => handleActivate(row.id)}
            onDeactivate={handleDeactivate}
            onToggle={() => handleToggle(row.id)}
            reducedMotion={reducedMotion}
          />
        ))}
      </ol>
      </div>
    </section>
  );
}

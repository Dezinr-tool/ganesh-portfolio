"use client";

import { useGSAP } from "@gsap/react";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import {
  animateBodyCopyOnScroll,
  animateRevealOnScroll,
  registerGsapPlugins,
} from "@/lib/gsap-scroll";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./journey-skills.css";

type SkillCategory = {
  id: string;
  title: string;
  skills: string[];
};

const SKILLS_BIO =
  "As a UX/UI design consultant, I partner with startups and product teams to turn ambiguous problems into clear, shippable digital experiences — from strategy and systems to polished interfaces.";

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "ui-ux",
    title: "UI / UX Design",
    skills: [
      "User research",
      "Wireframing",
      "Visual design",
      "Interaction design",
      "Usability testing",
      "Accessibility (WCAG)",
    ],
  },
  {
    id: "product-strategy",
    title: "Product Strategy",
    skills: [
      "Product discovery",
      "Roadmapping",
      "MVP definition",
      "Go-to-market alignment",
      "Metrics & analytics",
      "Stakeholder workshops",
    ],
  },
  {
    id: "design-systems",
    title: "Design Systems",
    skills: [
      "Component libraries",
      "Design tokens",
      "Pattern documentation",
      "Design ops",
      "Brand guidelines",
      "Cross-platform consistency",
    ],
  },
  {
    id: "prototyping",
    title: "Prototyping & Motion",
    skills: [
      "Figma prototypes",
      "Micro-interactions",
      "User flows",
      "Click-through demos",
      "Motion design",
      "Rapid iteration",
    ],
  },
  {
    id: "frontend-collab",
    title: "Frontend Collab",
    skills: [
      "HTML / CSS literacy",
      "React handoff",
      "Responsive specs",
      "Component thinking",
      "Dev sync & QA",
      "Design-to-code workflows",
    ],
  },
  {
    id: "tools",
    title: "Tools",
    skills: [
      "Figma",
      "Adobe Illustrator",
      "Photoshop",
      "After Effects",
      "Claude",
      "Cursor",
      "ChatGPT",
      "Figma AI",
    ],
  },
];

const ACCORDION_DURATION = 0.45;


function AccordionItem({
  category,
  isOpen,
  onSelect,
  reducedMotion,
}: {
  category: SkillCategory;
  isOpen: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const animateOpen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;

    tweenRef.current?.kill();

    if (reducedMotion) {
      gsap.set(panel, { height: "auto" });
      return;
    }

    gsap.to(panel, {
      height: panel.scrollHeight,
      duration: ACCORDION_DURATION,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(panel, { height: "auto" });
        scheduleScrollTriggerRefresh();
      },
    });
  }, [reducedMotion]);

  const animateClose = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;

    tweenRef.current?.kill();

    if (reducedMotion) {
      gsap.set(panel, { height: 0 });
      return;
    }

    gsap.set(panel, { height: panel.scrollHeight });
    gsap.to(panel, {
      height: 0,
      duration: ACCORDION_DURATION,
      ease: "power3.inOut",
    });
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (isOpen) {
      animateOpen();
    } else {
      animateClose();
    }
  }, [animateClose, animateOpen, isOpen]);

  useEffect(() => {
    const tweenRefSnapshot = tweenRef;
    return () => {
      tweenRefSnapshot.current?.kill();
    };
  }, []);

  return (
    <li
      className="skills-accordion__item"
      data-open={isOpen ? "true" : "false"}
    >
      <button
        type="button"
        className="skills-accordion__trigger"
        aria-expanded={isOpen}
        aria-controls={`skills-panel-${category.id}`}
        id={`skills-trigger-${category.id}`}
        onClick={onSelect}
      >
        <span className="skills-accordion__title">{category.title}</span>
        <span className="skills-accordion__toggle" aria-hidden="true">
          <span className="skills-accordion__toggle-h" />
          <span className="skills-accordion__toggle-v" />
        </span>
      </button>

      <div
        ref={panelRef}
        id={`skills-panel-${category.id}`}
        className="skills-accordion__panel"
        role="region"
        aria-labelledby={`skills-trigger-${category.id}`}
        hidden={reducedMotion ? !isOpen : undefined}
      >
        <div className="skills-accordion__panel-inner">
          <ul className="skills-accordion__list">
            {category.skills.map((skill) => (
              <li key={skill} className="skills-accordion__skill">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

function formatScrollCounter(value: number) {
  return `(${Math.round(value)})`;
}

export function Journey() {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const sideFillRef = useRef<HTMLDivElement>(null);
  const sideLabelRef = useRef<HTMLSpanElement>(null);
  const accordionRef = useRef<HTMLUListElement>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string>(
    SKILL_CATEGORIES[0]?.id ?? "",
  );
  const [scrollCounter, setScrollCounter] = useState(0);

  useGSAP(
    () => {
      registerGsapPlugins();

      const section = sectionRef.current;
      const left = leftRef.current;
      const arrow = arrowRef.current;
      const counter = counterRef.current;
      const side = sideRef.current;
      const sideFill = sideFillRef.current;
      const sideLabel = sideLabelRef.current;
      const accordionItems = accordionRef.current?.querySelectorAll(
        ".skills-accordion__title",
      );

      if (!section || !left) return;

      const label = left.querySelector("[data-skills-label]");
      const bio = left.querySelector("[data-skills-bio]");
      const contact = left.querySelector("[data-skills-contact]");

      if (label) {
        animateBodyCopyOnScroll(label, section, reducedMotion);
      }

      if (bio) {
        animateRevealOnScroll(bio, {
          trigger: section,
          y: 28,
          duration: 0.8,
          reducedMotion,
        });
      }

      if (contact) {
        animateRevealOnScroll(contact, {
          trigger: section,
          y: 16,
          duration: 0.6,
          delay: 0.12,
          reducedMotion,
        });
      }

      if (accordionItems?.length) {
        animateRevealOnScroll(accordionItems, {
          trigger: section,
          y: 20,
          stagger: 0.06,
          duration: 0.65,
          delay: 0.08,
          reducedMotion,
        });
      }

      if (reducedMotion) return;

      const firstPanel = section.querySelector(".skills-accordion__panel");
      if (firstPanel instanceof HTMLElement) {
        gsap.set(firstPanel, { height: firstPanel.scrollHeight });
      }

      const isMobileLayout = window.matchMedia("(max-width: 63.99rem)").matches;

      if (arrow && !isMobileLayout) {
        gsap.fromTo(
          arrow,
          { xPercent: 0, x: 0 },
          {
            xPercent: 100,
            x: () => {
              const pad =
                parseFloat(getComputedStyle(left).paddingLeft) +
                parseFloat(getComputedStyle(left).paddingRight);
              return left.clientWidth - pad - arrow.getBoundingClientRect().width;
            },
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom center",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (side) {
        side.dataset.visible = "false";
      }

      ScrollTrigger.create({
        id: "skills-side-progress",
        trigger: section,
        start: "top 65%",
        end: "bottom top",
        onUpdate: (self) => {
          const docH =
            document.documentElement.scrollHeight - window.innerHeight;
          const pagePct =
            docH > 0 ? Math.round((window.scrollY / docH) * 100) : 0;

          if (counter) {
            counter.textContent = formatScrollCounter(pagePct);
          }
          setScrollCounter(pagePct);

          if (sideFill) {
            sideFill.style.height = `${(self.progress * 100).toFixed(1)}%`;
          }

          if (sideLabel) {
            sideLabel.style.top = `${(self.progress * 100).toFixed(1)}%`;
          }

          if (side) {
            side.dataset.visible =
              self.isActive && self.progress > 0.02 && self.progress < 0.98
                ? "true"
                : "false";
          }
        },
      });

      return () => {
        ScrollTrigger.getById("skills-side-progress")?.kill();
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  const handleSelect = (id: string) => {
    if (id === openCategoryId) return;
    setOpenCategoryId(id);
  };

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="skills-section relative z-20"
      aria-label="Skills and expertise"
    >
      <div className="skills-section__inner">
        <div ref={leftRef} className="skills-section__left">
          <p data-skills-label className="skills-section__intro-label">
            Skills
          </p>
          <p data-skills-bio className="skills-section__bio text-body-lg">
            {SKILLS_BIO}
          </p>
          <hr className="skills-section__divider" aria-hidden="true" />
          <div data-skills-contact className="skills-section__contact-row">
            <span
              ref={counterRef}
              className="skills-section__contact-counter"
              aria-hidden="true"
            >
              {formatScrollCounter(scrollCounter)}
            </span>
            <Link
              href="mailto:hello@designbyganesh.com"
              className="skills-section__contact-link"
            >
              Contact me&nbsp;+
            </Link>
          </div>
          <svg
            ref={arrowRef}
            className="skills-section__arrow"
            viewBox="0 0 84 85"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M11 38H54L37 21H51L73 43L51 65H37L54 48H11Z" />
          </svg>
        </div>

        <ul ref={accordionRef} className="skills-section__right skills-accordion">
          {SKILL_CATEGORIES.map((category) => (
            <AccordionItem
              key={category.id}
              category={category}
              isOpen={openCategoryId === category.id}
              onSelect={() => handleSelect(category.id)}
              reducedMotion={reducedMotion}
            />
          ))}
        </ul>
      </div>

      <div ref={sideRef} className="skills-section__side" aria-hidden="true">
        <span ref={sideLabelRef} className="skills-section__side-label">
          Skills
        </span>
        <div className="skills-section__side-track">
          <div ref={sideFillRef} className="skills-section__side-fill" />
        </div>
      </div>
    </section>
  );
}

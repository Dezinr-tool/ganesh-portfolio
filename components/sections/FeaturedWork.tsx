"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import {
  getProjectsByCategory,
  type WorksCategory,
  type WorksProject,
} from "./works/projects";
import { WorksCanvas } from "./works/WorksCanvas";
import { WorksCarouselArrows } from "./works/WorksCarouselArrows";
import { WorksCategoryFilter } from "./works/WorksCategoryFilter";
import "./featured-work.css";

function sectionTitleWords(title: string) {
  return title.trim().split(/\s+/).filter(Boolean);
}

function splitTitleLetters(titleEl: HTMLElement) {
  return [...titleEl.querySelectorAll<HTMLElement>(".works-gallery__letter")];
}

function staggerFromCenter(letters: HTMLElement[]) {
  const center = (letters.length - 1) / 2;
  return letters
    .map((letter, index) => ({ letter, index }))
    .sort((a, b) => Math.abs(a.index - center) - Math.abs(b.index - center))
    .map(({ letter }) => letter);
}

type FeaturedWorkProps = {
  projects: WorksProject[];
  sectionTitle?: string;
};

export function FeaturedWork({
  projects,
  sectionTitle = "recent works",
}: FeaturedWorkProps) {
  const titleWords = sectionTitleWords(sectionTitle);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const swipePillRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const [activeCategory, setActiveCategory] = useState<WorksCategory>("product-design");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStageHovered, setIsStageHovered] = useState(false);
  const [isMobileGallery, setIsMobileGallery] = useState(false);
  const isDraggingRef = useRef(false);
  const isGalleryHoveredRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 68.75rem)");
    const sync = () => setIsMobileGallery(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const categoryProjects = useMemo(
    () => getProjectsByCategory(activeCategory, projects),
    [activeCategory, projects],
  );

  const activeProject = categoryProjects[activeIndex] ?? categoryProjects[0]!;

  const onActiveIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleCategoryChange = useCallback((category: WorksCategory) => {
    setActiveCategory(category);
    setActiveIndex(0);
  }, []);

  const goToPrevProject = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  const goToNextProject = useCallback(() => {
    setActiveIndex((index) =>
      Math.min(categoryProjects.length - 1, index + 1),
    );
  }, [categoryProjects.length]);

  const onGalleryHover = useCallback((hovered: boolean) => {
    setIsStageHovered(hovered);

    if (window.matchMedia("(max-width: 68.75rem)").matches || isDraggingRef.current) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    if (hovered) {
      isGalleryHoveredRef.current = true;
      cursor.classList.add("is-visible");
      gsap.fromTo(
        cursor,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: 0.5, delay: 0.2, ease: "power3.out" },
      );
    } else {
      isGalleryHoveredRef.current = false;
      cursor.classList.remove("is-visible");
      gsap.set(cursor, { clipPath: "inset(0 100% 0 0)" });
    }
  }, []);

  useGSAP(
    () => {
      if (reducedMotion) return;

      registerGsapPlugins();

      const section = sectionRef.current;
      const title = titleRef.current;
      const link = linkRef.current;
      const swipePill = swipePillRef.current;
      const cursor = cursorRef.current;

      if (!section || !title) return;

      const letters = splitTitleLetters(title);
      const orderedLetters = staggerFromCenter(letters);

      gsap.set(orderedLetters, { y: "-120%" });

      gsap.to(orderedLetters, {
        y: "0%",
        ease: "none",
        stagger: 0.05,
        scrollTrigger: {
          id: "works-title-letters",
          trigger: title,
          start: "top 100%",
          end: "bottom 30%",
          scrub: 1,
        },
      });

      const fadeTargets = [link, swipePill].filter(Boolean) as HTMLElement[];

      if (fadeTargets.length) {
        gsap.fromTo(
          fadeTargets,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              id: "works-overlays",
              trigger: section,
              start: "top -100%",
              end: "bottom 100%",
              scrub: true,
              onEnter: () => link?.classList.add("is-visible"),
              onEnterBack: () => link?.classList.add("is-visible"),
              onLeave: () => link?.classList.remove("is-visible"),
              onLeaveBack: () => link?.classList.remove("is-visible"),
            },
          },
        );
      }

      const mobileQuery = window.matchMedia("(max-width: 68.75rem)");

      const qCursorX = cursor
        ? gsap.quickTo(cursor, "left", { duration: 0.35, ease: "power3.out" })
        : null;
      const qCursorY = cursor
        ? gsap.quickTo(cursor, "top", { duration: 0.35, ease: "power3.out" })
        : null;

      const onMouseMove = (event: MouseEvent) => {
        if (!isGalleryHoveredRef.current || mobileQuery.matches) return;
        qCursorX?.(event.clientX + 16);
        qCursorY?.(event.clientY + 16);
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });
      requestAnimationFrame(() => scheduleScrollTriggerRefresh());

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
      };
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  if (reducedMotion) {
    return (
      <section
        id="works"
        className="works-gallery works-gallery--reduced"
        aria-label="Projects"
      >
        <h2 className="works-gallery__title">{sectionTitle}</h2>
        <div className="works-gallery__reduced-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={project.href}
              className="works-gallery__reduced-card"
            >
              <span className="works-gallery__reduced-meta">
                {project.month} {project.year}
              </span>
              <span className="works-gallery__reduced-name">{project.title}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="works"
        className="works-gallery"
        aria-label="Projects"
      >
        <h2 ref={titleRef} className="works-gallery__title animation-title">
          {titleWords.map((word) => (
            <span key={word} className="works-gallery__word">
              {word.split("").map((letter, index) => (
                <span key={`${word}-${index}`} className="works-gallery__letter">
                  {letter}
                </span>
              ))}
            </span>
          ))}
        </h2>

        <div
          ref={stageWrapRef}
          className="works-gallery__canvas-wrap"
          onMouseEnter={() => setIsStageHovered(true)}
          onMouseLeave={() => setIsStageHovered(false)}
        >
          <WorksCategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />

          <WorksCanvas
            className="works-gallery__stage-root"
            projects={categoryProjects}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            isDraggingRef={isDraggingRef}
            sectionRef={sectionRef}
            onGalleryHover={onGalleryHover}
            reducedMotion={reducedMotion}
          />

          <WorksCarouselArrows
            visible={isMobileGallery || isStageHovered}
            canGoPrev={activeIndex > 0}
            canGoNext={activeIndex < categoryProjects.length - 1}
            onPrev={goToPrevProject}
            onNext={goToNextProject}
          />

          <div ref={swipePillRef} className="works-gallery__swipe-pill">
            Swipe slider
          </div>

          <Link
            ref={linkRef}
            href={activeProject.href}
            className="works-gallery__case-link"
          >
            <span className="works-gallery__case-original">view case</span>
            <span className="works-gallery__case-clone" aria-hidden="true">
              view case
            </span>
          </Link>
        </div>
      </section>

      <div ref={cursorRef} className="works-gallery__swipe-cursor" aria-hidden="true">
        Swipe
      </div>
    </>
  );
}

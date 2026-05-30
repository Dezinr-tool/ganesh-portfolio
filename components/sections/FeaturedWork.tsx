"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { getLenisInstance } from "@/lib/lenis-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import "./featured-work.css";

const PROJECTS = [
  {
    id: "anima",
    title: "Anima",
    month: "06",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400&q=85&auto=format&fit=crop",
    href: "mailto:hello@designbyganesh.com",
  },
  {
    id: "lumex",
    title: "LumeX",
    month: "03",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1618005180814-d1db67ed6b6a?w=1400&q=85&auto=format&fit=crop",
    href: "mailto:hello@designbyganesh.com",
  },
  {
    id: "planza",
    title: "Planza",
    month: "11",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=85&auto=format&fit=crop",
    href: "mailto:hello@designbyganesh.com",
  },
  {
    id: "horizon-atlas",
    title: "Horizon Atlas",
    month: "07",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=85&auto=format&fit=crop",
    href: "mailto:hello@designbyganesh.com",
  },
  {
    id: "neurosync",
    title: "NeuroSync",
    month: "02",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1400&q=85&auto=format&fit=crop",
    href: "mailto:hello@designbyganesh.com",
  },
] as const;

/** Same path as lukebaffait.fr #fluid-line */
const FLUID_LINE_PATH = `
  M -80,0
  C 300,-20  600,150  540,400
  C 490,650   0,655    300,1050
  C 600,1385 650,1250 850,1200
  C 1050,1150 1350,1250 1540,1300
`;

function formatPreviewDate(month: string, year: string) {
  return `${month} ${year}`;
}

export function FeaturedWork() {
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const coverWrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeIndexRef = useRef(-1);
  const projectsVisibleRef = useRef(false);
  const reducedMotion = useReducedMotion() ?? false;

  const activeProject =
    activeIndex >= 0 ? PROJECTS[activeIndex] : PROJECTS[0];

  const activateProject = useCallback(
    (index: number, items: HTMLElement[], card: HTMLDivElement | null) => {
      if (index === activeIndexRef.current) return;

      items.forEach((item, i) => {
        item.classList.toggle("active", i === index);
        item.setAttribute("aria-selected", i === index ? "true" : "false");
      });

      if (!card || reducedMotion) {
        activeIndexRef.current = index;
        setActiveIndex(index);
        if (card) gsap.set(card, { opacity: 1 });
        return;
      }

      if (activeIndexRef.current === -1) {
        activeIndexRef.current = index;
        setActiveIndex(index);
        gsap.to(card, { opacity: 1, duration: 0.4, ease: "power2.out" });
      } else {
        gsap.to(card, {
          opacity: 0,
          duration: 0.18,
          ease: "power2.in",
          onComplete: () => {
            activeIndexRef.current = index;
            setActiveIndex(index);
            gsap.to(card, { opacity: 1, duration: 0.3, ease: "power2.out" });
          },
        });
      }
    },
    [reducedMotion],
  );

  const deactivateAll = useCallback(
    (items: HTMLElement[], card: HTMLDivElement | null) => {
      items.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });
      activeIndexRef.current = -1;
      setActiveIndex(-1);
      if (card && !reducedMotion) {
        gsap.to(card, { opacity: 0, duration: 0.25, ease: "power2.in" });
      }
    },
    [reducedMotion],
  );

  const scrollItemToCenter = useCallback((item: HTMLElement) => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const targetY = window.scrollY + itemCenter - window.innerHeight / 2;
    const lenis = getLenisInstance();
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.2 });
      return;
    }
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }, []);

  useGSAP(
    () => {
      registerGsapPlugins();

      const track = trackRef.current;
      const list = listRef.current;
      const path = pathRef.current;
      const card = cardRef.current;
      const preview = previewRef.current;
      const coverWrap = coverWrapRef.current;
      const cursor = cursorRef.current;

      if (!track || !list || !path) return;

      const items = [...list.querySelectorAll<HTMLElement>(".featured-work__item")];
      const lineLen = path.getTotalLength();

      const isMobileLayout = window.matchMedia("(max-width: 63.99rem)").matches;

      const setupMobileInteraction = () => {
        gsap.set(path, { strokeDashoffset: 0, strokeDasharray: lineLen });
        if (card) gsap.set(card, { opacity: 1 });
        preview?.classList.add("visible");
        projectsVisibleRef.current = true;
        activateProject(0, items, card);

        items.forEach((item, i) => {
          item.addEventListener("click", () => {
            if (item.classList.contains("active")) {
              window.location.href = PROJECTS[i]!.href;
            } else {
              activateProject(i, items, card);
              preview?.classList.add("visible");
            }
          });
        });
      };

      if (reducedMotion || isMobileLayout) {
        setupMobileInteraction();
        return;
      }

      gsap.set(path, { strokeDasharray: lineLen, strokeDashoffset: lineLen });
      if (card) gsap.set(card, { opacity: 0 });

      const itemQuickX = items.map((item) =>
        gsap.quickTo(item, "x", { duration: 0.6, ease: "power2.out" }),
      );

      const section = track.closest<HTMLElement>("#work");
      if (!section) return;

      ScrollTrigger.create({
        id: "featured-work-preview",
        trigger: section,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          preview?.classList.add("visible");
          projectsVisibleRef.current = true;
        },
        onLeave: () => {
          preview?.classList.remove("visible");
          projectsVisibleRef.current = false;
        },
        onEnterBack: () => {
          preview?.classList.add("visible");
          projectsVisibleRef.current = true;
        },
        onLeaveBack: () => {
          preview?.classList.remove("visible");
          projectsVisibleRef.current = false;
        },
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          id: "featured-work-fluid-line",
          trigger: section,
          start: "top 70%",
          end: "bottom 20%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      const onProjectsScroll = () => {
        if (!projectsVisibleRef.current) {
          if (activeIndexRef.current >= 0) deactivateAll(items, card);
          return;
        }

        const cy = window.innerHeight / 2;
        const halfH = window.innerHeight / 2;
        let closestIdx = -1;
        let closestDist = Infinity;

        items.forEach((item, i) => {
          const rect = item.getBoundingClientRect();
          const itemCy = rect.top + rect.height / 2;
          const dist = Math.abs(itemCy - cy);
          itemQuickX[i](Math.min(dist / halfH, 1) * 80);

          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        });

        if (closestIdx >= 0 && closestDist < window.innerHeight * 0.45) {
          activateProject(closestIdx, items, card);
        } else if (activeIndexRef.current >= 0) {
          deactivateAll(items, card);
        }
      };

      const lenis = getLenisInstance();
      lenis?.on("scroll", onProjectsScroll);
      onProjectsScroll();

      items.forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 52%",
          end: "bottom 48%",
          onEnter: () => {
            const instance = getLenisInstance() as
              | (ReturnType<typeof getLenisInstance> & {
                  options?: { lerp?: number };
                })
              | null;
            if (instance?.options) instance.options.lerp = 0.04;
          },
          onLeave: () => {
            const instance = getLenisInstance() as
              | (ReturnType<typeof getLenisInstance> & {
                  options?: { lerp?: number };
                })
              | null;
            if (instance?.options) instance.options.lerp = 0.06;
          },
          onEnterBack: () => {
            const instance = getLenisInstance() as
              | (ReturnType<typeof getLenisInstance> & {
                  options?: { lerp?: number };
                })
              | null;
            if (instance?.options) instance.options.lerp = 0.04;
          },
          onLeaveBack: () => {
            const instance = getLenisInstance() as
              | (ReturnType<typeof getLenisInstance> & {
                  options?: { lerp?: number };
                })
              | null;
            if (instance?.options) instance.options.lerp = 0.06;
          },
        });
      });

      items.forEach((item, i) => {
        item.addEventListener("click", () => {
          if (item.classList.contains("active")) {
            window.location.href = PROJECTS[i]!.href;
          } else {
            scrollItemToCenter(item);
          }
        });
      });

      requestAnimationFrame(() => {
        scheduleScrollTriggerRefresh();
      });

      const onResize = () => {
        scheduleScrollTriggerRefresh();
      };

      window.addEventListener("resize", onResize);

      let tiltRY = 0;
      let tiltRX = 0;
      let tiltTargetRY = 0;
      let tiltTargetRX = 0;

      const qCursorX = cursor
        ? gsap.quickTo(cursor, "left", { duration: 0.35, ease: "power3.out" })
        : null;
      const qCursorY = cursor
        ? gsap.quickTo(cursor, "top", { duration: 0.35, ease: "power3.out" })
        : null;

      const onMouseMove = (e: MouseEvent) => {
        if (projectsVisibleRef.current) {
          qCursorX?.(e.clientX);
          qCursorY?.(e.clientY);
        }

        if (projectsVisibleRef.current && card) {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const ry = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
          const rx = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
          tiltTargetRY = ry * 6;
          tiltTargetRX = -rx * 5;
        }
      };

      const onCoverEnter = () => cursor?.classList.add("active");
      const onCoverLeave = () => cursor?.classList.remove("active");

      coverWrap?.addEventListener("mouseenter", onCoverEnter);
      coverWrap?.addEventListener("mouseleave", onCoverLeave);

      window.addEventListener("mousemove", onMouseMove, { passive: true });

      const ticker = () => {
        if (projectsVisibleRef.current && card) {
          tiltRY += (tiltTargetRY - tiltRY) * 0.12;
          tiltRX += (tiltTargetRX - tiltRX) * 0.12;
          card.style.transform = `rotateY(${tiltRY.toFixed(2)}deg) rotateX(${tiltRX.toFixed(2)}deg)`;
        }
      };

      gsap.ticker.add(ticker);

      return () => {
        window.removeEventListener("resize", onResize);
        lenis?.off("scroll", onProjectsScroll);
        window.removeEventListener("mousemove", onMouseMove);
        coverWrap?.removeEventListener("mouseenter", onCoverEnter);
        coverWrap?.removeEventListener("mouseleave", onCoverLeave);
        gsap.ticker.remove(ticker);
      };
    },
    {
      scope: trackRef,
      dependencies: [reducedMotion, activateProject, deactivateAll, scrollItemToCenter],
    },
  );

  return (
    <>
      <section
        id="work"
        className={`featured-work ${reducedMotion ? "featured-work--reduced" : ""}`}
        aria-label="Projects"
      >
        <div ref={trackRef} className="featured-work__track">
          <div ref={panelRef} className="featured-work__panel">
            <svg
              className="featured-work__fluid-line-svg"
              viewBox="0 0 1400 1400"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <path ref={pathRef} className="featured-work__fluid-line" d={FLUID_LINE_PATH} />
            </svg>

            <div className="featured-work__inner">
              <div
                ref={listRef}
                className="featured-work__list"
                role="listbox"
                aria-label="Project list"
              >
                {PROJECTS.map((project, index) => (
                  <div
                    key={project.id}
                    role="option"
                    tabIndex={0}
                    aria-selected={index === activeIndex}
                    className="featured-work__item"
                    data-id={project.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                      }
                    }}
                  >
                    {project.title}
                  </div>
                ))}
              </div>

              <div
                ref={previewRef}
                className="featured-work__preview"
                id="proj-preview"
                aria-hidden={!reducedMotion && activeIndex < 0}
              >
                <div ref={cardRef} className="featured-work__card">
                  <div className="featured-work__card-meta">
                    <span className="featured-work__card-date">
                      {formatPreviewDate(activeProject.month, activeProject.year)}
                    </span>
                    <span className="featured-work__card-label">Preview</span>
                  </div>
                  <div ref={coverWrapRef} className="featured-work__card-image-wrap">
                    <Image
                      key={activeProject.id}
                      src={activeProject.image}
                      alt={`${activeProject.title} project preview`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 440px"
                      className="featured-work__card-image"
                      priority
                    />
                  </div>
                  <Link
                    href={activeProject.href}
                    className="featured-work__mobile-cta-link"
                  >
                    See project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={cursorRef} className="featured-work__cursor" aria-hidden="true">
        See project
      </div>
    </>
  );
}

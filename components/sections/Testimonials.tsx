"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { useCallback, useRef } from "react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import "./testimonials.css";
import "./section-stage.css";

export type Testimonial = {
  id: string;
  type: "recommendation" | "client-review";
  quote: string;
  name: string;
  role: string;
  company: string;
  image?: string;
  accent?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "deepesh-yadav",
    type: "recommendation",
    quote:
      "Ganesh demonstrated exceptional design skills and a deep understanding of user experience that made a significant impact on our product development.",
    name: "Deepesh Yadav",
    role: "Product Manager",
    company: "Testbook",
    accent: "#e8f4f0",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "narendra-tripathi",
    type: "client-review",
    quote:
      "Incredibly talented and dedicated. His ability to translate complex design concepts into simple, elegant solutions is truly remarkable. A rare find.",
    name: "Narendra Tripathi",
    role: "Product Leader",
    company: "Toothsi",
    accent: "#f0ede8",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "hanoze-boga",
    type: "recommendation",
    quote:
      "Meticulous in whatever he does. I recommend him to any organisation that wants creative thinkers and not just executors in their product design teams.",
    name: "Hanoze Boga",
    role: "Design Head",
    company: "JioSaavn",
    accent: "#eaf0f8",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "anuj-kapur",
    type: "client-review",
    quote:
      "Skillful and personally invested in every solution he delivers. Consistently and pleasantly surprised with the quality of work he brought to the table.",
    name: "Anuj Kapur",
    role: "Business Head, App & Growth",
    company: "Paisabazaar",
    accent: "#f5f0ea",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format&fit=crop",
  },
];

const CHAR_LIMIT = 130;
function truncate(text: string) {
  return text.length > CHAR_LIMIT ? text.slice(0, CHAR_LIMIT).trimEnd() + "…" : text;
}

const THUMB_BLUR_STEPS = [
  "t-card__photo-blur--1",
  "t-card__photo-blur--2",
  "t-card__photo-blur--3",
] as const;

function TestimonialThumbnail({
  src,
  alt,
  imgClassName,
}: {
  src: string;
  alt: string;
  imgClassName: string;
}) {
  const imgProps = {
    src,
    loading: "lazy" as const,
    draggable: false,
    className: imgClassName,
  };

  return (
    <div className="t-card__photo-stack">
      <img {...imgProps} alt={alt} />
      {THUMB_BLUR_STEPS.map((step) => (
        <div key={step} className={`t-card__photo-blur ${step}`} aria-hidden="true">
          <img {...imgProps} alt="" />
        </div>
      ))}
      <div className="t-card__photo-glass" aria-hidden="true" />
    </div>
  );
}

function RecommendationCard({ item }: { item: Testimonial }) {
  return (
    <article className="t-card t-card--recommendation" role="listitem">
      <div className="t-card__media">
        {item.image && (
          <TestimonialThumbnail
            src={item.image}
            alt={item.name}
            imgClassName="t-card__img"
          />
        )}
      </div>
      <div className="t-card__body">
        <span className="t-card__quote-mark" aria-hidden="true">&ldquo;</span>
        <p className="t-card__quote">{truncate(item.quote)}</p>
        <p className="t-card__attribution">
          — {item.name}, {item.company}
        </p>
      </div>
    </article>
  );
}

function ClientReviewCard({ item }: { item: Testimonial }) {
  const cardRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    const tl = gsap.timeline();
    tl.to(cardRef.current, { y: -14, scale: 1.04, duration: 0.22, ease: "power2.out" }, 0);
    tl.to(innerRef.current, { rotationY: 180, duration: 0.6, ease: "back.out(1.4)" }, 0.06);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const tl = gsap.timeline();
    tl.to(innerRef.current, { rotationY: 0, duration: 0.45, ease: "power2.inOut" }, 0);
    tl.to(cardRef.current, { y: 0, scale: 1, duration: 0.35, ease: "power2.out" }, 0.08);
  }, []);

  return (
    <article
      ref={cardRef}
      className="t-card t-card--client-review"
      role="listitem"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={innerRef} className="t-card__flip-inner">
        {/* Front — photo */}
        <div className="t-card__front t-card__flip-face">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="t-card__full-img"
              loading="lazy"
              draggable={false}
            />
          )}
          <div className="t-card__front-fade" aria-hidden="true" />
          <div className="t-card__front-info">
            <p className="t-card__front-name">{item.name}</p>
            <p className="t-card__front-company">{item.role} · {item.company}</p>
          </div>
        </div>

        {/* Back — subtle color + quote */}
        <div
          className="t-card__flip-back t-card__flip-face"
          style={{ background: item.accent ?? "#f0ede8" }}
        >
          <span className="t-card__quote-mark" aria-hidden="true">&ldquo;</span>
          <p className="t-card__quote">{truncate(item.quote)}</p>
          <p className="t-card__attribution">
            — {item.name}, {item.company}
          </p>
        </div>
      </div>
    </article>
  );
}

function useDragScroll(viewportRef: React.RefObject<HTMLDivElement | null>) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      hasDragged.current = false;
      startX.current = e.pageX;
      scrollStart.current = viewportRef.current?.scrollLeft ?? 0;
      if (viewportRef.current) viewportRef.current.style.cursor = "grabbing";
    },
    [viewportRef],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || !viewportRef.current) return;
      const dx = e.pageX - startX.current;
      if (Math.abs(dx) > 4) hasDragged.current = true;
      viewportRef.current.scrollLeft = scrollStart.current - dx;
    },
    [viewportRef],
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = "grab";
  }, [viewportRef]);

  return { onMouseDown, onMouseMove, onMouseUp };
}

type TestimonialsProps = { heading: string; testimonials: Testimonial[] };

export function Testimonials({ heading, testimonials }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const { onMouseDown, onMouseMove, onMouseUp } = useDragScroll(viewportRef);

  useGSAP(
    () => {
      if (reducedMotion) return;
      registerGsapPlugins();

      const isMobile = window.matchMedia("(max-width: 48rem)").matches;

      if (headingRef.current) {
        if (isMobile) {
          // On mobile, skip the scroll-gated animation — if ScrollTrigger
          // doesn't fire on iOS the heading stays permanently invisible.
          gsap.set(headingRef.current, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            headingRef.current,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: headingRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            },
          );
        }
      }

      const cards = trackRef.current ? Array.from(trackRef.current.children) : [];
      if (cards.length) {
        if (isMobile) {
          gsap.set(cards, { x: 0, opacity: 1 });
        } else {
          gsap.fromTo(
            cards,
            { x: -60, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
              stagger: 0.1,
              scrollTrigger: {
                trigger: viewportRef.current,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            },
          );
        }
      }
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  const scrollByCard = (dir: 1 | -1) => {
    const viewport = viewportRef.current;
    const card = trackRef.current?.children[0] as HTMLElement | undefined;
    if (!viewport || !card) return;
    const gap = parseInt(getComputedStyle(trackRef.current!).gap) || 24;
    viewport.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="testimonials-section"
      aria-labelledby="testimonials-heading"
    >
      <div className="testimonials-section__header">
        <h2
          ref={headingRef}
          id="testimonials-heading"
          className="testimonials-section__heading"
        >
          {heading}
        </h2>
      </div>

      <div
        ref={viewportRef}
        className="testimonials-section__viewport"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          ref={trackRef}
          className="testimonials-section__track"
          role="list"
          aria-label="Client testimonials"
        >
          {testimonials.map((item) =>
            item.type === "client-review" ? (
              <ClientReviewCard key={item.id} item={item} />
            ) : (
              <RecommendationCard key={item.id} item={item} />
            ),
          )}
        </div>
      </div>

      <div className="testimonials-section__nav" aria-label="Carousel navigation">
        <button className="t-nav-btn" onClick={() => scrollByCard(-1)} aria-label="Previous">
          ←
        </button>
        <button className="t-nav-btn" onClick={() => scrollByCard(1)} aria-label="Next">
          →
        </button>
      </div>
    </section>
  );
}

"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import {
  SERVICE_LABELS,
  type CaseStudy,
} from "@/lib/work/case-studies";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import { CaseMetaArrow } from "./CaseMetaArrow";
import "./case-study.css";

type MoreWork = {
  slug: string;
  title: string;
  image: string;
};

type CaseStudyViewProps = {
  study: CaseStudy;
  moreWorks: MoreWork[];
};

function splitTitleLetters(title: string) {
  return title.split("").map((letter, index) => ({
    letter: letter === " " ? "\u00A0" : letter,
    key: `${letter}-${index}`,
  }));
}

function CaseBarcode() {
  return (
    <svg
      className="case-study__barcode-svg"
      viewBox="0 0 600 85"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {Array.from({ length: 72 }, (_, index) => {
        const width = index % 5 === 0 ? 4 : index % 3 === 0 ? 2 : 3;
        const x = index * 8 + 4;
        return (
          <rect
            key={index}
            x={x}
            y={8}
            width={width}
            height={69}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

export function CaseStudyView({ study, moreWorks }: CaseStudyViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLAnchorElement>(null);
  const splitTitleRef = useRef<HTMLHeadingElement>(null);
  const splitDsgnRef = useRef<HTMLHeadingElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipTextRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      if (reducedMotion) return;

      registerGsapPlugins();

      const root = rootRef.current;
      const back = backRef.current;
      if (!root) return;

      const imageWrap = root.querySelector<HTMLElement>(".case-study__hero-image");
      const heroImg = root.querySelector<HTMLElement>(".case-study__hero-img");
      const animatedImgs = root.querySelectorAll<HTMLElement>(".case-study__animated-img");

      if (imageWrap) {
        gsap.set(imageWrap, {
          clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
        });
        gsap.to(imageWrap, {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          duration: 1.7,
          ease: "power3.inOut",
          delay: 0.15,
        });
      }

      if (heroImg) {
        gsap.set(heroImg, {
          clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
          scale: 0.95,
        });
        gsap.to(heroImg, {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          scale: 1,
          duration: 1.7,
          delay: 0.45,
          ease: "power4.inOut",
        });
      }

      gsap.fromTo(
        back,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: "power4.inOut", delay: 0.2 },
      );

      const titleLetters = root.querySelectorAll<HTMLElement>(
        ".case-study__title-letter",
      );
      if (titleLetters.length) {
        gsap.set(titleLetters, { y: "-120%" });
        gsap.to(titleLetters, {
          y: "0%",
          ease: "none",
          stagger: 0.05,
          scrollTrigger: {
            trigger: splitTitleRef.current,
            start: "top 100%",
            end: "top 30%",
            scrub: 1,
          },
        });
      }

      root.querySelectorAll<HTMLElement>(".case-study__dark-title").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          onEnter: () => el.classList.add("is-active"),
          onEnterBack: () => el.classList.add("is-active"),
          onLeave: () => el.classList.remove("is-active"),
          onLeaveBack: () => el.classList.remove("is-active"),
        });
      });

      animatedImgs.forEach((img) => {
        gsap.set(img, { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" });
        gsap.to(img, {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: img,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      const splitWords = splitDsgnRef.current?.querySelectorAll<HTMLElement>(
        ".case-study__split-word-inner",
      );
      if (splitWords?.length) {
        gsap.set(splitWords, { yPercent: -120 });
        gsap.to(splitWords, {
          yPercent: 0,
          ease: "none",
          stagger: 0.2,
          scrollTrigger: {
            trigger: splitDsgnRef.current,
            start: "top 100%",
            end: "top 30%",
            scrub: 1,
          },
        });
      }

      const bgMain = root.querySelector<HTMLElement>(".case-study__bg-main img");
      if (bgMain) {
        gsap.fromTo(
          bgMain,
          { yPercent: -15 },
          {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: ".case-study__bg-main",
              scrub: true,
            },
          },
        );
      }

      const dsgn7Bg = root.querySelector<HTMLElement>(".case-study__dsgn7-bg img");
      if (dsgn7Bg) {
        gsap.fromTo(
          dsgn7Bg,
          { yPercent: -15 },
          {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: ".case-study__dsgn7-bg",
              scrub: true,
            },
          },
        );
      }

      if (back) {
        ScrollTrigger.create({
          trigger: ".case-study__dark-zone",
          start: "top 5%",
          end: "bottom center",
          onEnter: () => back.classList.add("is-light"),
          onEnterBack: () => back.classList.add("is-light"),
          onLeave: () => back.classList.remove("is-light"),
          onLeaveBack: () => back.classList.remove("is-light"),
        });
      }

      requestAnimationFrame(() => scheduleScrollTriggerRefresh());
    },
    { scope: rootRef, dependencies: [reducedMotion, study.slug] },
  );

  const showTooltip = (event: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    const tooltip = tooltipRef.current;
    const text = tooltipTextRef.current;
    if (!tooltip || !text) return;

    text.textContent = label;
    gsap.set(tooltip, {
      left: event.clientX,
      top: event.clientY,
      xPercent: -50,
      yPercent: -50,
    });
    gsap.to(tooltip, { autoAlpha: 1, duration: 0.2, ease: "power2.out" });
    gsap.fromTo(
      text,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.35, ease: "power3.out" },
    );
  };

  const hideTooltip = () => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    gsap.to(tooltip, { autoAlpha: 0, duration: 0.2, ease: "power2.out" });
  };

  const titleLetters = splitTitleLetters(study.title);

  return (
    <main
      ref={rootRef}
      id="main-content"
      className={`case-study case-study--${study.slug}`}
      tabIndex={-1}
    >
      <div className="case-study__container">
        <Link
          ref={backRef}
          href="/#works"
          className="case-study__back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="16"
            viewBox="0 0 20 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18.5738 7.6158L0.784935 7.55245M7.54209 14.5716L0.573936 7.55185L7.58172 0.57166"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>back</span>
        </Link>

        <div className="case-study__hero-image">
          <Image
            src={study.mainImage}
            alt={study.title}
            width={1050}
            height={670}
            priority
            className="case-study__hero-img"
          />
        </div>

        <h1
          ref={splitTitleRef}
          className="case-study__title case-study__title--split"
          aria-label={study.title}
        >
          {titleLetters.map(({ letter, key }) => (
            <span key={key} className="case-study__title-letter">
              {letter}
            </span>
          ))}
        </h1>

        <h1 className="case-study__title case-study__title--mobile">
          <span>{study.title}</span>
        </h1>

        <div className="case-study__services">
          <ul>
            {SERVICE_LABELS.map((label, index) => (
              <li key={label} className="case-study__meta-col">
                <div className="case-study__meta-label">
                  {label}
                  <CaseMetaArrow />
                </div>
                <div className="case-study__meta-value">
                  {study.services[index]}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="case-study__barcode">
          <h2 className="case-study__barcode-title">{study.barcodeTitle}</h2>
          <CaseBarcode />
        </div>

        <div className="case-study__description">
          {study.sections.map((section) => (
            <div key={section.label} className="case-study__meta-col">
              <div className="case-study__meta-label case-study__meta-label--large">
                {section.label}
                <CaseMetaArrow />
              </div>
              <div className="case-study__meta-value">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}

          {study.websiteUrl ? (
            <a
              href={study.websiteUrl}
              className="case-study__visit link-line"
              target={study.websiteUrl.startsWith("http") ? "_blank" : undefined}
              rel={
                study.websiteUrl.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {study.websiteLabel ?? "visit website"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1.81213 19.1203L19.4395 1.43779M5.76584 1.24781L19.6484 1.2279L19.6922 15.1104"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ) : null}
        </div>
      </div>

      <div className="case-study__dark-zone">
        <section className="case-study__background">
          <div className="case-study__bg-main">
            <Image
              src={study.backgroundMain}
              alt=""
              fill
              sizes="100vw"
              className="case-study__bg-main-img"
            />
          </div>

          <div className="case-study__container">
            {study.backgroundTop.image ? (
              <div className="case-study__background-block case-study__background-top">
                {study.backgroundTop.title ? (
                  <h2 className="case-study__dark-title">
                    <span>{study.backgroundTop.title}</span>
                  </h2>
                ) : null}
                <div className="case-study__background-image" data-label="/ dsgn 1">
                  <Image
                    src={study.backgroundTop.image}
                    alt=""
                    width={1045}
                    height={700}
                    className="case-study__animated-img"
                  />
                </div>
              </div>
            ) : null}

            {study.backgroundMiddle.image ? (
              <div className="case-study__background-block case-study__background-middle">
                {study.backgroundMiddle.title ? (
                  <h2 className="case-study__dark-title">
                    <span>{study.backgroundMiddle.title}</span>
                  </h2>
                ) : null}
                <div
                  className="case-study__background-image case-study__background-image--second"
                  data-label="/ dsgn 2"
                >
                  <Image
                    src={study.backgroundMiddle.image}
                    alt=""
                    width={830}
                    height={600}
                    className="case-study__animated-img"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {study.dsgn3.image ? (
          <section className="case-study__dsgn3">
            <div className="case-study__container">
              <div className="case-study__dsgn3-wrap">
                <div className="case-study__dsgn3-image" data-label="/ dsgn 3">
                  <Image
                    src={study.dsgn3.image}
                    alt=""
                    width={885}
                    height={635}
                    className="case-study__animated-img"
                  />
                </div>
                {study.dsgn3.title ? (
                  <h2 className="case-study__dark-title">
                    <span>{study.dsgn3.title}</span>
                  </h2>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="case-study__dsgn4">
          {study.dsgn4.bg ? (
            <div className="case-study__dsgn4-bg">
              <Image src={study.dsgn4.bg} alt="" fill sizes="50vw" />
            </div>
          ) : null}
          <div className="case-study__container">
            <div className="case-study__dsgn4-wrap">
              <h2
                ref={splitDsgnRef}
                className="case-study__split-title"
              >
                {study.dsgn4.title.split(/\s+/).map((word, index) => (
                  <span key={`${word}-${index}`} className="case-study__split-word">
                    <span className="case-study__split-word-inner">{word}</span>
                  </span>
                ))}
              </h2>
              <div className="case-study__dsgn4-image" data-label="/ dsgn 4">
                <Image
                  src={study.dsgn4.image}
                  alt=""
                  width={940}
                  height={700}
                  className="case-study__animated-img"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="case-study__dsgn5">
          <div className="case-study__container">
            <div className="case-study__dsgn5-wrap">
              <h2 className="case-study__dark-title">
                <span>{study.dsgn5.title}</span>
              </h2>
              <div className="case-study__dsgn5-image" data-label="/ dsgn 5">
                <Image
                  src={study.dsgn5.image}
                  alt=""
                  width={900}
                  height={640}
                  className="case-study__animated-img"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="case-study__dsgn6">
          <div className="case-study__container">
            <div className="case-study__dsgn6-wrap">
              <h2 className="case-study__dark-title">
                <span>{study.dsgn6.title}</span>
              </h2>
              <div className="case-study__dsgn6-image" data-label="/ dsgn 6">
                <Image
                  src={study.dsgn6.image}
                  alt=""
                  width={980}
                  height={700}
                  className="case-study__animated-img"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="case-study__dsgn7">
          <div className="case-study__dsgn7-bg">
            <Image
              src={study.dsgn7.bg}
              alt=""
              fill
              sizes="100vw"
              className="case-study__dsgn7-bg-img"
            />
          </div>
          <div className="case-study__container">
            <div className="case-study__dsgn7-wrap">
              <div className="case-study__dsgn7-image" data-label="/ dsgn 7">
                <Image
                  src={study.dsgn7.image}
                  alt=""
                  width={1200}
                  height={800}
                  className="case-study__dsgn7-media case-study__animated-img"
                />
              </div>
              <h2 className="case-study__dark-title">
                <span>{study.dsgn7.title}</span>
              </h2>
            </div>
          </div>
        </section>
      </div>

      {moreWorks.length > 0 ? (
        <section className="case-study__more">
          <div className="case-study__container">
            <h2 className="case-study__more-title">MORE WORKS</h2>
            <ul
              className="case-study__more-grid"
              onMouseLeave={hideTooltip}
            >
              {moreWorks.map((work) => (
                <li key={work.slug} className="case-study__more-item">
                  <Link
                    href={`/work/${work.slug}`}
                    className="case-study__more-link"
                    onMouseEnter={(event) => showTooltip(event, work.title)}
                  >
                    <Image
                      src={work.image}
                      alt={work.title}
                      width={410}
                      height={280}
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <div ref={tooltipRef} className="case-study__tooltip" aria-hidden="true">
              <span ref={tooltipTextRef} className="case-study__tooltip-text" />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

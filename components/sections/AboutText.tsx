"use client";

import { useGSAP } from "@gsap/react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  registerGsapPlugins,
  SCROLL_START,
  setRevealVisible,
} from "@/lib/gsap-scroll";
import gsap from "gsap";
import { cssVar } from "@/lib/tokens";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AboutCircleBackground } from "@/components/sections/AboutCircleBackground";

const LINES = [
  "I build data-driven strategies, craft futuristic digital solutions,",
  "help founders make smarter decisions, and turn complex ideas into",
  "scalable products that grow.",
] as const;

const STATS = [
  { value: 8, suffix: "+", label: "Years Experience" },
  { value: 20, suffix: "+", label: "Products Shipped" },
  { value: 15, suffix: "+", label: "Startups Worked With" },
] as const;

function CountUp({
  target,
  suffix,
  active,
  reducedMotion,
  delay = 0,
}: {
  target: number;
  suffix: string;
  active: boolean;
  reducedMotion: boolean;
  delay?: number;
}) {
  const count = useMotionValue(reducedMotion ? target : 0);
  const display = useTransform(count, (value) => `${Math.round(value)}${suffix}`);

  useEffect(() => {
    if (!active) return;

    if (reducedMotion) {
      count.set(target);
      return;
    }

    count.set(0);
    const controls = animate(count, target, {
      duration: 1.6,
      delay,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [active, count, delay, reducedMotion, target]);

  return <motion.span>{display}</motion.span>;
}

function GreenDot() {
  return (
    <span
      className="size-1.5 shrink-0 rounded-full bg-success"
      aria-hidden="true"
    />
  );
}

const TEXT = LINES.join(" ");

const REVEAL_SPRING = { stiffness: 100, damping: 30 } as const;

const LINE_START_INDEX = LINES.reduce<number[]>((acc, line, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1]! + LINES[i - 1]!.length);
  return acc;
}, []);

const LETTER_COUNT = LINES.reduce((sum, line) => sum + line.length, 0);

function Letter({
  char,
  index,
  progress,
}: {
  char: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const color = useTransform(
    progress,
    [index / LETTER_COUNT, (index + 1) / LETTER_COUNT],
    [cssVar.colorTextRevealMuted, cssVar.colorText],
  );

  return <motion.span style={{ color }}>{char}</motion.span>;
}

function AboutStats() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const grid = statsGridRef.current;
      const trigger = statsRef.current;
      const statItems = grid?.children;

      if (!grid || !trigger || !statItems?.length) return;

      if (reducedMotion) {
        setStatsActive(true);
        setRevealVisible(statItems);
        return;
      }

      registerGsapPlugins();
      gsap.set(statItems, { opacity: 0, y: 24 });
      gsap.to(statItems, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger,
          start: SCROLL_START,
          once: true,
          onEnter: () => setStatsActive(true),
        },
      });
    },
    { scope: statsRef, dependencies: [reducedMotion] },
  );

  return (
    <div ref={statsRef} className="relative z-10 mt-10 w-full sm:mt-12">
      <div
        ref={statsGridRef}
        className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-10"
      >
        {STATS.map((stat, index) => (
          <div key={stat.label} className="text-center">
            <p className="text-[3.5rem] font-extrabold leading-none text-white">
              <CountUp
                target={stat.value}
                suffix={stat.suffix}
                active={statsActive}
                reducedMotion={reducedMotion}
                delay={index * 0.12}
              />
            </p>
            <p className="mt-3 text-body-copy text-white/65">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutText() {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef as RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, REVEAL_SPRING);

  const aboutThemeStyle = {
    "--color-text": "#ffffff",
    "--color-text-reveal-muted": "rgba(255, 255, 255, 0.32)",
    "--color-text-secondary": "rgba(255, 255, 255, 0.65)",
  } as CSSProperties;

  return (
    <section
      id="about"
      className="relative isolate z-10 bg-black text-white"
      style={aboutThemeStyle}
      aria-label="About me"
    >
      <div
        ref={scrollTrackRef}
        className={reducedMotion ? "relative min-h-screen" : "relative h-[250vh]"}
      >
        <div className="sticky top-0 relative flex min-h-screen w-full items-center justify-center px-8 sm:px-12 lg:px-16">
          <AboutCircleBackground progress={scrollYProgress} />
          <div className="relative z-10 mx-auto flex w-full flex-col items-center">
            <p className="text-consultant-label mb-6 text-white/80">
              <GreenDot />
              <span className="uppercase">I don&apos;t just solve problems</span>
            </p>
            {reducedMotion ? (
              <p className="text-body-lg w-full text-center text-white">{TEXT}</p>
            ) : (
              <p
                className="text-body-lg w-full text-center text-white"
                aria-label={TEXT}
              >
                {LINES.map((line, lineIndex) => (
                  <span key={lineIndex} className="block md:whitespace-nowrap">
                    {line.split("").map((char, charIndex) => (
                      <Letter
                        key={`${lineIndex}-${charIndex}`}
                        char={char}
                        index={LINE_START_INDEX[lineIndex]! + charIndex}
                        progress={smoothProgress}
                      />
                    ))}
                  </span>
                ))}
              </p>
            )}
            <AboutStats />
          </div>
        </div>
      </div>
    </section>
  );
}

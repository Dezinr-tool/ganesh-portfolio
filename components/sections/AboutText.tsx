"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cssVar } from "@/lib/tokens";
import { useRef, type RefObject } from "react";

const LINES = [
  "I build data-driven strategies, craft futuristic digital solutions,",
  "help founders make smarter decisions, and turn complex ideas into",
  "scalable products that grow.",
] as const;

const STATS = [
  { value: "8+", label: "Years Experience" },
  { value: "20+", label: "Products Shipped" },
  { value: "15+", label: "Startups Worked With" },
] as const;

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
  const isInView = useInView(statsRef as RefObject<HTMLDivElement>, {
    once: true,
    amount: 0.4,
  });
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div ref={statsRef} className="relative z-10 mt-10 w-full sm:mt-12">
      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 24 }}
        animate={{
          opacity: reducedMotion || isInView ? 1 : 0,
          y: reducedMotion || isInView ? 0 : 24,
        }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-foreground text-[3.5rem] font-extrabold leading-none">
                {stat.value}
              </p>
              <p className="mt-3 text-body-copy">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
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

  return (
    <section
      id="about"
      className="relative isolate z-10 bg-background text-foreground"
      aria-label="About me"
    >
      <div
        ref={scrollTrackRef}
        className={reducedMotion ? "min-h-screen" : "h-[250vh]"}
      >
        <div className="sticky top-0 flex min-h-screen w-full items-center justify-center bg-background px-8 sm:px-12 lg:px-16">
          <div className="mx-auto flex w-full flex-col items-center">
            <p className="text-consultant-label mb-6">
              <GreenDot />
              <span className="uppercase">I don&apos;t just solve problems</span>
            </p>
            {reducedMotion ? (
              <p className="text-body-lg w-full text-center">{TEXT}</p>
            ) : (
              <p className="text-body-lg w-full text-center" aria-label={TEXT}>
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

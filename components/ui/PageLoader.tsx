"use client";

import { mohave } from "@/app/fonts";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./page-loader.css";

const SESSION_KEY = "portfolio-loaded";
const FONT_WAIT_MS = 2500;
const REF_WAIT_FRAMES = 48;
const SAFETY_EXIT_MS = 14_000;

const HERO_TEXT = "DESIGN & STRATEGY FOR STARTUPS";
const SUB_TEXT = "UX/UI DESIGN • PRODUCT THINKING • D2C & B2B";

type LoaderPhase = "pending" | "active" | "hidden";

function readSessionLoaded(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSessionLoaded(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => {
      window.setTimeout(() => resolve(undefined), ms);
    }),
  ]);
}

async function waitForLoaderFonts(): Promise<void> {
  const work = async () => {
    if (document.readyState !== "complete") {
      await new Promise<void>((resolve) => {
        window.addEventListener("load", () => resolve(), { once: true });
      });
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    try {
      await document.fonts.load('700 72px "Mohave"');
      await document.fonts.load('400 14px "Mohave"');
    } catch {
      /* font load can fail in strict privacy modes */
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  };

  await withTimeout(work(), FONT_WAIT_MS);
}

async function waitForNextFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function cylinderGlyphStyle(index: number, count: number): CSSProperties {
  const angle = (index / count) * 360;
  return {
    transform: `rotateY(${angle}deg) translateZ(var(--glyph-radius)) translate(-50%, -50%)`,
  };
}

function CylinderText({
  text,
  glyphClassName,
}: {
  text: string;
  glyphClassName: string;
}) {
  const chars = [...text];

  return (
    <>
      {chars.map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={`page-loader__glyph ${glyphClassName}`}
          style={cylinderGlyphStyle(index, chars.length)}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </>
  );
}

export function PageLoader() {
  const [phase, setPhase] = useState<LoaderPhase>("pending");

  const rootRef = useRef<HTMLDivElement>(null);
  const heroGroupRef = useRef<HTMLDivElement>(null);
  const subGroupRef = useRef<HTMLDivElement>(null);
  const heroCylinderRef = useRef<HTMLDivElement>(null);
  const subCylinderRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const counterValueRef = useRef({ value: 0 });
  const exitStartedRef = useRef(false);

  const handleExitComplete = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    markSessionLoaded();
    setPhase("hidden");
  }, []);

  useLayoutEffect(() => {
    if (readSessionLoaded()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- avoid loader flash before paint
      setPhase("hidden");
      return;
    }

    if (prefersReducedMotion()) {
      markSessionLoaded();
      setPhase("hidden");
      return;
    }

    setPhase("active");
  }, []);

  useEffect(() => {
    if (phase !== "active") return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) handleExitComplete();
    }, SAFETY_EXIT_MS);
    cleanups.push(() => window.clearTimeout(safetyTimer));

    const run = async () => {
      await waitForLoaderFonts();
      if (cancelled) return;

      let refsReady = false;
      for (let i = 0; i < REF_WAIT_FRAMES; i += 1) {
        if (
          rootRef.current &&
          heroGroupRef.current &&
          subGroupRef.current &&
          heroCylinderRef.current &&
          subCylinderRef.current &&
          counterRef.current
        ) {
          refsReady = true;
          break;
        }
        await waitForNextFrame();
        if (cancelled) return;
      }

      if (!refsReady || cancelled) {
        if (!cancelled) handleExitComplete();
        return;
      }

      const root = rootRef.current!;
      const heroGroup = heroGroupRef.current!;
      const subGroup = subGroupRef.current!;
      const heroCylinder = heroCylinderRef.current!;
      const subCylinder = subCylinderRef.current!;
      const counterEl = counterRef.current!;

      counterValueRef.current.value = 0;
      counterEl.textContent = "0%";

      gsap.set([heroGroup, subGroup], { y: "40vh" });
      gsap.set(counterEl, { opacity: 0 });
      gsap.set([heroCylinder, subCylinder], { rotateY: 0 });

      const heroSpin = gsap.to(heroCylinder, {
        rotateY: "+=360",
        duration: 20,
        ease: "none",
        repeat: -1,
        force3D: true,
      });

      const subSpin = gsap.to(subCylinder, {
        rotateY: "+=360",
        duration: 14,
        ease: "none",
        repeat: -1,
        force3D: true,
      });

      cleanups.push(() => {
        heroSpin.kill();
        subSpin.kill();
      });

      const timeline = gsap.timeline({
        onComplete: () => {
          if (!cancelled) handleExitComplete();
        },
      });

      timeline.to(heroGroup, {
        y: 0,
        duration: 2.5,
        delay: 1,
        ease: "power4.out",
      });
      timeline.to(
        subGroup,
        {
          y: 0,
          duration: 2,
          ease: "power4.out",
        },
        "-=2",
      );

      timeline.to(
        counterEl,
        {
          opacity: 1,
          duration: 0.6,
        },
        2.3,
      );

      timeline.to(
        counterValueRef.current,
        {
          value: 100,
          duration: 4,
          ease: "power3.out",
          onUpdate: () => {
            counterEl.textContent = `${Math.round(counterValueRef.current.value)}%`;
          },
        },
        2.5,
      );

      timeline.to(counterEl, {
        opacity: 0,
        duration: 0.3,
      });

      timeline.to(
        subGroup,
        {
          y: "60vh",
          duration: 1.2,
          ease: "power4.in",
        },
        "+=0.1",
      );
      timeline.to(
        heroGroup,
        {
          y: "60vh",
          duration: 1.2,
          ease: "power4.in",
        },
        "-=1.1",
      );
      timeline.to(
        root,
        {
          y: "-100%",
          duration: 0.9,
          ease: "power4.inOut",
        },
        "-=0.4",
      );

      cleanups.push(() => {
        timeline.kill();
      });
    };

    void run();

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [phase, handleExitComplete]);

  if (phase !== "active") return null;

  return (
    <div
      ref={rootRef}
      className={`page-loader ${mohave.variable}`}
      role="status"
      aria-live="polite"
      aria-label="Loading site"
    >
      <div className="page-loader__viewport">
        <div className="page-loader__scene">
          <div
            className="page-loader__cylinder-group page-loader__cylinder-group--hero"
            ref={heroGroupRef}
          >
            <div
              className="page-loader__cylinder page-loader__cylinder--hero"
              ref={heroCylinderRef}
              aria-hidden="true"
            >
              <CylinderText
                text={HERO_TEXT}
                glyphClassName="page-loader__glyph--hero"
              />
            </div>
          </div>

          <div
            className="page-loader__cylinder-group page-loader__cylinder-group--sub"
            ref={subGroupRef}
          >
            <div
              className="page-loader__cylinder page-loader__cylinder--sub"
              ref={subCylinderRef}
              aria-hidden="true"
            >
              <CylinderText
                text={SUB_TEXT}
                glyphClassName="page-loader__glyph--sub"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="page-loader__counter" ref={counterRef}>
        0%
      </div>
    </div>
  );
}

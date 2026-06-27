"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
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

function isDashboardRoute(pathname: string | null): boolean {
  return pathname?.startsWith("/dashboard") ?? false;
}

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
      await document.fonts.load('300 72px "Breton"');
      await document.fonts.load('400 120px "other"');
      await document.fonts.load('400 16px "Inter"');
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

const HERO_ARC_DEGREES = 200;
const SUB_ARC_DEGREES = 180;

function cylinderGlyphStyle(
  index: number,
  count: number,
  arcDegrees: number,
): CSSProperties {
  // Center the arc so text is symmetrically visible on the front face
  const angle = ((index / (count - 1)) - 0.5) * arcDegrees;
  return {
    transform: `rotateY(${angle}deg) translateZ(var(--glyph-radius)) translate(-50%, -50%)`,
  };
}

function CylinderText({
  text,
  glyphClassName,
  arcDegrees,
}: {
  text: string;
  glyphClassName: string;
  arcDegrees: number;
}) {
  const chars = [...text];

  return (
    <>
      {chars.map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={`page-loader__glyph ${glyphClassName}`}
          style={cylinderGlyphStyle(index, chars.length, arcDegrees)}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </>
  );
}

export function PageLoader() {
  const pathname = usePathname();
  const skipLoader = isDashboardRoute(pathname);
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
    document.documentElement.classList.remove("page-loader-active");
    setPhase("hidden");
  }, []);

  useLayoutEffect(() => {
    if (skipLoader) {
      document.documentElement.classList.remove("page-loader-active");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dashboard must never show portfolio loader
      setPhase("hidden");
      return;
    }

    if (readSessionLoaded()) {
      document.documentElement.classList.remove("page-loader-active");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- avoid loader flash before paint
      setPhase("hidden");
      return;
    }

    if (prefersReducedMotion()) {
      document.documentElement.classList.remove("page-loader-active");
      markSessionLoaded();
      setPhase("hidden");
      return;
    }

    document.documentElement.classList.add("page-loader-active");
    setPhase("active");
  }, [skipLoader]);

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

      const isDesktop = window.matchMedia("(min-width: 56.25rem)").matches;
      const entryX = isDesktop ? "15vw" : "0vw";

      gsap.set(root, { y: 0, opacity: 1, overflow: "visible" });
      gsap.set([heroGroup, subGroup], { y: "100vh", x: entryX });
      gsap.set(counterEl, { opacity: 0 });
      gsap.set([heroCylinder, subCylinder], { rotateY: 0 });

      const timeline = gsap.timeline({
        onComplete: () => {
          if (!cancelled) handleExitComplete();
        },
      });

      timeline.to(
        [heroGroup, subGroup],
        {
          y: 0,
          x: 0,
          duration: 2.5,
          delay: 1,
          ease: "power4.out",
          stagger: 0.08,
        },
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
        duration: 0.35,
        ease: "power2.out",
      });

      timeline.add(() => {
        gsap.set(root, { overflow: "hidden" });
      });

      timeline.to(
        [heroGroup, subGroup],
        {
          y: "110vh",
          x: entryX,
          duration: 1.1,
          ease: "power4.in",
          stagger: 0.06,
        },
        "+=0.05",
      );

      timeline.to(
        root,
        {
          y: "-100%",
          opacity: 0,
          duration: 0.85,
          ease: "power4.inOut",
        },
        "-=0.55",
      );

      cleanups.push(() => {
        timeline.kill();
      });
    };

    void run();

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      document.documentElement.classList.remove("page-loader-active");
    };
  }, [phase, handleExitComplete]);

  if (phase !== "active") return null;

  return (
    <div
      ref={rootRef}
      className="page-loader"
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
                arcDegrees={HERO_ARC_DEGREES}
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
                arcDegrees={SUB_ARC_DEGREES}
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

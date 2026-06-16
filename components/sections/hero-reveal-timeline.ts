import {
  applyRevealCopyHighlight,
  resetRevealCopyHighlight,
  splitRevealCopy,
} from "@/components/sections/AboutRevealCopy";
import { syncHeroRevealOrbit } from "@/components/sections/HeroRevealCircles";
import {
  getHeroPhotoScrollMotion,
  getNameExitOffset,
  isMobileNameViewport,
  placeNameAtFooter,
  syncNameLayerRevealMode,
} from "@/components/sections/hero-name-placement";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Luke Baffait scroll-wrap timeline — https://lukebaffait.fr/js/index.js */
export const LUKE_SCROLL_T = {
  scrub: 0.5,
  /** Hero phase ends / reveal begins */
  heroPhaseEnd: 0.3,
  /** reveal-seq scale + name split duration */
  revealScaleDuration: 0.7,
  copyIn: 0.62,
  copyDone: 0.98,
  nameHide: 0.98,
  copyCharDuration: 0.06,
  copyCharStagger: 0.007,
} as const;

export type HeroRevealElements = {
  wrap: HTMLElement;
  heroStage: HTMLElement;
  aboutSection: HTMLElement;
  revealPanel: HTMLElement;
  circlesSvg: SVGSVGElement | null;
  revealCopy: HTMLParagraphElement | null;
  nameContent: HTMLElement;
  nameLeft: HTMLElement;
  nameRight: HTMLElement;
  photo: HTMLElement | null;
  nameLayer: HTMLElement | null;
  heroSection: HTMLElement | null;
};

type OrbitState = { p: number };

type AboutSyncOptions = {
  copyChars?: HTMLElement[];
  highlightOpts?: Parameters<typeof applyRevealCopyHighlight>[2];
  revealCopy?: HTMLParagraphElement | null;
};

function syncAboutRevealFrame(
  els: Pick<HeroRevealElements, "circlesSvg" | "nameLayer" | "revealPanel">,
  progress: number,
  orbit: OrbitState,
  options: AboutSyncOptions = {},
) {
  const revealStart = LUKE_SCROLL_T.heroPhaseEnd;
  syncHeroRevealOrbit(els.circlesSvg, orbit.p);
  syncNameLayerRevealMode(els.nameLayer, progress, revealStart);

  const inReveal =
    progress >= revealStart - 0.001 && progress < LUKE_SCROLL_T.nameHide - 0.001;

  if (inReveal) {
    gsap.set(els.revealPanel, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 5,
    });
  } else if (progress < revealStart - 0.001) {
    gsap.set(els.revealPanel, {
      clearProps: "position,top,left,width,zIndex",
    });
  }

  if (options.revealCopy) {
    const showCopy = progress >= LUKE_SCROLL_T.copyIn - 0.001;
    gsap.set(options.revealCopy, { autoAlpha: showCopy ? 1 : 0 });
  }

  if (options.copyChars?.length && options.highlightOpts) {
    if (progress < LUKE_SCROLL_T.copyIn) {
      resetRevealCopyHighlight(options.copyChars, options.highlightOpts);
    } else if (progress >= LUKE_SCROLL_T.copyDone - 0.001) {
      applyRevealCopyHighlight(options.copyChars, 1, options.highlightOpts);
    } else {
      const t =
        (progress - LUKE_SCROLL_T.copyIn) /
        (LUKE_SCROLL_T.copyDone - LUKE_SCROLL_T.copyIn);
      applyRevealCopyHighlight(options.copyChars, t, options.highlightOpts);
    }
  }

  if (els.nameLayer) {
    const hideName = progress >= LUKE_SCROLL_T.nameHide - 0.001;
    gsap.set(els.nameLayer, { autoAlpha: hideName ? 0 : 1 });
  }
}

function bindAboutWorkExit(els: Pick<HeroRevealElements, "revealPanel" | "revealCopy">) {
  const workSection = document.getElementById("work");
  if (!workSection) return;

  ScrollTrigger.getById("about-work-exit")?.kill();
  ScrollTrigger.getById("about-work-phrase-exit")?.kill();

  let copyChars: HTMLElement[] = [];
  if (els.revealCopy) {
    copyChars = Array.from(
      els.revealCopy.querySelectorAll<HTMLElement>(".hero-reveal-copy__char"),
    );
  }

  const exitTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  exitTl.to(els.revealPanel, { y: "-50vh", duration: 1 }, 0);

  const phraseExitTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  if (copyChars.length) {
    phraseExitTl.to(copyChars, {
      opacity: 0,
      duration: 0.2,
      stagger: { each: 0.01, from: "end" },
    }, 0);
  }

  ScrollTrigger.create({
    id: "about-work-phrase-exit",
    trigger: workSection,
    start: "top bottom",
    end: "top top",
    scrub: true,
    animation: phraseExitTl,
  });

  ScrollTrigger.create({
    id: "about-work-exit",
    trigger: workSection,
    start: "top bottom",
    end: "top top",
    scrub: true,
    animation: exitTl,
    onLeaveBack: () => {
      gsap.set(els.revealPanel, { y: 0, clearProps: "transform" });
      if (copyChars.length) {
        gsap.set(copyChars, { opacity: 1 });
      }
    },
  });
}

export function buildHeroRevealTimeline(els: HeroRevealElements) {
  const {
    wrap,
    revealPanel,
    circlesSvg,
    revealCopy,
    nameContent,
    nameLeft,
    nameRight,
    photo,
    nameLayer,
  } = els;

  const heroSection =
    els.heroSection ?? document.getElementById("hero");

  ScrollTrigger.getById("hero-scroll-transition")?.kill();
  ScrollTrigger.getById("about-scroll-reveal")?.kill();
  ScrollTrigger.getById("about-work-exit")?.kill();
  ScrollTrigger.getById("about-work-phrase-exit")?.kill();

  const { introSettledY } = placeNameAtFooter(nameContent);
  const introXvw = (gsap.getProperty(nameContent, "x") as string) || "0vw";
  const exit = getNameExitOffset();
  const exitLeft = `-${exit}vw`;
  const exitRight = `${exit}vw`;

  const H = LUKE_SCROLL_T.heroPhaseEnd;
  const R = LUKE_SCROLL_T.revealScaleDuration;

  gsap.set(revealPanel, {
    scale: 0,
    opacity: 1,
    y: 0,
    transformOrigin: "50% 50%",
    force3D: true,
  });

  let copyChars: HTMLElement[] = [];
  if (revealCopy && !revealCopy.dataset.split) {
    copyChars = splitRevealCopy(revealCopy);
    revealCopy.dataset.split = "true";
  } else if (revealCopy) {
    copyChars = Array.from(
      revealCopy.querySelectorAll<HTMLElement>(".hero-reveal-copy__char"),
    );
  }

  const highlightOpts = {
    useBlur: true,
    blurTrail: 3,
    maxBlur: isMobileNameViewport() ? 8 : 10,
  };

  if (copyChars.length) {
    if (revealCopy) revealCopy.dataset.revealBlur = "true";
    resetRevealCopyHighlight(copyChars, highlightOpts);
  }
  if (revealCopy) {
    gsap.set(revealCopy, { autoAlpha: 0 });
  }

  const orbit: OrbitState = { p: 0 };
  syncHeroRevealOrbit(circlesSvg, 0);

  const aboutSyncEls = { circlesSvg, nameLayer, revealPanel };
  const aboutSyncOpts: AboutSyncOptions = {
    copyChars,
    highlightOpts,
    revealCopy,
  };

  const syncFrame = (progress: number) => {
    syncAboutRevealFrame(aboutSyncEls, progress, orbit, aboutSyncOpts);
  };

  /* ——— Unified scroll-wrap timeline (Luke scrollTl) ——— */
  const masterTl = gsap.timeline({
    paused: true,
    defaults: { ease: "none" },
    onUpdate: () => {
      syncFrame(masterTl.progress());
    },
  });

  masterTl.fromTo(
    nameContent,
    { x: introXvw, y: introSettledY },
    { x: introXvw, y: 0, duration: H, ease: "none" },
    0,
  );

  if (heroSection) {
    gsap.set(heroSection, { autoAlpha: 1, visibility: "visible", "--hero-merge": 0 });
  }

  if (photo) {
    const photoMotion = getHeroPhotoScrollMotion();
    const photoLayer =
      photo.querySelector<HTMLElement>("[data-hero-photo-layer]") ?? photo;
    const dissolveDur = H * 0.4;

    gsap.set(photo, {
      y: 0,
      opacity: 1,
      transformOrigin: "center bottom",
      force3D: true,
      "--hero-merge": 0,
    });
    gsap.set(photoLayer, {
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transformOrigin: "center bottom",
      force3D: true,
    });

    masterTl.fromTo(
      photo,
      { y: 0 },
      {
        y: photoMotion.outerY,
        duration: H,
        ease: "power2.inOut",
      },
      0,
    );

    masterTl.fromTo(
      photoLayer,
      { x: 0, y: 0, scale: 1 },
      {
        x: photoMotion.layerX,
        y: photoMotion.layerY,
        scale: photoMotion.layerScale,
        duration: H,
        ease: "power1.inOut",
      },
      0,
    );

    masterTl.fromTo(
      photo,
      { "--hero-merge": 0 },
      { "--hero-merge": 1, duration: H, ease: "none" },
      0,
    );

    if (heroSection) {
      masterTl.fromTo(
        heroSection,
        { "--hero-merge": 0 },
        { "--hero-merge": 1, duration: H, ease: "none" },
        0,
      );
    }

    masterTl.fromTo(
      photo,
      { opacity: 1 },
      { opacity: 0, duration: dissolveDur, ease: "power2.in" },
      H - dissolveDur,
    );

    masterTl.fromTo(
      photoLayer,
      { filter: "blur(0px)" },
      {
        filter: `blur(${photoMotion.dissolveBlur}px)`,
        duration: dissolveDur,
        ease: "power2.in",
      },
      H - dissolveDur,
    );

    masterTl.set(photo, { opacity: 0 }, H);
  }

  if (heroSection) {
    masterTl.fromTo(
      heroSection,
      { autoAlpha: 1 },
      {
        autoAlpha: 0,
        duration: H * 0.2,
        ease: "power2.in",
      },
      H * 0.88,
    );
    masterTl.set(heroSection, { visibility: "hidden" }, H);
  }

  masterTl.fromTo(
    nameLeft,
    { x: "0vw", opacity: 1 },
    { x: exitLeft, opacity: 0, duration: R, ease: "none" },
    H,
  );
  masterTl.fromTo(
    nameRight,
    { x: "0vw", opacity: 1 },
    { x: exitRight, opacity: 0, duration: R, ease: "none" },
    H,
  );

  masterTl.fromTo(
    revealPanel,
    { scale: 0 },
    { scale: 1, duration: R, ease: "none" },
    H,
  );

  masterTl.fromTo(
    orbit,
    { p: 0 },
    { p: 1, duration: R, ease: "none" },
    H,
  );

  masterTl.fromTo(
    orbit,
    { p: 1 },
    {
      p: 2.85,
      duration: LUKE_SCROLL_T.copyDone - LUKE_SCROLL_T.copyIn,
      ease: "none",
    },
    LUKE_SCROLL_T.copyIn,
  );

  if (nameLayer) {
    gsap.set(nameLayer, { autoAlpha: 1 });
  }

  ScrollTrigger.create({
    id: "hero-scroll-transition",
    trigger: wrap,
    start: "top top",
    end: "bottom bottom",
    scrub: LUKE_SCROLL_T.scrub,
    animation: masterTl,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (self.progress > 0.001) {
        window.dispatchEvent(new CustomEvent("hero-scroll-started"));
      }
      if (self.progress >= H - 0.001 && nameLayer) {
        nameLayer.classList.add("hero-name-layer--reveal");
      }
    },
    onRefresh: (self) => {
      masterTl.progress(self.progress);
      syncFrame(self.progress);
      if (self.progress < 0.001) {
        placeNameAtFooter(nameContent);
        if (photo) gsap.set(photo, { "--hero-merge": 0 });
        if (heroSection) gsap.set(heroSection, { "--hero-merge": 0 });
        if (nameLayer) {
          nameLayer.classList.remove("hero-name-layer--reveal");
        }
      }
    },
    onLeaveBack: () => {
      placeNameAtFooter(nameContent);
      if (nameLayer) {
        nameLayer.classList.remove("hero-name-layer--reveal");
        gsap.set(nameLayer, { autoAlpha: 1 });
      }
      gsap.set(nameLeft, { x: "0vw", opacity: 1 });
      gsap.set(nameRight, { x: "0vw", opacity: 1 });
      gsap.set(revealPanel, {
        scale: 0,
        y: 0,
        clearProps: "position,top,left,width,zIndex,transform",
      });
      gsap.set(photo, { "--hero-merge": 0 });
      if (heroSection) gsap.set(heroSection, { "--hero-merge": 0 });
      syncFrame(0);
    },
  });

  masterTl.progress(
    ScrollTrigger.getById("hero-scroll-transition")?.progress ?? 0,
  );
  syncFrame(masterTl.progress());

  bindAboutWorkExit({ revealPanel, revealCopy });
  els.aboutSection.dataset.heroReady = "true";

  return masterTl;
}

/** @deprecated Use scroll trigger onLeave/onEnterBack instead */
export function bindHeroRevealHide() {
  ScrollTrigger.getById("hero-reveal-hide")?.kill();
}

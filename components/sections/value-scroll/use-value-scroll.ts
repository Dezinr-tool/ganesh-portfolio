import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import {
  buildCharPhysics,
  clearCharPhysics,
  launchCharExplosion,
  restoreCharPhysics,
  type CharPhysicsRuntime,
} from "@/lib/value-scroll/physics";
import {
  bindMwgCharReveal,
  lockParagraphHeights,
} from "@/lib/value-scroll/mwg-char-reveal";
import { bindValueScrollCarousel } from "@/lib/value-scroll/bind-value-scroll-carousel";
import {
  VALUE_SCROLL_DESKTOP_MQ,
  VALUE_SCROLL_LAYOUT,
} from "@/lib/value-scroll/constants";

export function useValueScrollAnimations() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reducedMotion) return;

      registerGsapPlugins();

      const isMobile = window.matchMedia(VALUE_SCROLL_DESKTOP_MQ).matches;
      const headline = root.querySelector<HTMLElement>(".vs-headline");
      const headlineStage = root.querySelector<HTMLElement>(".vs-headline__stage");
      const headlinePin = root.querySelector<HTMLElement>(".vs-headline__pin");
      const cardsSection = root.querySelector<HTMLElement>(".vs-cards");
      const cardsPin = root.querySelector<HTMLElement>(".vs-cards__pin");
      const cardsStage = root.querySelector<HTMLElement>(".vs-cards__stage");
      const wheel = root.querySelector<HTMLElement>(".vs-cards__wheel");

      if (
        !headline ||
        !headlineStage ||
        !headlinePin ||
        !cardsSection ||
        !cardsPin ||
        !cardsStage ||
        !wheel
      ) {
        return;
      }

      const headlineSelector = isMobile
        ? ".vs-headline__copy--mobile"
        : ".vs-headline__copy--desktop";
      const headlineCopy = headlineStage.querySelector<HTMLElement>(headlineSelector);
      if (!headlineCopy) return;

      const paragraphs = gsap.utils.toArray<HTMLElement>(
        headlineCopy.querySelectorAll(".vs-headline__line"),
      );
      const arms = gsap.utils.toArray<HTMLElement>(wheel.querySelectorAll(".vs-arm"));

      let charRevealCleanup: (() => void) | undefined;
      let carouselCleanup: (() => void) | undefined;
      let physicsRuntime: CharPhysicsRuntime | null = null;
      let matterModule: typeof import("matter-js") | null = null;

      if (isMobile) {
        gsap.set(headlineCopy.querySelectorAll(".vs-headline__char-inner"), {
          autoAlpha: 0,
        });
        gsap.to(headlineCopy.querySelectorAll(".vs-headline__char-inner"), {
          autoAlpha: 1,
          stagger: { each: 0.015, from: "random" },
          ease: "power2.out",
          duration: 0.6,
          scrollTrigger: {
            id: "vs-headline-mobile",
            trigger: headline,
            start: "top 75%",
            once: true,
          },
        });
        return;
      }

      lockParagraphHeights(paragraphs);

      charRevealCleanup = bindMwgCharReveal(headline, ".vs-headline__char-inner", {
        id: "vs-headline-chars",
        isMobile: false,
        endExtraViewports: 4,
      });

      ScrollTrigger.create({
        id: "vs-headline-pin",
        trigger: headlinePin,
        start: "top top",
        end: "bottom bottom",
        pin: headlineStage,
        anticipatePin: 1,
      });

      const loadMatter = async () => {
        if (!matterModule) matterModule = await import("matter-js");
        return matterModule;
      };

      ScrollTrigger.create({
        id: "vs-matter-burst",
        trigger: cardsSection,
        start: "top top",
        onEnter: () => {
          charRevealCleanup?.();
          charRevealCleanup = undefined;

          void loadMatter().then((Matter) => {
            if (physicsRuntime) return;
            physicsRuntime = buildCharPhysics(
              Matter,
              headlineCopy,
              ".vs-headline__char-inner",
            );
            launchCharExplosion(Matter, physicsRuntime, gsap);
            gsap.ticker.add(physicsRuntime.tick);
          });
        },
        onLeave: () => {
          if (physicsRuntime) gsap.ticker.remove(physicsRuntime.tick);
        },
        onEnterBack: () => {
          if (physicsRuntime) gsap.ticker.add(physicsRuntime.tick);
        },
        onLeaveBack: () => {
          if (physicsRuntime && matterModule) {
            gsap.ticker.remove(physicsRuntime.tick);
            restoreCharPhysics(matterModule, physicsRuntime, gsap);
            clearCharPhysics(matterModule, physicsRuntime);
            physicsRuntime = null;
          }

          charRevealCleanup = bindMwgCharReveal(headline, ".vs-headline__char-inner", {
            id: "vs-headline-chars",
            isMobile: false,
            endExtraViewports: 4,
          });
        },
      });

      carouselCleanup = bindValueScrollCarousel({
        pinHeight: cardsPin,
        stage: cardsStage,
        wheel,
        arms,
        rotationStep: VALUE_SCROLL_LAYOUT.carouselRotationStep,
      });

      scheduleScrollTriggerRefresh();

      return () => {
        charRevealCleanup?.();
        carouselCleanup?.();
        if (physicsRuntime && matterModule) {
          gsap.ticker.remove(physicsRuntime.tick);
          clearCharPhysics(matterModule, physicsRuntime);
          physicsRuntime = null;
        }
        ScrollTrigger.getById("vs-headline-pin")?.kill();
        ScrollTrigger.getById("vs-matter-burst")?.kill();
      };
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return rootRef;
}

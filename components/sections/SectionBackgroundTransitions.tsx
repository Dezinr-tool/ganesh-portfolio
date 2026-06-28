"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import "./section-background-transitions.css";

function readCssColor(name: "--color-bg" | "--color-text") {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

type BridgeVariant = "light-to-dark" | "dark-to-light";

function SectionBackgroundBridge({ variant }: { variant: BridgeVariant }) {
  const bridgeRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const bridge = bridgeRef.current;
      if (!bridge || reducedMotion) return;

      registerGsapPlugins();

      // On mobile, scrub-based ScrollTrigger is unreliable on iOS.
      // Show the bridge at 50% opacity as a static mid-tone blend instead.
      if (window.matchMedia("(max-width: 48rem)").matches) {
        gsap.set(bridge, { opacity: 0.5 });
        return;
      }

      gsap.fromTo(
        bridge,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            id: `section-bridge-${variant}-in`,
            trigger: bridge,
            start: "top 95%",
            end: "top 40%",
            scrub: 0.6,
          },
        },
      );

      gsap.fromTo(
        bridge,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            id: `section-bridge-${variant}-out`,
            trigger: bridge,
            start: "top 40%",
            end: "bottom 5%",
            scrub: 0.6,
          },
        },
      );

      scheduleScrollTriggerRefresh();
    },
    { scope: bridgeRef, dependencies: [reducedMotion, variant] },
  );

  return (
    <div
      ref={bridgeRef}
      className={`section-bg-bridge section-bg-bridge--${variant}`}
      aria-hidden="true"
    />
  );
}

export function ScrollBackgroundLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useGSAP(
    () => {
      const layer = layerRef.current;
      if (!layer || reducedMotion) return;

      registerGsapPlugins();

      const light = readCssColor("--color-bg");
      const dark = readCssColor("--color-text");

      // On mobile, skip the scrub — just hide the layer so each section's own
      // background color shows through without conflicting overlay.
      if (window.matchMedia("(max-width: 48rem)").matches) {
        gsap.set(layer, { display: "none" });
        return;
      }

      gsap.set(layer, { backgroundColor: light });

      gsap.fromTo(
        layer,
        { backgroundColor: light },
        {
          backgroundColor: dark,
          ease: "none",
          scrollTrigger: {
            id: "scroll-bg-light-to-dark",
            trigger: ".value-scroll",
            start: "bottom 85%",
            endTrigger: "#works",
            end: "top 15%",
            scrub: 0.6,
          },
        },
      );

      gsap.fromTo(
        layer,
        { backgroundColor: dark },
        {
          backgroundColor: light,
          ease: "none",
          scrollTrigger: {
            id: "scroll-bg-dark-to-light",
            trigger: "#works",
            start: "bottom 85%",
            endTrigger: ".tools-experience",
            end: "top 15%",
            scrub: 0.6,
          },
        },
      );

      scheduleScrollTriggerRefresh();
    },
    { scope: layerRef, dependencies: [reducedMotion] },
  );

  return <div ref={layerRef} className="scroll-bg-layer" aria-hidden="true" />;
}

export function LightToDarkBridge() {
  return <SectionBackgroundBridge variant="light-to-dark" />;
}

export function DarkToLightBridge() {
  return <SectionBackgroundBridge variant="dark-to-light" />;
}

"use client";

import { Canvas } from "@react-three/fiber";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useState, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import type { WorksProject } from "./projects";
import { WorksCanvasErrorBoundary } from "./WorksCanvasErrorBoundary";
import { WorksGalleryScene } from "./WorksGalleryScene";
import { WORKS_CAMERA, WORKS_TONE_MAPPING_EXPOSURE } from "./works-scene-constants";

type WorksCanvasProps = {
  projects: WorksProject[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isDraggingRef: MutableRefObject<boolean>;
  sectionRef: RefObject<HTMLElement | null>;
  onGalleryHover?: (hovered: boolean) => void;
  reducedMotion: boolean;
  className?: string;
};

function WorksCanvasFallback() {
  return (
    <div className="works-gallery__canvas-host works-gallery__canvas-host--loading">
      <span className="works-gallery__canvas-loading" aria-hidden="true" />
    </div>
  );
}

export function WorksCanvas({
  projects,
  activeIndex,
  onActiveIndexChange,
  isDraggingRef,
  sectionRef,
  onGalleryHover,
  reducedMotion,
  className,
}: WorksCanvasProps) {
  // isMobile must be determined after mount to avoid SSR/client hydration mismatch.
  // Both server and initial client render render the loading fallback, then after
  // mount we switch to the correct view for the device.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 68.75rem)").matches);
  }, []);

  const dpr = useMemo(() => {
    if (typeof window === "undefined" || isMobile === null) return 1;
    return isMobile ? 1 : Math.min(2, window.devicePixelRatio);
  }, [isMobile]);

  if (reducedMotion) {
    return null;
  }

  // During SSR and hydration, render nothing in the canvas slot.
  // After mount, isMobile resolves to the correct value.
  if (isMobile === null) {
    return (
      <div className={className}>
        <WorksCanvasFallback />
      </div>
    );
  }

  if (isMobile) {
    const project = projects[activeIndex] ?? projects[0];
    return (
      <div className={className}>
        <div className="works-gallery__canvas-host works-gallery__mobile-gallery">
          {project && (
            <Image
              key={project.id}
              src={project.image}
              alt={project.title}
              fill
              className="works-gallery__mobile-image"
              sizes="100vw"
              priority
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <WorksCanvasErrorBoundary>
        <div className="works-gallery__canvas-host">
          <Canvas
            className="works-gallery__canvas"
            dpr={[1, dpr]}
            camera={{
              position: WORKS_CAMERA.position,
              fov: WORKS_CAMERA.fov,
              near: 0.1,
              far: 100,
            }}
            gl={{
              antialias: false,
              powerPreference: "high-performance",
              alpha: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: WORKS_TONE_MAPPING_EXPOSURE,
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
            }}
            frameloop="demand"
          >
            <Suspense fallback={null}>
              <WorksGalleryScene
                sectionRef={sectionRef}
                projects={projects}
                activeIndex={activeIndex}
                onActiveIndexChange={onActiveIndexChange}
                isDraggingRef={isDraggingRef}
                onGalleryHover={onGalleryHover}
              />
            </Suspense>
          </Canvas>
        </div>
      </WorksCanvasErrorBoundary>
    </div>
  );
}

export { WorksCanvasFallback };

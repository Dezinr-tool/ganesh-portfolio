"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, type MutableRefObject, type RefObject } from "react";
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
  const dpr = useMemo(
    () => Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1),
    [],
  );

  if (reducedMotion) {
    return null;
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
              antialias: true,
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

"use client";

import { useGSAP } from "@gsap/react";
import { Environment, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";
import * as THREE from "three";
import { registerGsapPlugins } from "@/lib/gsap-scroll";
import { scheduleScrollTriggerRefresh } from "@/lib/scroll-refresh";
import type { WorksProject } from "./projects";
import {
  WORKS_BEAM,
  WORKS_DRAG_THRESHOLD,
  WORKS_FOG,
  WORKS_SCREEN,
  WORKS_TILT_START_X,
} from "./works-scene-constants";

useGLTF.preload("/models/final-scene.glb");

/** Matches Olha XR — emissive-baked GLTF materials (puff/wall/floor + emissive strips). */
function applyOlhaRoomMaterial(source: THREE.Material): THREE.MeshStandardMaterial {
  const isStandard = source instanceof THREE.MeshStandardMaterial;
  const isBasic = source instanceof THREE.MeshBasicMaterial;
  const map = isStandard ? source.map : isBasic ? source.map : null;

  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.flipY = false;
  }

  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 1,
    metalness: 0,
  });

  if (map) {
    material.map = map;
    material.emissiveMap = map;
    material.emissive = new THREE.Color(0xffffff);
    material.emissiveIntensity = 1;
  } else if (isStandard) {
    material.emissive.copy(source.emissive);
    material.emissiveIntensity = source.emissiveIntensity;
  } else {
    material.emissive = new THREE.Color(0xffffff);
    material.emissiveIntensity = 5;
  }

  if (isStandard) {
    if (source.normalMap) material.normalMap = source.normalMap;
    if (source.aoMap) material.aoMap = source.aoMap;
    if (source.roughnessMap) material.roughnessMap = source.roughnessMap;
  }

  material.needsUpdate = true;
  return material;
}

function assignOlhaRoomMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => applyOlhaRoomMaterial(material));
      return;
    }

    child.material = applyOlhaRoomMaterial(child.material);
  });
}

type WorksGallerySceneProps = {
  sectionRef: RefObject<HTMLElement | null>;
  projects: WorksProject[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isDraggingRef: MutableRefObject<boolean>;
  onGalleryHover?: (hovered: boolean) => void;
};

function RoomModel() {
  const { scene } = useGLTF("/models/final-scene.glb");
  const room = useMemo(() => {
    const cloned = scene.clone(true);
    assignOlhaRoomMaterials(cloned);
    return cloned;
  }, [scene]);

  return (
    <group position={[0, -0.25, 0]}>
      <primitive object={room} />
    </group>
  );
}

function ProjectorBeam() {
  const texture = useTexture(WORKS_BEAM.texture);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }, [texture]);

  return (
    <mesh
      position={WORKS_BEAM.position}
      rotation={WORKS_BEAM.rotation}
      scale={WORKS_BEAM.meshScale}
      renderOrder={10}
    >
      <coneGeometry args={[WORKS_BEAM.radius, WORKS_BEAM.length, 32, 1, true]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function ScrollFog({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const savedFog = useRef<THREE.Fog | THREE.FogExp2 | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      registerGsapPlugins();
      savedFog.current = scene.fog as THREE.Fog | null;

      const fog = new THREE.Fog("#101010", WORKS_FOG.startNear, WORKS_FOG.startFar);
      scene.fog = fog;

      const tween = gsap.to(fog, {
        near: WORKS_FOG.endNear,
        far: WORKS_FOG.endFar,
        ease: "none",
        onUpdate: invalidate,
        scrollTrigger: {
          id: "works-scene-fog",
          trigger: section,
          start: "top top",
          end: "+=200%",
          scrub: 2,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        scene.fog = savedFog.current;
      };
    },
    { dependencies: [sectionRef, scene, invalidate] },
  );

  return null;
}

function ScrollTiltGroup({
  sectionRef,
  children,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const group = groupRef.current;
      if (!section || !group) return;

      registerGsapPlugins();
      group.rotation.set(WORKS_TILT_START_X, 0, 0);

      const tween = gsap.to(group.rotation, {
        x: 0,
        ease: "none",
        onUpdate: invalidate,
        scrollTrigger: {
          id: "works-scene-tilt",
          trigger: section,
          start: "top 40%",
          end: "+=200%",
          scrub: 2,
          invalidateOnRefresh: true,
        },
      });

      scheduleScrollTriggerRefresh();

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [sectionRef, invalidate] },
  );

  return <group ref={groupRef}>{children}</group>;
}

function ProjectSlides({
  projects,
  activeIndex,
  onActiveIndexChange,
  isDraggingRef,
  onGalleryHover,
}: {
  projects: WorksProject[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isDraggingRef: MutableRefObject<boolean>;
  onGalleryHover?: (hovered: boolean) => void;
}) {
  const textures = useTexture(projects.map((project) => project.image));

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const startXRef = useRef(0);
  const dragDeltaRef = useRef(0);
  const draggingRef = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  const prevIndexRef = useRef(activeIndex);
  const projectsKeyRef = useRef("");
  const invalidate = useThree((state) => state.invalidate);

  const basePosition = WORKS_SCREEN.slide.position;

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
    });
  }, [textures]);

  useEffect(() => {
    const projectsKey = projects.map((project) => project.id).join("|");

    const resetSlides = () => {
      meshRefs.current.forEach((mesh, index) => {
        if (!mesh?.material || !(mesh.material instanceof THREE.MeshBasicMaterial)) {
          return;
        }
        mesh.position.set(...basePosition);
        mesh.material.opacity = index === activeIndex ? 1 : 0;
      });
      invalidate();
    };

    if (projectsKey !== projectsKeyRef.current) {
      projectsKeyRef.current = projectsKey;
      prevIndexRef.current = activeIndex;
      meshRefs.current.forEach((mesh) => {
        if (mesh) {
          gsap.killTweensOf(mesh.position);
          if (mesh.material instanceof THREE.MeshBasicMaterial) {
            gsap.killTweensOf(mesh.material);
          }
        }
      });
      resetSlides();
      return;
    }

    const prev = prevIndexRef.current;
    if (prev === activeIndex) return;

    const outgoing = meshRefs.current[prev];
    const incoming = meshRefs.current[activeIndex];

    if (!outgoing || !incoming) {
      prevIndexRef.current = activeIndex;
      resetSlides();
      return;
    }

    const outMat = outgoing.material as THREE.MeshBasicMaterial;
    const inMat = incoming.material as THREE.MeshBasicMaterial;

    meshRefs.current.forEach((mesh) => {
      if (mesh) {
        gsap.killTweensOf(mesh.position);
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          gsap.killTweensOf(mesh.material);
        }
      }
    });

    outgoing.position.set(...basePosition);
    incoming.position.set(...basePosition);
    outMat.opacity = 1;
    inMat.opacity = 0;

    gsap.to(outMat, {
      opacity: 0,
      duration: 0.48,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });

    gsap.to(inMat, {
      opacity: 1,
      duration: 0.48,
      ease: "power2.inOut",
      onUpdate: invalidate,
      onComplete: () => {
        meshRefs.current.forEach((mesh, index) => {
          if (!mesh?.material || !(mesh.material instanceof THREE.MeshBasicMaterial)) {
            return;
          }
          mesh.position.set(...basePosition);
          mesh.material.opacity = index === activeIndex ? 1 : 0;
        });
        invalidate();
      },
    });

    prevIndexRef.current = activeIndex;
  }, [activeIndex, basePosition, invalidate, projects]);

  const finishDrag = () => {
    if (!draggingRef.current) return;

    const delta = dragDeltaRef.current;
    draggingRef.current = false;
    isDraggingRef.current = false;
    document.body.style.cursor = "";

    const index = activeIndexRef.current;
    if (delta < -WORKS_DRAG_THRESHOLD && index < projects.length - 1) {
      onActiveIndexChange(index + 1);
    } else if (delta > WORKS_DRAG_THRESHOLD && index > 0) {
      onActiveIndexChange(index - 1);
    }

    dragDeltaRef.current = 0;
  };

  const pointerX = (nativeEvent: MouseEvent | TouchEvent) => {
    if ("clientX" in nativeEvent) return nativeEvent.clientX;
    return nativeEvent.touches[0]?.clientX ?? 0;
  };

  return (
    <group>
      <mesh
        position={[0, 0, WORKS_SCREEN.hit.z]}
        onPointerEnter={() => {
          onGalleryHover?.(true);
          document.body.style.cursor = "grab";
        }}
        onPointerLeave={() => {
          onGalleryHover?.(false);
          if (!draggingRef.current) document.body.style.cursor = "";
        }}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          draggingRef.current = true;
          isDraggingRef.current = true;
          startXRef.current = pointerX(event.nativeEvent);
          dragDeltaRef.current = 0;
          document.body.style.cursor = "grabbing";
        }}
        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
          if (!draggingRef.current) return;
          dragDeltaRef.current = pointerX(event.nativeEvent) - startXRef.current;
        }}
        onPointerUp={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          finishDrag();
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          isDraggingRef.current = false;
          document.body.style.cursor = "";
          finishDrag();
        }}
      >
        <planeGeometry args={WORKS_SCREEN.hit.size} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {textures.map((texture, index) => (
        <mesh
          key={projects[index]?.id ?? index}
          ref={(node) => {
            meshRefs.current[index] = node;
          }}
          position={WORKS_SCREEN.slide.position}
        >
          <planeGeometry args={WORKS_SCREEN.slide.size} />
          <meshBasicMaterial map={texture} transparent opacity={index === activeIndex ? 1 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function CameraParallax() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    if (window.innerWidth <= 1100) return;

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    if (window.innerWidth <= 1100) return;

    const prevX = camera.position.x;
    const prevY = camera.position.y;
    camera.position.x += (target.current.x * 0.1 - camera.position.x) * 0.05;
    camera.position.y += (target.current.y * 0.1 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    if (Math.abs(camera.position.x - prevX) > 0.0001 || Math.abs(camera.position.y - prevY) > 0.0001) {
      invalidate();
    }
  });

  return null;
}

function FrameLoopOptimizer({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const setFrameloop = useThree((state) => state.setFrameloop);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      registerGsapPlugins();
      setFrameloop("demand");

      const run = () => setFrameloop("always");
      const stop = () => setFrameloop("demand");

      const trigger = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onEnter: run,
          onEnterBack: run,
          onLeave: stop,
          onLeaveBack: stop,
        },
      });

      if (trigger.scrollTrigger?.isActive) {
        run();
      }

      return () => {
        trigger.scrollTrigger?.kill();
        trigger.kill();
        stop();
      };
    },
    { dependencies: [sectionRef, setFrameloop] },
  );

  return null;
}

export function WorksGalleryScene({
  sectionRef,
  projects,
  activeIndex,
  onActiveIndexChange,
  isDraggingRef,
  onGalleryHover,
}: WorksGallerySceneProps) {
  return (
    <>
      <color attach="background" args={["#101010"]} />
      <Environment preset="night" />
      <ScrollFog sectionRef={sectionRef} />
      <ScrollTiltGroup sectionRef={sectionRef}>
        <RoomModel />
        <ProjectSlides
          projects={projects}
          activeIndex={activeIndex}
          onActiveIndexChange={onActiveIndexChange}
          isDraggingRef={isDraggingRef}
          onGalleryHover={onGalleryHover}
        />
        <ProjectorBeam />
      </ScrollTiltGroup>
      <FrameLoopOptimizer sectionRef={sectionRef} />
      <CameraParallax />
    </>
  );
}

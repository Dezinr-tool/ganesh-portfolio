"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useProgress, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Five real camera angles of the subject, ordered left→right. Dragging rotates
 * the "head" by cross-fading between adjacent angles, giving a genuine turning
 * effect (not a depth trick) — the closest single-DOM approximation of the
 * landonorris.com rotating-3D hero using flat images.
 */
const VIEWS = [
  "/portrait/0-left-profile.avif",
  "/portrait/1-left-3q.avif",
  "/portrait/2-front.avif",
  "/portrait/3-right-3q.avif",
  "/portrait/4-right-profile.avif",
] as const;
const FRONT_INDEX = 2;
const LAST_INDEX = VIEWS.length - 1;

/** Intrinsic aspect of the angle renders (720 × 1278). */
const IMG_ASPECT = 720 / 1278;
const MOBILE_QUERY = "(max-width: 68.75rem)";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Cross-fades between two adjacent angle textures (uTexA/uTexB by uMix) and adds
 * a pointer-driven studio highlight + soft vignette. Pixels are never warped.
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;
  uniform vec2 uPointer;
  uniform float uSweep;
  varying vec2 vUv;

  void main() {
    vec4 a = texture2D(uTexA, vUv);
    vec4 b = texture2D(uTexB, vUv);
    vec4 c = mix(a, b, uMix);
    if (c.a < 0.01) discard;

    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));

    float d = distance(vUv, uPointer);
    float sweep = smoothstep(0.62, 0.0, d);
    float spec = sweep * (0.3 + 0.75 * lum) * uSweep;
    vec3 col = c.rgb + spec * vec3(0.8);

    float vig = smoothstep(1.15, 0.12, distance(vUv, vec2(0.5)));
    col *= mix(0.88, 1.06, vig);

    gl_FragColor = vec4(col, c.a);
  }
`;

type ViewState = {
  angle: number;
  targetAngle: number;
  pointer: THREE.Vector2;
  targetPointer: THREE.Vector2;
  sweep: number;
  targetSweep: number;
};

function PortraitPlane() {
  const textures = useTexture([...VIEWS]);
  const { viewport, gl } = useThree();

  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [textures, gl]);

  const { width, height, y } = useMemo(() => {
    const contAspect = viewport.width / viewport.height;
    let w: number;
    let h: number;
    if (IMG_ASPECT > contAspect) {
      w = viewport.width;
      h = w / IMG_ASPECT;
    } else {
      h = viewport.height;
      w = h * IMG_ASPECT;
    }
    const scale = 1.22;
    w *= scale;
    h *= scale;
    const topMargin = viewport.height * 0.06;
    return { width: w, height: h, y: viewport.height / 2 - h / 2 - topMargin };
  }, [viewport.width, viewport.height]);

  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTexA: { value: textures[FRONT_INDEX] },
      uTexB: { value: textures[FRONT_INDEX] },
      uMix: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uSweep: { value: 0 },
    }),
    [textures],
  );

  const state = useRef<ViewState>({
    angle: FRONT_INDEX,
    targetAngle: FRONT_INDEX,
    pointer: new THREE.Vector2(0.5, 0.5),
    targetPointer: new THREE.Vector2(0.5, 0.5),
    sweep: 0,
    targetSweep: 0,
  });

  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    let dragging = false;
    let lastX = 0;
    // How much drag distance (fraction of width) turns one full step between angles.
    const stepPerWidth = 0.55;

    const rectPointer = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      return {
        px: (clientX - rect.left) / rect.width,
        py: (clientY - rect.top) / rect.height,
      };
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      s.targetSweep = 1;
      el.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      const { px, py } = rectPointer(e.clientX, e.clientY);
      const inside = px >= 0 && px <= 1 && py >= 0 && py <= 1;
      if (inside) {
        s.targetPointer.set(px, 1 - py);
        s.targetSweep = dragging ? 1 : 0.6;
      } else if (!dragging) {
        s.targetSweep = 0;
      }

      if (dragging) {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - lastX) / rect.width;
        // Drag right → head turns to its right (toward higher index).
        s.targetAngle = clamp(
          s.targetAngle + (dx / stepPerWidth) * (LAST_INDEX),
          0,
          LAST_INDEX,
        );
        lastX = e.clientX;
      } else if (inside) {
        // Idle: subtle look-toward-cursor within ±1 angle of front.
        s.targetAngle = clamp(FRONT_INDEX + (px - 0.5) * 2.0, 0, LAST_INDEX);
      }
    };

    const onUp = () => {
      dragging = false;
      el.style.cursor = "grab";
    };

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const s = state.current;
    const k = Math.min(1, delta * 7);

    s.angle += (s.targetAngle - s.angle) * k;
    s.sweep += (s.targetSweep - s.sweep) * k;
    s.pointer.lerp(s.targetPointer, Math.min(1, delta * 6));

    const mat = materialRef.current;
    if (mat) {
      const lo = Math.floor(s.angle);
      const hi = Math.min(lo + 1, LAST_INDEX);
      mat.uniforms.uTexA.value = textures[lo];
      mat.uniforms.uTexB.value = textures[hi];
      mat.uniforms.uMix.value = s.angle - lo;
      mat.uniforms.uPointer.value.copy(s.pointer);
      mat.uniforms.uSweep.value = s.sweep;
    }
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      <mesh>
        <planeGeometry args={[width, height, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    </group>
  );
}

function PortraitScene({ withBloom }: { withBloom: boolean }) {
  return (
    <>
      <PortraitPlane />
      {withBloom && (
        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={1.0}
            luminanceThreshold={0.65}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

function PortraitLoader() {
  const { active, progress } = useProgress();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!active && progress >= 100) {
      const t = window.setTimeout(() => setHidden(true), 350);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [active, progress]);

  if (hidden) return null;

  return (
    <div
      className="hero-portrait-loader"
      data-done={!active && progress >= 100 ? "true" : "false"}
      aria-hidden="true"
    >
      <span className="hero-portrait-loader__label">LOAD</span>
      <span className="hero-portrait-loader__bar">
        <span
          className="hero-portrait-loader__fill"
          style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }}
        />
      </span>
    </div>
  );
}

function StaticPortrait() {
  return (
    <div className="hero-photo-stack relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        <Image
          src={VIEWS[FRONT_INDEX]}
          fill
          sizes="100vw"
          className="hero-portrait-img"
          alt="Ganesh Das"
          priority
        />
      </div>
    </div>
  );
}

export function HeroPortrait3D() {
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [withBloom, setWithBloom] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia(MOBILE_QUERY).matches;
    if (reduced) {
      setMode("static");
      return;
    }
    setMode("3d");
    setWithBloom(!isMobile);
  }, []);

  if (mode !== "3d") {
    return (
      <div className="hero-portrait-3d">
        <StaticPortrait />
      </div>
    );
  }

  return (
    <div className="hero-portrait-3d">
      <Canvas
        className="hero-portrait-canvas"
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{ position: [0, 0, 3], fov: 35, near: 0.1, far: 20 }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
        }}
      >
        <Suspense fallback={null}>
          <PortraitScene withBloom={withBloom} />
        </Suspense>
      </Canvas>
      <PortraitLoader />
    </div>
  );
}

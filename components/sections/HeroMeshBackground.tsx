"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import {
  getAutoTargets,
  smoothTowardVec2,
  type Vec2,
} from "./hero-mesh-motion";
import {
  HERO_IMAGE_SIZE,
  HERO_MESH_FRAG_BLUR,
  HERO_MESH_FRAG_COMPOSITE,
  HERO_MESH_FRAG_FLOW,
  HERO_MESH_FRAG_PRESENT,
  HERO_MESH_VERT,
} from "./hero-mesh-shaders";

const HERO_BG_SRC = "/hero-shader-bg.png";

const SMOOTH_FOCUS = 0.38;
const SMOOTH_DRIFT = 0.48;
const SMOOTH_POINTER = 0.28;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: string,
  fs: string,
): WebGLProgram | null {
  const v = compileShader(gl, gl.VERTEX_SHADER, vs);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function loadTexture(gl: WebGL2RenderingContext, src: string) {
  return new Promise<{ tex: WebGLTexture; w: number; h: number } | null>(
    (resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const tex = gl.createTexture();
        if (!tex) {
          resolve(null);
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.bindTexture(gl.TEXTURE_2D, null);
        resolve({ tex, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = src;
    },
  );
}

function createFbo(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) return null;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { fbo, tex };
}

export function HeroMeshBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<Vec2>({ x: 0.5, y: 0.5 });
  const smoothPointerRef = useRef<Vec2>({ x: 0.5, y: 0.5 });
  const smoothFocusRef = useRef<Vec2>({ x: 0.5, y: 0.5 });
  const smoothDriftRef = useRef<Vec2>({ x: 0, y: 0 });
  const reducedMotionRef = useRef(false);

  useGSAP(
    () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      reducedMotionRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.ticker.lagSmoothing(1000, 16);

      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
      if (!gl) return;

      let disposed = false;
      let cleanup: (() => void) | undefined;

      const init = async () => {
        const progComposite = linkProgram(
          gl,
          HERO_MESH_VERT,
          HERO_MESH_FRAG_COMPOSITE,
        );
        const progFlow = linkProgram(gl, HERO_MESH_VERT, HERO_MESH_FRAG_FLOW);
        const progBlur = linkProgram(gl, HERO_MESH_VERT, HERO_MESH_FRAG_BLUR);
        const progPresent = linkProgram(gl, HERO_MESH_VERT, HERO_MESH_FRAG_PRESENT);
        if (!progComposite || !progFlow || !progBlur || !progPresent || disposed) {
          return;
        }

        const loaded = await loadTexture(gl, HERO_BG_SRC);
        if (!loaded || disposed) return;

        const { tex: srcTex, w: imgW, h: imgH } = loaded;
        const imageSize = {
          width: imgW || HERO_IMAGE_SIZE.width,
          height: imgH || HERO_IMAGE_SIZE.height,
        };

        const quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );

        const bindQuad = (program: WebGLProgram, attr = "aPosition") => {
          const loc = gl.getAttribLocation(program, attr);
          gl.bindBuffer(gl.ARRAY_BUFFER, quad);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        };

        const uComposite = {
          source: gl.getUniformLocation(progComposite, "uSourceImage"),
          resolution: gl.getUniformLocation(progComposite, "uResolution"),
          imageSize: gl.getUniformLocation(progComposite, "uImageSize"),
        };
        const uFlow = {
          texture: gl.getUniformLocation(progFlow, "uTexture"),
          resolution: gl.getUniformLocation(progFlow, "uResolution"),
          mousePos: gl.getUniformLocation(progFlow, "uMousePos"),
          autoDrift: gl.getUniformLocation(progFlow, "uAutoDrift"),
          time: gl.getUniformLocation(progFlow, "uTime"),
        };
        const uBlur = {
          texture: gl.getUniformLocation(progBlur, "uTexture"),
          resolution: gl.getUniformLocation(progBlur, "uResolution"),
          direction: gl.getUniformLocation(progBlur, "uDirection"),
          passIndex: gl.getUniformLocation(progBlur, "uPassIndex"),
        };
        const uPresent = {
          texture: gl.getUniformLocation(progPresent, "uTexture"),
        };

        let fboA: { fbo: WebGLFramebuffer; tex: WebGLTexture } | null = null;
        let fboB: { fbo: WebGLFramebuffer; tex: WebGLTexture } | null = null;
        let size = { width: 1, height: 1, dpr: 1 };

        const resize = () => {
          const isMobile = window.innerWidth <= 768;
          const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
          const width = container.clientWidth;
          const height = container.clientHeight;
          size = { width, height, dpr };
          const pw = Math.max(1, Math.floor(width * dpr));
          const ph = Math.max(1, Math.floor(height * dpr));
          canvas.width = pw;
          canvas.height = ph;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;

          if (fboA?.tex) gl.deleteTexture(fboA.tex);
          if (fboA?.fbo) gl.deleteFramebuffer(fboA.fbo);
          if (fboB?.tex) gl.deleteTexture(fboB.tex);
          if (fboB?.fbo) gl.deleteFramebuffer(fboB.fbo);
          fboA = createFbo(gl, pw, ph);
          fboB = createFbo(gl, pw, ph);
        };

        const setMouseFromEvent = (clientX: number, clientY: number) => {
          const rect = container.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          pointerRef.current.x = Math.max(
            0,
            Math.min(1, (clientX - rect.left) / rect.width),
          );
          pointerRef.current.y = Math.max(
            0,
            Math.min(1, (clientY - rect.top) / rect.height),
          );
        };

        const onPointerMove = (e: PointerEvent) =>
          setMouseFromEvent(e.clientX, e.clientY);

        const drawQuad = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const draw = () => {
          const hero = container.closest("#hero");
          if (
            hero instanceof HTMLElement &&
            getComputedStyle(hero).visibility === "hidden"
          ) {
            return;
          }

          if (!fboA || !fboB) return;
          const { width, height, dpr } = size;
          if (width <= 0 || height <= 0) return;
          const pw = Math.floor(width * dpr);
          const ph = Math.floor(height * dpr);

          const delta = gsap.ticker.deltaRatio();
          const time = reducedMotionRef.current ? 0.95 : gsap.ticker.time;

          if (!reducedMotionRef.current) {
            smoothTowardVec2(
              smoothPointerRef.current,
              pointerRef.current,
              SMOOTH_POINTER,
              delta,
            );

            const targets = getAutoTargets(time, smoothPointerRef.current);
            smoothTowardVec2(
              smoothFocusRef.current,
              targets.focus,
              SMOOTH_FOCUS,
              delta,
            );
            smoothTowardVec2(
              smoothDriftRef.current,
              targets.drift,
              SMOOTH_DRIFT,
              delta,
            );
          }

          const focus = smoothFocusRef.current;
          const drift = smoothDriftRef.current;

          const bgX = (focus.x + drift.x * 0.4) * 100;
          const bgY = (1 - focus.y + drift.y * 0.4) * 100;
          const bgXStr = `${bgX.toFixed(2)}%`;
          const bgYStr = `${bgY.toFixed(2)}%`;

          const section = container.parentElement;
          if (section instanceof HTMLElement) {
            section.style.setProperty("--hero-shader-bg-x", bgXStr);
            section.style.setProperty("--hero-shader-bg-y", bgYStr);
          }

          const nameLayer = document.getElementById("name-layer");
          if (nameLayer) {
            nameLayer.style.setProperty("--hero-shader-bg-x", bgXStr);
            nameLayer.style.setProperty("--hero-shader-bg-y", bgYStr);
          }

          gl.viewport(0, 0, pw, ph);

          gl.bindFramebuffer(gl.FRAMEBUFFER, fboA.fbo);
          gl.useProgram(progComposite);
          bindQuad(progComposite);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, srcTex);
          gl.uniform1i(uComposite.source, 0);
          gl.uniform2f(uComposite.resolution, width, height);
          gl.uniform2f(uComposite.imageSize, imageSize.width, imageSize.height);
          drawQuad();

          gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
          gl.useProgram(progFlow);
          bindQuad(progFlow);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
          gl.uniform1i(uFlow.texture, 0);
          gl.uniform2f(uFlow.resolution, width, height);
          gl.uniform2f(uFlow.mousePos, focus.x, focus.y);
          gl.uniform2f(uFlow.autoDrift, drift.x, drift.y);
          gl.uniform1f(uFlow.time, time);
          drawQuad();

          const blurPasses: { dir: [number, number]; index: number }[] =
            window.innerWidth <= 768
              ? [
                  { dir: [1, 0], index: 0 },
                  { dir: [0, 1], index: 1 },
                ]
              : [
                  { dir: [1, 0], index: 0 },
                  { dir: [0, 1], index: 1 },
                  { dir: [1, 0], index: 2 },
                  { dir: [0, 1], index: 3 },
                ];

          let readTex = fboB.tex;
          let writeFbo = fboA;

          gl.useProgram(progBlur);
          bindQuad(progBlur);

          for (const pass of blurPasses) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo.fbo);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, readTex);
            gl.uniform1i(uBlur.texture, 0);
            gl.uniform2f(uBlur.resolution, pw, ph);
            gl.uniform2f(uBlur.direction, pass.dir[0], pass.dir[1]);
            gl.uniform1i(uBlur.passIndex, pass.index);
            drawQuad();
            readTex = writeFbo.tex;
            writeFbo = writeFbo === fboA ? fboB : fboA;
          }

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.useProgram(progPresent);
          bindQuad(progPresent);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, readTex);
          gl.uniform1i(uPresent.texture, 0);
          drawQuad();
        };

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        gsap.ticker.add(draw);

        cleanup = () => {
          window.removeEventListener("resize", resize);
          window.removeEventListener("pointermove", onPointerMove);
          gsap.ticker.remove(draw);
          if (fboA) {
            gl.deleteTexture(fboA.tex);
            gl.deleteFramebuffer(fboA.fbo);
          }
          if (fboB) {
            gl.deleteTexture(fboB.tex);
            gl.deleteFramebuffer(fboB.fbo);
          }
          gl.deleteTexture(srcTex);
          gl.deleteProgram(progComposite);
          gl.deleteProgram(progFlow);
          gl.deleteProgram(progBlur);
          gl.deleteProgram(progPresent);
        };
      };

      init();

      return () => {
        disposed = true;
        cleanup?.();
      };
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="hero-mesh-bg pointer-events-none absolute inset-0 z-[-1] overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="hero-mesh-bg__canvas" />
      <div className="hero-mesh-bg__grain" aria-hidden="true" />
    </div>
  );
}

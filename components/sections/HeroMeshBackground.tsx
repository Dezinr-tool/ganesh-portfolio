"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import {
  createFlowGovernor,
  flowBufferSize,
  flowTime,
  followPointer,
  isHeroOnScreen,
  pointerToFlowUv,
  type Vec2,
} from "./hero-mesh-motion";
import {
  HERO_MESH_BLUR_STRENGTHS,
  HERO_MESH_FRAG_BLUR,
  HERO_MESH_FRAG_FLOW,
  HERO_MESH_FRAG_PRESENT,
  HERO_MESH_FRAG_SOURCE,
  HERO_MESH_VERT,
} from "./hero-mesh-shaders";

const MAX_DPR = 1.5;
const MAX_DPR_PHONE = 1;
const PHONE_WIDTH = 768;

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture };

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

function linkProgram(gl: WebGL2RenderingContext, fragment: string) {
  const v = compileShader(gl, gl.VERTEX_SHADER, HERO_MESH_VERT);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!v || !f || !program) return null;
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.bindAttribLocation(program, 0, "aPosition");
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

function createTarget(gl: WebGL2RenderingContext, w: number, h: number): Target | null {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { fbo, tex };
}

function deleteTarget(gl: WebGL2RenderingContext, target: Target | null) {
  if (!target) return;
  gl.deleteTexture(target.tex);
  gl.deleteFramebuffer(target.fbo);
}

export function HeroMeshBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;

    const progSource = linkProgram(gl, HERO_MESH_FRAG_SOURCE);
    const progFlow = linkProgram(gl, HERO_MESH_FRAG_FLOW);
    const progBlur = linkProgram(gl, HERO_MESH_FRAG_BLUR);
    const progPresent = linkProgram(gl, HERO_MESH_FRAG_PRESENT);
    if (!progSource || !progFlow || !progBlur || !progPresent) return;

    const uSourceResolution = gl.getUniformLocation(progSource, "uResolution");
    const uFlow = {
      texture: gl.getUniformLocation(progFlow, "uTexture"),
      resolution: gl.getUniformLocation(progFlow, "uResolution"),
      pointer: gl.getUniformLocation(progFlow, "uPointer"),
      time: gl.getUniformLocation(progFlow, "uTime"),
    };
    const uBlur = {
      texture: gl.getUniformLocation(progBlur, "uTexture"),
      aspect: gl.getUniformLocation(progBlur, "uAspect"),
      strength: gl.getUniformLocation(progBlur, "uStrength"),
    };
    const uPresentTexture = gl.getUniformLocation(progPresent, "uTexture");

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer: Vec2 = { x: 0.5, y: 0.5 };
    const followed: Vec2 = { x: 0.5, y: 0.5 };
    const governor = createFlowGovernor();
    let source: Target | null = null;
    let passes: [Target | null, Target | null] = [null, null];
    let buffer = { width: 1, height: 1 };
    let contextLost = false;
    let seconds = 0;
    let active = true;

    const drawQuad = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const resize = () => {
      const dprLimit = window.innerWidth <= PHONE_WIDTH ? MAX_DPR_PHONE : MAX_DPR;
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
      const width = Math.max(1, Math.floor(container.clientWidth * dpr));
      const height = Math.max(1, Math.floor(container.clientHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      buffer = flowBufferSize(width, height, governor.scale);

      deleteTarget(gl, source);
      deleteTarget(gl, passes[0]);
      deleteTarget(gl, passes[1]);
      source = createTarget(gl, buffer.width, buffer.height);
      passes = [
        createTarget(gl, buffer.width, buffer.height),
        createTarget(gl, buffer.width, buffer.height),
      ];
      if (!source) return;

      // The shape never changes, so it only needs drawing when the size does.
      gl.bindFramebuffer(gl.FRAMEBUFFER, source.fbo);
      gl.viewport(0, 0, buffer.width, buffer.height);
      gl.useProgram(progSource);
      gl.uniform2f(uSourceResolution, buffer.width, buffer.height);
      drawQuad();
    };

    const draw = () => {
      const [first, second] = passes;
      if (contextLost || !source || !first || !second) return;

      gl.activeTexture(gl.TEXTURE0);
      gl.viewport(0, 0, buffer.width, buffer.height);

      gl.bindFramebuffer(gl.FRAMEBUFFER, first.fbo);
      gl.useProgram(progFlow);
      gl.bindTexture(gl.TEXTURE_2D, source.tex);
      gl.uniform1i(uFlow.texture, 0);
      gl.uniform2f(uFlow.resolution, buffer.width, buffer.height);
      gl.uniform2f(uFlow.pointer, followed.x, followed.y);
      gl.uniform1f(uFlow.time, flowTime(seconds));
      drawQuad();

      gl.useProgram(progBlur);
      gl.uniform1i(uBlur.texture, 0);
      gl.uniform1f(uBlur.aspect, buffer.width / buffer.height);
      let read = first;
      let write = second;
      for (const strength of HERO_MESH_BLUR_STRENGTHS) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
        gl.bindTexture(gl.TEXTURE_2D, read.tex);
        gl.uniform1f(uBlur.strength, strength);
        drawQuad();
        [read, write] = [write, read];
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(progPresent);
      gl.bindTexture(gl.TEXTURE_2D, read.tex);
      gl.uniform1i(uPresentTexture, 0);
      drawQuad();
    };

    const syncActive = () => {
      active = isHeroOnScreen(container);
      canvas.dataset.flowActive = String(active);
    };

    const tick = (_time: number, deltaMs: number) => {
      syncActive();
      if (!active) return;
      seconds += deltaMs / 1000;
      followPointer(followed, pointer, gsap.ticker.deltaRatio(60));
      draw();

      const decision = governor.frame(deltaMs);
      if (decision === "resize") {
        resize();
      } else if (decision === "stop") {
        gsap.ticker.remove(tick);
        canvas.dataset.flowActive = "false";
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const next = pointerToFlowUv(event.clientX, event.clientY, container.getBoundingClientRect());
      if (next) Object.assign(pointer, next);
    };

    const onResize = () => {
      resize();
      syncActive();
      draw();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
    };

    resize();
    syncActive();
    draw();
    canvas.dataset.flowReady = "true";
    window.addEventListener("resize", onResize);
    canvas.addEventListener("webglcontextlost", onContextLost);

    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      gsap.ticker.add(tick);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gsap.ticker.remove(tick);
      deleteTarget(gl, source);
      deleteTarget(gl, passes[0]);
      deleteTarget(gl, passes[1]);
      gl.deleteBuffer(quad);
      gl.deleteProgram(progSource);
      gl.deleteProgram(progFlow);
      gl.deleteProgram(progBlur);
      gl.deleteProgram(progPresent);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-mesh-bg pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="hero-mesh-bg__canvas" />
    </div>
  );
}

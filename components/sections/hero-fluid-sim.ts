import type {
  Camera,
  Mesh,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";


const VERT = `precision highp float;
in vec3 position;
uniform vec2 boundarySpace;
out vec2 uv;
void main() {
  vec3 pos = position;
  pos.xy = pos.xy * (1.0 - boundarySpace * 2.0);
  uv = vec2(0.5) + pos.xy * 0.5;
  gl_Position = vec4(pos, 1.0);
}`;

const ADVECT_FRAG = `precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform bool isBFECC;
uniform vec2 fboSize;
in vec2 uv;
out vec4 fragColor;
void main() {
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  if (!isBFECC) {
    fragColor = vec4(texture(velocity, uv - texture(velocity, uv).xy * dt * ratio).xy, 0.0, 0.0);
  } else {
    vec2 vel_old = texture(velocity, uv).xy;
    vec2 spot_old = uv - vel_old * dt * ratio;
    vec2 vel_new1 = texture(velocity, spot_old).xy;
    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
    vec2 spot_new3 = uv - (spot_new2 - uv) / 2.0;
    vec2 vel_2 = texture(velocity, spot_new3).xy;
    fragColor = vec4(texture(velocity, spot_new3 - vel_2 * dt * ratio).xy, 0.0, 0.0);
  }
}`;

const DISSIPATE_FRAG = `precision highp float;
uniform sampler2D velocity;
uniform float dissipation;
in vec2 uv;
out vec4 fragColor;
void main() {
  fragColor = vec4(texture(velocity, uv).xy * dissipation, 0.0, 0.0);
}`;

const DIVERGENCE_FRAG = `precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
in vec2 uv;
out vec4 fragColor;
void main() {
  float x0 = texture(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture(velocity, uv + vec2(0.0, px.y)).y;
  fragColor = vec4((x1 - x0 + y1 - y0) * 0.5 / dt);
}`;

const PRESSURE_FRAG = `precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
in vec2 uv;
out vec4 fragColor;
void main() {
  float p0 = texture(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  fragColor = vec4((p0 + p1 + p2 + p3) / 4.0 - texture(divergence, uv).r);
}`;

const GRADIENT_SUBTRACT_FRAG = `precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
in vec2 uv;
out vec4 fragColor;
void main() {
  float p0 = texture(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture(pressure, uv - vec2(0.0, px.y)).r;
  fragColor = vec4(texture(velocity, uv).xy - vec2(p0 - p1, p2 - p3) * 0.5 * dt, 0.0, 1.0);
}`;

const FORCE_FRAG = `precision highp float;
uniform vec2 force;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(c), 1.0);
  d *= d;
  fragColor = vec4(force * d, 0.0, 1.0);
}`;

const FORCE_VERT = `precision highp float;
in vec3 position;
in vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
out vec2 vUv;
void main() {
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

const DISPLAY_FRAG = `precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
uniform float displayMix;
in vec2 uv;
out vec4 fragColor;
void main() {
  float lenv = length(texture(velocity, uv).xy);
  float t = smoothstep(0.0, 0.38, lenv * displayMix);
  vec3 ink = texture(palette, vec2(clamp(lenv * displayMix * 0.85, 0.0, 1.0), 0.5)).rgb;
  fragColor = vec4(mix(bgColor.rgb, ink, t * 0.78), 1.0);
}`;

export type HeroFluidOptions = {
  mouseForce?: number;
  cursorSize?: number;
  resolution?: number;
  iterationsPoisson?: number;
  dissipation?: number;
  mouseSmoothing?: number;
  displayMix?: number;
  colors?: string[];
  bgColor?: string;
};

type FboSet = Record<string, WebGLRenderTarget>;

type Pass = {
  scene: Scene;
  camera: Camera;
  mesh: Mesh;
  target: WebGLRenderTarget | null;
  render: () => void;
};

function createPaletteTexture(
  THREE: typeof import("three"),
  colors: string[],
): Texture {
  const data = new Uint8Array(colors.length * 4);
  for (let i = 0; i < colors.length; i++) {
    const c = new THREE.Color(colors[i] ?? "#dddddd");
    data[i * 4] = Math.round(c.r * 255);
    data[i * 4 + 1] = Math.round(c.g * 255);
    data[i * 4 + 2] = Math.round(c.b * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, colors.length, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function pickFboType(
  THREE: typeof import("three"),
  renderer: WebGLRenderer,
): import("three").TextureDataType {
  const gl = renderer.getContext();
  const tryType = (type: import("three").TextureDataType) => {
    const rt = new THREE.WebGLRenderTarget(4, 4, {
      type,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });
    renderer.setRenderTarget(rt);
    renderer.clear();
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    renderer.setRenderTarget(null);
    rt.dispose();
    return ok;
  };

  if (tryType(THREE.HalfFloatType)) return THREE.HalfFloatType;
  if (tryType(THREE.FloatType)) return THREE.FloatType;
  return THREE.HalfFloatType;
}

export function createHeroFluidSim(
  THREE: typeof import("three"),
  container: HTMLElement,
  options: HeroFluidOptions = {},
) {
  const opts = {
    mouseForce: options.mouseForce ?? 20,
    cursorSize: options.cursorSize ?? 160,
    resolution: options.resolution ?? 0.5,
    iterationsPoisson: options.iterationsPoisson ?? 10,
    dissipation: options.dissipation ?? 0.985,
    mouseSmoothing: options.mouseSmoothing ?? 0.09,
    displayMix: options.displayMix ?? 3.2,
    colors: options.colors ?? ["#e6320f", "#e6320f", "#ff2d00"],
    bgColor: options.bgColor ?? "#0a0a0a",
  };

  const width = () => Math.max(1, container.clientWidth);
  const height = () => Math.max(1, container.clientHeight);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
  });
  renderer.autoClear = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(new THREE.Color(opts.bgColor), 1);
  renderer.domElement.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;";
  container.appendChild(renderer.domElement);

  const fboType = pickFboType(THREE, renderer);
  const fboParams = {
    type: fboType,
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  };

  const palette = createPaletteTexture(THREE, opts.colors);
  const bg = new THREE.Color(opts.bgColor);

  const mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0, inside: false };
  const target = { x: 0.5, y: 0.5 };

  const fboSize = new THREE.Vector2(1, 1);
  const cellScale = new THREE.Vector2(1, 1);
  const boundarySpace = new THREE.Vector2(0, 0);

  let fbos: FboSet = {};

  function calcSize() {
    const w = Math.max(1, Math.round(width() * opts.resolution));
    const h = Math.max(1, Math.round(height() * opts.resolution));
    fboSize.set(w, h);
    cellScale.set(1 / w, 1 / h);
  }

  function makePass(
    frag: string,
    uniforms: Record<string, { value: unknown }>,
    vert = VERT,
  ): Pass {
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);
    const pass: Pass = {
      scene,
      camera,
      mesh,
      target: null,
      render() {
        renderer.setRenderTarget(pass.target);
        renderer.render(scene, camera);
      },
    };
    return pass;
  }

  function resizeFbos() {
    for (const key of Object.keys(fbos)) fbos[key]?.dispose();
    fbos = {};
    for (const name of ["vel_0", "vel_1", "div", "pres_0", "pres_1"]) {
      fbos[name] = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, fboParams);
    }
  }

  calcSize();
  resizeFbos();

  const dt = 0.014;

  const advectUniforms = {
    boundarySpace: { value: cellScale },
    px: { value: cellScale },
    fboSize: { value: fboSize },
    velocity: { value: fbos.vel_0!.texture },
    dt: { value: dt },
    isBFECC: { value: true },
  };
  const advect = makePass(ADVECT_FRAG, advectUniforms);

  const dissipateUniforms = {
    boundarySpace: { value: boundarySpace },
    velocity: { value: fbos.vel_0!.texture },
    dissipation: { value: opts.dissipation },
  };
  const dissipate = makePass(DISSIPATE_FRAG, dissipateUniforms);

  const forceUniforms = {
    px: { value: cellScale },
    force: { value: new THREE.Vector2() },
    center: { value: new THREE.Vector2() },
    scale: { value: new THREE.Vector2(opts.cursorSize, opts.cursorSize) },
  };
  const forceScene = new THREE.Scene();
  const forceCamera = new THREE.Camera();
  const forceMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: FORCE_VERT,
    fragmentShader: FORCE_FRAG,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: forceUniforms,
  });
  const forceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), forceMat);
  forceScene.add(forceMesh);

  const divUniforms = {
    boundarySpace: { value: boundarySpace },
    velocity: { value: fbos.vel_1!.texture },
    px: { value: cellScale },
    dt: { value: dt },
  };
  const div = makePass(DIVERGENCE_FRAG, divUniforms);

  const poisUniforms = {
    boundarySpace: { value: boundarySpace },
    pressure: { value: fbos.pres_0!.texture },
    divergence: { value: fbos.div!.texture },
    px: { value: cellScale },
  };
  const pois = makePass(PRESSURE_FRAG, poisUniforms);

  const gradUniforms = {
    boundarySpace: { value: boundarySpace },
    pressure: { value: fbos.pres_0!.texture },
    velocity: { value: fbos.vel_1!.texture },
    px: { value: cellScale },
    dt: { value: dt },
  };
  const grad = makePass(GRADIENT_SUBTRACT_FRAG, gradUniforms);

  const displayScene = new THREE.Scene();
  const displayCamera = new THREE.Camera();
  const displayMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: DISPLAY_FRAG,
    uniforms: {
      boundarySpace: { value: boundarySpace },
      velocity: { value: fbos.vel_0!.texture },
      palette: { value: palette },
      bgColor: { value: new THREE.Vector4(bg.r, bg.g, bg.b, 1) },
      displayMix: { value: opts.displayMix },
    },
  });
  displayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), displayMat));

  function resize() {
    calcSize();
    resizeFbos();
    renderer.setSize(width(), height(), false);
    advectUniforms.velocity.value = fbos.vel_0!.texture;
    dissipateUniforms.velocity.value = fbos.vel_0!.texture;
    divUniforms.velocity.value = fbos.vel_1!.texture;
    poisUniforms.pressure.value = fbos.pres_0!.texture;
    poisUniforms.divergence.value = fbos.div!.texture;
    gradUniforms.pressure.value = fbos.pres_0!.texture;
    gradUniforms.velocity.value = fbos.vel_1!.texture;
    (displayMat as ShaderMaterial).uniforms.velocity.value = fbos.vel_0!.texture;
  }

  resize();

  function setMouse(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (clientX - rect.left) / rect.width;
    const ny = 1 - (clientY - rect.top) / rect.height;
    target.x = nx;
    target.y = ny;
    mouse.inside = true;
  }

  const trackEl = container.closest("#hero") ?? container;

  function onMove(e: PointerEvent) {
    const rect = trackEl.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      mouse.inside = false;
      return;
    }
    setMouse(e.clientX, e.clientY);
  }

  window.addEventListener("pointermove", onMove, { passive: true });

  let raf = 0;
  let visible = true;
  let idleT = 0;

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
    },
    { threshold: 0.05 },
  );
  observer.observe(container);

  function step() {
    if (!visible) return;

    boundarySpace.set(0, 0);

    if (!mouse.inside) {
      idleT += 0.014;
      target.x = 0.5 + Math.sin(idleT) * 0.28;
      target.y = 0.5 + Math.cos(idleT * 0.82) * 0.2;
    }

    const smooth = opts.mouseSmoothing;
    mouse.x += (target.x - mouse.x) * smooth;
    mouse.y += (target.y - mouse.y) * smooth;
    mouse.vx = mouse.x - mouse.px;
    mouse.vy = mouse.y - mouse.py;
    mouse.px = mouse.x;
    mouse.py = mouse.y;

    const fx = mouse.vx * opts.mouseForce;
    const fy = mouse.vy * opts.mouseForce;

    const r = opts.cursorSize * cellScale.x;
    const cx = Math.min(Math.max(mouse.x * 2 - 1, -1 + r), 1 - r);
    const cy = Math.min(Math.max(mouse.y * 2 - 1, -1 + r), 1 - r);

    forceUniforms.force.value.set(fx, fy);
    forceUniforms.center.value.set(cx, cy);

    dissipateUniforms.velocity.value = fbos.vel_0!.texture;
    dissipate.target = fbos.vel_1!;
    dissipate.render();

    advectUniforms.velocity.value = fbos.vel_1!.texture;
    advect.target = fbos.vel_0!;
    advect.render();

    renderer.setRenderTarget(fbos.vel_0!);
    renderer.render(forceScene, forceCamera);

    divUniforms.velocity.value = fbos.vel_0!.texture;
    div.target = fbos.div!;
    div.render();

    let presRead = fbos.pres_0!;
    let presWrite = fbos.pres_1!;
    for (let i = 0; i < opts.iterationsPoisson; i++) {
      poisUniforms.pressure.value = presRead.texture;
      poisUniforms.divergence.value = fbos.div!.texture;
      pois.target = presWrite;
      pois.render();
      [presRead, presWrite] = [presWrite, presRead];
    }

    gradUniforms.pressure.value = presRead.texture;
    gradUniforms.velocity.value = fbos.vel_0!.texture;
    grad.target = fbos.vel_1!;
    grad.render();

    renderer.setRenderTarget(null);
    renderer.setClearColor(new THREE.Color(opts.bgColor), 1);
    renderer.clear();
    (displayMat as ShaderMaterial).uniforms.velocity.value = fbos.vel_1!.texture;
    renderer.render(displayScene, displayCamera);
  }

  function loop() {
    step();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onMove);
    observer.disconnect();
    palette.dispose();
    for (const key of Object.keys(fbos)) fbos[key]?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

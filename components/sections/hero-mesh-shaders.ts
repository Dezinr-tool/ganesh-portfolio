/**
 * Hero gradient passes: a soft red shape, warped by a slow noise flow field whose
 * domain shifts with the cursor, then streaked by a vertical blur.
 * The palette follows the reference gradient, as an agreed exception to the 3-colour rule.
 */

export const HERO_MESH_VERT = `#version 300 es
precision mediump float;

in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** Layered glow: a hot top edge, a crimson tongue reaching down, plum and purple in the falloff. */
export const HERO_MESH_FRAG_SOURCE = `#version 300 es
precision highp float;

in vec2 vUv;
uniform vec2 uResolution;
out vec4 fragColor;

const float SOURCE_ASPECT = 1432.0 / 928.0;

const vec3 BASE = vec3(12.0, 14.0, 12.0) / 255.0;
const vec3 PLUM = vec3(42.0, 20.0, 28.0) / 255.0;
const vec3 UMBER = vec3(58.0, 26.0, 20.0) / 255.0;
const vec3 PURPLE = vec3(74.0, 26.0, 68.0) / 255.0;
const vec3 WINE = vec3(138.0, 26.0, 34.0) / 255.0;
const vec3 MAROON = vec3(128.0, 30.0, 25.0) / 255.0;
const vec3 BRICK = vec3(190.0, 52.0, 28.0) / 255.0;
const vec3 RUST = vec3(168.0, 41.0, 24.0) / 255.0;
const vec3 CRIMSON = vec3(224.0, 32.0, 32.0) / 255.0;
const vec3 RED = vec3(250.0, 43.0, 31.0) / 255.0;
const vec3 CORAL = vec3(216.0, 74.0, 48.0) / 255.0;
const vec3 ORANGE = vec3(255.0, 106.0, 58.0) / 255.0;

float blob(vec2 p, vec2 center, vec2 spread) {
  vec2 d = (p - center) / spread;
  return exp(-0.5 * dot(d, d));
}

void main() {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 fit = canvasAspect < SOURCE_ASPECT
    ? vec2(canvasAspect / SOURCE_ASPECT, 1.0)
    : vec2(1.0, SOURCE_ASPECT / canvasAspect);
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  p = (p - 0.5) * fit + 0.5;

  vec3 color = BASE;
  color = mix(color, PLUM, blob(p, vec2(0.58, 0.58), vec2(0.17, 0.17)) * 0.9);
  color = mix(color, UMBER, blob(p, vec2(0.86, 0.50), vec2(0.16, 0.13)) * 0.9);
  color = mix(color, PURPLE, blob(p, vec2(1.00, 0.48), vec2(0.035, 0.12)) * 0.9);
  color = mix(color, WINE, blob(p, vec2(0.60, 0.50), vec2(0.07, 0.11)));
  color = mix(color, MAROON, blob(p, vec2(0.19, 0.02), vec2(0.07, 0.16)) * 0.9);
  color = mix(color, BRICK, blob(p, vec2(0.38, 0.11), vec2(0.15, 0.15)));
  color = mix(color, RUST, blob(p, vec2(0.85, 0.32), vec2(0.13, 0.11)));
  color = mix(color, CRIMSON, blob(p, vec2(0.61, 0.33), vec2(0.075, 0.13)));
  color = mix(color, RED, blob(p, vec2(0.88, 0.14), vec2(0.10, 0.12)));
  color = mix(color, RED, blob(p, vec2(0.62, 0.18), vec2(0.12, 0.11)));
  color = mix(color, CORAL, blob(p, vec2(0.48, 0.04), vec2(0.12, 0.07)) * 0.8);
  color = mix(color, ORANGE, blob(p, vec2(0.62, 0.06), vec2(0.09, 0.09)));

  fragColor = vec4(color, 1.0);
}
`;

export const HERO_MESH_FRAG_FLOW = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
out vec4 fragColor;

const int FLOW_STEPS = 8;
const float STEP_LENGTH = 0.02;
const float SPREAD = 0.168;
const float TURN = 37.66;
const float WARP_MIX = 0.51;

vec3 lattice(vec3 p) {
  p = fract(p * vec3(0.1031, 0.11369, 0.13787));
  p += dot(p, p.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3((p.x + p.y) * p.z, (p.x + p.z) * p.y, (p.y + p.z) * p.x));
}

float gradientNoise(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = p - cell;
  vec3 s = f * f * (3.0 - 2.0 * f);
  float value = 0.0;
  for (int i = 0; i < 8; i++) {
    vec3 corner = vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1));
    vec3 w = mix(1.0 - s, s, corner);
    value += w.x * w.y * w.z * dot(f - corner, lattice(cell + corner));
  }
  return value;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 stretch = vec2(aspect, 1.0);
  float frequency = 5.0 * SPREAD / ((aspect + 1.0) * 0.5);
  vec2 st = vUv;

  for (int i = 0; i < FLOW_STEPS; i++) {
    vec2 field = (clamp(st, -1.0, 2.0) - 0.5) * stretch + (1.0 - uPointer);
    float angle = (gradientNoise(vec3((field - 0.5) * frequency, uTime)) - 0.5) * TURN;
    st += vec2(cos(angle), sin(angle)) * STEP_LENGTH;
  }

  fragColor = texture(uTexture, mix(vUv, clamp(st, 0.0, 1.0), WARP_MIX));
}
`;

/** Vertical gaussian, strongest mid-screen and easing off toward the corners. */
export const HERO_MESH_FRAG_BLUR = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uTexture;
uniform float uAspect;
uniform float uStrength;
out vec4 fragColor;

const int TAPS = 36;
const float SIGMA = 6.0;
const float CENTER_WEIGHT = 1.32;

void main() {
  float fromCenter = distance(vUv, vec2(0.5));
  float amount = uStrength * mix(fromCenter, max(0.0, 1.0 - fromCenter), CENTER_WEIGHT);
  float total = 0.0;
  vec3 color = vec3(0.0);

  for (int i = 0; i < TAPS; i++) {
    float x = float(i) - float(TAPS) * 0.5 + 0.5;
    float weight = exp(-0.5 * x * x / (SIGMA * SIGMA));
    color += texture(uTexture, vUv + vec2(0.0, x * 0.001 * amount * uAspect)).rgb * weight;
    total += weight;
  }

  fragColor = vec4(color / total, 1.0);
}
`;

/** Upscales to the screen, with dither so the dark falloff does not band. */
export const HERO_MESH_FRAG_PRESENT = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uTexture;
out vec4 fragColor;

float dither(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))) - 0.5;
}

void main() {
  vec3 color = texture(uTexture, vUv).rgb;
  fragColor = vec4(color + dither(gl_FragCoord.xy) / 255.0, 1.0);
}
`;

/** Blur strengths of the two vertical passes. */
export const HERO_MESH_BLUR_STRENGTHS = [3, 5.5] as const;

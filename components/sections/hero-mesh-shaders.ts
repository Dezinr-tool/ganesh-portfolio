/** Shaders ported from lukebaffait.fr hero-project (CoreRenderer flowField + image + blur) */

export const HERO_MESH_VERT = `#version 300 es
precision mediump float;

in vec2 aPosition;
out vec2 vTextureCoord;

void main() {
  vTextureCoord = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** Image layer — subtle 3D tilt from mouse (Luke vertex shader) */
export const HERO_MESH_VERT_IMAGE = `#version 300 es
precision mediump float;

in vec2 aPosition;
uniform vec2 uMousePos;
out vec2 vTextureCoord;

const float PI = 3.14159265359;

void main() {
  float angleX = uMousePos.y * 0.5 - 0.25;
  float angleY = (1.0 - uMousePos.x) * 0.5 - 0.25;

  vec3 p = vec3(aPosition, 0.0);
  p.y = p.y * cos(angleX) - p.z * sin(angleX);
  p.z = p.y * sin(angleX) + p.z * cos(angleX);
  float py = p.y;
  p.x = p.x * cos(angleY) + p.z * sin(angleY);
  p.z = -p.x * sin(angleY) + p.z * cos(angleY);
  p.y = py;

  vTextureCoord = aPosition * 0.5 + 0.5;
  gl_Position = vec4(p.xy, 0.0, 1.0);
}
`;

/** Pass 1: white bg + cover-fit background.png */
export const HERO_MESH_FRAG_COMPOSITE = `#version 300 es
precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uSourceImage;
uniform vec2 uResolution;
uniform vec2 uImageSize;

out vec4 fragColor;

vec4 sampleCover(vec2 uv) {
  float imageAspect = uImageSize.x / uImageSize.y;
  float canvasAspect = uResolution.x / uResolution.y;
  vec2 fitSize = vec2(
    canvasAspect < imageAspect ? uResolution.y * imageAspect : uResolution.x,
    canvasAspect < imageAspect ? uResolution.y : uResolution.x / imageAspect
  );
  vec2 offset = (uResolution - fitSize) * 0.5;
  vec2 canvasPos = vec2(uv.x * uResolution.x, (1.0 - uv.y) * uResolution.y);
  vec2 imageUV = (canvasPos - offset) / fitSize;

  if (imageUV.x < 0.0 || imageUV.x > 1.0 || imageUV.y < 0.0 || imageUV.y > 1.0) {
    return vec4(0.0);
  }

  return texture(uSourceImage, vec2(imageUV.x, 1.0 - imageUV.y));
}

void main() {
  vec4 bg = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 color = sampleCover(vTextureCoord);
  color.rgb = clamp(color.rgb, 0.0, 1.0);
  fragColor = color + bg * (1.0 - color.a);
}
`;

/** Pass 2: flow field — exact Luke distortUV */
export const HERO_MESH_FRAG_FLOW = `#version 300 es
precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uMousePos;
uniform vec2 uAutoDrift;
uniform float uTime;

out vec4 fragColor;

const int MAX_ITERATIONS = 8;
const float PI = 3.14159265359;

float ease1(float t) {
  return t;
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(
    (p3.x + p3.y) * p3.z,
    (p3.x + p3.z) * p3.y,
    (p3.y + p3.z) * p3.x
  ));
}

float perlinNoise(vec3 p) {
  vec3 pi = floor(p);
  vec3 pf = p - pi;
  vec3 w = pf * pf * (3.0 - 2.0 * pf);

  float n000 = dot(pf - vec3(0.0, 0.0, 0.0), hash33(pi + vec3(0.0, 0.0, 0.0)));
  float n100 = dot(pf - vec3(1.0, 0.0, 0.0), hash33(pi + vec3(1.0, 0.0, 0.0)));
  float n010 = dot(pf - vec3(0.0, 1.0, 0.0), hash33(pi + vec3(0.0, 1.0, 0.0)));
  float n110 = dot(pf - vec3(1.0, 1.0, 0.0), hash33(pi + vec3(1.0, 1.0, 0.0)));
  float n001 = dot(pf - vec3(0.0, 0.0, 1.0), hash33(pi + vec3(0.0, 0.0, 1.0)));
  float n101 = dot(pf - vec3(1.0, 0.0, 1.0), hash33(pi + vec3(1.0, 0.0, 1.0)));
  float n011 = dot(pf - vec3(0.0, 1.0, 1.0), hash33(pi + vec3(0.0, 1.0, 1.0)));
  float n111 = dot(pf - vec3(1.0, 1.0, 1.0), hash33(pi + vec3(1.0, 1.0, 1.0)));

  float nx00 = mix(n000, n100, w.x);
  float nx01 = mix(n001, n101, w.x);
  float nx10 = mix(n010, n110, w.x);
  float nx11 = mix(n011, n111, w.x);
  float nxy0 = mix(nx00, nx10, w.y);
  float nxy1 = mix(nx01, nx11, w.y);
  return mix(nxy0, nxy1, w.z);
}

vec2 distortUV(vec2 uv) {
  vec2 st = uv;
  float aspectRatio = uResolution.x / max(uResolution.y, 0.001);
  vec2 aspectVec = vec2(aspectRatio, 1.0);
  vec2 mPos = vec2(0.5, 0.5) + (uMousePos - 0.5) + uAutoDrift * 0.22;
  st += uAutoDrift * 0.065;
  vec2 pos = mix(vec2(0.5, 0.5), mPos, 1.0);
  float dist = ease1(max(0.0, 1.0 - length(st * aspectVec - mPos * aspectVec) * 4.0));
  float sprd = (0.158 + 0.01) / ((aspectRatio + 1.0) / 2.0);
  float amt = 2.0 * 0.01 * dist;

  if (amt <= 0.0) {
    return st;
  }

  vec2 invPos = 1.0 - pos;
  float freq = 5.0 * sprd;
  float t = 0.19 * 5.0 + uTime * 0.029;
  float degrees = 360.0 * (0.999 * 6.0);
  float rad = degrees * PI / 180.0;

  for (int i = 0; i < MAX_ITERATIONS; i++) {
    vec2 clampedSt = clamp(st, -1.0, 2.0);
    vec2 scaled = (clampedSt - 0.5) * aspectVec + invPos;
    float perlin = perlinNoise(vec3((scaled - 0.5) * freq, t)) - 0.5;
    float ang = perlin * rad;
    st += vec2(cos(ang), sin(ang)) * amt;
  }

  return mix(uv, clamp(st, 0.0, 1.0), 0.51);
}

void main() {
  vec2 uv = distortUV(vTextureCoord);
  fragColor = texture(uTexture, uv);
}
`;

/** Pass 3–6: Luke gaussian blur (kernel 36, strength 0.5) */
export const HERO_MESH_FRAG_BLUR = `#version 300 es
precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uDirection;
uniform int uPassIndex;

out vec4 fragColor;

const int KERNEL_SIZE = 36;

float getGaussianWeight(int index) {
  float x = float(index - KERNEL_SIZE / 2) / float(KERNEL_SIZE / 2);
  return exp(-x * x * 3.2);
}

void main() {
  vec2 uv = vTextureCoord;
  vec2 pos = vec2(0.5, 0.5);
  float inner = distance(uv, pos);
  float outer = max(0.0, 1.0 - distance(uv, pos));
  float amt = uPassIndex <= 1 ? 6.0 : 11.0;
  float amount = 0.5 * amt * mix(inner, outer, 1.32);
  vec2 dir = uDirection * amount / max(uResolution, vec2(1.0));

  float wSum = 0.0;
  vec4 color = vec4(0.0);

  for (int i = 0; i < KERNEL_SIZE; i++) {
    float w = getGaussianWeight(i);
    float fi = float(i - KERNEL_SIZE / 2);
    color += texture(uTexture, uv + dir * fi * 0.001) * w;
    wSum += w;
  }

  fragColor = color / wSum;
}
`;

export const HERO_MESH_FRAG_PRESENT = `#version 300 es
precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
  vec3 col = texture(uTexture, vTextureCoord).rgb;
  col = pow(col, vec3(0.98));
  fragColor = vec4(col, 1.0);
}
`;

export const HERO_IMAGE_SIZE = { width: 1432, height: 928 } as const;

export const WORKS_SCENE_BG = "var(--color-text)";
export const WORKS_DRAG_THRESHOLD = 40;

/** Olha reference camera */
export const WORKS_CAMERA = {
  position: [0, 0, 1.5] as [number, number, number],
  fov: 45,
};

/** Scroll fog — matches olhalazarieva.com HR component */
export const WORKS_FOG = {
  startNear: 0.01,
  startFar: 2.7,
  endNear: 2.5,
  endFar: 3,
};

/** Room tilt — YR component: starts at 1.5 rad (~86°), eases to 0 */
export const WORKS_TILT_START_X = 1.5;

/** Projector screen planes — zR component */
export const WORKS_SCREEN = {
  hit: { size: [0.813, 0.47] as [number, number], z: -0.69 },
  slide: { size: [0.813, 0.47] as [number, number], z: -0.72, position: [0.004, 0.001, -0.72] as [number, number, number] },
  slideOffset: 0.88,
};

/** Projector beam — VR component (Olha YR: length 2, radius 0.45, scale 0.1×0.03×0.1) */
export const WORKS_BEAM = {
  position: [0.029, 0.177, 0.37] as [number, number, number],
  rotation: [Math.PI / 2, 0, 0] as [number, number, number],
  length: 2,
  radius: 0.45,
  meshScale: [0.1, 0.03, 0.1] as [number, number, number],
  texture: "/img/beam_linear_1024x2048.png",
};

/** Olha projects canvas tone mapping exposure */
export const WORKS_TONE_MAPPING_EXPOSURE = 0.92;

# Hero Portrait 3D — Lando-Norris-style WebGL treatment

Date: 2026-07-08
Status: Approved (design)

## Goal

Give the hero portrait a real-time WebGL feel inspired by landonorris.com's
helmet hero, adapted to a **flat 2D image** (`/public/ganesh.avif`). The
portrait must **never be distorted** (face stays intact); only rigid transforms
and light/glow are applied around it.

## Constraints

- Use **only `/ganesh.avif`** — no 3D model, no depth map, no extra image assets.
- **Do not warp/distort** the portrait pixels (no liquid displacement on the face).
- Color palette limited to the 3 project tokens: bg `#FFFFFF`, text `#111111`,
  accent `#FF1E00`.
- GSAP is the primary animation lib; ScrollTrigger for scroll; Lenis for smooth
  scroll (all already installed).
- Respect `prefers-reduced-motion`; lighter path on mobile.

## Lando → Ganesh parity map

| Lando (helmet)              | This build (flat avif)                                   |
| --------------------------- | -------------------------------------------------------- |
| GLTF 3D helmet spin         | Portrait **plane 3D tilt** (drag ±12°, inertia) — no warp |
| HDRI studio lighting        | Pointer-following **glossy light sweep + vignette**      |
| Bloom shine glow            | **Bloom** postprocessing on highlights                   |
| Draggable (mouse/touch)     | **Drag to rotate** + touch "drag" hint                   |
| Sticky + ScrollTrigger scrub| Hero already sticky — **scroll-scrub reveal timeline**   |
| Lenis smooth scroll         | **Lenis** inertia/easing                                 |
| "LOAD NORRIS" preloader     | **Loader gate** until avif texture ready (3-color)       |
| Draco model download        | N/A                                                      |

## Architecture

- **`components/sections/HeroPortrait3D.tsx`** (new, client)
  - R3F `<Canvas>` sized to the portrait area; `frameloop` gated for perf.
  - `PortraitPlane`: a plane textured with `/ganesh.avif` at correct aspect.
    Custom `ShaderMaterial` samples the texture unchanged and adds:
    - pointer-driven radial **light sweep** (screen-space highlight)
    - soft **vignette**
    - the mask/blur/glass stack stays as DOM overlay (existing look) OR is
      folded into the shader — decision: keep existing DOM blur/glass overlay so
      the current framer look is preserved; shader only adds light + tilt.
  - **Tilt/drag**: pointerdown/move/up → target rotation (clamped), eased each
    frame (inertia). Idle pointer parallax when not dragging. Touch supported.
  - **Bloom**: `@react-three/postprocessing` `<EffectComposer><Bloom/>`.
    Disabled on mobile / reduced-motion. If the dependency is incompatible with
    React 19 / R3F 9, fall back to an additive glow mesh.
- **Preloader gate**: portrait area shows a minimal loader until the texture is
  decoded; then GSAP reveal. Reuses existing page-loader tokens where possible.
- **Lenis**: add a smooth-scroll provider (or reuse existing lenis usage in
  `lib/mobile-viewport.ts`) so ScrollTrigger + Lenis are in sync.
- **`Hero.tsx`**: replace the current portrait `<Image>` stack with
  `HeroPortrait3D`; remove the liquid-ether hookup (`#liquid-ether-1`,
  `<HeroLiquidEther/>`). Keep DOM `<h1>`, badges, subtext unchanged.

## Removed / not doing (YAGNI)

- Liquid-ether glow behind portrait (retired for this hero).
- MSDF in-canvas text (keep accessible DOM headline/badges).

## Fallbacks

- `prefers-reduced-motion`: render the plain `<Image>` portrait, no canvas.
- Mobile: textured plane + tilt allowed, but **no bloom/postprocessing**;
  reduced pixel ratio.
- WebGL/context failure: fall back to the existing `<Image>` stack
  (error boundary like `WorksCanvasErrorBoundary`).

## Testing / QA

- Playwright capture of the hero at load, after pointer move, after drag, and at
  scroll positions; verify portrait is undistorted, glow visible, no layout
  shift, loader gates correctly. Compare against the current hero for regressions.

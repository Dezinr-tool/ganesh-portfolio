export const WORKS_FRAME_COUNT = 7;

export function worksFramePath(index: number): string {
  const clamped = Math.max(0, Math.min(WORKS_FRAME_COUNT - 1, Math.round(index)));
  return `/works-sequence/frame_${String(clamped + 1).padStart(3, "0")}.jpg`;
}

export function worksFramePaths(): string[] {
  return Array.from({ length: WORKS_FRAME_COUNT }, (_, index) => worksFramePath(index));
}

import { describe, expect, it } from "vitest";
import {
  createFlowGovernor,
  flowBufferSize,
  flowTime,
  followPointer,
  isHeroFlowActive,
  pointerToFlowUv,
  pointerToSheen,
  sheenSway,
} from "@/components/sections/hero-mesh-motion";

describe("hero gradient cursor tracking", () => {
  const rect = { left: 100, top: 50, width: 1000, height: 500 };

  it("maps the cursor to shader space, with y pointing up", () => {
    expect(pointerToFlowUv(100, 50, rect)).toEqual({ x: 0, y: 1 });
    expect(pointerToFlowUv(1100, 550, rect)).toEqual({ x: 1, y: 0 });
    expect(pointerToFlowUv(600, 300, rect)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("clamps a cursor outside the hero", () => {
    expect(pointerToFlowUv(-500, 9000, rect)).toEqual({ x: 0, y: 0 });
  });

  it("does not move for an empty hero box", () => {
    expect(pointerToFlowUv(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });

  it("closes one eighth of the gap per 60fps frame", () => {
    const current = { x: 0, y: 1 };
    followPointer(current, { x: 1, y: 0 }, 1);
    expect(current.x).toBeCloseTo(0.125);
    expect(current.y).toBeCloseTo(0.875);
  });

  it("moves at the same speed on a 30fps screen", () => {
    const at60 = { x: 0, y: 0 };
    followPointer(at60, { x: 1, y: 0 }, 1);
    followPointer(at60, { x: 1, y: 0 }, 1);
    const at30 = { x: 0, y: 0 };
    followPointer(at30, { x: 1, y: 0 }, 2);
    expect(at30.x).toBeCloseTo(at60.x);
  });

  it("settles on the cursor", () => {
    const current = { x: 0, y: 0 };
    for (let frame = 0; frame < 120; frame += 1) {
      followPointer(current, { x: 0.8, y: 0.3 }, 1);
    }
    expect(current.x).toBeCloseTo(0.8);
    expect(current.y).toBeCloseTo(0.3);
  });
});

describe("hero gradient clock", () => {
  it("starts from the reference seed", () => {
    expect(flowTime(0)).toBeCloseTo(0.95);
  });

  it("drifts slowly, about 0.06 noise units per second", () => {
    expect(flowTime(10) - flowTime(0)).toBeCloseTo(0.5976);
  });
});

describe("hero gradient buffers", () => {
  it("renders the flow at the requested share of the canvas", () => {
    expect(flowBufferSize(1200, 800, 0.25)).toEqual({ width: 300, height: 200 });
  });

  it("never asks for an empty buffer", () => {
    expect(flowBufferSize(0, 1, 0.25)).toEqual({ width: 1, height: 1 });
  });
});

describe("hero gradient on slow devices", () => {
  /** Feeds one second of frames at a steady rate and returns the last decision. */
  function runSecond(governor: ReturnType<typeof createFlowGovernor>, frameMs: number) {
    let decision = governor.frame(frameMs);
    for (let elapsed = frameMs; elapsed < 1000; elapsed += frameMs) {
      decision = governor.frame(frameMs);
    }
    return decision;
  }

  it("leaves a smooth device alone", () => {
    const governor = createFlowGovernor();
    expect(runSecond(governor, 16)).toBe("keep");
    expect(governor.scale).toBe(0.25);
  });

  it("halves the buffer when frames are slow", () => {
    const governor = createFlowGovernor();
    expect(runSecond(governor, 100)).toBe("resize");
    expect(governor.scale).toBe(0.125);
  });

  it("stops animating when even the smallest buffer is too slow", () => {
    const governor = createFlowGovernor();
    runSecond(governor, 100);
    expect(runSecond(governor, 100)).toBe("stop");
  });

  it("does not punish a device that recovers after lowering", () => {
    const governor = createFlowGovernor();
    runSecond(governor, 100);
    expect(runSecond(governor, 20)).toBe("keep");
    expect(governor.scale).toBe(0.125);
  });

  it("ignores a long gap from a hidden tab", () => {
    const governor = createFlowGovernor();
    expect(governor.frame(5000)).toBe("keep");
    expect(runSecond(governor, 16)).toBe("keep");
    expect(governor.scale).toBe(0.25);
  });
});

describe("hero gradient pause rule", () => {
  const viewport = { viewportHeight: 800, loaderActive: false };

  it("runs while the sticky hero is showing", () => {
    expect(isHeroFlowActive({ ...viewport, sticky: true, scrollY: 100, top: 0, bottom: 800 })).toBe(true);
  });

  it("waits for the intro loader to finish", () => {
    expect(isHeroFlowActive({ ...viewport, loaderActive: true, sticky: true, scrollY: 0, top: 0, bottom: 800 })).toBe(false);
  });

  it("stops once content has covered the sticky hero", () => {
    expect(isHeroFlowActive({ ...viewport, sticky: true, scrollY: 800, top: 0, bottom: 800 })).toBe(false);
  });

  it("follows the hero box when it scrolls normally on a phone", () => {
    expect(isHeroFlowActive({ ...viewport, sticky: false, scrollY: 300, top: -300, bottom: 500 })).toBe(true);
    expect(isHeroFlowActive({ ...viewport, sticky: false, scrollY: 900, top: -900, bottom: -100 })).toBe(false);
  });
});

describe("headline sheen position", () => {
  const box = { left: 100, top: 500, width: 400, height: 100 };

  it("sits under the cursor, as a share of the headline box", () => {
    expect(pointerToSheen(300, 550, box)).toEqual({ x: 50, y: 50 });
    expect(pointerToSheen(100, 500, box)).toEqual({ x: 0, y: 0 });
  });

  it("stays on the headline when the cursor is elsewhere on the page", () => {
    expect(pointerToSheen(-900, 20, box)).toEqual({ x: 0, y: 0 });
    expect(pointerToSheen(5000, 9000, box)).toEqual({ x: 100, y: 100 });
  });

  it("does not move for an empty headline box", () => {
    expect(pointerToSheen(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });
});

describe("headline sheen with no cursor", () => {
  it("drifts across the headline without leaving it", () => {
    for (let seconds = 0; seconds < 60; seconds += 0.5) {
      const { x, y } = sheenSway(seconds);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBe(50);
    }
  });

  it("actually moves", () => {
    expect(sheenSway(0).x).not.toBeCloseTo(sheenSway(4).x);
  });
});

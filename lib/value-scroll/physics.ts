import type { Engine, Body } from "matter-js";
import type gsap from "gsap";

export type CharPhysicsEntry = {
  dom: HTMLElement;
  body: Body;
  ix: number;
  iy: number;
  dirX: number;
  dirY: number;
  scale: number;
};

export type CharPhysicsRuntime = {
  engine: Engine;
  entries: CharPhysicsEntry[];
  tick: () => void;
};

type MatterNS = typeof import("matter-js");

export function buildCharPhysics(
  Matter: MatterNS,
  headlineEl: HTMLElement,
  charInnerSelector: string,
): CharPhysicsRuntime {
  const { Engine, World, Bodies } = Matter;
  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const entries: CharPhysicsEntry[] = [];

  const headlineRect = headlineEl.getBoundingClientRect();
  const centerX = headlineRect.left + headlineRect.width / 2;
  const centerY = headlineRect.top + headlineRect.height / 2;

  headlineEl.querySelectorAll<HTMLElement>(charInnerSelector).forEach((dom) => {
    const rect = dom.getBoundingClientRect();
    if (rect.width === 0) return;

    const ix = rect.left + rect.width / 2;
    const iy = rect.top + rect.height / 2;
    const body = Bodies.rectangle(ix, iy, rect.width, rect.height, {
      frictionAir: 0.08,
      restitution: 0.4,
      density: 0.001,
    });

    const dx = ix - centerX;
    const dy = iy - centerY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    entries.push({
      dom,
      body,
      ix,
      iy,
      dirX: dx / len,
      dirY: dy / len,
      scale: 1,
    });
    World.add(engine.world, body);
  });

  const tick = () => {
    Engine.update(engine, 1000 / 60);
    entries.forEach(({ dom, body, ix, iy, scale }) => {
      dom.style.transform = `translate(${body.position.x - ix}px, ${body.position.y - iy}px) rotate(${body.angle}rad) scale(${scale})`;
    });
  };

  return { engine, entries, tick };
}

export function launchCharExplosion(
  Matter: MatterNS,
  runtime: CharPhysicsRuntime,
  gsapInstance: typeof gsap,
) {
  const { Body } = Matter;
  const { entries } = runtime;

  entries.forEach(({ body, ix, iy, dirX, dirY }) => {
    Body.setPosition(body, { x: ix, y: iy });
    Body.setAngle(body, 0);
    const speed = 9 + Math.random() * 10;
    Body.setVelocity(body, {
      x: dirX * speed * 1.5 + (Math.random() - 0.5) * 2,
      y: dirY * speed * 1.5 - (Math.random() * 5 + 8),
    });
    Body.setAngularVelocity(body, 0.5 * (Math.random() - 0.5));
  });

  const shuffled = [...entries].sort(() => Math.random() - 0.5);

  shuffled.forEach((entry, index) => {
    const delay = 0.4 + index * 0.006;
    gsapInstance.to(entry, {
      scale: 0.8,
      duration: 0.2,
      delay,
      ease: "back.in(2)",
    });
    gsapInstance.to(entry.dom, {
      autoAlpha: 0,
      duration: 0.2,
      delay,
      ease: "power3.in",
    });
  });
}

export function restoreCharPhysics(
  Matter: MatterNS,
  runtime: CharPhysicsRuntime,
  gsapInstance: typeof gsap,
) {
  const { World, Engine, Body } = Matter;
  const { engine, entries } = runtime;

  entries.forEach((entry) => {
    gsapInstance.killTweensOf(entry.dom);
    gsapInstance.killTweensOf(entry);
  });

  gsapInstance.fromTo(
    entries.map((e) => e.dom),
    {
      x: (index) => entries[index]!.body.position.x - entries[index]!.ix,
      y: (index) => entries[index]!.body.position.y - entries[index]!.iy,
      rotation: (index) => entries[index]!.body.angle,
      scale: (index) => entries[index]!.scale,
    },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      stagger: { each: 0.006, from: "random" },
      ease: "expo.out",
      duration: 0.4,
    },
  );

  entries.forEach((entry) => {
    Body.setPosition(entry.body, { x: entry.ix, y: entry.iy });
    Body.setAngle(entry.body, 0);
    Body.setVelocity(entry.body, { x: 0, y: 0 });
    Body.setAngularVelocity(entry.body, 0);
    entry.dom.style.transform = "";
    entry.scale = 1;
  });

  World.clear(engine.world, false);
  Engine.clear(engine);
}

export function clearCharPhysics(Matter: MatterNS, runtime: CharPhysicsRuntime | null) {
  if (!runtime) return;
  Matter.World.clear(runtime.engine.world, false);
  Matter.Engine.clear(runtime.engine);
}

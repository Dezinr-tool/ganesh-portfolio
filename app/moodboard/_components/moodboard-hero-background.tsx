"use client";

import { useEffect, useMemo, useState } from "react";

type AbstractCard = {
  id: string;
  aspect: "portrait" | "landscape" | "square";
  blocks: { color: string; flex: number }[];
  fragment?: string;
  shape?: "circle" | "line" | "grid";
};

const CARD_POOL: AbstractCard[] = [
  {
    id: "a",
    aspect: "portrait",
    blocks: [
      { color: "#2a2a2a", flex: 3 },
      { color: "#3d3d3d", flex: 1 },
      { color: "#1f1f1f", flex: 2 },
    ],
    fragment: "visual tone",
  },
  {
    id: "b",
    aspect: "landscape",
    blocks: [
      { color: "#333", flex: 2 },
      { color: "#252525", flex: 1 },
    ],
    shape: "line",
  },
  {
    id: "c",
    aspect: "square",
    blocks: [
      { color: "#2e2e2e", flex: 1 },
      { color: "#404040", flex: 1 },
    ],
    fragment: "brand system",
    shape: "grid",
  },
  {
    id: "d",
    aspect: "portrait",
    blocks: [
      { color: "#222", flex: 2 },
      { color: "#383838", flex: 2 },
    ],
    shape: "circle",
  },
  {
    id: "e",
    aspect: "landscape",
    blocks: [
      { color: "#2c2c2c", flex: 1 },
      { color: "#1a1a1a", flex: 3 },
    ],
    fragment: "direction",
  },
  {
    id: "f",
    aspect: "square",
    blocks: [{ color: "#303030", flex: 1 }],
    shape: "line",
  },
];

function aspectClass(aspect: AbstractCard["aspect"]) {
  if (aspect === "portrait") return "h-44 w-28";
  if (aspect === "landscape") return "h-28 w-44";
  return "h-32 w-32";
}

function AbstractMoodCard({ card }: { card: AbstractCard }) {
  const isRow = card.aspect === "landscape";

  return (
    <div
      className={`${aspectClass(card.aspect)} relative flex shrink-0 flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#111]`}
    >
      <div className={`flex flex-1 ${isRow ? "flex-row" : "flex-col"}`}>
        {card.blocks.map((block, i) => (
          <div
            key={i}
            className={isRow ? "h-full" : "w-full"}
            style={{ backgroundColor: block.color, flex: block.flex }}
          />
        ))}
      </div>
      {card.fragment ? (
        <p className="px-2 py-1.5 text-[9px] uppercase tracking-widest text-white/30">
          {card.fragment}
        </p>
      ) : null}
      {card.shape === "circle" ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border border-white/10" />
        </div>
      ) : null}
      {card.shape === "line" ? (
        <div className="px-2 pb-2">
          <div className="h-px w-full bg-white/10" />
          <div className="mt-1 h-px w-2/3 bg-white/5" />
        </div>
      ) : null}
      {card.shape === "grid" ? (
        <div className="grid grid-cols-3 gap-0.5 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-sm bg-white/[0.04]" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScrollColumn({
  cards,
  delay,
  parallaxX,
  parallaxY,
}: {
  cards: AbstractCard[];
  delay: string;
  parallaxX: number;
  parallaxY: number;
}) {
  const loop = [...cards, ...cards];

  return (
    <div
      className="flex-1 transition-transform duration-500 ease-out"
      style={{ transform: `translate(${parallaxX}px, ${parallaxY}px)` }}
    >
      <div
        className="moodboard-hero-scroll-col flex flex-col gap-4"
        style={{ animationDelay: delay }}
      >
        {loop.map((card, i) => (
          <div key={`${card.id}-${i}`} className="relative">
            <AbstractMoodCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MoodboardHeroBackground() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const columns = useMemo(
    () => [
      CARD_POOL.slice(0, 2),
      CARD_POOL.slice(2, 4),
      CARD_POOL.slice(4, 6),
      [...CARD_POOL.slice(1, 3), ...CARD_POOL.slice(4, 5)],
    ],
    [],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 20;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 20;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const shifts = [
    { x: parallax.x * 0.6, y: parallax.y * 0.4 },
    { x: parallax.x * -0.4, y: parallax.y * 0.6 },
    { x: parallax.x * 0.3, y: parallax.y * -0.5 },
    { x: parallax.x * -0.5, y: parallax.y * -0.3 },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden blur-[8px]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#fafafa]" />
      <div className="absolute inset-0 opacity-[0.35]">
        <div className="flex h-[200vh] justify-center gap-6 px-6 pt-8 sm:gap-10">
          {columns.map((cards, i) => (
            <ScrollColumn
              key={i}
              cards={cards}
              delay={`${-i * 15}s`}
              parallaxX={shifts[i]?.x ?? 0}
              parallaxY={shifts[i]?.y ?? 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

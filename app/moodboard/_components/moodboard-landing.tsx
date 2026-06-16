"use client";

import { MoodboardComposer } from "./moodboard-composer";
import { MoodboardHeroBackground } from "./moodboard-hero-background";
import type { MoodboardModelId } from "@/lib/moodboard/types";

type MoodboardLandingProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
  disabled?: boolean;
  fading?: boolean;
};

export function MoodboardLanding({
  value,
  onChange,
  onSubmit,
  modelId,
  onModelChange,
  disabled,
  fading,
}: MoodboardLandingProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-57px)] flex-1 flex-col">
      <MoodboardHeroBackground />

      <div
        className={`relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-8 transition-opacity duration-300 ease-out sm:px-8 ${
          fading ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto w-full max-w-[680px] text-center">
          <h1 className="text-[2.25rem] font-medium leading-[1.1] tracking-[-0.02em] text-[#1a1a1a] sm:text-5xl lg:text-[64px]">
            Great design starts with personality.
          </h1>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-relaxed text-[#666]">
            Explore the visual tone, mood, and direction of your brand before anything is designed.
          </p>

          <div className="mt-10 w-full text-left">
            <MoodboardComposer
              variant="hero"
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              disabled={disabled}
              placeholder="Describe an idea, brand, or project..."
              modelId={modelId}
              onModelChange={onModelChange}
              showAttach
            />
          </div>
        </div>
      </div>
    </div>
  );
}

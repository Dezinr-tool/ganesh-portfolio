"use client";

import { MoodboardComposer } from "./moodboard-composer";
import type { MoodboardModelId } from "@/lib/moodboard/types";

export const LANDING_SUGGESTIONS = [
  { emoji: "🎨", label: "New brand identity", message: "I need a new brand identity" },
  { emoji: "🌐", label: "Website redesign", message: "I'm working on a website redesign" },
  { emoji: "📣", label: "Campaign direction", message: "I need campaign direction" },
  { emoji: "🔄", label: "Refresh existing brand", message: "I want to refresh an existing brand" },
] as const;

const CHIP =
  "flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-40";

type MoodboardLandingProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onChip: (message: string) => void;
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
  disabled?: boolean;
  fading?: boolean;
};

export function MoodboardLanding({
  value,
  onChange,
  onSubmit,
  onChip,
  modelId,
  onModelChange,
  disabled,
  fading,
}: MoodboardLandingProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[680px] flex-col items-center px-4 transition-opacity duration-300 ease-out ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="mb-8 text-center">
        <h1 className="text-[2rem] font-light leading-tight tracking-tight text-white sm:text-[2.25rem]">
          What are we creating today?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
          I&apos;ll ask a few questions to understand your brand,
          <br className="hidden sm:inline" />
          then generate 3 visual directions.
        </p>
      </div>

      <div className="w-full">
        <MoodboardComposer
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
          placeholder="Describe your brand or just say hi..."
          modelId={modelId}
          onModelChange={onModelChange}
        />
      </div>

      <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
        {LANDING_SUGGESTIONS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={disabled}
            onClick={() => onChip(chip.message)}
            className={CHIP}
          >
            <span aria-hidden>{chip.emoji}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

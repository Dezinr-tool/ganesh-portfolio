"use client";

import { MoodboardComposer } from "./moodboard-composer";
import type { MoodboardModelId } from "@/lib/moodboard/types";

type MoodboardLandingProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
  disabled?: boolean;
  submitting?: boolean;
  onFilesSelected?: (files: File[]) => void;
};

export function MoodboardLanding({
  value,
  onChange,
  onSubmit,
  modelId,
  onModelChange,
  disabled,
  submitting,
  onFilesSelected,
}: MoodboardLandingProps) {
  return (
    <div className="moodboard-landing-view">
      {submitting ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--mb-bg)]/90"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[var(--mb-text-muted)]">Starting your session…</p>
        </div>
      ) : null}

      <div className="moodboard-landing-inner">
        <header className="moodboard-landing-hero">
          <h1 className="moodboard-landing-title">
            Great design starts with personality.
          </h1>
          <p className="moodboard-landing-subtitle">
            Explore the visual tone, mood, and direction of your brand before anything
            is designed.
          </p>
        </header>

        <div className="moodboard-composer-frame moodboard-composer-frame--animated">
          <div className="moodboard-composer-frame-inner">
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
              onFilesSelected={onFilesSelected}
              uploadAccept=".pdf,.docx,.txt,.ppt,.pptx"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

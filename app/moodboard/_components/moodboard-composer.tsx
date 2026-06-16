"use client";

import { useRef } from "react";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5L5 12M12 5L19 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4M12 4L8 8M12 4L16 8M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function shortModelLabel(id: MoodboardModelId): string {
  const map: Record<MoodboardModelId, string> = {
    "claude-haiku": "Haiku",
    "claude-sonnet": "Sonnet",
    "claude-nano": "Nano",
    "gpt-4o": "GPT-4o",
    "gemini-pro": "Gemini",
  };
  return map[id];
}

export function MoodboardComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  hidden,
  placeholder = "Type your answer…",
  showUpload,
  uploadAccept,
  onFilesSelected,
  modelId,
  onModelChange,
  showSkip,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  hidden?: boolean;
  placeholder?: string;
  inputMode?: "text" | "url" | "hidden";
  showUpload?: boolean;
  uploadAccept?: string;
  onFilesSelected?: (files: File[]) => void;
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
  showSkip?: boolean;
  onSkip?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && value.trim().length > 0;

  if (hidden) {
    return (
      <div className="pt-1">
        <ModelPicker modelId={modelId} onModelChange={onModelChange} />
      </div>
    );
  }

  return (
    <div className="pt-1">
      <div
        className={`flex items-end gap-2 rounded-[26px] border border-white/10 bg-[#1a1a1a] px-3 py-2 shadow-[0_0_0_1px_rgba(0,0,0,0.2)] ${
          disabled ? "opacity-60" : ""
        }`}
      >
        {showUpload ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={uploadAccept}
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length && onFilesSelected) onFilesSelected(picked);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
              aria-label="Upload file"
            >
              <UploadIcon />
            </button>
          </>
        ) : null}

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-snug text-white outline-none placeholder:text-zinc-600"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />

        <button
          type="button"
          disabled={!canSend}
          onClick={onSubmit}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-white/20 hover:text-white disabled:opacity-30"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 pl-1">
        <ModelPicker modelId={modelId} onModelChange={onModelChange} />
        {showSkip && onSkip ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onSkip}
            className="text-xs text-zinc-600 transition hover:text-zinc-400"
          >
            Skip
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModelPicker({
  modelId,
  onModelChange,
}: {
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
}) {
  const model = MOODBOARD_MODELS.find((m) => m.id === modelId);
  return (
    <div className="relative inline-flex items-center">
      <select
        value={modelId}
        onChange={(e) => onModelChange(e.target.value as MoodboardModelId)}
        className="cursor-pointer appearance-none bg-transparent pr-4 text-xs text-zinc-500 outline-none hover:text-zinc-400"
        aria-label="AI model"
      >
        {MOODBOARD_MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
            {shortModelLabel(m.id)}
            {m.recommended ? " · default" : ""}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 text-[10px] text-zinc-600">
        ∨
      </span>
      <span className="sr-only">
        {shortModelLabel(modelId)}
        {model?.recommended ? " · default" : ""}
      </span>
    </div>
  );
}

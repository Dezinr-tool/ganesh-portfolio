"use client";

import { useEffect, useRef } from "react";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19 11v1a7 7 0 01-14 0v-1M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function shortModelLabel(id: MoodboardModelId, hero?: boolean): string {
  if (hero && id === "claude-sonnet") return "Sonnet";
  const map: Record<MoodboardModelId, string> = {
    "claude-haiku": "Haiku",
    "claude-sonnet": "Sonnet 4.6",
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
  showAttach = false,
  variant = "default",
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
  showAttach?: boolean;
  variant?: "default" | "hero";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && value.trim().length > 0;
  const showAttachButton = showAttach || showUpload;
  const isHero = variant === "hero";

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, isHero ? 160 : 120)}px`;
  }, [value, isHero]);

  if (hidden) {
    return (
      <div className="pl-0.5 pt-1">
        <ModelPicker modelId={modelId} onModelChange={onModelChange} hero={isHero} />
      </div>
    );
  }

  const shellClass = isHero
    ? "flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.24)] backdrop-blur-[12px]"
    : "flex items-center gap-1 rounded-full border border-[#3a3a38] bg-[#ececea] px-2 py-1 shadow-sm";

  const inputClass = isHero
    ? "max-h-[160px] min-h-[24px] flex-1 resize-none bg-transparent py-0.5 text-[15px] leading-6 text-white outline-none placeholder:text-[#444]"
    : "max-h-[120px] min-h-[22px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-5 text-zinc-900 outline-none placeholder:text-zinc-400";

  const attachBtnClass = isHero
    ? "flex h-8 w-8 shrink-0 items-center justify-center text-[#555] transition hover:text-[#888]"
    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-700";

  return (
    <div className="w-full">
      <div className={`${shellClass} ${disabled ? "opacity-60" : ""}`}>
        {showAttachButton ? (
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
              className={attachBtnClass}
              aria-label="Attach file"
            >
              <PaperclipIcon />
            </button>
          </>
        ) : null}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={inputClass}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />

        {isHero ? (
          <button
            type="button"
            disabled={disabled}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-[#555] transition hover:text-[#888]"
            aria-label="Voice input"
            tabIndex={-1}
          >
            <MicIcon />
          </button>
        ) : null}

        {canSend ? (
          <button
            type="button"
            onClick={onSubmit}
            className={
              isHero
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/15"
                : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-white transition hover:bg-zinc-700"
            }
            aria-label="Send"
          >
            <SendIcon />
          </button>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 pl-0.5">
        <ModelPicker modelId={modelId} onModelChange={onModelChange} hero={isHero} />
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
  hero,
}: {
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
  hero?: boolean;
}) {
  const model = MOODBOARD_MODELS.find((m) => m.id === modelId);
  const label = shortModelLabel(modelId, hero);
  const suffix = model?.recommended ? (hero ? " · Default" : " · default") : "";

  return (
    <div className="relative inline-flex items-center">
      <select
        value={modelId}
        onChange={(e) => onModelChange(e.target.value as MoodboardModelId)}
        className="cursor-pointer appearance-none bg-transparent pr-3.5 text-[11px] text-[#555] capitalize outline-none hover:text-[#777]"
        aria-label="AI model"
      >
        {MOODBOARD_MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#111] text-white">
            {shortModelLabel(m.id, hero)}
            {m.recommended ? (hero ? " · Default" : " · default") : ""}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 text-[9px] text-[#444]">
        ∨
      </span>
      <span className="sr-only">
        {label}
        {suffix}
      </span>
    </div>
  );
}

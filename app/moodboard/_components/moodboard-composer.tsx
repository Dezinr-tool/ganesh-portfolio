"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function WaveformSendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="8" y="7" width="2" height="10" rx="1" fill="currentColor" />
      <rect x="12" y="9" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="16" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="20" y="8" width="2" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

function SendArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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

export type MoodboardComposerHandle = {
  focus: () => void;
};

export const MoodboardComposer = forwardRef<
  MoodboardComposerHandle,
  {
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
    variant?: "default" | "hero" | "chat";
  }
>(function MoodboardComposer(
  {
    value,
    onChange,
    onSubmit,
    disabled,
    hidden,
    placeholder = "Write a message...",
    showUpload,
    uploadAccept,
    onFilesSelected,
    modelId,
    onModelChange,
    showSkip,
    onSkip,
    showAttach = false,
    variant = "default",
  },
  ref,
) {
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && value.trim().length > 0;
  const showAttachButton = showAttach || showUpload;
  const isHero = variant === "hero";
  const isChat = variant === "chat";

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, isHero ? 160 : isChat ? 200 : 120)}px`;
  }, [value, isHero, isChat]);

  if (hidden) {
    return null;
  }

  if (isChat || isHero) {
    return (
      <div className="w-full">
        <div className={`moodboard-composer-chat ${disabled ? "opacity-60" : ""}`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="moodboard-composer-textarea"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSubmit();
              }
            }}
          />
          <div className="moodboard-composer-toolbar">
            <div className="flex items-center gap-1">
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
                    className="moodboard-composer-icon-btn"
                    aria-label="Attach file"
                  >
                    <PlusIcon />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled
                  className="moodboard-composer-icon-btn opacity-30"
                  aria-label="Attach"
                  tabIndex={-1}
                >
                  <PlusIcon />
                </button>
              )}
            </div>
            <div className="moodboard-composer-toolbar-right">
              <ModelPicker modelId={modelId} onModelChange={onModelChange} chat />
              <button
                type="button"
                disabled={disabled}
                className="moodboard-composer-icon-btn"
                aria-label="Voice input"
                tabIndex={-1}
              >
                <MicIcon />
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={disabled || !canSend}
                className="moodboard-composer-send-btn"
                aria-label="Send"
              >
                {canSend ? <SendArrowIcon /> : <WaveformSendIcon />}
              </button>
            </div>
          </div>
        </div>
        {showSkip && onSkip && !isHero ? (
          <div className="mt-2 text-right">
            <button
              type="button"
              disabled={disabled}
              onClick={onSkip}
              className="text-xs text-[#888] transition hover:text-[#555]"
            >
              Skip
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const shellClass =
    "flex items-center gap-1 rounded-full border border-[#3a3a38] bg-[#ececea] px-2 py-1 shadow-sm";

  const inputClass =
    "max-h-[120px] min-h-[22px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-5 text-zinc-900 outline-none placeholder:text-zinc-400";

  const attachBtnClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-700";

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
              <PlusIcon />
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

        {canSend ? (
          <button
            type="button"
            onClick={onSubmit}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-white transition hover:bg-zinc-700"
            aria-label="Send"
          >
            <SendArrowIcon />
          </button>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 pl-0.5">
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
});

function ModelPicker({
  modelId,
  onModelChange,
  hero,
  chat,
}: {
  modelId: MoodboardModelId;
  onModelChange: (id: MoodboardModelId) => void;
  hero?: boolean;
  chat?: boolean;
}) {
  const model = MOODBOARD_MODELS.find((m) => m.id === modelId);
  const label = shortModelLabel(modelId, hero);
  const suffix = model?.recommended ? (hero || chat ? " · Default" : " · default") : "";

  if (chat) {
    return (
      <div className="relative inline-flex items-center">
        <select
          value={modelId}
          onChange={(e) => onModelChange(e.target.value as MoodboardModelId)}
          className="moodboard-model-select"
          aria-label="AI model"
        >
          {MOODBOARD_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {shortModelLabel(m.id)}
              {m.recommended ? " · Default" : ""}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-0 text-[10px] text-[#aaa]">
          ∨
        </span>
      </div>
    );
  }

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

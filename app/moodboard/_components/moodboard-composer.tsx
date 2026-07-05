"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { ArrowUpIcon } from "@/components/ui/arrow-up";
import { AudioLinesIcon } from "@/components/ui/audio-lines";
import { ChevronDownIcon } from "@/components/ui/chevron-down";
import { PlusIcon } from "@/components/ui/plus";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";

const ICON_SIZE = 18;
const CHEVRON_SIZE = 14;

function shortModelLabel(id: MoodboardModelId): string {
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
    uploadAccept = ".pdf,.docx,.txt,.ppt,.pptx",
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
                    <PlusIcon size={ICON_SIZE} aria-hidden />
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
                  <PlusIcon size={ICON_SIZE} aria-hidden />
                </button>
              )}
            </div>
            <div className="moodboard-composer-toolbar-right">
              <ModelPicker modelId={modelId} onModelChange={onModelChange} chat />
              <button
                type="button"
                onClick={onSubmit}
                disabled={disabled || !canSend}
                className="moodboard-composer-send-btn"
                aria-label="Send"
              >
                {canSend ? (
                  <ArrowUpIcon size={ICON_SIZE} aria-hidden />
                ) : (
                  <AudioLinesIcon size={ICON_SIZE} aria-hidden />
                )}
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
              className="text-xs text-[var(--color-text)] transition hover:text-[var(--color-text)]"
            >
              Skip
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const shellClass =
    "flex items-center gap-1 rounded-lg border border-[var(--mb-border-strong)] bg-[var(--mb-bg-elevated)] px-2 py-1";

  const inputClass =
    "max-h-[120px] min-h-[22px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-5 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text)]";

  const attachBtnClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text)] transition hover:bg-[var(--color-text)]/5 hover:text-[var(--color-text)]";

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
              <PlusIcon size={ICON_SIZE} aria-hidden />
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
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-bg)] transition hover:bg-[var(--color-bg)]"
            aria-label="Send"
          >
            <ArrowUpIcon size={ICON_SIZE} aria-hidden />
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
            className="text-xs text-[var(--color-text)] transition hover:text-[var(--color-text)]"
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
  const label = shortModelLabel(modelId);
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
        <span className="pointer-events-none absolute right-0 flex items-center text-[var(--color-text)]">
          <ChevronDownIcon size={CHEVRON_SIZE} aria-hidden />
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={modelId}
        onChange={(e) => onModelChange(e.target.value as MoodboardModelId)}
        className="cursor-pointer appearance-none bg-transparent pr-3.5 text-[11px] text-[var(--color-text)] capitalize outline-none hover:text-[var(--color-text)]"
        aria-label="AI model"
      >
        {MOODBOARD_MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-[var(--color-text)] text-[var(--color-bg)]">
            {shortModelLabel(m.id)}
            {m.recommended ? (hero ? " · Default" : " · default") : ""}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 flex items-center text-[var(--color-text)]">
        <ChevronDownIcon size={CHEVRON_SIZE} aria-hidden />
      </span>
      <span className="sr-only">
        {label}
        {suffix}
      </span>
    </div>
  );
}

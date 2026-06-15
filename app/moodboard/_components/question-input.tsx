"use client";

import { useRef, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import {
  MAX_REFERENCE_IMAGES,
  MULTI_SELECT_KEYS,
} from "@/lib/moodboard/question-seed";
import { isQuestionOptional } from "@/lib/moodboard/question-flow";

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600";
const BTN =
  "rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:opacity-40";
const CHIP =
  "rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-40";
const CHIP_ACTIVE = "border-zinc-500 bg-zinc-800 text-white";

export function ChatBubble({
  role,
  children,
}: {
  role: "assistant" | "user";
  children: React.ReactNode;
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] space-y-3 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%] ${
          role === "user"
            ? "bg-zinc-800 text-zinc-100"
            : "border border-zinc-800/80 bg-zinc-900/40 text-zinc-300"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function QuestionInput({
  question,
  disabled,
  onSubmit,
  onSkip,
}: {
  question: MoodboardQuestion;
  disabled?: boolean;
  onSubmit: (value: unknown) => void;
  onSkip?: () => void;
}) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const multi = MULTI_SELECT_KEYS.has(question.key);
  const optional = isQuestionOptional(question.key);
  const isUpload = question.question_type === "upload";
  const isUrl = question.question_type === "url";
  const isChips = question.question_type === "chips";
  const allowUploadOnOpen = question.key === "q4b";

  const handleChip = (chip: string) => {
    if (multi) {
      setSelected((prev) =>
        prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
      );
    } else {
      onSubmit(chip);
    }
  };

  const handleSubmit = () => {
    if (isChips && multi) {
      if (selected.length === 0) return;
      onSubmit(selected);
      return;
    }
    if (isUpload) {
      onSubmit({ text: text.trim(), files });
      return;
    }
    if (allowUploadOnOpen) {
      onSubmit({ text: text.trim(), files });
      return;
    }
    if (!text.trim()) return;
    onSubmit(text.trim());
  };

  const canSubmit = (() => {
    if (isChips && multi) return selected.length > 0;
    if (isUrl) return text.trim().length > 0;
    if (isUpload) return text.trim().length > 0 || files.length > 0;
    if (allowUploadOnOpen) return text.trim().length > 0 || files.length > 0;
    return text.trim().length > 0;
  })();

  const accept =
    question.key === "q19"
      ? ".pdf,.docx,.txt,application/pdf"
      : "image/*";

  return (
    <div className="space-y-3">
      {isChips && question.chips_options ? (
        <div className="flex flex-wrap gap-2">
          {question.chips_options.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => handleChip(chip)}
              className={`${CHIP} ${multi && selected.includes(chip) ? CHIP_ACTIVE : ""}`}
            >
              {chip}
            </button>
          ))}
          {multi ? (
            <button
              type="button"
              disabled={disabled || selected.length === 0}
              onClick={handleSubmit}
              className={BTN}
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}

      {!isChips || allowUploadOnOpen ? (
        <>
          {isUrl ? (
            <input
              type="url"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://"
              disabled={disabled}
              className={INPUT}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={isUpload ? 2 : 3}
              placeholder={
                isUpload
                  ? "Describe your references (optional)…"
                  : "Type your answer…"
              }
              disabled={disabled}
              className={INPUT}
            />
          )}

          {(isUpload || allowUploadOnOpen) && (
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept={accept}
                multiple={question.key === "q13"}
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  const max = question.key === "q13" ? MAX_REFERENCE_IMAGES : 5;
                  setFiles((prev) => [...prev, ...picked].slice(0, max));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileRef.current?.click()}
                className="text-xs text-zinc-500 underline hover:text-zinc-300"
              >
                {question.key === "q19"
                  ? "Upload PDF, DOCX, or TXT"
                  : `Upload files${question.key === "q13" ? ` (up to ${MAX_REFERENCE_IMAGES})` : ""}`}
              </button>
              {files.length > 0 ? (
                <p className="text-xs text-zinc-500">{files.length} file(s) selected</p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !canSubmit}
              onClick={handleSubmit}
              className={BTN}
            >
              Submit
            </button>
            {optional && onSkip ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onSkip}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300"
              >
                Skip
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

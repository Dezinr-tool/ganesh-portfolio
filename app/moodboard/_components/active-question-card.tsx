"use client";

import { useMemo, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { MULTI_SELECT_KEYS } from "@/lib/moodboard/question-seed";
import { SectionSelector } from "./section-selector";

const CHIP =
  "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40";
const CHIP_ACTIVE = "border-white/25 bg-white/10 text-white";

export function ActiveQuestionCard({
  question,
  disabled,
  pendingFiles,
  onChip,
  onMultiChipSubmit,
  onSectionSubmit,
  onUploadContinue,
}: {
  question: MoodboardQuestion;
  disabled?: boolean;
  pendingFiles?: File[];
  onChip: (value: string) => void;
  onMultiChipSubmit: (values: string[]) => void;
  onSectionSubmit: (keys: string[]) => void;
  onUploadContinue?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const multi = MULTI_SELECT_KEYS.has(question.key);
  const isChips = question.question_type === "chips";
  const isSectionSelect = question.question_type === "multi_section_select";
  const isUpload =
    question.question_type === "upload" || question.key === "q4b";
  const chips = useMemo(
    () => (Array.isArray(question.chips_options) ? question.chips_options : []) as string[],
    [question.chips_options],
  );

  const handleChip = (chip: string) => {
    if (multi) {
      setSelected((prev) =>
        prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
      );
    } else {
      onChip(chip);
    }
  };

  return (
    <div
      key={question.key}
      className="moodboard-card-enter mb-3 rounded-xl border border-white/10 bg-white/[0.05] p-4"
    >
      <p className="text-[15px] leading-relaxed text-white">{question.question_text}</p>

      {isChips && chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
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
              onClick={() => onMultiChipSubmit(selected)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40"
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}

      {isSectionSelect ? (
        <div className="mt-4">
          <SectionSelector
            question={question}
            disabled={disabled}
            variant="card"
            onSubmit={onSectionSubmit}
          />
        </div>
      ) : null}

      {isUpload && pendingFiles && pendingFiles.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            {pendingFiles.map((f) => (
              <p key={f.name} className="text-xs text-zinc-400">
                {f.name}
              </p>
            ))}
          </div>
          {onUploadContinue ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onUploadContinue}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200"
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function FloatingStatusCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="moodboard-card-enter mb-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-[15px] text-white">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}

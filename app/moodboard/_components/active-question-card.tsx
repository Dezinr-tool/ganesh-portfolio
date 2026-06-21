"use client";

import { useMemo, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { MULTI_SELECT_KEYS } from "@/lib/moodboard/question-seed";
import { SectionSelector } from "./section-selector";

const CHIP =
  "rounded-full border border-[var(--color-bg)]/10 bg-[var(--color-bg)]/[0.04] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:border-[var(--color-bg)]/20 hover:bg-[var(--color-bg)]/[0.08] hover:text-[var(--color-bg)] disabled:opacity-40";
const CHIP_ACTIVE = "border-[var(--color-bg)]/25 bg-[var(--color-bg)]/10 text-[var(--color-bg)]";

/** Legacy card for IA tool — moodboard uses QuestionOptionsCard instead. */
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

  if (isSectionSelect) {
    return (
      <div className="moodboard-card-enter mb-3 rounded-xl border border-[var(--color-bg)]/10 bg-[var(--color-bg)]/[0.05] p-4">
        <p className="text-[15px] leading-relaxed text-[var(--color-bg)]">{question.question_text}</p>
        <div className="mt-4">
          <SectionSelector
            question={question}
            disabled={disabled}
            variant="card"
            onSubmit={onSectionSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="moodboard-card-enter mb-3 rounded-xl border border-[var(--color-bg)]/10 bg-[var(--color-bg)]/[0.05] p-4">
      <p className="text-[15px] leading-relaxed text-[var(--color-bg)]">{question.question_text}</p>

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
              className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-40"
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}

      {isUpload && pendingFiles && pendingFiles.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            {pendingFiles.map((f) => (
              <p key={f.name} className="text-xs text-[var(--color-text)]">
                {f.name}
              </p>
            ))}
          </div>
          {onUploadContinue ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onUploadContinue}
              className="rounded-full bg-[var(--color-bg)] px-4 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
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
    <div className="moodboard-card-enter mb-3">
      <p className="moodboard-assistant-message">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-[var(--color-text)]">{subtitle}</p> : null}
    </div>
  );
}

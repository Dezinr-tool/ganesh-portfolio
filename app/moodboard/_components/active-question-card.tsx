"use client";

import { useMemo, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { MULTI_SELECT_KEYS } from "@/lib/moodboard/question-seed";
import { SectionSelector } from "./section-selector";

export function MoodboardInlineOptions({
  question,
  disabled,
  pendingFiles,
  onChip,
  onMultiChipSubmit,
  onSectionSubmit,
  onUploadContinue,
  variant = "chat",
}: {
  question: MoodboardQuestion;
  disabled?: boolean;
  pendingFiles?: File[];
  onChip: (value: string) => void;
  onMultiChipSubmit: (values: string[]) => void;
  onSectionSubmit: (keys: string[]) => void;
  onUploadContinue?: () => void;
  variant?: "chat" | "card";
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
      <SectionSelector
        question={question}
        disabled={disabled}
        variant={variant}
        onSubmit={onSectionSubmit}
      />
    );
  }

  return (
    <div className="space-y-3">
      {isChips && chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => handleChip(chip)}
              className={`moodboard-chip ${multi && selected.includes(chip) ? "moodboard-chip-active" : ""}`}
            >
              {chip}
            </button>
          ))}
          {multi ? (
            <button
              type="button"
              disabled={disabled || selected.length === 0}
              onClick={() => onMultiChipSubmit(selected)}
              className="moodboard-chip-continue disabled:opacity-40"
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}

      {isUpload && pendingFiles && pendingFiles.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            {pendingFiles.map((f) => (
              <p key={f.name} className="text-sm text-[#888]">
                {f.name}
              </p>
            ))}
          </div>
          {onUploadContinue ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onUploadContinue}
              className="moodboard-chip-continue disabled:opacity-40"
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use inline options in chat history */
export function ActiveQuestionCard(props: Parameters<typeof MoodboardInlineOptions>[0]) {
  return <MoodboardInlineOptions {...props} />;
}

export function FloatingStatusCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="moodboard-card-enter">
      <p className="moodboard-assistant-message">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-[#888]">{subtitle}</p> : null}
    </div>
  );
}

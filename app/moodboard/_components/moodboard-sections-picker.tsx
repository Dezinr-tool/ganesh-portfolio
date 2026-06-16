"use client";

import { QuestionOptionsCard } from "./question-options-card";
import { DEFAULT_MOODBOARD_PICKER_KEYS } from "@/lib/moodboard/output-sections";
import { OUTPUT_SECTIONS_QUESTION } from "@/lib/moodboard/sections-picker-question";

export function MoodboardSectionsPicker({
  onConfirm,
  onSomethingElse,
  onDismiss,
  loading = false,
}: {
  onConfirm: (sections: string[]) => void | Promise<void>;
  onSomethingElse?: () => void;
  onDismiss?: () => void;
  loading?: boolean;
}) {
  return (
    <QuestionOptionsCard
      question={OUTPUT_SECTIONS_QUESTION}
      disabled={loading}
      optional
      dismissed={false}
      onSelect={() => {}}
      onMultiSubmit={(values) => void onConfirm(values)}
      onSkip={() => void onConfirm(DEFAULT_MOODBOARD_PICKER_KEYS)}
      onDismiss={() => onDismiss?.()}
      onSomethingElse={() => onSomethingElse?.()}
    />
  );
}

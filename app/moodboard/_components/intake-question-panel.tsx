"use client";

import { useMemo } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import {
  isOptionalChipQuestion,
  resolveIntakeChipQuestion,
} from "@/lib/moodboard/intake-chip-question";
import { QuestionOptionsCard, showsQuestionCard } from "./question-options-card";

export function IntakeQuestionPanel({
  answers,
  dismissedKeys,
  disabled,
  onAnswer,
  onDismiss,
  onSomethingElse,
}: {
  answers: Record<string, unknown>;
  dismissedKeys: Set<string>;
  disabled?: boolean;
  onAnswer: (question: MoodboardQuestion, value: string | string[]) => void;
  onDismiss: (questionKey: string) => void;
  onSomethingElse: () => void;
}) {
  const question = useMemo(
    () => resolveIntakeChipQuestion(answers, dismissedKeys),
    [answers, dismissedKeys],
  );

  if (!question || !showsQuestionCard(question)) return null;

  const optional = isOptionalChipQuestion(question);

  return (
    <div
      className="moodboard-intake-question-panel mb-3"
      data-testid="moodboard-intake-question"
    >
      <QuestionOptionsCard
        question={question}
        disabled={disabled}
        optional={optional}
        onSelect={(value) => onAnswer(question, value)}
        onMultiSubmit={(values) => onAnswer(question, values)}
        onSkip={() => onDismiss(question.key)}
        onDismiss={() => onDismiss(question.key)}
        onSomethingElse={onSomethingElse}
      />
    </div>
  );
}

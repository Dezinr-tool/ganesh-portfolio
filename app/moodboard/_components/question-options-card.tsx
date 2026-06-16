"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { MULTI_SELECT_KEYS } from "@/lib/moodboard/question-seed";
import {
  MIN_OUTPUT_SECTIONS,
  parseSectionOptions,
} from "@/lib/moodboard/output-sections";

const OPTIONS_PER_PAGE = 3;

export type QuestionOption = {
  id: string;
  label: string;
};

export function showsQuestionCard(question: MoodboardQuestion | null): boolean {
  if (!question) return false;
  if (question.question_type === "multi_section_select") return true;
  if (question.question_type === "chips") {
    const opts = question.chips_options;
    return Array.isArray(opts) && opts.length > 0;
  }
  return false;
}

function parseOptions(question: MoodboardQuestion): QuestionOption[] {
  if (question.question_type === "multi_section_select") {
    return parseSectionOptions(question).map((o) => ({
      id: o.key,
      label: o.label,
    }));
  }
  const chips = question.chips_options;
  if (!Array.isArray(chips)) return [];
  return chips.map((chip) => {
    const label = String(chip);
    return { id: label, label };
  });
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QuestionOptionsCard({
  question,
  disabled,
  optional,
  dismissed,
  onSelect,
  onMultiSubmit,
  onSkip,
  onDismiss,
  onSomethingElse,
}: {
  question: MoodboardQuestion;
  disabled?: boolean;
  optional?: boolean;
  dismissed?: boolean;
  onSelect: (value: string) => void;
  onMultiSubmit: (values: string[]) => void;
  onSkip: () => void;
  onDismiss: () => void;
  onSomethingElse: () => void;
}) {
  const options = useMemo(() => parseOptions(question), [question]);
  const isMulti =
    MULTI_SELECT_KEYS.has(question.key) ||
    question.question_type === "multi_section_select";
  const minSelections =
    question.question_type === "multi_section_select" ? MIN_OUTPUT_SECTIONS : 1;

  const [page, setPage] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [exiting, setExiting] = useState(false);

  const pageCount = Math.max(1, Math.ceil(options.length / OPTIONS_PER_PAGE));
  const pageOptions = options.slice(
    page * OPTIONS_PER_PAGE,
    page * OPTIONS_PER_PAGE + OPTIONS_PER_PAGE,
  );
  const somethingElseIndex = pageOptions.length;

  const submitSingle = useCallback(
    (value: string) => {
      if (disabled || exiting) return;
      setExiting(true);
      window.setTimeout(() => onSelect(value), 150);
    },
    [disabled, exiting, onSelect],
  );

  const submitMulti = useCallback(() => {
    if (disabled || exiting || selected.length < minSelections) return;
    setExiting(true);
    window.setTimeout(() => onMultiSubmit(selected), 150);
  }, [disabled, exiting, minSelections, onMultiSubmit, selected]);

  const toggleMulti = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const activateHighlight = useCallback(() => {
    if (highlight === somethingElseIndex) {
      if (isMulti && selected.length >= minSelections) {
        submitMulti();
      } else {
        onSomethingElse();
      }
      return;
    }
    const opt = pageOptions[highlight];
    if (!opt) return;
    if (isMulti) {
      toggleMulti(opt.id);
    } else {
      submitSingle(opt.id);
    }
  }, [
    highlight,
    isMulti,
    minSelections,
    onSomethingElse,
    pageOptions,
    selected.length,
    somethingElseIndex,
    submitMulti,
    submitSingle,
    toggleMulti,
  ]);

  useEffect(() => {
    if (dismissed || exiting) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, somethingElseIndex));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        activateHighlight();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activateHighlight,
    disabled,
    dismissed,
    exiting,
    somethingElseIndex,
  ]);

  if (dismissed) return null;

  return (
    <>
      <div
        className={`moodboard-question-card mb-3 ${
          exiting ? "moodboard-question-card-exit" : "moodboard-question-card-enter"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-medium leading-snug text-[#1a1a1a]">
            {question.question_text}
          </p>
          <div className="flex shrink-0 items-center gap-1 text-[#999]">
            {pageCount > 1 ? (
              <div className="flex items-center gap-0.5 text-xs">
                <button
                  type="button"
                  disabled={disabled || page === 0}
                  onClick={() => {
                    setPage((p) => Math.max(0, p - 1));
                    setHighlight(0);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#f5f5f5] disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </button>
                <span className="min-w-[3.5rem] text-center tabular-nums">
                  {page + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  disabled={disabled || page >= pageCount - 1}
                  onClick={() => {
                    setPage((p) => Math.min(pageCount - 1, p + 1));
                    setHighlight(0);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#f5f5f5] disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={optional ? onSkip : onDismiss}
              className="flex h-6 w-6 items-center justify-center rounded text-[#bbb] hover:bg-[#f5f5f5] hover:text-[#888]"
              aria-label={optional ? "Skip question" : "Dismiss"}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {pageOptions.map((opt, i) => {
            const isHighlighted = highlight === i;
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled || exiting}
                onClick={() => {
                  if (isMulti) {
                    toggleMulti(opt.id);
                  } else {
                    submitSingle(opt.id);
                  }
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`moodboard-question-option moodboard-question-option-stagger ${
                  isHighlighted ? "moodboard-question-option-highlighted" : ""
                } ${isSelected ? "moodboard-question-option-selected" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="moodboard-question-option-badge">
                  {page * OPTIONS_PER_PAGE + i + 1}
                </span>
                <span className="moodboard-question-option-label">{opt.label}</span>
                <span className="moodboard-question-option-arrow">
                  <ArrowRight />
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#f0f0f0] pt-3">
          <button
            type="button"
            disabled={disabled || exiting}
            onClick={onSomethingElse}
            onMouseEnter={() => setHighlight(somethingElseIndex)}
            className={`flex items-center gap-2 text-sm text-[#999] transition hover:text-[#666] ${
              highlight === somethingElseIndex ? "text-[#666]" : ""
            }`}
          >
            <PencilIcon />
            Something else
          </button>
          <div className="flex items-center gap-2">
            {isMulti && selected.length >= minSelections ? (
              <button
                type="button"
                disabled={disabled || exiting}
                onClick={submitMulti}
                className="moodboard-question-skip-btn bg-[#1a1a1a] text-white hover:bg-[#333]"
              >
                Continue ({selected.length})
              </button>
            ) : null}
            {optional ? (
              <button
                type="button"
                disabled={disabled || exiting}
                onClick={onSkip}
                className="moodboard-question-skip-btn"
              >
                Skip
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <p className="moodboard-question-kbd-hint mb-3">
        ↑↓ to navigate · Enter to select · or type below
      </p>
    </>
  );
}

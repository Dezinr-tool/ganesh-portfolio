"use client";

import { useMemo, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import {
  MIN_OUTPUT_SECTIONS,
  groupSections,
  parseSectionOptions,
} from "@/lib/moodboard/output-sections";

const CHIP =
  "rounded-full border border-[var(--color-bg)]/10 bg-[var(--color-bg)]/[0.04] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:border-[var(--color-bg)]/20 hover:bg-[var(--color-bg)]/[0.08] hover:text-[var(--color-bg)] disabled:opacity-40";
const CHIP_ACTIVE = "border-[var(--color-bg)]/25 bg-[var(--color-bg)]/10 text-[var(--color-bg)]";
const BTN =
  "rounded-full bg-[var(--color-bg)] px-4 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-40";

const CHIP_CHAT = "moodboard-chip";
const CHIP_CHAT_ACTIVE = "moodboard-chip-active";
const BTN_CHAT = "moodboard-chip-continue disabled:opacity-40";

export function SectionSelector({
  question,
  disabled,
  onSubmit,
  variant = "default",
}: {
  question: MoodboardQuestion;
  disabled?: boolean;
  onSubmit: (keys: string[]) => void;
  variant?: "default" | "card" | "chat";
}) {
  const options = useMemo(() => parseSectionOptions(question), [question]);
  const grouped = useMemo(() => groupSections(options), [options]);
  const allKeys = useMemo(() => options.map((o) => o.key), [options]);

  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const selectAll = () => setSelected([...allKeys]);
  const clearAll = () => setSelected([]);

  const canSubmit = selected.length >= MIN_OUTPUT_SECTIONS;

  const chipClass =
    variant === "chat"
      ? CHIP_CHAT
      : variant === "card"
        ? CHIP
        : "rounded-full border border-[var(--color-text)] bg-[var(--color-bg)]/80 px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:border-[var(--color-text)] hover:text-[var(--color-bg)] disabled:opacity-40";
  const chipActiveClass =
    variant === "chat"
      ? `${CHIP_CHAT} ${CHIP_CHAT_ACTIVE}`
      : variant === "card"
        ? CHIP_ACTIVE
        : "border-[var(--color-text)] bg-[var(--color-bg)] text-[var(--color-bg)]";
  const btnClass =
    variant === "chat"
      ? BTN_CHAT
      : variant === "card"
        ? BTN
        : "rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-40";
  const metaClass = variant === "chat" ? "text-xs text-[var(--color-text)]" : "text-xs text-[var(--color-text)]";
  const linkClass =
    variant === "chat"
      ? "text-xs text-[var(--color-text)] underline hover:text-[var(--color-text)]"
      : "text-xs text-[var(--color-text)] underline hover:text-[var(--color-text)]";
  const groupLabelClass =
    variant === "chat"
      ? "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]"
      : "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={selectAll}
          className={linkClass}
        >
          Select All
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={clearAll}
          className={linkClass}
        >
          Clear
        </button>
        <span className={metaClass}>
          {selected.length} selected · min {MIN_OUTPUT_SECTIONS}
        </span>
      </div>

      {[...grouped.entries()].map(([group, items]) => (
        <div key={group}>
          <p className={groupLabelClass}>
            {group}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                onClick={() => toggle(item.key)}
                className={`${chipClass} ${selected.includes(item.key) ? chipActiveClass : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled || !canSubmit}
        onClick={() => onSubmit(selected)}
        className={btnClass}
      >
        Continue
      </button>
    </div>
  );
}

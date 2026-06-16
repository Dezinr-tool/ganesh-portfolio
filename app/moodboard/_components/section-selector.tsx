"use client";

import { useMemo, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import {
  MIN_OUTPUT_SECTIONS,
  groupSections,
  parseSectionOptions,
} from "@/lib/moodboard/output-sections";

const CHIP =
  "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40";
const CHIP_ACTIVE = "border-white/25 bg-white/10 text-white";
const BTN =
  "rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40";

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
        : "rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-40";
  const chipActiveClass =
    variant === "chat"
      ? `${CHIP_CHAT} ${CHIP_CHAT_ACTIVE}`
      : variant === "card"
        ? CHIP_ACTIVE
        : "border-zinc-500 bg-zinc-800 text-white";
  const btnClass =
    variant === "chat"
      ? BTN_CHAT
      : variant === "card"
        ? BTN
        : "rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:opacity-40";
  const metaClass = variant === "chat" ? "text-xs text-[#888]" : "text-xs text-zinc-600";
  const linkClass =
    variant === "chat"
      ? "text-xs text-[#888] underline hover:text-[#555]"
      : "text-xs text-zinc-400 underline hover:text-zinc-200";
  const groupLabelClass =
    variant === "chat"
      ? "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#aaa]"
      : "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500";

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

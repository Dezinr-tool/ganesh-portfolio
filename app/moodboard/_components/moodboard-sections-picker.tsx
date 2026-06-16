"use client";

import { useState } from "react";
import {
  DEFAULT_MOODBOARD_PICKER_KEYS,
  MIN_OUTPUT_SECTIONS,
  MOODBOARD_PICKER_SECTIONS,
  UI_REFERENCES_SOURCES,
} from "@/lib/moodboard/output-sections";

export function MoodboardSectionsPicker({
  initialSelected = DEFAULT_MOODBOARD_PICKER_KEYS,
  onConfirm,
  loading = false,
}: {
  initialSelected?: string[];
  onConfirm: (sections: string[]) => void | Promise<void>;
  loading?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const count = selected.size;
  const canSubmit = count >= MIN_OUTPUT_SECTIONS && !loading;

  return (
    <div className="moodboard-sections-picker rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#888]">
          Before we generate
        </p>
        <h3 className="mt-1 text-base font-medium text-[#1a1a1a]">
          What should your moodboard include?
        </h3>
        <p className="mt-1 text-sm text-[#666]">
          Choose the elements for all three directions. UI references are sourced from{" "}
          {UI_REFERENCES_SOURCES}.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {MOODBOARD_PICKER_SECTIONS.map((section) => {
          const checked = selected.has(section.key);
          return (
            <label
              key={section.key}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                checked
                  ? "border-[#1a1a1a] bg-[#fafafa]"
                  : "border-[#ececec] hover:border-[#ccc]"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(section.key)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a1a1a]"
              />
              <span className="text-sm text-[#1a1a1a]">{section.label}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#888]">
          {count < MIN_OUTPUT_SECTIONS
            ? `Select at least ${MIN_OUTPUT_SECTIONS} elements (${count} selected)`
            : `${count} elements selected`}
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void onConfirm([...selected])}
          className="rounded-full bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#333] disabled:opacity-50"
        >
          {loading ? "Starting…" : "Generate 3 directions"}
        </button>
      </div>
    </div>
  );
}

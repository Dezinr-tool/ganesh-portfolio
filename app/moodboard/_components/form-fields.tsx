"use client";

import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import { EA_INPUT } from "@/app/ea/_components/ea-ui";

export function ModelSelect({
  value,
  onChange,
}: {
  value: MoodboardModelId;
  onChange: (id: MoodboardModelId) => void;
}) {
  const selected = MOODBOARD_MODELS.find((m) => m.id === value);
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        AI model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MoodboardModelId)}
        className={EA_INPUT}
      >
        {MOODBOARD_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
            {model.recommended ? " ← default" : ""}
            {" · ~"}
            {model.estimatedSeconds}s
          </option>
        ))}
      </select>
      {selected ? (
        <p className="mt-1.5 text-xs text-zinc-500">
          Estimated generation time: ~{selected.estimatedSeconds} seconds
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-zinc-400">
        {label}
        {optional ? " (optional)" : ""}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${EA_INPUT} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={EA_INPUT}
        />
      )}
    </div>
  );
}

export { EA_INPUT as inputClass };

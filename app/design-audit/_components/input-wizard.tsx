"use client";

import { useCallback, useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function ImageDropZone({
  files,
  onChange,
  max = 5,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = [...files];
      for (const file of Array.from(incoming)) {
        if (list.length >= max) break;
        if (file.type.startsWith("image/")) list.push(file);
      }
      onChange(list.slice(0, max));
    },
    [files, max, onChange],
  );

  const previews = files.map((f) => URL.createObjectURL(f));

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-white/40 bg-white/5"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <p className="text-sm text-zinc-300">Drop screenshots here</p>
        <p className="mt-1 text-xs text-zinc-500">
          JPG, PNG, WebP — up to {max} images
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files ?? [])}
      />
      {previews.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((url, i) => (
            <div key={url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Preview ${i + 1}`}
                className="h-32 w-full rounded-lg border border-white/10 object-cover"
              />
              <div className="absolute inset-x-1 bottom-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...files];
                      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                      onChange(next);
                    }}
                    className="flex-1 rounded bg-black/80 py-1 text-[10px] text-white"
                  >
                    ←
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="flex-1 rounded bg-black/80 py-1 text-[10px] text-red-300"
                >
                  Remove
                </button>
                {i < files.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...files];
                      [next[i], next[i + 1]] = [next[i + 1]!, next[i]!];
                      onChange(next);
                    }}
                    className="flex-1 rounded bg-black/80 py-1 text-[10px] text-white"
                  >
                    →
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const CONTEXT_STEPS = [
  {
    key: "productDescription" as const,
    label: "What is this product/screen?",
    placeholder: "B2B analytics dashboard for marketing teams",
  },
  {
    key: "targetUser" as const,
    label: "Who is the target user?",
    placeholder: "Marketing managers at mid-size SaaS companies",
  },
  {
    key: "primaryGoal" as const,
    label: "What is the primary goal of this page/screen?",
    placeholder: "Convert visitors to start a free trial",
  },
];

export function ContextWizard({
  context,
  onChange,
  onComplete,
  loading,
}: {
  context: {
    productDescription: string;
    targetUser: string;
    primaryGoal: string;
    specificConcerns?: string;
  };
  onChange: (patch: Partial<typeof context>) => void;
  onComplete: () => void;
  loading: boolean;
}) {
  const [step, setStep] = useState(0);
  const current = CONTEXT_STEPS[step];
  const value = context[current?.key ?? "productDescription"] ?? "";

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {CONTEXT_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-white" : "bg-white/10"}`}
          />
        ))}
      </div>
      {current ? (
        <div>
          <label className="mb-2 block text-sm text-white">
            {step + 1}. {current.label}
          </label>
          <input
            value={value}
            onChange={(e) => onChange({ [current.key]: e.target.value })}
            placeholder={current.placeholder}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>
      ) : null}
      {step === CONTEXT_STEPS.length ? (
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Any specific concerns? (optional)
          </label>
          <textarea
            value={context.specificConcerns ?? ""}
            onChange={(e) => onChange({ specificConcerns: e.target.value })}
            rows={3}
            placeholder="Low conversion on mobile, unclear pricing…"
            className="w-full resize-y rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>
      ) : null}

      <div className="flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300"
          >
            ← Back
          </button>
        ) : null}
        {step < CONTEXT_STEPS.length ? (
          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            disabled={loading}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Running audit…" : "Run design audit"}
          </button>
        )}
      </div>
    </div>
  );
}

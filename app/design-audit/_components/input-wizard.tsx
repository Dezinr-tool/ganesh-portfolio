"use client";

import { useCallback, useRef, useState } from "react";
import {
  EA_BTN_PRIMARY,
  EA_BTN_SECONDARY,
  EA_INPUT,
} from "@/app/ea/_components/ea-ui";
import { AuditModelSelector } from "./audit-model-selector";
import type { AuditModelId } from "@/lib/design-audit/types";

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
        className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-zinc-500 bg-zinc-900/50"
            : "border-zinc-800 hover:border-zinc-600"
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
                className="h-32 w-full rounded-lg border border-zinc-800 object-cover"
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
  modelId,
  onModelChange,
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
  modelId: AuditModelId;
  onModelChange: (id: AuditModelId) => void;
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
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-zinc-400" : "bg-zinc-800"}`}
          />
        ))}
      </div>
      {current ? (
        <div>
          <label className="mb-2 block text-sm text-zinc-300">
            {step + 1}. {current.label}
          </label>
          <input
            value={value}
            onChange={(e) => onChange({ [current.key]: e.target.value })}
            placeholder={current.placeholder}
            className={EA_INPUT}
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
            className={`${EA_INPUT} resize-y`}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="order-2 pl-0.5 sm:order-1">
          <AuditModelSelector
            modelId={modelId}
            onModelChange={onModelChange}
            disabled={loading}
          />
        </div>

        <div className="order-1 flex gap-3 sm:order-2 sm:justify-end">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className={EA_BTN_SECONDARY}
            >
              ← Back
            </button>
          ) : null}
          {step < CONTEXT_STEPS.length ? (
            <button
              type="button"
              disabled={!value.trim()}
              onClick={() => setStep((s) => s + 1)}
              className={EA_BTN_PRIMARY}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              disabled={loading}
              className={EA_BTN_PRIMARY}
            >
              {loading ? "Running audit…" : "Run design audit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

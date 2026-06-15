"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { ChipOption, ChatWidget } from "@/lib/moodboard/chat-types";
import type { MoodboardDirection } from "@/lib/moodboard/types";
import {
  DirectionCard,
  DirectionDetailModal,
  ExportPanel,
} from "./direction-cards";
import { EA_INPUT, EA_BTN_PRIMARY, EA_BTN_SECONDARY } from "@/app/ea/_components/ea-ui";

const CHIP_CLASS =
  "rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-40";
const CHIP_ACTIVE = "border-zinc-500 bg-zinc-800 text-white";

export function ChatBubble({
  role,
  children,
}: {
  role: "assistant" | "user";
  children: ReactNode;
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] space-y-3 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%] ${
          role === "user"
            ? "bg-zinc-800 text-zinc-100"
            : "border border-zinc-800/80 bg-zinc-900/40 text-zinc-300"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ChipRow({
  options,
  multi,
  selected,
  onSelect,
  disabled,
}: {
  options: ChipOption[];
  multi?: boolean;
  selected?: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected?.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt.id)}
            className={`${CHIP_CLASS} ${active ? CHIP_ACTIVE : ""}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChatWidgetView({
  widget,
  disabled,
  onChip,
  onText,
  onUrl,
  onRich,
  onConfirm,
  onDirections,
  selectedChips,
}: {
  widget: ChatWidget;
  disabled?: boolean;
  onChip: (id: string) => void;
  onText: (value: string) => void;
  onUrl: (value: string) => void;
  onRich: (payload: {
    text: string;
    files: File[];
    skipped?: boolean;
    questionnaireFile?: File | null;
  }) => void;
  onConfirm: (confirmed: boolean) => void;
  onDirections: {
    onSelect: (id: string) => void;
    onRefine: (id: string) => void;
    onReject: (id: string) => void;
    onExpand: (id: string) => void;
    selectedId: string | null;
    exportPanel?: ReactNode;
  };
  selectedChips?: string[];
}) {
  if (widget.type === "chips") {
    return (
      <ChipRow
        options={widget.options}
        multi={widget.multi}
        selected={selectedChips}
        onSelect={onChip}
        disabled={disabled}
      />
    );
  }

  if (widget.type === "loader") {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
        {widget.message}
      </div>
    );
  }

  if (widget.type === "text" || widget.type === "url") {
    return (
      <InlineTextInput
        multiline={widget.type === "text" && widget.multiline}
        placeholder={
          widget.type === "url"
            ? (widget.placeholder ?? "https://example.com")
            : widget.placeholder
        }
        submitLabel={widget.type === "text" ? widget.submitLabel : "Submit"}
        disabled={disabled}
        inputMode={widget.type === "url" ? "url" : "text"}
        onSubmit={widget.type === "url" ? onUrl : onText}
      />
    );
  }

  if (widget.type === "rich") {
    return (
      <RichInput
        placeholder={widget.placeholder}
        multiline={widget.multiline ?? true}
        allowQuestionnaire={widget.allowQuestionnaire}
        allowImages={widget.allowImages}
        maxImages={widget.maxImages ?? 5}
        skippable={widget.skippable}
        submitLabel={widget.submitLabel ?? "Continue"}
        disabled={disabled}
        onSubmit={onRich}
      />
    );
  }

  if (widget.type === "confirm") {
    return (
      <ConfirmSummary
        summary={widget.summary}
        fields={widget.fields}
        disabled={disabled}
        onConfirm={onConfirm}
      />
    );
  }

  if (widget.type === "directions") {
    return (
      <div className="space-y-4">
        {onDirections.exportPanel}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {widget.directions.map((direction) => (
            <DirectionCard
              key={direction.id}
              direction={direction}
              chosen={onDirections.selectedId === direction.id}
              onSelect={() => onDirections.onSelect(direction.id)}
              onRefine={() => onDirections.onRefine(direction.id)}
              onReject={() => onDirections.onReject(direction.id)}
              onExpand={() => onDirections.onExpand(direction.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function InlineTextInput({
  placeholder,
  multiline,
  submitLabel = "Continue",
  disabled,
  inputMode = "text",
  onSubmit,
}: {
  placeholder?: string;
  multiline?: boolean;
  submitLabel?: string;
  disabled?: boolean;
  inputMode?: "text" | "url";
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSubmit(trimmed);
        setValue("");
      }}
    >
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          className={`${EA_INPUT} resize-y`}
        />
      ) : (
        <input
          type={inputMode === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={EA_INPUT}
        />
      )}
      <button type="submit" disabled={disabled || !value.trim()} className={EA_BTN_PRIMARY}>
        {submitLabel}
      </button>
    </form>
  );
}

function RichInput({
  placeholder,
  multiline,
  allowQuestionnaire,
  allowImages,
  maxImages = 5,
  skippable,
  submitLabel,
  disabled,
  onSubmit,
}: {
  placeholder?: string;
  multiline?: boolean;
  allowQuestionnaire?: boolean;
  allowImages?: boolean;
  maxImages?: number;
  skippable?: boolean;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (payload: {
    text: string;
    files: File[];
    skipped?: boolean;
    questionnaireFile?: File | null;
  }) => void;
}) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  return (
    <div className="space-y-3">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          className={`${EA_INPUT} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={EA_INPUT}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {allowQuestionnaire ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => docRef.current?.click()}
              className={EA_BTN_SECONDARY}
            >
              Upload questionnaire
            </button>
            <input
              ref={docRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => setQuestionnaireFile(e.target.files?.[0] ?? null)}
            />
          </>
        ) : null}
        {allowImages ? (
          <>
            <button
              type="button"
              disabled={disabled || files.length >= maxImages}
              onClick={() => imageRef.current?.click()}
              className={EA_BTN_SECONDARY}
            >
              Upload images ({files.length}/{maxImages})
            </button>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const incoming = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...incoming].slice(0, maxImages));
              }}
            />
          </>
        ) : null}
        {skippable ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit({ text: "", files: [], skipped: true })}
            className="rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Skip
          </button>
        ) : null}
      </div>

      {questionnaireFile ? (
        <p className="text-xs text-zinc-500">Questionnaire: {questionnaireFile.name}</p>
      ) : null}

      {previews.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`Reference ${i + 1}`}
              className="h-16 w-full rounded-lg border border-zinc-800 object-cover"
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled || (!value.trim() && !questionnaireFile && files.length === 0)}
        onClick={() =>
          onSubmit({
            text: value.trim(),
            files,
            questionnaireFile,
          })
        }
        className={EA_BTN_PRIMARY}
      >
        {submitLabel}
      </button>
    </div>
  );
}

function ConfirmSummary({
  summary,
  fields,
  disabled,
  onConfirm,
}: {
  summary: Record<string, string>;
  fields: string[];
  disabled?: boolean;
  onConfirm: (confirmed: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-400">
      {fields.map((field) => (
        <p key={field}>
          <span className="text-zinc-500">{field}:</span>{" "}
          <span className="text-zinc-200">{summary[field] || "—"}</span>
        </p>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onConfirm(true)}
          className={EA_BTN_PRIMARY}
        >
          Looks good
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onConfirm(false)}
          className={EA_BTN_SECONDARY}
        >
          Edit answers
        </button>
      </div>
    </div>
  );
}

export { DirectionDetailModal, ExportPanel };
export type { MoodboardDirection };

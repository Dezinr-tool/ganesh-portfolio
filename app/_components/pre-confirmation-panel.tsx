"use client";

import { useMemo, useState } from "react";
import type {
  PreConfirmation,
  UserPreConfirmation,
} from "@/lib/pre-generation-types";
import { buildUserPreConfirmationFromUI } from "@/lib/pre-generation-ui";

type PreConfirmationPanelProps = {
  preConfirmation: PreConfirmation;
  onConfirm: (selections: UserPreConfirmation) => void;
  loading?: boolean;
  brandName?: string;
  variant?: "default" | "inline";
};

function Pill({
  label,
  reason,
  onRemove,
  inline,
}: {
  label: string;
  reason: string;
  onRemove: () => void;
  inline?: boolean;
}) {
  return (
    <span
      className={`group relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${
        inline
          ? "border border-[var(--color-bg)]/10 bg-[var(--color-bg)]/[0.04] text-[var(--color-text)]"
          : "border border-[var(--color-text)] bg-[var(--color-bg)] text-[var(--color-text)]"
      }`}
      title={reason}
    >
      <span>✓ {label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full px-1 text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-bg)]"
        aria-label={`Remove ${label}`}
      >
        ✕
      </button>
    </span>
  );
}

export function PreConfirmationPanel({
  preConfirmation,
  onConfirm,
  loading,
  brandName,
  variant = "default",
}: PreConfirmationPanelProps) {
  const [rejectedFrameworks, setRejectedFrameworks] = useState<string[]>([]);
  const [rejectedRules, setRejectedRules] = useState<string[]>([]);
  const [observationAnswers, setObservationAnswers] = useState<Record<number, string>>({});
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  const activeFrameworks = useMemo(
    () =>
      preConfirmation.proposed_frameworks.filter((f) => !rejectedFrameworks.includes(f.key)),
    [preConfirmation.proposed_frameworks, rejectedFrameworks],
  );
  const activeRules = useMemo(
    () => preConfirmation.proposed_rules.filter((r) => !rejectedRules.includes(r.key)),
    [preConfirmation.proposed_rules, rejectedRules],
  );

  const allQuestionsAnswered = preConfirmation.confirmation_questions.every(
    (q) => q.is_optional || questionAnswers[q.key] || q.default_answer,
  );

  const handleSubmit = () => {
    const selections = buildUserPreConfirmationFromUI({
      preConfirmation,
      rejectedFrameworkKeys: rejectedFrameworks,
      rejectedRuleKeys: rejectedRules,
      observationAnswers,
      questionAnswers,
    });
    onConfirm(selections);
  };

  const inline = variant === "inline";
  const shellClass = inline
    ? "space-y-5"
    : "space-y-6 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5";

  return (
    <div className={shellClass}>
      <div>
        <p className={`${inline ? "text-[15px] leading-relaxed" : "text-sm font-medium"} text-[var(--color-bg)]`}>
          {inline && brandName
            ? `Here's my approach for ${brandName}`
            : "Approach I'm planning"}
        </p>
        {!inline ? (
          <p className="mt-1 text-xs text-[var(--color-text)]">
            Review what I&apos;ll apply. Remove anything you don&apos;t want.
          </p>
        ) : (
          <p className="mt-2 text-xs text-[var(--color-text)]">Using:</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFrameworks.map((f) => (
            <Pill
              key={f.key}
              label={f.name}
              reason={f.reason}
              inline={inline}
              onRemove={() => setRejectedFrameworks((k) => [...k, f.key])}
            />
          ))}
          {activeRules.map((r) => (
            <Pill
              key={r.key}
              label={r.name}
              reason={r.reason}
              inline={inline}
              onRemove={() => setRejectedRules((k) => [...k, r.key])}
            />
          ))}
          {rejectedFrameworks.map((key) => {
            const f = preConfirmation.proposed_frameworks.find((x) => x.key === key);
            if (!f) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRejectedFrameworks((k) => k.filter((x) => x !== key))}
                className="rounded-full border border-dashed border-[var(--color-text)] px-3 py-1 text-xs text-[var(--color-text)] line-through"
              >
                {f.name} (removed)
              </button>
            );
          })}
        </div>
      </div>

      {preConfirmation.ia_preview ? (
        <div
          className={`rounded-lg p-3 ${inline ? "bg-[var(--color-bg)]/[0.03]" : "border border-[var(--color-text)] bg-[var(--color-text)]/40"}`}
        >
          <p className="text-xs font-medium text-[var(--color-text)]">IA approach</p>
          <dl className="mt-2 space-y-1.5 text-sm text-[var(--color-text)]">
            <div>
              <dt className="inline text-[var(--color-text)]">Industry pattern: </dt>
              <dd className="inline">{preConfirmation.ia_preview.industry_pattern}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--color-text)]">Navigation: </dt>
              <dd className="inline">{preConfirmation.ia_preview.navigation_pattern}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-[var(--color-text)]">UX controversies to address:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[var(--color-text)]">
            {preConfirmation.ia_preview.controversies_to_address.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {preConfirmation.meeting_observations.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-[var(--color-text)]">
            {inline ? "From your EA:" : "From your previous sessions"}
          </p>
          <div className="mt-3 space-y-3">
            {preConfirmation.meeting_observations.map((obs, i) => (
              <div
                key={`${obs.source}-${i}`}
                className={`rounded-lg p-3 ${inline ? "bg-[var(--color-bg)]/[0.03]" : "border border-[var(--color-text)] bg-[var(--color-text)]/40 p-4"}`}
              >
                {!inline ? (
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text)]">
                    {obs.source === "meeting"
                      ? "💬 From your EA meeting"
                      : obs.source === "ea_memory"
                        ? "🧠 EA memory"
                        : obs.source === "previous_audit"
                          ? "📋 Previous audit"
                          : "🎨 Previous moodboard"}
                  </p>
                ) : null}
                <p className={`${inline ? "text-sm" : "mt-2 text-sm"} text-[var(--color-text)]`}>
                  {inline ? `"${obs.observation}"` : `“${obs.observation}”`}
                </p>
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  {inline ? `→ ${obs.question}` : obs.question}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(inline ? ["Yes", "No"] : ["Yes, apply this", "No, skip"]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setObservationAnswers((a) => ({
                          ...a,
                          [i]: inline
                            ? opt === "Yes"
                              ? "Yes, apply this"
                              : "No, skip"
                            : opt,
                        }))
                      }
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        (observationAnswers[i] ?? "Yes, apply this") ===
                        (inline
                          ? opt === "Yes"
                            ? "Yes, apply this"
                            : "No, skip"
                          : opt)
                          ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                          : "border border-[var(--color-bg)]/10 text-[var(--color-text)] hover:border-[var(--color-bg)]/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {preConfirmation.confirmation_questions.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-[var(--color-bg)]">Quick questions</p>
          <div className="mt-3 space-y-4">
            {preConfirmation.confirmation_questions.map((q) => (
              <div key={q.key}>
                <p className="text-sm text-[var(--color-text)]">{q.question}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(q.options ?? []).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQuestionAnswers((a) => ({ ...a, [q.key]: opt }))}
                      className={`rounded-md px-3 py-1.5 text-xs transition ${
                        (questionAnswers[q.key] ?? q.default_answer) === opt
                          ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                          : "border border-[var(--color-text)] text-[var(--color-text)] hover:border-[var(--color-text)]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        data-testid="pre-confirmation-generate"
        disabled={loading || !allQuestionsAnswered}
        onClick={handleSubmit}
        className={`w-full py-3 text-sm font-medium disabled:opacity-50 ${
          inline
            ? "rounded-full bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
            : "rounded-lg bg-[var(--color-bg)] text-[var(--color-text)]"
        }`}
      >
        {loading ? "Starting…" : inline ? "Generate Moodboard →" : "Confirm & generate →"}
      </button>
    </div>
  );
}

"use client";

import { DesignTokensScope } from "@/components/design-tokens-scope";
import {
  DEFAULT_DESIGN_TOKENS,
  isValidHexColor,
  type DesignTokens,
} from "@/lib/design-tokens";
import { useEffect, useState } from "react";

type TokenField = keyof DesignTokens;

const TOKEN_FIELDS: {
  key: TokenField;
  label: string;
  description: string;
}[] = [
  {
    key: "bg",
    label: "Background",
    description: "Page and document backgrounds",
  },
  {
    key: "text",
    label: "Text",
    description: "Body copy, borders, and primary UI",
  },
  {
    key: "accent",
    label: "Accent",
    description: "Links, highlights, and emphasis",
  },
];

function TokenPreview({ tokens }: { tokens: DesignTokens }) {
  return (
    <DesignTokensScope tokens={tokens}>
      <div className="rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
        <p className="text-sm font-medium text-[var(--color-text)]">
          Preview heading
        </p>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          Body text on your background color.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex min-h-10 items-center rounded-none border border-[var(--color-text)] bg-[var(--color-text)] px-4 text-sm font-medium text-[var(--color-bg)]">
            Solid CTA
          </span>
          <span className="inline-flex min-h-10 items-center rounded-none border border-[var(--color-text)] bg-transparent px-4 text-sm font-medium text-[var(--color-text)]">
            Outline CTA
          </span>
          <span className="inline-flex min-h-10 items-center px-2 text-sm font-medium text-[var(--color-accent)]">
            Accent link
          </span>
        </div>
      </div>
    </DesignTokensScope>
  );
}

export function BrandSettingsForm() {
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_DESIGN_TOKENS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.designTokens) {
          setTokens(data.designTokens);
        }
      })
      .catch(() => setError("Failed to load brand settings."))
      .finally(() => setLoading(false));
  }, []);

  function updateToken(key: TokenField, value: string) {
    setTokens((current) => ({ ...current, [key]: value }));
    setSuccess(false);
  }

  async function handleSave() {
    for (const field of TOKEN_FIELDS) {
      if (!isValidHexColor(tokens[field.key])) {
        setError(`${field.label} must be a valid hex color (e.g. #111111).`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designTokens: tokens }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save brand settings.");
      }

      if (data.designTokens) {
        setTokens(data.designTokens);

        document.getElementById("design-tokens")?.remove();
        const style = document.createElement("style");
        style.id = "design-tokens";
        style.textContent = `:root{--color-bg:${data.designTokens.bg};--color-text:${data.designTokens.text};--color-accent:${data.designTokens.accent};}`;
        document.head.appendChild(style);
      }

      setSuccess(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save brand settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setTokens(DEFAULT_DESIGN_TOKENS);
    setSuccess(false);
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-text)]">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {TOKEN_FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`brand-${field.key}`}
              className="block text-sm font-medium text-[var(--color-text)]"
            >
              {field.label}
            </label>
            <p className="mt-0.5 text-xs text-[var(--color-text)]">
              {field.description}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <input
                id={`brand-${field.key}`}
                type="color"
                value={
                  isValidHexColor(tokens[field.key])
                    ? tokens[field.key]
                    : DEFAULT_DESIGN_TOKENS[field.key]
                }
                onChange={(event) => updateToken(field.key, event.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-[var(--color-text)] bg-[var(--color-bg)] p-1"
              />
              <input
                type="text"
                value={tokens[field.key]}
                onChange={(event) => updateToken(field.key, event.target.value)}
                spellCheck={false}
                className="min-h-10 flex-1 rounded border border-[var(--color-text)] bg-[var(--color-bg)] px-3 font-mono text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-text)]"
                aria-label={`${field.label} hex value`}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
          Live preview
        </p>
        <TokenPreview tokens={tokens} />
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-accent)]" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-[var(--color-accent)]">
          Brand settings saved. Portfolio, invoices, and agreements will use
          these colors.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-10 rounded-none border border-[var(--color-text)] bg-[var(--color-text)] px-5 text-sm font-medium text-[var(--color-bg)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save brand colors"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="min-h-10 rounded-none border border-[var(--color-text)] bg-transparent px-5 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

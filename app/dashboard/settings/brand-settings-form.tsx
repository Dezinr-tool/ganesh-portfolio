"use client";

import { DesignTokensScope } from "@/components/design-tokens-scope";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_DESIGN_TOKENS,
  designTokensCssText,
  isValidHexColor,
  type DesignTokens,
} from "@/lib/design-tokens-shared";
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
      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-sm font-medium">Preview heading</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Body text on your background color.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm">
            Solid CTA
          </Button>
          <Button type="button" variant="outline" size="sm">
            Outline CTA
          </Button>
          <Button type="button" variant="link" size="sm">
            Accent link
          </Button>
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
        style.textContent = designTokensCssText(data.designTokens);
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
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {TOKEN_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`brand-${field.key}`}>{field.label}</Label>
            <p className="text-xs text-muted-foreground">{field.description}</p>
            <div className="flex items-center gap-3">
              <input
                id={`brand-${field.key}-picker`}
                type="color"
                value={
                  isValidHexColor(tokens[field.key])
                    ? tokens[field.key]
                    : DEFAULT_DESIGN_TOKENS[field.key]
                }
                onChange={(event) => updateToken(field.key, event.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-background p-1"
              />
              <Input
                id={`brand-${field.key}`}
                value={tokens[field.key]}
                onChange={(event) => updateToken(field.key, event.target.value)}
                spellCheck={false}
                className="font-mono"
                aria-label={`${field.label} hex value`}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Live preview</p>
        <TokenPreview tokens={tokens} />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>
            Brand settings saved. Portfolio, invoices, and agreements will use
            these colors.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save brand colors"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

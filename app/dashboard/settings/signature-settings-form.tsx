"use client";

import { useEffect, useRef, useState } from "react";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/dashboard/agreements/signature-canvas";

type SignatureMode = "upload" | "draw";

export function SignatureSettingsForm() {
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<SignatureMode>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.signature) setPreview(data.signature);
      })
      .catch(() => setError("Failed to load saved signature."))
      .finally(() => setLoading(false));
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Please upload a PNG or JPG image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setError(null);
      setSuccess(false);
    };
    reader.readAsDataURL(file);
  }

  function handleUseDrawing() {
    const dataUrl = canvasRef.current?.getDataUrl();
    if (!dataUrl) {
      setError("Please draw a signature first.");
      return;
    }
    setPreview(dataUrl);
    setError(null);
    setSuccess(false);
  }

  async function handleSave() {
    if (!preview) {
      setError("No signature to save.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: preview }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save signature.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Failed to save signature.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-text)]">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6">
        <h2 className="text-sm font-medium text-[var(--color-bg)]">Default signature</h2>
        <p className="mt-1 text-sm text-[var(--color-text)]">
          Upload an image or draw your signature. This will be used when signing
          agreements.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === "upload"
                ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                : "border border-[var(--color-text)] text-[var(--color-text)] hover:text-[var(--color-bg)]"
            }`}
          >
            Upload image
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === "draw"
                ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                : "border border-[var(--color-text)] text-[var(--color-text)] hover:text-[var(--color-bg)]"
            }`}
          >
            Draw on canvas
          </button>
        </div>

        {mode === "upload" ? (
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="block text-sm text-[var(--color-text)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--color-bg)] file:px-4 file:py-2 file:text-sm file:text-[var(--color-bg)] hover:file:bg-[var(--color-bg)]"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="overflow-x-auto rounded border border-[var(--color-text)] bg-[var(--color-bg)] p-2">
              <SignatureCanvas
                ref={canvasRef}
                width={500}
                height={200}
                onChange={setHasDrawn}
              />
            </div>
            <button
              type="button"
              onClick={handleUseDrawing}
              disabled={!hasDrawn}
              className="rounded-md border border-[var(--color-text)] px-4 py-2 text-sm text-[var(--color-bg)] hover:bg-[var(--color-bg)] disabled:opacity-40"
            >
              Use this drawing
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6">
        <h2 className="text-sm font-medium text-[var(--color-bg)]">Preview</h2>
        <div className="mt-4 flex min-h-[120px] items-center justify-center rounded border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Signature preview"
              className="max-h-24 object-contain"
            />
          ) : (
            <p className="text-sm text-[var(--color-text)]">No signature yet</p>
          )}
        </div>
      </section>

      {error ? (
        <p className="text-sm text-[var(--color-accent)]" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-[var(--color-accent)]">Default signature saved.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={!preview || saving}
        className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Default Signature"}
      </button>
    </div>
  );
}

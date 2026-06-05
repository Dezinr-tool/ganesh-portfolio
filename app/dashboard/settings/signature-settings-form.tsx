"use client";

import { useEffect, useRef, useState } from "react";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/agreements/signature-canvas";

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
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Default signature</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Upload an image or draw your signature. This will be used when signing
          agreements.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === "upload"
                ? "bg-white text-neutral-950"
                : "border border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            Upload image
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === "draw"
                ? "bg-white text-neutral-950"
                : "border border-neutral-700 text-neutral-300 hover:text-white"
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
              className="block text-sm text-neutral-400 file:mr-4 file:rounded-md file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-neutral-700"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="overflow-x-auto rounded border border-neutral-700 bg-white p-2">
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
              className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              Use this drawing
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Preview</h2>
        <div className="mt-4 flex min-h-[120px] items-center justify-center rounded border border-neutral-700 bg-white p-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Signature preview"
              className="max-h-24 object-contain"
            />
          ) : (
            <p className="text-sm text-neutral-500">No signature yet</p>
          )}
        </div>
      </section>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-emerald-400">Default signature saved.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={!preview || saving}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Default Signature"}
      </button>
    </div>
  );
}

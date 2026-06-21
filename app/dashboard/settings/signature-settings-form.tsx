"use client";

import { useEffect, useRef, useState } from "react";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/dashboard/agreements/signature-canvas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default signature</CardTitle>
          <CardDescription>
            Upload an image or draw your signature. This will be used when
            signing agreements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("upload")}
            >
              Upload image
            </Button>
            <Button
              type="button"
              variant={mode === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("draw")}
            >
              Draw on canvas
            </Button>
          </div>

          {mode === "upload" ? (
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-border p-2">
                <SignatureCanvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  onChange={setHasDrawn}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleUseDrawing}
                disabled={!hasDrawn}
              >
                Use this drawing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex min-h-[120px] items-center justify-center rounded-lg border border-border bg-muted/20 p-4",
            )}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Signature preview"
                className="max-h-24 object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No signature yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertDescription>Default signature saved.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="button" onClick={handleSave} disabled={!preview || saving}>
        {saving ? "Saving…" : "Save default signature"}
      </Button>
    </div>
  );
}

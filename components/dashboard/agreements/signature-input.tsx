"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { SignatureCanvas, type SignatureCanvasRef } from "./signature-canvas";

export type SignatureInputRef = {
  getDataUrl: () => string | null;
};

type SignatureMethod = "draw" | "type" | "upload";

const METHODS: { value: SignatureMethod; label: string }[] = [
  { value: "draw", label: "Draw" },
  { value: "type", label: "Type" },
  { value: "upload", label: "Upload" },
];

function typedNameToDataUrl(name: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "middle";

  let fontSize = 56;
  ctx.font = `italic ${fontSize}px Georgia, serif`;
  while (ctx.measureText(name).width > canvas.width - 40 && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `italic ${fontSize}px Georgia, serif`;
  }

  ctx.fillText(name, 20, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

type SignatureInputProps = {
  onChange?: (hasSignature: boolean) => void;
};

export const SignatureInput = forwardRef<SignatureInputRef, SignatureInputProps>(
  function SignatureInput({ onChange }, ref) {
    const [method, setMethod] = useState<SignatureMethod>("draw");
    const canvasRef = useRef<SignatureCanvasRef>(null);
    const [typedName, setTypedName] = useState("");
    const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const notify = useCallback(
      (
        next: SignatureMethod,
        overrides?: { typedName?: string; uploadedDataUrl?: string | null },
      ) => {
        const typed = overrides?.typedName ?? typedName;
        const uploaded =
          overrides?.uploadedDataUrl !== undefined
            ? overrides.uploadedDataUrl
            : uploadedDataUrl;
        const has =
          next === "draw"
            ? (canvasRef.current?.hasContent() ?? false)
            : next === "type"
              ? typed.trim().length > 0
              : uploaded != null;
        onChange?.(has);
      },
      [typedName, uploadedDataUrl, onChange],
    );

    function handleMethodChange(next: SignatureMethod) {
      setMethod(next);
      notify(next);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadError(null);

      if (!file.type.startsWith("image/")) {
        setUploadError("Please upload an image file.");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setUploadError("Image must be under 3MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedDataUrl(dataUrl);
        notify("upload", { uploadedDataUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }

    useImperativeHandle(
      ref,
      () => ({
        getDataUrl: () => {
          if (method === "draw") return canvasRef.current?.getDataUrl() ?? null;
          if (method === "type") {
            return typedName.trim() ? typedNameToDataUrl(typedName.trim()) : null;
          }
          return uploadedDataUrl;
        },
      }),
      [method, typedName, uploadedDataUrl],
    );

    return (
      <div>
        <div className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => handleMethodChange(m.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                method === m.value
                  ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]"
                  : "border-[var(--color-text)] text-[var(--color-text)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {method === "draw" ? (
            <div className="overflow-x-auto">
              <SignatureCanvas
                ref={canvasRef}
                width={500}
                height={200}
                showClearButton={false}
                onChange={(has) => onChange?.(has)}
              />
              <button
                type="button"
                onClick={() => {
                  canvasRef.current?.clear();
                  onChange?.(false);
                }}
                className="mt-2 text-xs text-[var(--color-text)] underline"
              >
                Clear
              </button>
            </div>
          ) : null}

          {method === "type" ? (
            <div>
              <input
                type="text"
                value={typedName}
                onChange={(e) => {
                  setTypedName(e.target.value);
                  notify("type", { typedName: e.target.value });
                }}
                placeholder="Type your full name"
                className="w-full max-w-[500px] rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none"
              />
              {typedName.trim() ? (
                <p
                  className="mt-3 max-w-[500px] border border-dashed border-[var(--color-text)] px-4 py-6 text-3xl text-[var(--color-text)]"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                >
                  {typedName}
                </p>
              ) : null}
            </div>
          ) : null}

          {method === "upload" ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block text-sm text-[var(--color-text)]"
              />
              {uploadError ? (
                <p className="mt-2 text-xs text-[var(--color-accent)]">{uploadError}</p>
              ) : null}
              {uploadedDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL preview, no remote source
                <img
                  src={uploadedDataUrl}
                  alt="Uploaded signature preview"
                  className="mt-3 max-h-[120px] max-w-[500px] border border-[var(--color-text)] object-contain p-2"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

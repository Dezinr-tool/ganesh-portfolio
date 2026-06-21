"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { IaNav } from "../_components/ia-nav";

export default function IaUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setError("");
      setFileName(file.name);

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/ia/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Upload failed");
        }
        if (data.sessionId) {
          localStorage.setItem("ia-session-id", data.sessionId);
          router.push(`/wireframe/${data.sessionId}`);
          return;
        }
        throw new Error("No session returned");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setBusy(false);
      }
    },
    [router],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-text)] text-[var(--color-text)]">
      <IaNav />

      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center px-4 py-12">
        <h1 className="text-xl font-medium text-[var(--color-bg)]">Upload existing IA</h1>
        <p className="mt-2 max-w-md text-center text-sm text-[var(--color-text)]">
          Upload a PDF, DOCX, TXT, JSON, or image file. We&apos;ll extract the structure and
          jump straight to wireframes.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.json,application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="mt-8 rounded-full border border-[var(--color-bg)]/10 bg-[var(--color-bg)]/[0.05] px-6 py-3 text-sm font-medium text-[var(--color-bg)] transition hover:bg-[var(--color-bg)]/[0.08] disabled:opacity-50"
        >
          {busy ? "Processing…" : "Choose file"}
        </button>

        {fileName ? (
          <p className="mt-4 text-xs text-[var(--color-text)]">{fileName}</p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-[var(--color-accent)]">{error}</p>
        ) : null}

        <Link href="/ia" className="mt-8 text-sm text-[var(--color-text)] transition hover:text-[var(--color-text)]">
          ← Back to IA session
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";

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
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-zinc-100">
      <Link
        href="/ia"
        className="fixed left-4 top-4 z-30 text-sm text-white/80 transition hover:text-white"
      >
        ← Back to IA chat
      </Link>

      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center px-4 py-20">
        <h1 className="text-xl font-medium text-white">Upload existing IA</h1>
        <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
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
          className="mt-8 rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          {busy ? "Processing…" : "Choose file"}
        </button>

        {fileName ? (
          <p className="mt-4 text-xs text-zinc-500">{fileName}</p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

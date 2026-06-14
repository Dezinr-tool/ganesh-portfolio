"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUDIT_MODELS } from "@/lib/design-audit/models";
import { auditToMarkdown } from "@/lib/design-audit/markdown";
import type {
  AuditContext,
  AuditImage,
  AuditInputMode,
  AuditModelId,
  DesignAuditResult,
} from "@/lib/design-audit/types";
import { AuditReportView } from "./_components/audit-report";
import { readSseStream } from "@/lib/ai-sse";
import { ContextWizard, ImageDropZone } from "./_components/input-wizard";

const TABS: { id: AuditInputMode; label: string }[] = [
  { id: "figma", label: "Figma Link" },
  { id: "website", label: "Website URL" },
  { id: "screenshot", label: "Screenshot Upload" },
];

const DEFAULT_MODEL =
  AUDIT_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/25";

export default function DesignAuditPage() {
  const [inputMode, setInputMode] = useState<AuditInputMode>("website");
  const [phase, setPhase] = useState<"input" | "context" | "report">("input");
  const [modelId, setModelId] = useState<AuditModelId>(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [figmaUrl, setFigmaUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [images, setImages] = useState<AuditImage[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [context, setContext] = useState<AuditContext>({
    productDescription: "",
    targetUser: "",
    primaryGoal: "",
    specificConcerns: "",
  });
  const [eaClient, setEaClient] = useState<string | null>(null);
  const [eaSaved, setEaSaved] = useState(false);
  const [auditStatus, setAuditStatus] = useState("");
  const [result, setResult] = useState<DesignAuditResult | null>(null);
  const inputCache = useRef<Map<string, { meta: Record<string, unknown>; images: AuditImage[]; previewUrl: string | null }>>(new Map());

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/design-audit/ea-context", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.available && data.prefill) {
          setEaClient(data.clientName);
          setContext((prev) => ({
            ...prev,
            productDescription: data.prefill.productDescription || prev.productDescription,
            targetUser: data.prefill.targetUser || prev.targetUser,
            primaryGoal: data.prefill.primaryGoal || prev.primaryGoal,
            specificConcerns: data.prefill.specificConcerns || prev.specificConcerns,
            eaClientName: data.clientName,
            eaPrefillSummary: data.prefill.eaPrefillSummary,
          }));
        }
      } catch {
        // optional
      }
    })();
  }, []);

  const filePreviews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const readFilesAsImages = useCallback(async (list: File[]): Promise<AuditImage[]> => {
    const out: AuditImage[] = [];
    for (const file of list.slice(0, 5)) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const base64 = btoa(binary);
      const mediaType = file.type.startsWith("image/")
        ? (file.type as AuditImage["mediaType"])
        : "image/png";
      out.push({ base64, mediaType, label: file.name });
    }
    return out;
  }, []);

  const prepareInput = async (): Promise<boolean> => {
    setError("");
    setLoading(true);
    try {
      const cacheKey =
        inputMode === "figma"
          ? figmaUrl.trim()
          : inputMode === "website"
            ? websiteUrl.trim()
            : files.map((f) => `${f.name}:${f.size}`).join("|");

      const cached = inputCache.current.get(`${inputMode}:${cacheKey}`);
      if (cached) {
        setMetadata(cached.meta);
        setImages(cached.images);
        setPreviewUrl(cached.previewUrl);
        setPhase("context");
        return true;
      }

      let nextMeta: Record<string, unknown> = {};
      let nextImages: AuditImage[] = [];
      let nextPreview: string | null = null;

      if (inputMode === "figma") {
        if (!figmaUrl.trim()) throw new Error("Enter a Figma URL.");
        const res = await fetch("/api/design-audit/figma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: figmaUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Figma fetch failed");
        nextMeta = data.meta;
        if (data.image) {
          nextImages = [data.image];
          nextPreview = `data:${data.image.mediaType};base64,${data.image.base64}`;
        } else {
          setMessage(data.error ?? "No Figma image — upload a screenshot as backup.");
        }
      } else if (inputMode === "website") {
        if (!websiteUrl.trim()) throw new Error("Enter a website URL.");
        const res = await fetch("/api/design-audit/website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: websiteUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Website capture failed");
        nextMeta = data.meta;
        if (data.image) {
          nextImages = [data.image];
          nextPreview = `data:${data.image.mediaType};base64,${data.image.base64}`;
        } else {
          throw new Error("Could not capture screenshot. Try screenshot upload.");
        }
      } else {
        if (files.length === 0) throw new Error("Upload at least one screenshot.");
        nextImages = await readFilesAsImages(files);
        nextMeta = { fileNames: files.map((f) => f.name) };
        nextPreview = filePreviews[0] ?? null;
      }

      setMetadata(nextMeta);
      setImages(nextImages);
      setPreviewUrl(nextPreview);
      inputCache.current.set(`${inputMode}:${cacheKey}`, {
        meta: nextMeta,
        images: nextImages,
        previewUrl: nextPreview,
      });
      setPhase("context");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Input failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    if (!context.productDescription || !context.targetUser || !context.primaryGoal) {
      setError("Complete all 3 context questions.");
      return;
    }
    if (images.length === 0) {
      setError("No images available for audit. Re-check your input.");
      return;
    }

    setLoading(true);
    setError("");
    setAuditStatus("Starting audit…");
    try {
      const res = await fetch("/api/design-audit/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          inputMode,
          context,
          metadata,
          images,
          stream: true,
        }),
      });

      type AuditPayload = {
        result: DesignAuditResult;
        intelligenceSaved?: number;
        cached?: boolean;
      };

      const payload = await readSseStream<AuditPayload>(res, (event) => {
        if (event.type === "status" && event.message) {
          setAuditStatus(event.message);
        }
        if (event.type === "cached") {
          setMessage("Loaded cached audit — no AI re-run.");
        }
      });

      if (!payload?.result) throw new Error("Audit failed");
      setResult(payload.result);
      setPhase("report");
      if ((payload.intelligenceSaved ?? 0) > 0) {
        setEaSaved(true);
        setMessage(`Saved ${payload.intelligenceSaved} findings to EA intelligence.`);
      } else if (payload.cached) {
        setMessage("Loaded cached audit result.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
      setAuditStatus("");
    }
  };

  const copyMarkdown = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(
      auditToMarkdown(result, {
        product: context.productDescription,
        targetUser: context.targetUser,
      }),
    );
    setMessage("Report copied as markdown");
    setTimeout(() => setMessage(""), 2000);
  };

  const downloadPdf = async () => {
    if (!result) return;
    const res = await fetch("/api/design-audit/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result,
        product: context.productDescription,
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-audit-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              P12 · Design Intelligence
            </p>
            <Link href="/ea/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">
              ← Virtual EA
            </Link>
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Design Audit
          </h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-400">
            Brutally honest UX/UI audits across 10 dimensions — Figma, live sites, or
            screenshots.
          </p>
        </header>

        {eaClient ? (
          <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
            Audit context pre-filled from your EA session with{" "}
            <span className="font-medium text-white">{eaClient}</span>
          </div>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {message ? <p className="mb-4 text-sm text-emerald-400">{message}</p> : null}
        {loading && auditStatus ? (
          <p className="mb-4 text-sm text-zinc-400">{auditStatus}</p>
        ) : null}

        {phase !== "report" ? (
          <>
            <nav className="mb-8 flex gap-2 rounded-2xl border border-white/8 bg-[#12121a] p-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setInputMode(tab.id);
                    setPhase("input");
                  }}
                  className={`flex-1 rounded-xl px-2 py-3 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                    inputMode === tab.id
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {phase === "input" ? (
              <div className="space-y-6 rounded-2xl border border-white/8 bg-[#12121a]/80 p-6">
                {inputMode === "figma" ? (
                  <div>
                    <label className="mb-2 block text-xs text-zinc-400">Figma frame URL</label>
                    <input
                      type="url"
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      placeholder="https://www.figma.com/design/...?node-id=..."
                      className={inputClass}
                    />
                  </div>
                ) : null}

                {inputMode === "website" ? (
                  <div>
                    <label className="mb-2 block text-xs text-zinc-400">Website URL</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className={inputClass}
                    />
                  </div>
                ) : null}

                {inputMode === "screenshot" ? (
                  <ImageDropZone files={files} onChange={setFiles} max={5} />
                ) : null}

                <button
                  type="button"
                  onClick={prepareInput}
                  disabled={loading}
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {loading ? "Processing…" : "Continue to context →"}
                </button>
              </div>
            ) : null}

            {phase === "context" ? (
              <div className="space-y-6">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 rounded-xl border border-white/10 object-contain"
                  />
                ) : null}

                <div className="space-y-4 rounded-2xl border border-white/8 bg-[#12121a]/80 p-6">
                  <h2 className="text-lg font-medium text-white">Audit context</h2>

                  <ContextWizard
                    context={context}
                    onChange={(patch) => setContext({ ...context, ...patch })}
                    onComplete={runAudit}
                    loading={loading}
                  />

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                      AI model
                    </label>
                    <select
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value as AuditModelId)}
                      className={inputClass}
                    >
                      {AUDIT_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                          {m.recommended ? " ← default" : ""}
                          {" · ~"}
                          {m.estimatedSeconds}s
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Estimated audit time: ~
                      {AUDIT_MODELS.find((m) => m.id === modelId)?.estimatedSeconds ?? 50}{" "}
                      seconds
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhase("input")}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    ← Back to input
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {phase === "report" && result ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setPhase("input");
                setResult(null);
              }}
              className="text-xs text-zinc-500 hover:text-white"
            >
              ← New audit
            </button>
            <AuditReportView
              result={result}
              previewUrl={previewUrl}
              onCopyMarkdown={copyMarkdown}
              onDownloadPdf={downloadPdf}
              eaSaved={eaSaved}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

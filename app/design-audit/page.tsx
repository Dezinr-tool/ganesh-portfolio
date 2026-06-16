"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DesignAuditNav } from "./_components/design-audit-nav";
import {
  EA_BTN_PRIMARY,
  EA_CARD_PADDED,
  EA_INPUT,
  EA_TAB_ACTIVE,
  EA_TAB_INACTIVE,
} from "@/app/ea/_components/ea-ui";
import { AUDIT_MODELS, isValidAuditModelId } from "@/lib/design-audit/models";
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
import { AuditModelConfirmLine } from "./_components/audit-model-selector";
import { PreConfirmationPanel } from "@/app/_components/pre-confirmation-panel";
import type { PreConfirmation, UserPreConfirmation } from "@/lib/pre-generation-types";
import { readStoredValue } from "@/lib/client-storage";

const TABS: { id: AuditInputMode; label: string }[] = [
  { id: "figma", label: "Figma Link" },
  { id: "website", label: "Website URL" },
  { id: "screenshot", label: "Screenshot Upload" },
];

const DEFAULT_MODEL =
  AUDIT_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

const MODEL_STORAGE_KEY = "design-audit-model-id";

const inputClass = EA_INPUT;

export default function DesignAuditPage() {
  const [inputMode, setInputMode] = useState<AuditInputMode>("website");
  const [phase, setPhase] = useState<"input" | "context" | "confirm" | "report">("input");
  const [modelId, setModelId] = useState<AuditModelId>(() =>
    readStoredValue(MODEL_STORAGE_KEY, isValidAuditModelId, DEFAULT_MODEL),
  );
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
  const [preConfirmation, setPreConfirmation] = useState<PreConfirmation | null>(null);
  const [loadingPreConfirm, setLoadingPreConfirm] = useState(false);
  const inputCache = useRef<Map<string, { meta: Record<string, unknown>; images: AuditImage[]; previewUrl: string | null }>>(new Map());

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

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

  const runAudit = async (confirmations?: UserPreConfirmation) => {
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
          preConfirmation: confirmations,
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

  const requestPreConfirmation = async () => {
    if (!context.productDescription || !context.targetUser || !context.primaryGoal) {
      setError("Complete all 3 context questions.");
      return;
    }
    if (images.length === 0) {
      setError("No images available for audit. Re-check your input.");
      return;
    }

    setLoadingPreConfirm(true);
    setError("");
    try {
      const sessionAnswers = {
        q1: context.eaClientName ?? eaClient ?? "",
        q3: context.productDescription,
        q7: context.targetUser,
        q18: context.specificConcerns ?? "",
        primaryGoal: context.primaryGoal,
      };

      const res = await fetch("/api/pre-generation/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "design_audit",
          sessionAnswers,
          context,
          inputType: inputMode,
          clientName: context.eaClientName ?? eaClient ?? undefined,
        }),
      });
      const data = await res.json();
      const pre = data.preConfirmation as PreConfirmation;
      if (!pre || pre.skip_confirmation) {
        await runAudit();
        return;
      }
      setPreConfirmation(pre);
      setPhase("confirm");
    } catch {
      await runAudit();
    } finally {
      setLoadingPreConfirm(false);
    }
  };

  const handlePreConfirm = async (selections: UserPreConfirmation) => {
    setMessage("Got it. Running audit with your preferences…");
    await runAudit(selections);
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
    <div className="min-h-screen bg-black text-zinc-100">
      <DesignAuditNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white">Design Audit</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Brutally honest UX/UI audits across 10 dimensions — Figma, live sites, or screenshots.
          </p>
        </div>
        {eaClient ? (
          <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-300">
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
        {loadingPreConfirm ? (
          <p className="mb-4 text-sm text-zinc-400">Analyzing context and preparing approach…</p>
        ) : null}

        {phase !== "report" ? (
          <>
            <nav className="mb-8 flex flex-wrap gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setInputMode(tab.id);
                    setPhase("input");
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    inputMode === tab.id ? EA_TAB_ACTIVE : EA_TAB_INACTIVE
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {phase === "input" ? (
              <div className={`space-y-6 ${EA_CARD_PADDED}`}>
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
                  className={EA_BTN_PRIMARY}
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
                    className="max-h-64 rounded-lg border border-zinc-800 object-contain"
                  />
                ) : null}

                <div className={`space-y-4 ${EA_CARD_PADDED}`}>
                  <h2 className="text-sm font-medium text-zinc-300">Audit context</h2>

                  <ContextWizard
                    context={context}
                    onChange={(patch) => setContext({ ...context, ...patch })}
                    onComplete={requestPreConfirmation}
                    loading={loading || loadingPreConfirm}
                    modelId={modelId}
                    onModelChange={setModelId}
                  />

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

            {phase === "confirm" && preConfirmation ? (
              <div className="space-y-6">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 rounded-lg border border-zinc-800 object-contain opacity-60"
                  />
                ) : null}
                <div className={`${EA_CARD_PADDED}`}>
                  <AuditModelConfirmLine
                    modelId={modelId}
                    onModelChange={setModelId}
                    disabled={loading}
                  />
                  <p className="mb-4 text-sm text-zinc-400">
                    Before I generate, let me share what I&apos;m planning to use and check a few
                    things with you.
                  </p>
                  <PreConfirmationPanel
                    preConfirmation={preConfirmation}
                    onConfirm={handlePreConfirm}
                    loading={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setPhase("context")}
                    className="mt-4 text-xs text-zinc-500 hover:text-white"
                  >
                    ← Back to context
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
      </main>
    </div>
  );
}

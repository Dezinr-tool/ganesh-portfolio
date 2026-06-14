"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { randomUUID } from "@/lib/moodboard/uuid";
import { readSseStream } from "@/lib/ai-sse";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import {
  directionToText,
  saveMoodboardHistory,
} from "@/lib/moodboard/history";
import type {
  MoodboardBrief,
  MoodboardDirection,
  MoodboardModelId,
  MoodboardTab,
  WebsiteAnalysis,
} from "@/lib/moodboard/types";
import {
  DirectionCard,
  DirectionDetailModal,
  ExportPanel,
} from "./_components/direction-cards";
import { Field, ModelSelect } from "./_components/form-fields";
import {
  GENERATION_STATUS,
  ProgressStepper,
  SCRAPE_STATUS,
} from "./_components/progress-stepper";

const TABS: { id: MoodboardTab; label: string }[] = [
  { id: "logo", label: "Logo" },
  { id: "website", label: "Website / Personality" },
  { id: "campaign", label: "Campaign" },
];

const DEFAULT_MODEL: MoodboardModelId =
  MOODBOARD_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

export default function MoodboardPage() {
  const [tab, setTab] = useState<MoodboardTab>("website");
  const [phase, setPhase] = useState<"intake" | "results">("intake");
  const [modelId, setModelId] = useState<MoodboardModelId>(DEFAULT_MODEL);
  const [brief, setBrief] = useState<MoodboardBrief>({ tab: "website" });
  const [directions, setDirections] = useState<MoodboardDirection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingQuestionnaire, setParsingQuestionnaire] = useState(false);
  const [error, setError] = useState("");
  const [eaClient, setEaClient] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [questionnaire, setQuestionnaire] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [genStatusIdx, setGenStatusIdx] = useState(0);
  const [scrapeStatusIdx, setScrapeStatusIdx] = useState(0);
  const [websiteStep, setWebsiteStep] = useState(0);
  const scrapeCache = useRef<Map<string, WebsiteAnalysis>>(new Map());

  const updateBrief = useCallback((patch: Partial<MoodboardBrief>) => {
    setBrief((prev) => ({ ...prev, ...patch }));
  }, []);

  const referencePreviews = useMemo(
    () => referenceFiles.map((f) => URL.createObjectURL(f)),
    [referenceFiles],
  );

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setGenStatusIdx((i) => (i + 1) % GENERATION_STATUS.length);
    }, 2200);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!scraping) return;
    const id = setInterval(() => {
      setScrapeStatusIdx((i) => (i + 1) % SCRAPE_STATUS.length);
    }, 1800);
    return () => clearInterval(id);
  }, [scraping]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/moodboard/ea-context", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.available && data.prefill) {
          setEaClient(data.clientName);
          updateBrief({
            industry: data.prefill.industry ?? "",
            audience: data.prefill.audience ?? "",
            feeling: data.prefill.feeling ?? "",
            admiredBrands: data.prefill.admiredBrands ?? "",
            brandName: data.prefill.brandName ?? "",
            eaClientName: data.clientName,
            eaPrefillSummary: data.prefill.eaPrefillSummary ?? "",
          });
        }
      } catch {
        // EA context optional
      }
    })();
  }, [updateBrief]);

  const handleTabChange = (next: MoodboardTab) => {
    setTab(next);
    setPhase("intake");
    setDirections([]);
    setSelectedId(null);
    setError("");
    updateBrief({ tab: next });
  };

  const scrapeUrl = async () => {
    if (!websiteUrl.trim()) return;
    const normalized = websiteUrl.trim();
    const cached = scrapeCache.current.get(normalized);
    if (cached) {
      updateBrief({
        websiteUrl: cached.url,
        websiteAnalysis: cached,
        industry: brief.industry || cached.title,
        feeling: brief.feeling || cached.personality,
      });
      return;
    }

    setScraping(true);
    setError("");
    try {
      const res = await fetch("/api/moodboard/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      const analysis = data.analysis as WebsiteAnalysis;
      scrapeCache.current.set(normalized, analysis);
      updateBrief({
        websiteUrl: analysis.url,
        websiteAnalysis: analysis,
        industry: brief.industry || analysis.title,
        feeling: brief.feeling || analysis.personality,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const parseQuestionnaire = async () => {
    if (!questionnaire.trim()) return;
    setParsingQuestionnaire(true);
    try {
      const res = await fetch("/api/moodboard/parse-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: questionnaire }),
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        updateBrief({
          questionnaireText: questionnaire,
          industry: data.parsed.industry ?? brief.industry,
          audience: data.parsed.audience ?? brief.audience,
          feeling: data.parsed.feeling ?? brief.feeling,
          colorDirection: data.parsed.colorDirection ?? brief.colorDirection,
          admiredBrands: data.parsed.admiredBrands ?? brief.admiredBrands,
          brandName: data.parsed.brandName ?? brief.brandName,
        });
      }
    } catch {
      updateBrief({ questionnaireText: questionnaire });
    } finally {
      setParsingQuestionnaire(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const payload: MoodboardBrief = {
        ...brief,
        tab,
        hasWebsite: hasWebsite ?? undefined,
        websiteUrl,
        referenceImageCount: referenceFiles.length,
        referenceNotes:
          referenceFiles.length > 0
            ? referenceFiles.map((f) => f.name).join(", ")
            : brief.referenceNotes,
      };

      const res = await fetch("/api/moodboard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, modelId, brief: payload, stream: true }),
      });

      const payloadResult = await readSseStream<{ directions: MoodboardDirection[] }>(
        res,
        () => {
          setGenStatusIdx((i) => (i + 1) % GENERATION_STATUS.length);
        },
      );

      const directions = payloadResult?.directions;
      if (!directions || directions.length !== 3) {
        throw new Error("Expected exactly 3 directions");
      }
      setDirections(directions);
      setPhase("results");
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const refineDirection = async () => {
    if (!refineId || !refineNote.trim()) return;
    const direction = directions.find((d) => d.id === refineId);
    if (!direction) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/moodboard/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab,
          modelId,
          brief,
          direction,
          refineNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refine failed");
      setDirections((prev) =>
        prev.map((d) => (d.id === refineId ? data.direction : d)),
      );
      setRefineId(null);
      setRefineNote("");
      const before = direction;
      const after = data.direction as MoodboardDirection;
      const changes: string[] = [];
      if (before.name !== after.name) changes.push(`Name: "${before.name}" → "${after.name}"`);
      if (before.concept !== after.concept) changes.push("Concept updated");
      if (before.typography.heading !== after.typography.heading) {
        changes.push(`Heading font: ${before.typography.heading} → ${after.typography.heading}`);
      }
      if (before.mood.join(",") !== after.mood.join(",")) {
        changes.push(`Mood: ${before.mood.join(", ")} → ${after.mood.join(", ")}`);
      }
      setCopyMessage(
        changes.length
          ? `Refined: ${changes.join(" · ")}`
          : "Direction refined with your feedback.",
      );
      setTimeout(() => setCopyMessage(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refine failed");
    } finally {
      setLoading(false);
    }
  };

  const rejectDirection = (id: string) => {
    setDirections((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const copyDirection = async (direction: MoodboardDirection) => {
    await navigator.clipboard.writeText(directionToText(direction));
    setCopyMessage("Copied to clipboard");
    setTimeout(() => setCopyMessage(""), 2000);
  };

  const downloadPdf = async (direction: MoodboardDirection) => {
    const res = await fetch("/api/moodboard/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, tab }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${direction.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveHistory = (direction: MoodboardDirection) => {
    saveMoodboardHistory({
      id: randomUUID(),
      tab,
      createdAt: new Date().toISOString(),
      chosenDirectionId: direction.id,
      directions,
      brief,
    });
    setCopyMessage("Saved to history");
    setTimeout(() => setCopyMessage(""), 2000);
  };

  const expanded = directions.find((d) => d.id === expandedId);
  const selected = directions.find((d) => d.id === selectedId);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              P11 · Creative Intelligence
            </p>
            <Link
              href="/ea/dashboard"
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              ← Virtual EA
            </Link>
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Moodboard Platform
          </h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-400">
            Generate three editorial visual directions — logo, website personality,
            or campaign — with strategic intent, not templates.
          </p>
        </header>

        {eaClient ? (
          <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
            Pre-filled from your EA session with{" "}
            <span className="font-medium text-white">{eaClient}</span>
          </div>
        ) : null}

        <nav className="mb-8 flex gap-2 rounded-2xl border border-white/8 bg-[#12121a] p-1.5 transition-all">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 rounded-xl px-3 py-3 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                tab === t.id
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {copyMessage ? (
          <p className="mb-4 text-sm text-emerald-400">{copyMessage}</p>
        ) : null}

        {phase === "intake" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
            <ProgressStepper
              steps={3}
              current={tab === "website" ? websiteStep : tab === "logo" ? 1 : 2}
              labels={["Brief", "Model", "Generate"]}
            />
            <ModelSelect value={modelId} onChange={setModelId} />

            {tab === "website" ? (
              <WebsiteIntake
                hasWebsite={hasWebsite}
                setHasWebsite={setHasWebsite}
                websiteUrl={websiteUrl}
                setWebsiteUrl={setWebsiteUrl}
                scraping={scraping}
                onScrape={scrapeUrl}
                analysis={brief.websiteAnalysis}
                brief={brief}
                updateBrief={updateBrief}
                questionnaire={questionnaire}
                setQuestionnaire={setQuestionnaire}
                onParseQuestionnaire={parseQuestionnaire}
                parsingQuestionnaire={parsingQuestionnaire}
                setReferenceFiles={setReferenceFiles}
                referencePreviews={referencePreviews}
                websiteStep={websiteStep}
                setWebsiteStep={setWebsiteStep}
                scrapeStatusIdx={scrapeStatusIdx}
              />
            ) : null}

            {tab === "logo" ? (
              <LogoIntake brief={brief} updateBrief={updateBrief} />
            ) : null}

            {tab === "campaign" ? (
              <CampaignIntake brief={brief} updateBrief={updateBrief} />
            ) : null}

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="w-full rounded-xl bg-white py-4 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {loading ? "Generating 3 directions…" : "Generate 3 directions"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                {directions.length} direction{directions.length === 1 ? "" : "s"}{" "}
                · Model: {MOODBOARD_MODELS.find((m) => m.id === modelId)?.label}
              </p>
              <button
                type="button"
                onClick={() => setPhase("intake")}
                className="text-xs text-zinc-500 hover:text-white"
              >
                ← Edit brief
              </button>
            </div>

            {selected ? (
              <ExportPanel
                direction={selected}
                onCopy={() => copyDirection(selected)}
                onDownloadPdf={() => downloadPdf(selected)}
                onSaveHistory={() => saveHistory(selected)}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {directions.map((direction) => (
                <DirectionCard
                  key={direction.id}
                  direction={direction}
                  chosen={selectedId === direction.id}
                  onSelect={() => setSelectedId(direction.id)}
                  onRefine={() => {
                    setRefineId(direction.id);
                    setRefineNote("");
                  }}
                  onReject={() => rejectDirection(direction.id)}
                  onExpand={() => setExpandedId(direction.id)}
                />
              ))}
            </div>
          </div>
        )}

        {refineId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6">
              <h3 className="text-lg font-medium text-white">Refine direction</h3>
              <p className="mt-1 text-sm text-zinc-500">
                What should change? We&apos;ll regenerate this direction only.
              </p>
              <textarea
                value={refineNote}
                onChange={(e) => setRefineNote(e.target.value)}
                rows={4}
                placeholder="Make it warmer, less corporate, bolder typography…"
                className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/25"
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRefineId(null)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={refineDirection}
                  disabled={loading || !refineNote.trim()}
                  className="flex-1 rounded-lg bg-white py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  {loading ? "Refining…" : "Regenerate"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {expanded ? (
          <DirectionDetailModal
            direction={expanded}
            onClose={() => setExpandedId(null)}
          />
        ) : null}

        {loading && phase === "intake" ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="rounded-2xl border border-white/10 bg-[#12121a] px-8 py-6 text-center">
              <p className="text-sm text-white">{GENERATION_STATUS[genStatusIdx]}</p>
              <p className="mt-2 text-xs text-zinc-500">Generating 3 directions…</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WebsiteIntake({
  hasWebsite,
  setHasWebsite,
  websiteUrl,
  setWebsiteUrl,
  scraping,
  onScrape,
  analysis,
  brief,
  updateBrief,
  questionnaire,
  setQuestionnaire,
  onParseQuestionnaire,
  parsingQuestionnaire,
  setReferenceFiles,
  referencePreviews,
  websiteStep,
  setWebsiteStep,
  scrapeStatusIdx,
}: {
  hasWebsite: boolean | null;
  setHasWebsite: (v: boolean | null) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  scraping: boolean;
  onScrape: () => void;
  analysis?: WebsiteAnalysis;
  brief: MoodboardBrief;
  updateBrief: (p: Partial<MoodboardBrief>) => void;
  questionnaire: string;
  setQuestionnaire: (v: string) => void;
  onParseQuestionnaire: () => void;
  parsingQuestionnaire: boolean;
  setReferenceFiles: (f: File[]) => void;
  referencePreviews: string[];
  websiteStep: number;
  setWebsiteStep: (n: number) => void;
  scrapeStatusIdx: number;
}) {
  const SCRATCH_FIELDS = [
    {
      key: "industry" as const,
      label: "What is this brand/product?",
      placeholder: "Premium DTC skincare, B2B fintech…",
    },
    {
      key: "audience" as const,
      label: "Who is the target audience?",
      placeholder: "Urban professionals 28–40, design-conscious…",
    },
    {
      key: "feeling" as const,
      label: "Three words that describe how it should feel?",
      placeholder: "Confident, warm, precise",
    },
    {
      key: "colorDirection" as const,
      label: "Color direction?",
      placeholder: "warm / cool / neutral / bold / open",
    },
    {
      key: "admiredBrands" as const,
      label: "Brands or websites whose vibe you admire?",
      placeholder: "Aesop, Linear, Stripe…",
    },
  ];

  const scratchField = SCRATCH_FIELDS[websiteStep];

  return (
    <div className="space-y-6 rounded-2xl border border-white/8 bg-[#12121a]/80 p-6">
      <h2 className="text-lg font-medium text-white">Website / Personality brief</h2>

      <div>
        <p className="mb-3 text-sm text-zinc-400">Do you have an existing website?</p>
        <div className="flex gap-2">
          {[
            { val: true, label: "We have a website" },
            { val: false, label: "Starting from scratch" },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setHasWebsite(val)}
              className={`rounded-lg px-4 py-2 text-sm ${
                hasWebsite === val
                  ? "bg-white text-black"
                  : "border border-white/10 text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasWebsite ? (
        <div className="space-y-3">
          <Field
            label="Website URL"
            value={websiteUrl}
            onChange={setWebsiteUrl}
            placeholder="https://example.com"
          />
          <button
            type="button"
            onClick={onScrape}
            disabled={scraping || !websiteUrl.trim()}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-50"
          >
            {scraping ? "Analyzing your website…" : "Analyze website"}
          </button>
          {scraping ? (
            <p className="text-xs text-zinc-500">{SCRAPE_STATUS[scrapeStatusIdx]}</p>
          ) : null}
          {analysis ? (
            <div className="rounded-xl border border-white/8 bg-black/40 p-4 text-sm text-zinc-300">
              <p className="font-medium text-white">{analysis.title}</p>
              <p className="mt-2">{analysis.personality}</p>
              <p className="mt-1 text-zinc-500">Tone: {analysis.tone}</p>
              {analysis.fallback ? (
                <p className="mt-2 text-amber-400/80">
                  Scrape limited — complete quick questions below.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasWebsite === false && scratchField ? (
        <div>
          <div className="mb-4 flex gap-1.5">
            {SCRATCH_FIELDS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= websiteStep ? "bg-white" : "bg-white/10"}`}
              />
            ))}
          </div>
          <Field
            label={`${websiteStep + 1}. ${scratchField.label}`}
            value={brief[scratchField.key] ?? ""}
            onChange={(v) => updateBrief({ [scratchField.key]: v })}
            placeholder={scratchField.placeholder}
          />
          <div className="mt-3 flex gap-2">
            {websiteStep > 0 ? (
              <button
                type="button"
                onClick={() => setWebsiteStep(websiteStep - 1)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300"
              >
                ← Back
              </button>
            ) : null}
            {websiteStep < SCRATCH_FIELDS.length - 1 ? (
              <button
                type="button"
                disabled={!(brief[scratchField.key] ?? "").trim()}
                onClick={() => setWebsiteStep(websiteStep + 1)}
                className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
              >
                Continue →
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {(hasWebsite === true && analysis) || (hasWebsite === false && websiteStep >= SCRATCH_FIELDS.length - 1 && (brief.industry || brief.audience)) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry / sector" value={brief.industry ?? ""} onChange={(v) => updateBrief({ industry: v })} />
          <Field label="Target audience" value={brief.audience ?? ""} onChange={(v) => updateBrief({ audience: v })} />
          <Field label="Brand feeling" value={brief.feeling ?? ""} onChange={(v) => updateBrief({ feeling: v })} placeholder="Bold, warm, precise" />
          <Field label="Color direction" value={brief.colorDirection ?? ""} onChange={(v) => updateBrief({ colorDirection: v })} placeholder="warm / cool / neutral" />
          <Field label="Brands you admire" value={brief.admiredBrands ?? ""} onChange={(v) => updateBrief({ admiredBrands: v })} optional />
        </div>
      ) : null}

      <div>
        <Field
          label="Have a questionnaire? Paste it here"
          value={questionnaire}
          onChange={setQuestionnaire}
          textarea
          optional
          placeholder="Paste client questionnaire or brand brief…"
        />
        {questionnaire.trim() ? (
          <button
            type="button"
            onClick={onParseQuestionnaire}
            disabled={parsingQuestionnaire}
            className="mt-2 text-xs text-zinc-400 underline hover:text-white disabled:opacity-50"
          >
            {parsingQuestionnaire ? "Extracting…" : "Extract brand signals"}
          </button>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-xs text-zinc-400">
          Upload logos or websites that inspire you (up to 5)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            setReferenceFiles(Array.from(e.target.files ?? []).slice(0, 5))
          }
          className="text-xs text-zinc-400"
        />
        {referencePreviews.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {referencePreviews.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`Reference ${i + 1}`}
                className="h-16 w-full rounded-lg border border-white/10 object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LogoIntake({
  brief,
  updateBrief,
}: {
  brief: MoodboardBrief;
  updateBrief: (p: Partial<MoodboardBrief>) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-[#12121a]/80 p-6">
      <h2 className="text-lg font-medium text-white">Logo moodboard brief</h2>
      <Field
        label="Brand name"
        value={brief.brandName ?? ""}
        onChange={(v) => updateBrief({ brandName: v })}
      />
      <Field
        label="Industry"
        value={brief.industry ?? ""}
        onChange={(v) => updateBrief({ industry: v })}
      />
      <Field
        label="Brand values (3 words)"
        value={brief.values ?? ""}
        onChange={(v) => updateBrief({ values: v })}
        placeholder="Trust, craft, momentum"
      />
      <Field
        label="Style preference"
        value={brief.stylePreference ?? ""}
        onChange={(v) => updateBrief({ stylePreference: v })}
        placeholder="Wordmark, Lettermark, Symbol, Combination"
      />
      <div className="flex flex-wrap gap-2">
        {["Wordmark", "Lettermark", "Symbol", "Combination"].map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => updateBrief({ stylePreference: style })}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              brief.stylePreference === style
                ? "bg-white text-black"
                : "border border-white/10 text-zinc-400"
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}

function CampaignIntake({
  brief,
  updateBrief,
}: {
  brief: MoodboardBrief;
  updateBrief: (p: Partial<MoodboardBrief>) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-[#12121a]/80 p-6">
      <h2 className="text-lg font-medium text-white">Campaign visual brief</h2>
      <Field
        label="Campaign goal"
        value={brief.campaignGoal ?? ""}
        onChange={(v) => updateBrief({ campaignGoal: v })}
        placeholder="Launch, awareness, conversion…"
      />
      <Field
        label="Target audience"
        value={brief.audience ?? ""}
        onChange={(v) => updateBrief({ audience: v })}
      />
      <Field
        label="Platform"
        value={brief.platform ?? ""}
        onChange={(v) => updateBrief({ platform: v })}
        placeholder="social / print / web / OOH / all"
      />
      <Field
        label="Campaign feeling (3 words)"
        value={brief.campaignFeeling ?? ""}
        onChange={(v) => updateBrief({ campaignFeeling: v })}
        placeholder="Bold, urgent, human"
      />
    </div>
  );
}

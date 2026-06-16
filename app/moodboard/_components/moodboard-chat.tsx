"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EANav } from "@/app/ea/_components/ea-nav";
import { readSseStream } from "@/lib/ai-sse";
import {
  CAMPAIGN_GOAL_CHIPS,
  CAMPAIGN_PLATFORM_CHIPS,
  COLOR_CHIPS,
  FEEL_CHIPS,
  GENERATION_STATUS,
  LOGO_MARK_CHIPS,
  LOGO_STYLE_CHIPS,
  type MoodboardChatMessage,
} from "@/lib/moodboard/chat-types";
import {
  directionToText,
  saveMoodboardHistory,
} from "@/lib/moodboard/history";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type {
  MoodboardBrief,
  MoodboardDirection,
  MoodboardModelId,
  MoodboardTab,
  WebsiteAnalysis,
} from "@/lib/moodboard/types";
import { randomUUID } from "@/lib/moodboard/uuid";
import {
  ChatBubble,
  ChatWidgetView,
  DirectionDetailModal,
  ExportPanel,
} from "./chat-widgets";

const MODEL_STORAGE_KEY = "moodboard-model-id";
const DEFAULT_MODEL: MoodboardModelId =
  MOODBOARD_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

function shortModelLabel(id: MoodboardModelId): string {
  const map: Record<MoodboardModelId, string> = {
    "claude-haiku": "Haiku",
    "claude-sonnet": "Sonnet",
    "claude-nano": "Nano",
    "gpt-4o": "GPT-4o",
    "gemini-pro": "Gemini",
  };
  return map[id];
}

function uid() {
  return randomUUID();
}

function inactiveMessages(msgs: MoodboardChatMessage[]) {
  return msgs.map((m) => ({ ...m, inactive: true }));
}

export function MoodboardChat() {
  const [messages, setMessages] = useState<MoodboardChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [modelId, setModelId] = useState<MoodboardModelId>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL;
    const stored = localStorage.getItem(MODEL_STORAGE_KEY) as MoodboardModelId | null;
    if (stored && MOODBOARD_MODELS.some((m) => m.id === stored)) return stored;
    return DEFAULT_MODEL;
  });
  const [brief, setBrief] = useState<MoodboardBrief>({ tab: "website" });
  const [step, setStep] = useState("entry");
  const [flow, setFlow] = useState<MoodboardTab | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [directions, setDirections] = useState<MoodboardDirection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refineId, setRefineId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [multiChips, setMultiChips] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<Record<string, string> | null>(
    null,
  );
  const [resumeAfterConfirm, setResumeAfterConfirm] = useState<string | null>(null);
  const [genStatusIdx, setGenStatusIdx] = useState(0);
  const [eaClient, setEaClient] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef(brief);

  useEffect(() => {
    briefRef.current = brief;
  }, [brief]);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => {
      setGenStatusIdx((i) => (i + 1) % GENERATION_STATUS.length);
    }, 2200);
    return () => clearInterval(id);
  }, [busy]);

  const appendAssistant = useCallback(
    (content: string, widget?: MoodboardChatMessage["widget"]) => {
      setMessages((prev) => [
        ...inactiveMessages(prev),
        { id: uid(), role: "assistant", content, widget },
      ]);
    },
    [],
  );

  const appendUser = useCallback((content: string) => {
    setMessages((prev) => [
      ...inactiveMessages(prev),
      { id: uid(), role: "user", content },
    ]);
  }, []);

  const updateBrief = useCallback((patch: Partial<MoodboardBrief>) => {
    setBrief((prev) => ({ ...prev, ...patch }));
  }, []);

  const mergeReferenceFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    setReferenceFiles((prev) => {
      const next = [...prev, ...files].slice(0, 5);
      updateBrief({ referenceImageCount: next.length });
      return next;
    });
  }, [updateBrief]);

  const startEntry = useCallback(() => {
    appendAssistant(
      "Hey! What are we creating a moodboard for today?",
      {
        type: "chips",
        options: [
          { id: "website", label: "🌐 Website" },
          { id: "logo", label: "🎨 Brand / Logo" },
          { id: "campaign", label: "📣 Campaign" },
        ],
      },
    );
    setStep("entry");
  }, [appendAssistant]);

  useEffect(() => {
    const timer = window.setTimeout(() => startEntry(), 0);
    return () => window.clearTimeout(timer);
  }, [startEntry]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
      try {
        const res = await fetch("/api/moodboard/ea-context", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
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
          appendAssistant(
            `I pulled context from your EA session${data.clientName ? ` with ${data.clientName}` : ""}. You can still walk me through the brief — I'll use that as a starting point.`,
          );
        }
      } catch {
        // optional
      }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askWebsiteMode = useCallback(() => {
    appendAssistant("Great. Is this a redesign or are we starting from scratch?", {
      type: "chips",
      options: [
        { id: "redesign", label: "🔄 Redesign" },
        { id: "scratch", label: "✨ From Scratch" },
      ],
    });
    setStep("website_mode");
  }, [appendAssistant]);

  const askRedesignUrl = useCallback(() => {
    appendAssistant("Share the existing website link.");
    appendAssistant("", { type: "url", placeholder: "https://example.com" });
    setStep("redesign_url");
  }, [appendAssistant]);

  const scrapeWebsite = useCallback(
    async (url: string) => {
      appendUser(url);
      appendAssistant(`Analyzing ${url}...`, {
        type: "loader",
        message: `Analyzing ${url}...`,
      });
      setBusy(true);
      try {
        const res = await fetch("/api/moodboard/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        const analysis = data.analysis as WebsiteAnalysis | undefined;
        updateBrief({ websiteUrl: url, websiteAnalysis: analysis });

        if (analysis && !analysis.fallback) {
          const brandName = analysis.title.split(/[|\-–]/)[0]?.trim() || analysis.title;
          updateBrief({ brandName, industry: analysis.personality });
          appendAssistant(
            `Found ${brandName}. Looks like a ${analysis.personality || "brand"} brand.\n\nBefore I dig deeper — what's not working? What made you decide it needs a refresh?`,
            {
              type: "rich",
              placeholder: "Describe what's broken, stale, or misaligned…",
              allowQuestionnaire: true,
              multiline: true,
            },
          );
          setStep("redesign_problem");
        } else {
          appendAssistant(
            "Couldn't fetch the site — could be behind auth.\n\nTell me about the brand: what do they do and who are they trying to reach?",
            {
              type: "rich",
              placeholder: "Brand description and target audience…",
              allowQuestionnaire: true,
              multiline: true,
            },
          );
          setStep("redesign_fallback");
        }
      } catch {
        appendAssistant(
          "Couldn't fetch the site — could be behind auth.\n\nTell me about the brand: what do they do and who are they trying to reach?",
          {
            type: "rich",
            placeholder: "Brand description and target audience…",
            allowQuestionnaire: true,
            multiline: true,
          },
        );
        setStep("redesign_fallback");
      } finally {
        setBusy(false);
      }
    },
    [appendAssistant, appendUser, updateBrief],
  );

  const askMoreBeforeGenerate = useCallback(() => {
    appendAssistant("Got it. A few more things before I generate directions...");
    appendAssistant("What industry or category is this brand in?", {
      type: "text",
      placeholder: "e.g. DTC skincare, B2B fintech",
    });
    setStep("q_industry");
  }, [appendAssistant]);

  const questionChain = useCallback(
    (startStep: string) => {
      const chain: Record<string, { next: string; ask: () => void }> = {
        q_industry: {
          next: "q_audience",
          ask: () =>
            appendAssistant(
              "Who is the target audience? Be specific — age, lifestyle, mindset.",
              { type: "text", placeholder: "Urban professionals 28–40…" },
            ),
        },
        q_audience: {
          next: "q_feeling",
          ask: () =>
            appendAssistant("How should the new brand feel? Give me 3 words.", {
              type: "text",
              placeholder: "Confident, warm, precise",
            }),
        },
        q_feeling: {
          next: "q_references",
          ask: () =>
            appendAssistant(
              "Any visual references — brands, websites, or aesthetics you're drawn to? You can upload images or just describe them.",
              {
                type: "rich",
                placeholder: "Aesop, Linear, editorial photography…",
                allowImages: true,
                maxImages: 5,
                skippable: true,
              },
            ),
        },
        q_references: {
          next: "q_constraints",
          ask: () =>
            appendAssistant(
              "Anything else I should know? Constraints, mandatories, things to avoid?",
              {
                type: "rich",
                placeholder: "No gradients, must work in dark mode…",
                skippable: true,
              },
            ),
        },
      };

      const current = chain[startStep];
      if (current) {
        setStep(current.next);
        current.ask();
      }
    },
    [appendAssistant],
  );

  const askBrandName = useCallback(
    (nextFlow: MoodboardTab, fromWebsiteScratch = false) => {
      updateBrief({
        tab: nextFlow,
        hasWebsite: fromWebsiteScratch ? false : briefRef.current.hasWebsite,
      });
      appendAssistant("What's the brand name?", {
        type: "text",
        placeholder: "Brand name",
      });
      setStep(`${nextFlow}_brand`);
    },
    [appendAssistant, updateBrief],
  );

  const researchBrand = useCallback(
    async (brandName: string, nextStep: string) => {
      appendUser(brandName);
      updateBrief({ brandName });
      appendAssistant(`Researching ${brandName}...`, {
        type: "loader",
        message: `Researching ${brandName}...`,
      });
      setBusy(true);
      try {
        const res = await fetch("/api/moodboard/research-brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandName }),
        });
        const data = await res.json();
        if (data.found && data.analysis) {
          updateBrief({
            industry: data.analysis.personality,
            websiteAnalysis: data.analysis,
            websiteUrl: data.url,
          });
          appendAssistant(
            `I found ${data.analysis.title} at ${data.url}. ${data.analysis.description || data.analysis.personality}\n\nDoes this look right? Tell me about the business — what do they do and what industry are they in?`,
            {
              type: "rich",
              placeholder: "Business description and industry…",
              allowQuestionnaire: true,
              multiline: true,
            },
          );
        } else {
          appendAssistant(
            "Tell me about the business — what do they do and what industry are they in?",
            {
              type: "rich",
              placeholder: "Business description and industry…",
              allowQuestionnaire: true,
              multiline: true,
            },
          );
        }
        setStep(nextStep);
      } finally {
        setBusy(false);
      }
    },
    [appendAssistant, appendUser, updateBrief],
  );

  const scratchQuestionChain = useCallback(
    (start: string) => {
      const chain: Record<string, { next: string; ask: () => void }> = {
        scratch_q_audience: {
          next: "scratch_q_values",
          ask: () =>
            appendAssistant(
              "Who is your target audience? Age, lifestyle, what matters to them.",
              { type: "text" },
            ),
        },
        scratch_q_values: {
          next: "scratch_q_feeling",
          ask: () =>
            appendAssistant("What are the brand's core values? 3–5 words.", {
              type: "text",
            }),
        },
        scratch_q_feeling: {
          next: "scratch_q_color",
          ask: () =>
            appendAssistant(
              "How should it feel? Pick a direction or describe your own.",
              {
                type: "chips",
                options: FEEL_CHIPS.map((f) => ({ id: f, label: f })),
                multi: true,
              },
            ),
        },
        scratch_q_color: {
          next: "scratch_q_references",
          ask: () =>
            appendAssistant("Color direction?", {
              type: "chips",
              options: COLOR_CHIPS.map((c) => ({ id: c, label: c })),
            }),
        },
        scratch_q_references: {
          next: "scratch_q_avoid",
          ask: () =>
            appendAssistant(
              "Any visual references? Brands, websites, moods you like.",
              {
                type: "rich",
                allowImages: true,
                maxImages: 5,
                skippable: true,
              },
            ),
        },
        scratch_q_avoid: {
          next: "generate",
          ask: () =>
            appendAssistant(
              "Anything to avoid? Clichés, colors, styles that feel wrong for this brand.",
              { type: "rich", skippable: true },
            ),
        },
        logo_q_audience: {
          next: "logo_q_values",
          ask: () =>
            appendAssistant("Who is your target audience?", { type: "text" }),
        },
        logo_q_values: {
          next: "logo_q_feeling",
          ask: () =>
            appendAssistant("Core brand values — 3–5 words.", { type: "text" }),
        },
        logo_q_feeling: {
          next: "logo_q_color",
          ask: () =>
            appendAssistant("How should it feel?", {
              type: "chips",
              options: FEEL_CHIPS.map((f) => ({ id: f, label: f })),
              multi: true,
            }),
        },
        logo_q_color: {
          next: "logo_q_references",
          ask: () =>
            appendAssistant("Color direction?", {
              type: "chips",
              options: COLOR_CHIPS.map((c) => ({ id: c, label: c })),
            }),
        },
        logo_q_references: {
          next: "logo_q_mark",
          ask: () =>
            appendAssistant("Visual references?", {
              type: "rich",
              allowImages: true,
              maxImages: 5,
              skippable: true,
            }),
        },
        logo_q_mark: {
          next: "logo_q_style",
          ask: () =>
            appendAssistant(
              "Is this a wordmark, lettermark, symbol, or combination mark?",
              {
                type: "chips",
                options: LOGO_MARK_CHIPS.map((m) => ({ id: m, label: m })),
              },
            ),
        },
        logo_q_style: {
          next: "logo_q_avoid",
          ask: () =>
            appendAssistant("What style feels right?", {
              type: "chips",
              options: LOGO_STYLE_CHIPS.map((s) => ({ id: s, label: s })),
            }),
        },
        logo_q_avoid: {
          next: "generate",
          ask: () =>
            appendAssistant("Anything to avoid?", {
              type: "rich",
              skippable: true,
            }),
        },
      };
      const current = chain[start];
      if (current) {
        setStep(current.next);
        current.ask();
      }
    },
    [appendAssistant],
  );

  const parseQuestionnaireFile = useCallback(
    async (file: File): Promise<string | null> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/moodboard/extract-document", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read file");
      return data.text as string;
    },
    [],
  );

  const handleQuestionnaire = useCallback(
    async (text: string, resumeStep: string) => {
      setBusy(true);
      try {
        const res = await fetch("/api/moodboard/parse-questionnaire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        const parsed = data.parsed as Record<string, string>;
        const summary = {
          Brand: parsed.brandName ?? briefRef.current.brandName ?? "",
          Industry: parsed.industry ?? "",
          Audience: parsed.audience ?? "",
          Tone: parsed.feeling ?? parsed.summary ?? "",
        };
        updateBrief({
          brandName: parsed.brandName || briefRef.current.brandName,
          industry: parsed.industry || briefRef.current.industry,
          audience: parsed.audience || briefRef.current.audience,
          feeling: parsed.feeling || briefRef.current.feeling,
          admiredBrands: parsed.admiredBrands || briefRef.current.admiredBrands,
          colorDirection: parsed.colorDirection || briefRef.current.colorDirection,
          questionnaireText: text,
        });
        setPendingConfirm(summary);
        setResumeAfterConfirm(resumeStep);
        appendAssistant(
          "Here's what I gathered from your questionnaire:\nAnything to correct?",
          {
            type: "confirm",
            summary,
            fields: ["Brand", "Industry", "Audience", "Tone"],
          },
        );
        setStep("confirm_questionnaire");
      } finally {
        setBusy(false);
      }
    },
    [appendAssistant, updateBrief],
  );

  const generateDirections = useCallback(async () => {
    appendAssistant(
      "Perfect. I have everything I need.\nGenerating 3 moodboard directions...",
      { type: "loader", message: GENERATION_STATUS[0] },
    );
    setStep("generate");
    setBusy(true);
    try {
      const res = await fetch("/api/moodboard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: briefRef.current.tab,
          modelId,
          brief: {
            ...briefRef.current,
            referenceImageCount: referenceFiles.length,
          },
          stream: true,
        }),
      });

      const result = await readSseStream<{ directions: MoodboardDirection[] }>(
        res,
        () => {},
      );
      const dirs = result?.directions ?? [];
      if (dirs.length !== 3) throw new Error("Expected 3 directions");

      setDirections(dirs);
      appendAssistant("Here are your three directions:", {
        type: "directions",
        directions: dirs,
      });
      setStep("results");
    } catch {
      appendAssistant("Something went wrong generating directions. Try again in a moment.");
      setStep("results_error");
    } finally {
      setBusy(false);
    }
  }, [appendAssistant, modelId, referenceFiles.length]);

  const handleChip = useCallback(
    async (chipId: string) => {
      if (busy) return;

      if (step === "entry") {
        const tab = chipId as MoodboardTab;
        setFlow(tab);
        updateBrief({ tab });
        appendUser(
          chipId === "website"
            ? "🌐 Website"
            : chipId === "logo"
              ? "🎨 Brand / Logo"
              : "📣 Campaign",
        );
        if (tab === "website") askWebsiteMode();
        else if (tab === "logo") askBrandName("logo");
        else {
          appendAssistant("What's this campaign for? Brand name and what you're promoting.", {
            type: "text",
            placeholder: "Acme — spring product launch",
          });
          setStep("campaign_brief");
        }
        return;
      }

      if (step === "website_mode") {
        appendUser(chipId === "redesign" ? "🔄 Redesign" : "✨ From Scratch");
        if (chipId === "redesign") askRedesignUrl();
        else askBrandName("website", true);
        return;
      }

      if (step === "scratch_q_feeling" || step === "logo_q_feeling") {
        setMultiChips((prev) =>
          prev.includes(chipId) ? prev.filter((c) => c !== chipId) : [...prev, chipId],
        );
        return;
      }

      if (step === "scratch_q_color" || step === "logo_q_color") {
        appendUser(chipId);
        updateBrief({ colorDirection: chipId });
        scratchQuestionChain(
          step === "scratch_q_color" ? "scratch_q_color" : "logo_q_color",
        );
        return;
      }

      if (step === "logo_q_mark") {
        appendUser(chipId);
        updateBrief({ logoMarkType: chipId, stylePreference: chipId });
        scratchQuestionChain("logo_q_mark");
        return;
      }

      if (step === "logo_q_style") {
        appendUser(chipId);
        updateBrief({ logoStyle: chipId });
        scratchQuestionChain("logo_q_style");
        return;
      }

      if (step === "campaign_goal") {
        appendUser(chipId);
        updateBrief({ campaignGoal: chipId });
        appendAssistant("Who is the audience for this campaign?", { type: "text" });
        setStep("campaign_audience");
        return;
      }

      if (step === "campaign_platform") {
        setMultiChips((prev) =>
          prev.includes(chipId) ? prev.filter((c) => c !== chipId) : [...prev, chipId],
        );
        return;
      }
    },
    [
      appendUser,
      askBrandName,
      askRedesignUrl,
      askWebsiteMode,
      busy,
      scratchQuestionChain,
      step,
      updateBrief,
    ],
  );

  const continueAfterChipMulti = useCallback(() => {
    if (step === "scratch_q_feeling" || step === "logo_q_feeling") {
      if (!multiChips.length) return;
      appendUser(multiChips.join(", "));
      updateBrief({ feelChips: multiChips, feeling: multiChips.join(", ") });
      setMultiChips([]);
      scratchQuestionChain(step === "scratch_q_feeling" ? "scratch_q_feeling" : "logo_q_feeling");
      return;
    }
    if (step === "campaign_platform") {
      if (!multiChips.length) return;
      appendUser(multiChips.join(", "));
      updateBrief({ campaignPlatforms: multiChips, platform: multiChips.join(", ") });
      setMultiChips([]);
      appendAssistant("What feeling should the campaign evoke?", {
        type: "text",
        placeholder: "Bold, urgent, human",
      });
      setStep("campaign_feeling");
    }
  }, [appendAssistant, appendUser, multiChips, scratchQuestionChain, step, updateBrief]);

  const refineDirection = useCallback(
    async (note: string) => {
      const direction = directions.find((d) => d.id === refineId);
      if (!direction || !note.trim()) return;
      setBusy(true);
      try {
        const res = await fetch("/api/moodboard/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tab: briefRef.current.tab,
            modelId,
            brief: briefRef.current,
            direction,
            refineNote: note,
          }),
        });
        const data = await res.json();
        if (data.direction) {
          setDirections((prev) =>
            prev.map((d) => (d.id === direction.id ? data.direction : d)),
          );
          appendAssistant(`Updated direction: ${data.direction.name}`);
        }
      } finally {
        setBusy(false);
        setRefineId(null);
        setStep("results");
      }
    },
    [appendAssistant, directions, modelId, refineId],
  );

  const handleText = useCallback(
    async (value: string) => {
      if (busy || !value.trim()) return;
      appendUser(value);

      if (step === "campaign_brief") {
        updateBrief({ brandName: value });
        appendAssistant("What's the campaign goal?", {
          type: "chips",
          options: CAMPAIGN_GOAL_CHIPS.map((g) => ({ id: g, label: g })),
        });
        setStep("campaign_goal");
        return;
      }

      if (step === "campaign_audience") {
        updateBrief({ audience: value });
        appendAssistant("Where will this campaign run?", {
          type: "chips",
          options: CAMPAIGN_PLATFORM_CHIPS.map((p) => ({ id: p, label: p })),
          multi: true,
        });
        setStep("campaign_platform");
        return;
      }

      if (step === "campaign_feeling") {
        updateBrief({ campaignFeeling: value, feeling: value });
        appendAssistant("Any visual references or things to avoid?", {
          type: "rich",
          allowImages: true,
          maxImages: 5,
          skippable: true,
        });
        setStep("campaign_references");
        return;
      }

      if (step.endsWith("_brand")) {
        const tab = flow ?? "website";
        void researchBrand(
          value,
          tab === "logo" ? "logo_business" : "scratch_business",
        );
        return;
      }

      if (step === "q_industry") {
        updateBrief({ industry: value });
        questionChain("q_industry");
        return;
      }
      if (step === "q_audience") {
        updateBrief({ audience: value });
        questionChain("q_audience");
        return;
      }
      if (step === "q_feeling") {
        updateBrief({ feeling: value });
        questionChain("q_feeling");
        return;
      }

      if (step === "scratch_q_audience" || step === "logo_q_audience") {
        updateBrief({ audience: value });
        scratchQuestionChain(step);
        return;
      }
      if (step === "scratch_q_values" || step === "logo_q_values") {
        updateBrief({ values: value });
        scratchQuestionChain(step);
        return;
      }

      if (step === "refine_note") {
        void refineDirection(value);
        return;
      }
    },
    [
      appendUser,
      busy,
      flow,
      questionChain,
      refineDirection,
      researchBrand,
      scratchQuestionChain,
      step,
      updateBrief,
    ],
  );

  const handleUrl = useCallback(
    (url: string) => {
      if (busy) return;
      void scrapeWebsite(url);
    },
    [busy, scrapeWebsite],
  );

  const handleRich = useCallback(
    async (payload: {
      text: string;
      files: File[];
      skipped?: boolean;
      questionnaireFile?: File | null;
    }) => {
      if (busy) return;

      if (payload.skipped) {
        appendUser("Skip");
      } else if (payload.text) {
        appendUser(payload.text);
      } else if (payload.questionnaireFile) {
        appendUser(`Uploaded ${payload.questionnaireFile.name}`);
      }

      if (payload.files.length) mergeReferenceFiles(payload.files);

      const resume = step;

      if (payload.questionnaireFile) {
        try {
          setBusy(true);
          const text = await parseQuestionnaireFile(payload.questionnaireFile);
          if (text) {
            await handleQuestionnaire(text, step);
            return;
          }
        } catch (err) {
          appendAssistant(
            err instanceof Error ? err.message : "Could not read questionnaire.",
          );
          return;
        } finally {
          setBusy(false);
        }
      }

      if (step === "redesign_problem" || step === "redesign_fallback") {
        if (payload.text) updateBrief({ problemStatement: payload.text });
        askMoreBeforeGenerate();
        return;
      }

      if (step === "scratch_business" || step === "logo_business") {
        if (payload.text) updateBrief({ businessDescription: payload.text, industry: payload.text });
        const next =
          step === "scratch_business" ? "scratch_q_audience" : "logo_q_audience";
        setStep(next);
        scratchQuestionChain(next);
        return;
      }

      if (step === "q_references") {
        if (payload.text) updateBrief({ admiredBrands: payload.text, referenceNotes: payload.text });
        questionChain("q_references");
        return;
      }
      if (step === "q_constraints") {
        if (payload.text) updateBrief({ avoid: payload.text });
        void generateDirections();
        return;
      }

      if (step === "scratch_q_references" || step === "logo_q_references") {
        if (payload.text) updateBrief({ admiredBrands: payload.text, referenceNotes: payload.text });
        scratchQuestionChain(step);
        return;
      }
      if (step === "scratch_q_avoid" || step === "logo_q_avoid") {
        if (payload.text) updateBrief({ avoid: payload.text });
        void generateDirections();
        return;
      }

      if (step === "campaign_references") {
        if (payload.text) updateBrief({ referenceNotes: payload.text, admiredBrands: payload.text });
        void generateDirections();
        return;
      }

      if (resume === step && payload.skipped) {
        if (step === "q_references") questionChain("q_references");
        else if (step === "q_constraints") void generateDirections();
        else if (step === "scratch_q_references") scratchQuestionChain("scratch_q_references");
        else if (step === "scratch_q_avoid") void generateDirections();
        else if (step === "logo_q_references") scratchQuestionChain("logo_q_references");
        else if (step === "logo_q_avoid") void generateDirections();
        else if (step === "campaign_references") void generateDirections();
      }
    },
    [
      appendUser,
      askMoreBeforeGenerate,
      busy,
      generateDirections,
      handleQuestionnaire,
      mergeReferenceFiles,
      parseQuestionnaireFile,
      questionChain,
      scratchQuestionChain,
      step,
      updateBrief,
    ],
  );

  const handleConfirm = useCallback(
    (confirmed: boolean) => {
      appendUser(confirmed ? "Looks good" : "I'll edit answers");
      if (confirmed && resumeAfterConfirm) {
        const next =
          resumeAfterConfirm === "scratch_business"
            ? "scratch_q_audience"
            : resumeAfterConfirm === "logo_business"
              ? "logo_q_audience"
              : resumeAfterConfirm;
        setStep(next);
        scratchQuestionChain(next);
      } else if (!confirmed) {
        appendAssistant("No problem — continue answering in the chat and I'll update the brief.");
      }
      setPendingConfirm(null);
      setResumeAfterConfirm(null);
    },
    [appendAssistant, appendUser, resumeAfterConfirm, scratchQuestionChain],
  );

  const rejectDirection = useCallback((id: string) => {
    setDirections((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const copyDirection = useCallback(async (direction: MoodboardDirection) => {
    await navigator.clipboard.writeText(directionToText(direction));
    setCopyMessage("Copied to clipboard");
    setTimeout(() => setCopyMessage(""), 2000);
  }, []);

  const downloadPdf = useCallback(async (direction: MoodboardDirection) => {
    const res = await fetch("/api/moodboard/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, tab: briefRef.current.tab }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moodboard-${direction.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const saveHistory = useCallback(
    (direction: MoodboardDirection) => {
      saveMoodboardHistory({
        id: uid(),
        tab: briefRef.current.tab,
        createdAt: new Date().toISOString(),
        chosenDirectionId: direction.id,
        directions,
        brief: briefRef.current,
      });
      setCopyMessage("Saved to history");
      setTimeout(() => setCopyMessage(""), 2000);
    },
    [directions],
  );

  const selected = directions.find((d) => d.id === selectedId);
  const expanded = directions.find((d) => d.id === expandedId);
  const activeMessage = [...messages].reverse().find((m) => m.role === "assistant" && !m.inactive);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#0d0d0d] text-zinc-100">
      <div className="shrink-0">
        <EANav />
      </div>

      <div className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col px-4 pb-4 sm:px-6">
        {eaClient ? (
          <p className="mt-3 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400">
            EA context loaded for <span className="text-zinc-200">{eaClient}</span>
          </p>
        ) : null}

        <div
          className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-4"
          data-lenis-prevent
        >
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} role={msg.role}>
                {msg.content ? <p className="whitespace-pre-wrap">{msg.content}</p> : null}
                {msg.widget && !msg.inactive ? (
                  <ChatWidgetView
                    widget={
                      msg.id === activeMessage?.id &&
                      msg.widget.type === "loader" &&
                      step === "generate"
                        ? { ...msg.widget, message: GENERATION_STATUS[genStatusIdx]! }
                        : msg.widget
                    }
                    disabled={busy || msg.inactive}
                    onChip={handleChip}
                    onText={handleText}
                    onUrl={handleUrl}
                    onRich={handleRich}
                    onConfirm={handleConfirm}
                    selectedChips={multiChips}
                    onDirections={{
                      selectedId,
                      onSelect: setSelectedId,
                      onRefine: (id) => {
                        setRefineId(id);
                        appendAssistant("What should change about this direction?", {
                          type: "text",
                          placeholder: "Warmer, less corporate, bolder typography…",
                        });
                        setStep("refine_note");
                      },
                      onReject: rejectDirection,
                      onExpand: setExpandedId,
                      exportPanel:
                        selected && msg.widget.type === "directions" ? (
                          <ExportPanel
                            direction={selected}
                            onCopy={() => void copyDirection(selected)}
                            onDownloadPdf={() => void downloadPdf(selected)}
                            onSaveHistory={() => saveHistory(selected)}
                          />
                        ) : undefined,
                    }}
                  />
                ) : null}
              </ChatBubble>
            ))}

            {(step === "scratch_q_feeling" ||
              step === "logo_q_feeling" ||
              step === "campaign_platform") &&
            multiChips.length > 0 ? (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={continueAfterChipMulti}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200"
                >
                  Continue with {multiChips.length} selected
                </button>
              </div>
            ) : null}

            {busy && step !== "generate" ? (
              <div className="flex justify-start">
                <div className="flex gap-1 px-2 py-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}

            {copyMessage ? (
              <p className="text-center text-xs text-emerald-400">{copyMessage}</p>
            ) : null}

            <div ref={messagesEndRef} className="h-px shrink-0" />
          </div>
        </div>

        <div className="relative shrink-0 border-t border-zinc-800/80 pt-3">
          <div className="absolute bottom-3 left-0 z-10">
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value as MoodboardModelId)}
              className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-[11px] text-zinc-400 outline-none hover:border-zinc-700"
              aria-label="AI model"
            >
              {MOODBOARD_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {shortModelLabel(m.id)}
                  {m.recommended ? " · default" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="pb-2 pl-[7.5rem] text-[10px] text-zinc-600">
            Select chips above to continue the moodboard brief
          </p>
        </div>
      </div>

      {expanded ? (
        <DirectionDetailModal direction={expanded} onClose={() => setExpandedId(null)} />
      ) : null}
    </div>
  );
}

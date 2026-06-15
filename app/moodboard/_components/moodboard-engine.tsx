"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readSseStream } from "@/lib/ai-sse";
import type { MoodboardQuestion, MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import {
  extractBrandName,
  getFirstQuestion,
  getNextQuestion,
} from "@/lib/moodboard/question-flow";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import {
  QUESTION_STEP_MAP,
  TOTAL_QUESTION_STEPS,
} from "@/lib/moodboard/question-seed";
import { MoodboardNav } from "./moodboard-nav";
import { ChatBubble, QuestionInput } from "./question-input";
import { PresentationView } from "./presentation-view";

const MODEL_STORAGE_KEY = "moodboard-model-id";
const SESSION_STORAGE_KEY = "moodboard-session-id";
const DEFAULT_MODEL: MoodboardModelId =
  MOODBOARD_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

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
  return crypto.randomUUID();
}

export function MoodboardEngine() {
  const [questions, setQuestions] = useState<MoodboardQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentQuestion, setCurrentQuestion] = useState<MoodboardQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [directions, setDirections] = useState<MoodboardPresentationDirection[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [modelId, setModelId] = useState<MoodboardModelId>(DEFAULT_MODEL);
  const [extras, setExtras] = useState<{
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY) as MoodboardModelId | null;
    if (stored && MOODBOARD_MODELS.some((m) => m.id === stored)) {
      setModelId(stored);
    }
    const sid = localStorage.getItem(SESSION_STORAGE_KEY) ?? crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, sid);
    setSessionId(sid);
  }, []);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, generating]);

  const addAssistant = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text }]);
  }, []);

  const addUser = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
  }, []);

  const persistSession = useCallback(
    async (nextAnswers: Record<string, unknown>, patch?: Record<string, unknown>) => {
      if (!sessionId) return;
      await fetch("/api/moodboard/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: nextAnswers, ...patch }),
      });
    },
    [sessionId],
  );

  const runSilentResearch = useCallback(
    async (key: string, nextAnswers: Record<string, unknown>) => {
      if (key === "q2") {
        const brand = String(nextAnswers.q1 ?? "");
        const desc = String(nextAnswers.q2 ?? "");
        try {
          const res = await fetch("/api/moodboard/research-brand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brandName: brand, description: desc }),
          });
          const data = await res.json();
          if (data.summary) {
            setExtras((e) => ({ ...e, brandResearch: data.summary }));
          }
        } catch {
          /* graceful fallback */
        }
      }

      if (key === "q4a") {
        const url = String(nextAnswers.q4a ?? "");
        if (url.startsWith("http")) {
          try {
            const res = await fetch("/api/moodboard/scrape", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (data.analysis) {
              const a = data.analysis;
              setExtras((e) => ({
                ...e,
                websiteAnalysis: `${a.title}: ${a.personality}. ${a.tone}. Colors: ${a.colors?.join(", ")}`,
              }));
            }
          } catch {
            /* graceful fallback */
          }
        }
      }

      if (key === "q10") {
        const competitors = String(nextAnswers.q10 ?? "");
        try {
          const res = await fetch("/api/moodboard/research-brand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brandName: competitors, description: "competitor research" }),
          });
          const data = await res.json();
          if (data.summary) {
            setExtras((e) => ({ ...e, competitorResearch: data.summary }));
          }
        } catch {
          /* graceful fallback */
        }
      }

      if (key === "q19" || key === "q13") {
        const val = nextAnswers[key];
        if (val && typeof val === "object" && "files" in val) {
          const files = (val as { files: File[] }).files;
          const doc = files.find((f) =>
            /\.(pdf|docx|txt)$/i.test(f.name),
          );
          if (doc) {
            const fd = new FormData();
            fd.append("file", doc);
            try {
              const res = await fetch("/api/moodboard/extract-document", {
                method: "POST",
                body: fd,
              });
              const data = await res.json();
              if (data.text) {
                setExtras((e) => ({ ...e, documentExtract: data.text }));
              }
            } catch {
              /* graceful fallback */
            }
          }
        }
      }
    },
    [],
  );

  const startGeneration = useCallback(
    async (nextAnswers: Record<string, unknown>) => {
      const brand = extractBrandName(nextAnswers);
      addAssistant(
        `Perfect. I have everything I need to create 3 moodboard directions for ${brand}. Give me a moment…`,
      );
      setGenerating(true);
      setGenStatus("Building three distinct directions…");
      await persistSession(nextAnswers, { status: "generating" });

      try {
        const res = await fetch("/api/moodboard/generate-presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: nextAnswers,
            modelId,
            sessionId,
            stream: true,
            extras,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Generation failed");

        const result = await readSseStream<{ directions: MoodboardPresentationDirection[] }>(
          res,
          (event) => {
            if (event.type === "status" && event.message) {
              setGenStatus(event.message);
            }
          },
        );
        if (result?.directions) {
          setDirections(result.directions);
        }
      } catch {
        addAssistant("Something went wrong generating directions. Please try again.");
      } finally {
        setGenerating(false);
        setCurrentQuestion(null);
      }
    },
    [addAssistant, extras, modelId, persistSession, sessionId],
  );

  const advanceFlow = useCallback(
    async (questionKey: string, nextAnswers: Record<string, unknown>) => {
      const next = getNextQuestion(questionKey, nextAnswers, questions);
      if (!next) {
        await startGeneration(nextAnswers);
        return;
      }
      setCurrentQuestion(next);
      addAssistant(next.question_text);
    },
    [addAssistant, questions, startGeneration],
  );

  const handleAnswer = useCallback(
    async (value: unknown) => {
      if (!currentQuestion || busy) return;
      setBusy(true);

      const display =
        typeof value === "string"
          ? value
          : Array.isArray(value)
            ? value.join(", ")
            : typeof value === "object" && value !== null && "text" in value
              ? String((value as { text?: string }).text || "[uploaded files]")
              : String(value);

      addUser(display);

      const nextAnswers = { ...answersRef.current, [currentQuestion.key]: value };
      setAnswers(nextAnswers);
      await persistSession(nextAnswers);

      void runSilentResearch(currentQuestion.key, nextAnswers);

      await advanceFlow(currentQuestion.key, nextAnswers);
      setBusy(false);
    },
    [addUser, advanceFlow, busy, currentQuestion, persistSession, runSilentResearch],
  );

  const handleSkip = useCallback(async () => {
    if (!currentQuestion || busy) return;
    setBusy(true);
    addUser("Skipped");
    const nextAnswers = { ...answersRef.current, [currentQuestion.key]: "" };
    setAnswers(nextAnswers);
    await persistSession(nextAnswers);
    await advanceFlow(currentQuestion.key, nextAnswers);
    setBusy(false);
  }, [addUser, advanceFlow, busy, currentQuestion, persistSession]);

  const handleRefine = useCallback(
    async (directionId: string, note: string) => {
      const dir = directions.find((d) => d.id === directionId);
      if (!dir) return;
      setGenerating(true);
      const res = await fetch("/api/moodboard/refine-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          modelId,
          direction: dir,
          refineNote: note,
          extras,
        }),
      });
      const data = await res.json();
      if (data.direction) {
        setDirections((prev) =>
          prev.map((d) => (d.id === directionId ? data.direction : d)),
        );
      }
      setGenerating(false);
    },
    [answers, directions, extras, modelId],
  );

  useEffect(() => {
    if (initializedRef.current) return;

    async function init() {
      try {
        const [qRes] = await Promise.all([
          fetch("/api/moodboard/questions"),
          sessionId
            ? fetch("/api/moodboard/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
              })
            : Promise.resolve(null),
        ]);

        const qData = await qRes.json();
        const qs = (qData.questions ?? []) as MoodboardQuestion[];
        setQuestions(qs);

        if (qs.length === 0) return;

        initializedRef.current = true;
        setTimeout(() => {
          addAssistant(
            "Hi — I'm your moodboard assistant. I'll ask a few questions one at a time to understand your brand, then generate 3 visual directions.",
          );
          const first = getFirstQuestion(qs);
          if (first) {
            setCurrentQuestion(first);
            addAssistant(first.question_text);
          }
        }, 400);
      } catch {
        addAssistant("Couldn't load questions. Please refresh.");
      }
    }

    if (sessionId) init();
  }, [sessionId, addAssistant]);

  const step = currentQuestion ? QUESTION_STEP_MAP[currentQuestion.key] ?? 1 : TOTAL_QUESTION_STEPS;
  const brandName = extractBrandName(answers);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <MoodboardNav />

      <div className="mx-auto flex max-w-3xl flex-col px-4 pb-28 pt-6 sm:px-6">
        {currentQuestion && !directions.length ? (
          <p className="mb-4 text-center text-xs text-zinc-600">
            Step {step} of {TOTAL_QUESTION_STEPS}
          </p>
        ) : null}

        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role}>
              {msg.text}
            </ChatBubble>
          ))}

          {currentQuestion && !generating && !directions.length ? (
            <ChatBubble role="assistant">
              <QuestionInput
                question={currentQuestion}
                disabled={busy}
                onSubmit={handleAnswer}
                onSkip={handleSkip}
              />
            </ChatBubble>
          ) : null}

          {generating ? (
            <ChatBubble role="assistant">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                {genStatus || "Generating…"}
              </div>
            </ChatBubble>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {directions.length > 0 ? (
        <PresentationView
          directions={directions}
          brandName={brandName}
          onRefine={handleRefine}
        />
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800/80 bg-[#0d0d0d]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value as MoodboardModelId)}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-400 outline-none"
            aria-label="Model selector"
          >
            {MOODBOARD_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {shortModelLabel(m.id)}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-600">Moodboard · Brucira</p>
        </div>
      </div>
    </div>
  );
}

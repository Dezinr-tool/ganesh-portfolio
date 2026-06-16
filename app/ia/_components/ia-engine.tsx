"use client";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readSseStream } from "@/lib/ai-sse";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import {
  formatBrandCorrectionAck,
  getVagueFollowUp,
  isDuplicateSubmit,
  isVagueOpenAnswer,
  parseBrandCorrection,
} from "@/lib/moodboard/intake-helpers";
import { PreConfirmationPanel } from "@/app/_components/pre-confirmation-panel";
import type { PreConfirmation, UserPreConfirmation } from "@/lib/pre-generation-types";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "@/lib/pre-generation-types";
import {
  extractClientName,
  extractProductName,
  extractProductType,
  getFirstQuestion,
  getNextQuestion,
  isQuestionOptional,
  normalizeAnswer,
  shouldShowQuestion,
} from "@/lib/ia/question-flow";
import { IA_GREETING, IA_QUESTIONS } from "@/lib/ia/question-seed";
import type { IaOutput, IaQuestion, IaModelId } from "@/lib/ia/types";
import {
  ActiveQuestionCard,
  FloatingStatusCard,
} from "@/app/moodboard/_components/active-question-card";
import {
  MoodboardChatHistory,
  type HistoryMessage,
} from "@/app/moodboard/_components/moodboard-chat-history";
import { MoodboardComposer } from "@/app/moodboard/_components/moodboard-composer";
import { IaOutputView } from "./ia-output-view";
import { IaNav } from "./ia-nav";
import { readStoredValue, useClientSessionId } from "@/lib/client-storage";

const SESSION_STORAGE_KEY = "ia-session-id";
const MODEL_STORAGE_KEY = "ia-model-id";
const VALID_IA_MODELS = new Set<IaModelId>(["claude-sonnet", "claude-haiku", "gpt-4o"]);
const DEFAULT_MODEL: IaModelId = "claude-sonnet";

function uid() {
  return crypto.randomUUID();
}

function formatDisplay(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null && "text" in value) {
    const obj = value as { text?: string; files?: File[] };
    const parts = [obj.text?.trim()].filter(Boolean);
    if (obj.files?.length) parts.push(`${obj.files.length} file(s)`);
    return parts.join(" · ") || "[uploaded files]";
  }
  return String(value);
}

function iaToMoodboardQuestion(q: IaQuestion): MoodboardQuestion {
  return {
    id: q.key,
    key: q.key,
    question_text: q.question_text,
    question_type:
      q.question_type === "open_upload"
        ? "open"
        : q.question_type === "url"
          ? "url"
          : q.question_type,
    parent_key: q.parent_key,
    chips_options: q.chips_options,
    follow_up_condition: q.follow_up_condition,
    category: "brand_basics",
    order_index: q.order_index,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

function usesComposerInput(question: IaQuestion | null): boolean {
  if (!question) return false;
  if (question.question_type === "chips") return false;
  return true;
}

function usesUpload(question: IaQuestion | null): boolean {
  if (!question) return false;
  return (
    question.question_type === "upload" ||
    question.question_type === "open_upload" ||
    question.key === "q3a" ||
    question.key === "q3b" ||
    question.key === "q7a" ||
    question.key === "q14"
  );
}

function toIaModelId(id: MoodboardModelId): IaModelId {
  if (VALID_IA_MODELS.has(id as IaModelId)) return id as IaModelId;
  return DEFAULT_MODEL;
}

function getResumeQuestion(answers: Record<string, unknown>): IaQuestion | null {
  const sorted = [...IA_QUESTIONS].sort((a, b) => a.order_index - b.order_index);
  for (const q of sorted) {
    if (!shouldShowQuestion(q, answers)) continue;
    const val = answers[q.key];
    const answered =
      val !== undefined &&
      val !== null &&
      (normalizeAnswer(val) !== "" || isQuestionOptional(q.key));
    if (!answered) return q;
  }
  return null;
}

export function IaEngine() {
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentQuestion, setCurrentQuestion] = useState<IaQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [output, setOutput] = useState<IaOutput | null>(null);
  const sessionId = useClientSessionId(SESSION_STORAGE_KEY);
  const [modelId, setModelId] = useState<IaModelId>(() =>
    readStoredValue(
      MODEL_STORAGE_KEY,
      (value): value is IaModelId => VALID_IA_MODELS.has(value as IaModelId),
      DEFAULT_MODEL,
    ),
  );
  const [extras, setExtras] = useState<{ documentExtract?: string }>({});
  const [preConfirmation, setPreConfirmation] = useState<PreConfirmation | null>(null);
  const [showPreConfirm, setShowPreConfirm] = useState(false);
  const [loadingPreConfirm, setLoadingPreConfirm] = useState(false);
  const [uxControversyDecisions, setUxControversyDecisions] = useState<
    Record<string, import("@/lib/ia/types").IaUxControversyDecision>
  >({});
  const [composerText, setComposerText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const pendingAnswersRef = useRef<Record<string, unknown>>({});
  const lastSubmitRef = useRef<{ text: string; at: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, generating, currentQuestion, showPreConfirm]);

  const addEaMessage = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text }]);
  }, []);

  const commitExchange = useCallback((questionText: string, answerText: string) => {
    setMessages((m) => [
      ...m,
      { id: uid(), role: "assistant", text: questionText },
      { id: uid(), role: "user", text: answerText },
    ]);
  }, []);

  const persistSession = useCallback(
    async (nextAnswers: Record<string, unknown>, patch?: Record<string, unknown>) => {
      if (!sessionId) return;
      await fetch("/api/ia/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: nextAnswers, ...patch }),
      });
    },
    [sessionId],
  );

  const extractDocuments = useCallback(async (key: string, value: unknown) => {
    if (!value || typeof value !== "object" || !("files" in value)) return;
    const files = (value as { files: File[] }).files;
    const doc = files.find((f) => /\.(pdf|docx|txt|json)$/i.test(f.name));
    if (!doc) return;
    const fd = new FormData();
    fd.append("file", doc);
    try {
      const res = await fetch("/api/moodboard/extract-document", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) {
        setExtras((e) => ({
          ...e,
          documentExtract: [e.documentExtract, `[${key}] ${data.text}`]
            .filter(Boolean)
            .join("\n\n"),
        }));
      }
    } catch {
      /* graceful fallback */
    }
  }, []);

  const pauseThen = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startGeneration = useCallback(
    async (
      nextAnswers: Record<string, unknown>,
      confirmations?: UserPreConfirmation | null,
    ) => {
      const product = extractProductName(nextAnswers);
      addEaMessage(
        confirmations
          ? "Got it. Generating your information architecture now…"
          : `Perfect. I have everything I need to map the IA for ${product}. Give me a moment…`,
      );
      setShowPreConfirm(false);
      setCurrentQuestion(null);
      setGenerating(true);
      setGenStatus("Generating information architecture…");
      const answersWithConfirm = confirmations
        ? { ...nextAnswers, [PRE_CONFIRMATION_ANSWERS_KEY]: confirmations }
        : nextAnswers;
      await persistSession(answersWithConfirm);

      try {
        const res = await fetch("/api/ia/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: answersWithConfirm,
            modelId,
            sessionId,
            stream: true,
            extras,
            preConfirmation: confirmations ?? undefined,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Generation failed");

        const result = await readSseStream<{ output: IaOutput }>(res, (event) => {
          if (event.type === "status" && event.message) {
            setGenStatus(event.message);
          }
        });
        if (result?.output) {
          setOutput(result.output);
        }
      } catch {
        addEaMessage("Something went wrong generating the IA. Please try again.");
      } finally {
        setGenerating(false);
      }
    },
    [addEaMessage, extras, modelId, persistSession, sessionId],
  );

  const requestPreConfirmation = useCallback(
    async (nextAnswers: Record<string, unknown>) => {
      pendingAnswersRef.current = nextAnswers;
      setLoadingPreConfirm(true);
      setCurrentQuestion(null);

      try {
        const res = await fetch("/api/pre-generation/advise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: "ia",
            sessionAnswers: nextAnswers,
            clientName: extractClientName(nextAnswers),
            projectType: extractProductType(nextAnswers),
          }),
        });
        const data = await res.json();
        const pre = data.preConfirmation as PreConfirmation;
        if (!pre || pre.skip_confirmation) {
          await startGeneration(nextAnswers);
          return;
        }
        setPreConfirmation(pre);
        setShowPreConfirm(true);
      } catch {
        await startGeneration(nextAnswers);
      } finally {
        setLoadingPreConfirm(false);
      }
    },
    [startGeneration],
  );

  const handlePreConfirm = useCallback(
    async (selections: UserPreConfirmation) => {
      await startGeneration(pendingAnswersRef.current, selections);
    },
    [startGeneration],
  );

  const showNextQuestion = useCallback(
    async (questionKey: string, nextAnswers: Record<string, unknown>) => {
      setThinking(true);
      await pauseThen(450);
      const next = getNextQuestion(questionKey, nextAnswers);
      setThinking(false);
      if (!next) {
        await requestPreConfirmation(nextAnswers);
        return;
      }
      setCurrentQuestion(next);
    },
    [requestPreConfirmation],
  );

  const analyzeCompetitorScreenshots = useCallback(
    async (files: File[], nextAnswers: Record<string, unknown>) => {
      if (!sessionId || !files.length) return;
      setThinking(true);
      addEaMessage("Analyzing competitor screenshots…");
      try {
        const fd = new FormData();
        fd.append("sessionId", sessionId);
        fd.append(
          "productContext",
          `${extractProductName(nextAnswers)} — ${extractProductType(nextAnswers)}`,
        );
        if (nextAnswers.q7b) {
          fd.append("differentiateFrom", String(nextAnswers.q7b));
        }
        for (const file of files.slice(0, 10)) {
          fd.append("files", file);
        }
        const res = await fetch("/api/ia/analyze-competitors", { method: "POST", body: fd });
        const data = await res.json();
        if (data.message) {
          addEaMessage(data.message);
        }
      } catch {
        addEaMessage("I couldn't analyze the screenshots, but I'll continue with your other answers.");
      } finally {
        setThinking(false);
      }
    },
    [addEaMessage, sessionId],
  );

  const processAnswer = useCallback(
    async (value: unknown, options?: { skipArchive?: boolean }) => {
      if (!currentQuestion || busy) return;

      const display = formatDisplay(value);
      const now = Date.now();
      if (isDuplicateSubmit(lastSubmitRef.current, display, now)) return;
      lastSubmitRef.current = { text: display.trim().toLowerCase(), at: now };

      setBusy(true);
      const questionSnapshot = currentQuestion;
      const mappedQuestion = iaToMoodboardQuestion(questionSnapshot);

      const correction = parseBrandCorrection(display);
      if (correction) {
        if (!options?.skipArchive) {
          commitExchange(questionSnapshot.question_text, display);
        }
        const nextAnswers: Record<string, unknown> = {
          ...answersRef.current,
          q1: correction.brand,
        };
        setAnswers(nextAnswers);
        addEaMessage(formatBrandCorrectionAck(correction));
        await persistSession(nextAnswers);
        setCurrentQuestion(null);
        await showNextQuestion(questionSnapshot.key, nextAnswers);
        setComposerText("");
        setPendingFiles([]);
        setBusy(false);
        return;
      }

      if (isVagueOpenAnswer(mappedQuestion, value)) {
        if (!options?.skipArchive) {
          commitExchange(questionSnapshot.question_text, display);
        }
        addEaMessage(getVagueFollowUp(mappedQuestion));
        setBusy(false);
        return;
      }

      const nextAnswers = { ...answersRef.current, [questionSnapshot.key]: value };
      setAnswers(nextAnswers);
      await persistSession(nextAnswers);

      if (["q3a", "q3b", "q14"].includes(questionSnapshot.key)) {
        void extractDocuments(questionSnapshot.key, value);
      }

      if (questionSnapshot.key === "q7a" && value && typeof value === "object" && "files" in value) {
        const files = (value as { files: File[] }).files ?? [];
        if (files.length > 0) {
          await analyzeCompetitorScreenshots(files, nextAnswers);
        }
      }

      if (!options?.skipArchive) {
        commitExchange(questionSnapshot.question_text, display);
      }
      setCurrentQuestion(null);
      setComposerText("");
      setPendingFiles([]);

      await showNextQuestion(questionSnapshot.key, nextAnswers);
      setBusy(false);
    },
    [
      addEaMessage,
      analyzeCompetitorScreenshots,
      busy,
      commitExchange,
      currentQuestion,
      extractDocuments,
      persistSession,
      showNextQuestion,
    ],
  );

  const handleAnswer = useCallback(
    (value: unknown) => {
      void processAnswer(value);
    },
    [processAnswer],
  );

  const handleSkip = useCallback(async () => {
    if (!currentQuestion || busy) return;
    setBusy(true);
    const q = currentQuestion;
    const nextAnswers = { ...answersRef.current, [q.key]: "" };
    setAnswers(nextAnswers);
    await persistSession(nextAnswers);
    commitExchange(q.question_text, "Skipped");
    setCurrentQuestion(null);
    setComposerText("");
    setPendingFiles([]);
    await showNextQuestion(q.key, nextAnswers);
    setBusy(false);
  }, [busy, commitExchange, currentQuestion, persistSession, showNextQuestion]);

  const handleComposerSubmit = useCallback(() => {
    if (!currentQuestion) return;
    const text = composerText.trim();
    if (!text && pendingFiles.length === 0) return;
    handleAnswer({ text, files: pendingFiles });
  }, [composerText, currentQuestion, handleAnswer, pendingFiles]);

  const handleUploadContinue = useCallback(() => {
    if (!currentQuestion || pendingFiles.length === 0) return;
    handleAnswer({ text: composerText.trim(), files: pendingFiles });
  }, [composerText, currentQuestion, handleAnswer, pendingFiles]);

  useEffect(() => {
    if (initializedRef.current || !sessionId) return;

    async function init() {
      try {
        await fetch("/api/ia/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const res = await fetch(`/api/ia/sessions?sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          const session = data.session as {
            answers?: Record<string, unknown>;
            ia_output?: IaOutput | null;
            status?: string;
            ux_controversy_decisions?: Record<
              string,
              import("@/lib/ia/types").IaUxControversyDecision
            >;
          };
          if (session?.answers && Object.keys(session.answers).length > 0) {
            setAnswers(session.answers);
            if (session.ux_controversy_decisions) {
              setUxControversyDecisions(session.ux_controversy_decisions);
            }
            if (session.status === "complete" && session.ia_output) {
              setOutput(session.ia_output);
              initializedRef.current = true;
              return;
            }
            const resume = getResumeQuestion(session.answers);
            initializedRef.current = true;
            setTimeout(() => {
              addEaMessage(IA_GREETING);
              if (resume) setCurrentQuestion(resume);
            }, 400);
            return;
          }
        }

        initializedRef.current = true;
        setTimeout(() => {
          addEaMessage(IA_GREETING);
          setCurrentQuestion(getFirstQuestion());
        }, 400);
      } catch {
        addEaMessage("Couldn't load session. Please refresh.");
      }
    }

    void init();
  }, [sessionId, addEaMessage]);

  const productName = extractProductName(answers);
  const intakeComplete = output !== null;
  const moodboardQuestion = currentQuestion ? iaToMoodboardQuestion(currentQuestion) : null;

  const composerHidden = useMemo(() => {
    if (generating || showPreConfirm || loadingPreConfirm) return true;
    if (!currentQuestion) return true;
    return !usesComposerInput(currentQuestion);
  }, [currentQuestion, generating, loadingPreConfirm, showPreConfirm]);

  const uploadAccept = useMemo(() => {
    if (!currentQuestion) return undefined;
    if (currentQuestion.key === "q14") {
      return ".pdf,.docx,.txt,.json,application/pdf,image/*";
    }
    return "image/*,.pdf,.docx,.txt,.json";
  }, [currentQuestion]);

  const composerPlaceholder = useMemo(() => {
    if (!currentQuestion) return "Type your answer…";
    if (currentQuestion.question_type === "url") return "https://";
    if (usesUpload(currentQuestion)) return "Add a note (optional)…";
    return "Type your answer…";
  }, [currentQuestion]);

  const showSkip = currentQuestion ? isQuestionOptional(currentQuestion.key) : false;

  const composerModelId = modelId as MoodboardModelId;

  if (intakeComplete && output) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
        <IaNav />

        <div className="mx-auto max-w-[680px] border-b border-white/10 px-4 pb-3 pt-4">
          <p className="text-sm font-medium text-white">{productName}</p>
          <p className="text-xs text-zinc-500">Information architecture</p>
        </div>

        <div className="moodboard-output-enter bg-white text-neutral-900">
          <IaOutputView
            output={output}
            sessionId={sessionId}
            initialDecisions={uxControversyDecisions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-zinc-100">
      <IaNav />

      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-4 pb-6 pt-4">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <MoodboardChatHistory
            messages={messages}
            thinking={thinking}
            generating={generating}
            genStatus={genStatus}
          />
          <div ref={messagesEndRef} className="h-4 shrink-0" />
        </div>

        <div className="sticky bottom-0 shrink-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pb-2 pt-4">
          {showPreConfirm && preConfirmation ? (
            <div className="moodboard-card-enter mb-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <PreConfirmationPanel
                preConfirmation={preConfirmation}
                onConfirm={handlePreConfirm}
                loading={generating || loadingPreConfirm}
                brandName={productName}
                variant="inline"
              />
            </div>
          ) : null}

          {loadingPreConfirm ? (
            <FloatingStatusCard
              title="Analyzing context…"
              subtitle="Preparing my approach before generation"
            />
          ) : null}

          {moodboardQuestion && !generating && !showPreConfirm && !loadingPreConfirm ? (
            <ActiveQuestionCard
              question={moodboardQuestion}
              disabled={busy}
              pendingFiles={pendingFiles}
              onChip={handleAnswer}
              onMultiChipSubmit={handleAnswer}
              onSectionSubmit={handleAnswer}
              onUploadContinue={handleUploadContinue}
            />
          ) : null}

          <MoodboardComposer
            value={composerText}
            onChange={setComposerText}
            onSubmit={handleComposerSubmit}
            disabled={busy || generating}
            hidden={composerHidden}
            placeholder={composerPlaceholder}
            inputMode={currentQuestion?.question_type === "url" ? "url" : "text"}
            showUpload={usesUpload(currentQuestion)}
            uploadAccept={uploadAccept}
            onFilesSelected={(files) => {
              setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
            }}
            modelId={composerModelId}
            onModelChange={(id) => setModelId(toIaModelId(id))}
            showSkip={showSkip && !composerHidden}
            onSkip={() => void handleSkip()}
          />
        </div>
      </div>
    </div>
  );
}

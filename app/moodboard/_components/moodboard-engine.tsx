"use client";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readSseStream } from "@/lib/ai-sse";
import type { MoodboardQuestion, MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import {
  extractBrandName,
  getFirstQuestion,
  getNextQuestion,
  isQuestionOptional,
} from "@/lib/moodboard/question-flow";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import { getSelectedOutputSections } from "@/lib/moodboard/output-sections";
import { PreConfirmationPanel } from "@/app/_components/pre-confirmation-panel";
import type { PreConfirmation, UserPreConfirmation } from "@/lib/pre-generation-types";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "@/lib/pre-generation-types";
import { extractProjectType } from "@/lib/moodboard/question-flow";
import {
  formatBrandCorrectionAck,
  getVagueFollowUp,
  isDuplicateSubmit,
  isVagueOpenAnswer,
  parseBrandCorrection,
} from "@/lib/moodboard/intake-helpers";
import { MAX_REFERENCE_IMAGES } from "@/lib/moodboard/question-seed";
import {
  getQuestionDurationMs,
  markQuestionStarted,
  trackMoodboardEvent,
} from "@/lib/moodboard/track-event";
import { FloatingStatusCard } from "./active-question-card";
import {
  MoodboardChatHistory,
  type HistoryMessage,
} from "./moodboard-chat-history";
import { MoodboardComposer, type MoodboardComposerHandle } from "./moodboard-composer";
import { PresentationView } from "./presentation-view";
import { MoodboardNav } from "./moodboard-nav";
import { MoodboardLanding } from "./moodboard-landing";
import { readStoredValue, useClientSessionId } from "@/lib/client-storage";

const MODEL_STORAGE_KEY = "moodboard-model-id";
const SESSION_STORAGE_KEY = "moodboard-session-id";
const DEFAULT_MODEL: MoodboardModelId =
  MOODBOARD_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

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

function usesComposerInput(question: MoodboardQuestion | null): boolean {
  if (!question) return false;
  if (question.question_type === "multi_section_select") return false;
  if (question.question_type === "chips" && question.key !== "q4b") return false;
  return true;
}

function usesUpload(question: MoodboardQuestion | null): boolean {
  if (!question) return false;
  return question.question_type === "upload" || question.key === "q4b" || question.key === "q13";
}

export function MoodboardEngine() {
  const [questions, setQuestions] = useState<MoodboardQuestion[]>([]);
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentQuestion, setCurrentQuestion] = useState<MoodboardQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [directions, setDirections] = useState<MoodboardPresentationDirection[]>([]);
  const sessionId = useClientSessionId(SESSION_STORAGE_KEY);
  const [modelId, setModelId] = useState<MoodboardModelId>(() =>
    readStoredValue(
      MODEL_STORAGE_KEY,
      (value): value is MoodboardModelId =>
        MOODBOARD_MODELS.some((m) => m.id === value),
      DEFAULT_MODEL,
    ),
  );
  const [selectedOutputSections, setSelectedOutputSections] = useState<string[]>([]);
  const [extras, setExtras] = useState<{
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  }>({});
  const [preConfirmation, setPreConfirmation] = useState<PreConfirmation | null>(null);
  const [showPreConfirm, setShowPreConfirm] = useState(false);
  const [loadingPreConfirm, setLoadingPreConfirm] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [landingFading, setLandingFading] = useState(false);
  const [questionsReady, setQuestionsReady] = useState(false);

  const pendingAnswersRef = useRef<Record<string, unknown>>({});
  const lastSubmitRef = useRef<{ text: string; at: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<MoodboardComposerHandle>(null);
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

  useEffect(() => {
    if (currentQuestion?.key) {
      markQuestionStarted(currentQuestion.key);
    }
    if (currentQuestion?.key && usesComposerInput(currentQuestion)) {
      const t = window.setTimeout(() => composerRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [currentQuestion?.key]);

  const addEaMessage = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text }]);
  }, []);

  const commitUserAnswer = useCallback((answerText: string) => {
    setMessages((m) => [...m, { id: uid(), role: "user", text: answerText }]);
  }, []);

  const showQuestion = useCallback((question: MoodboardQuestion) => {
    setCurrentQuestion(question);
    addEaMessage(question.question_text);
  }, [addEaMessage]);

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
          const doc = files.find((f) => /\.(pdf|docx|txt)$/i.test(f.name));
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

  const pauseThen = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startGeneration = useCallback(
    async (
      nextAnswers: Record<string, unknown>,
      confirmations?: UserPreConfirmation | null,
    ) => {
      const brand = extractBrandName(nextAnswers);
      addEaMessage(
        confirmations
          ? "Got it. Generating now with your preferences…"
          : `Perfect. I have everything I need to create 3 moodboard directions for ${brand}. Give me a moment…`,
      );
      setShowPreConfirm(false);
      setCurrentQuestion(null);
      setGenerating(true);
      setGenStatus("Building three distinct directions…");
      const answersWithConfirm = confirmations
        ? { ...nextAnswers, [PRE_CONFIRMATION_ANSWERS_KEY]: confirmations }
        : nextAnswers;
      const sections =
        getSelectedOutputSections(nextAnswers).length > 0
          ? getSelectedOutputSections(nextAnswers)
          : selectedOutputSections;
      await persistSession(answersWithConfirm, { status: "generating", selected_model: modelId });
      void trackMoodboardEvent(sessionId, "generation_started", {
        modelId,
        selectedOutputSections: sections,
      });

      try {
        const res = await fetch("/api/moodboard/generate-presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: answersWithConfirm,
            modelId,
            sessionId,
            stream: true,
            extras,
            selectedOutputSections: sections,
            preConfirmation: confirmations ?? undefined,
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
          void trackMoodboardEvent(sessionId, "generation_complete", {
            modelId,
            directionCount: result.directions.length,
            directionNames: result.directions.map((d) => d.directionName),
          });
        }
      } catch {
        addEaMessage("Something went wrong generating directions. Please try again.");
      } finally {
        setGenerating(false);
      }
    },
    [addEaMessage, extras, modelId, persistSession, selectedOutputSections, sessionId],
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
            tool: "moodboard",
            sessionAnswers: nextAnswers,
            clientName: extractBrandName(nextAnswers),
            projectType: extractProjectType(nextAnswers),
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
      const next = getNextQuestion(questionKey, nextAnswers, questions);
      setThinking(false);
      if (!next) {
        await requestPreConfirmation(nextAnswers);
        return;
      }
      showQuestion(next);
    },
    [questions, requestPreConfirmation, showQuestion],
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

      const correction = parseBrandCorrection(display);
      if (correction) {
        if (!options?.skipArchive) {
          commitUserAnswer(display);
        }
        const nextAnswers: Record<string, unknown> = {
          ...answersRef.current,
          q1: correction.brand,
        };
        if (correction.description) {
          nextAnswers.q2 = correction.description;
        }
        setAnswers(nextAnswers);
        addEaMessage(formatBrandCorrectionAck(correction));
        await persistSession(nextAnswers);

        setCurrentQuestion(null);
        if (correction.description) {
          if (questionSnapshot.key === "q2") {
            void runSilentResearch("q2", nextAnswers);
          }
          await showNextQuestion(questionSnapshot.key, nextAnswers);
        } else if (questionSnapshot.key === "q1") {
          await showNextQuestion("q1", nextAnswers);
        } else {
          setCurrentQuestion(questionSnapshot);
        }
        setComposerText("");
        setPendingFiles([]);
        setBusy(false);
        return;
      }

      if (isVagueOpenAnswer(questionSnapshot, value)) {
        if (!options?.skipArchive) {
          commitUserAnswer(display);
        }
        addEaMessage(getVagueFollowUp(questionSnapshot));
        setBusy(false);
        return;
      }

      const nextAnswers = { ...answersRef.current, [questionSnapshot.key]: value };
      setAnswers(nextAnswers);

      if (questionSnapshot.key === "q_output_sections" && Array.isArray(value)) {
        setSelectedOutputSections(value as string[]);
        await persistSession(nextAnswers, {
          selected_output_sections: value as string[],
        });
        void trackMoodboardEvent(sessionId, "chip_selected", {
          questionKey: questionSnapshot.key,
          answer: value,
        }, getQuestionDurationMs(questionSnapshot.key));
      } else {
        await persistSession(nextAnswers, { selected_model: modelId });
        const eventType =
          questionSnapshot.question_type === "chips" ? "chip_selected" : "question_answered";
        void trackMoodboardEvent(
          sessionId,
          eventType,
          {
            questionKey: questionSnapshot.key,
            questionType: questionSnapshot.question_type,
            answer: display,
          },
          getQuestionDurationMs(questionSnapshot.key),
        );
      }

      void runSilentResearch(questionSnapshot.key, nextAnswers);

      if (!options?.skipArchive) {
        commitUserAnswer(display);
      }
      setCurrentQuestion(null);
      setComposerText("");
      setPendingFiles([]);

      await showNextQuestion(questionSnapshot.key, nextAnswers);
      setBusy(false);
    },
    [
      addEaMessage,
      busy,
      commitUserAnswer,
      currentQuestion,
      persistSession,
      runSilentResearch,
      sessionId,
      showNextQuestion,
      modelId,
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
    void trackMoodboardEvent(sessionId, "question_skipped", {
      questionKey: q.key,
    }, getQuestionDurationMs(q.key));
    commitUserAnswer("Skipped");
    setCurrentQuestion(null);
    setComposerText("");
    setPendingFiles([]);
    await showNextQuestion(q.key, nextAnswers);
    setBusy(false);
  }, [busy, commitUserAnswer, currentQuestion, persistSession, sessionId, showNextQuestion]);

  const handleComposerSubmit = useCallback(() => {
    if (!currentQuestion) return;
    const text = composerText.trim();
    if (!text && pendingFiles.length === 0) return;
    handleAnswer({ text, files: pendingFiles });
  }, [composerText, currentQuestion, handleAnswer, pendingFiles]);

  const startConversation = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || conversationStarted || busy || !questionsReady) return;

      setLandingFading(true);
      setBusy(true);
      setComposerText("");

      await pauseThen(300);

      setConversationStarted(true);
      void trackMoodboardEvent(sessionId, "session_started", { openingMessage: trimmed });
      setMessages((m) => [...m, { id: uid(), role: "user", text: trimmed }]);

      setThinking(true);
      await pauseThen(450);
      setThinking(false);

      addEaMessage(
        "Great — I'll ask a few questions to understand your brand, then generate 3 visual directions.",
      );

      const first = getFirstQuestion(questions);
      if (first) showQuestion(first);

      setBusy(false);
    },
    [addEaMessage, busy, conversationStarted, questions, questionsReady, sessionId, showQuestion],
  );

  const handleLandingSubmit = useCallback(() => {
    void startConversation(composerText);
  }, [composerText, startConversation]);

  const handleUploadContinue = useCallback(() => {
    if (!currentQuestion || pendingFiles.length === 0) return;
    handleAnswer({ text: composerText.trim(), files: pendingFiles });
  }, [composerText, currentQuestion, handleAnswer, pendingFiles]);

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
          selectedOutputSections,
        }),
      });
      const data = await res.json();
      if (data.direction) {
        setDirections((prev) =>
          prev.map((d) => (d.id === directionId ? data.direction : d)),
        );
        void trackMoodboardEvent(sessionId, "direction_refined", {
          directionId,
          directionName: dir.directionName,
          refineNote: note,
        });
      }
      setGenerating(false);
    },
    [answers, directions, extras, modelId, selectedOutputSections, sessionId],
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
        setQuestionsReady(qs.length > 0);
        initializedRef.current = true;
      } catch {
        setQuestionsReady(false);
      }
    }

    if (sessionId) init();
  }, [sessionId]);

  const brandName = extractBrandName(answers);
  const intakeComplete = directions.length > 0;

  const composerHidden = useMemo(() => {
    if (generating || showPreConfirm || loadingPreConfirm) return true;
    if (!currentQuestion) return true;
    return !usesComposerInput(currentQuestion);
  }, [currentQuestion, generating, loadingPreConfirm, showPreConfirm]);

  const uploadAccept = useMemo(() => {
    if (!currentQuestion) return undefined;
    if (currentQuestion.key === "q19") return ".pdf,.docx,.txt,application/pdf";
    if (currentQuestion.key === "q13") return "image/*";
    return "image/*,.pdf,.docx,.txt";
  }, [currentQuestion]);

  const composerPlaceholder = useMemo(() => {
    if (!currentQuestion) return "Write a message...";
    if (currentQuestion.question_type === "url") return "https://";
    if (usesUpload(currentQuestion)) return "Add a note (optional)…";
    return "Write a message...";
  }, [currentQuestion]);

  const showSkip = currentQuestion ? isQuestionOptional(currentQuestion.key) : false;

  if (intakeComplete) {
    return (
      <div className="min-h-screen bg-black text-zinc-100">
        <MoodboardNav />
        <div className="moodboard-output-enter">
          <PresentationView
            directions={directions}
            brandName={brandName}
            selectedOutputSections={selectedOutputSections}
            sessionId={sessionId}
            onRefine={handleRefine}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col transition-colors duration-[400ms] ease-out ${
        conversationStarted ? "moodboard-chat-shell" : "bg-black text-zinc-100"
      }`}
    >
      <MoodboardNav theme={conversationStarted ? "light" : "dark"} />

      {!conversationStarted ? (
        <MoodboardLanding
          value={composerText}
          onChange={setComposerText}
          onSubmit={handleLandingSubmit}
          modelId={modelId}
          onModelChange={setModelId}
          disabled={busy || !questionsReady}
          fading={landingFading}
        />
      ) : (
        <div className="relative mx-auto flex w-full max-w-[680px] flex-1 flex-col px-6 pb-6">
          <div className="moodboard-fade-in flex min-h-0 flex-1 flex-col pt-4">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <MoodboardChatHistory
                messages={messages}
                thinking={thinking}
                generating={generating}
                genStatus={genStatus}
                currentQuestion={
                  !generating && !showPreConfirm && !loadingPreConfirm
                    ? currentQuestion
                    : null
                }
                questionDisabled={busy}
                pendingFiles={pendingFiles}
                onChip={handleAnswer}
                onMultiChipSubmit={handleAnswer}
                onSectionSubmit={handleAnswer}
                onUploadContinue={handleUploadContinue}
              />
              <div ref={messagesEndRef} className="h-4 shrink-0" />
            </div>

            <div className="sticky bottom-0 shrink-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pb-2 pt-4">
              {showPreConfirm && preConfirmation ? (
                <div className="moodboard-card-enter mb-4 rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
                  <PreConfirmationPanel
                    preConfirmation={preConfirmation}
                    onConfirm={handlePreConfirm}
                    loading={generating || loadingPreConfirm}
                    brandName={brandName}
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

              <MoodboardComposer
                ref={composerRef}
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
                  const max =
                    currentQuestion?.key === "q13" ? MAX_REFERENCE_IMAGES : 5;
                  setPendingFiles((prev) => [...prev, ...files].slice(0, max));
                }}
                modelId={modelId}
                onModelChange={setModelId}
                showSkip={showSkip && !composerHidden}
                onSkip={() => void handleSkip()}
                variant="chat"
              />

              <p className="moodboard-chat-footer">
                Powered by Claude · AI can make mistakes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

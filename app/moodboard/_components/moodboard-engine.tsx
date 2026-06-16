"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readSseStream } from "@/lib/ai-sse";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import { extractBrandName, extractProjectType } from "@/lib/moodboard/question-flow";
import { MOODBOARD_MODELS } from "@/lib/moodboard/models";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import { getSelectedOutputSections, DEFAULT_MOODBOARD_PICKER_KEYS, MIN_OUTPUT_SECTIONS } from "@/lib/moodboard/output-sections";
import {
  shouldOfferSectionsPhase,
  userNeedsPanelHelp,
  userRequestedGeneration,
} from "@/lib/moodboard/intake-phase";
import { PreConfirmationPanel } from "@/app/_components/pre-confirmation-panel";
import type { PreConfirmation, UserPreConfirmation } from "@/lib/pre-generation-types";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "@/lib/pre-generation-types";
import { trackMoodboardEvent } from "@/lib/moodboard/track-event";
import {
  MoodboardChatHistory,
  type HistoryMessage,
} from "./moodboard-chat-history";
import { MoodboardComposer, type MoodboardComposerHandle } from "./moodboard-composer";
import { MoodboardOutputShell } from "./moodboard-output-shell";
import { MoodboardNav } from "./moodboard-nav";
import { MoodboardLanding } from "./moodboard-landing";
import { readStoredValue, useClientSessionId } from "@/lib/client-storage";
import { restoreSessionState } from "@/lib/moodboard/session-restore";
import { registerSession, startNewSession, upsertSessionIndex } from "@/lib/moodboard/session-index";
import type { MoodboardSession } from "@/lib/moodboard/db-types";
import { MoodboardSessionsSidebar } from "./moodboard-sessions-sidebar";
import { MoodboardSectionsPicker } from "./moodboard-sections-picker";

const MODEL_STORAGE_KEY = "moodboard-model-id";
const SESSION_STORAGE_KEY = "moodboard-session-id";
const DEFAULT_MODEL: MoodboardModelId =
  MOODBOARD_MODELS.find((m) => m.recommended)?.id ?? "claude-sonnet";

function uid() {
  return crypto.randomUUID();
}

export function MoodboardEngine() {
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
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
  const [conversationStarted, setConversationStarted] = useState(false);
  const [landingFading, setLandingFading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);

  const pendingAnswersRef = useRef<Record<string, unknown>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<MoodboardComposerHandle>(null);
  const initializedRef = useRef(false);
  const answersRef = useRef(answers);
  const messagesRef = useRef(messages);
  const extrasRef = useRef(extras);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    extrasRef.current = extras;
  }, [extras]);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

  const offerSections = useMemo(
    () =>
      shouldOfferSectionsPhase({
        answers,
        messages,
        directionsCount: directions.length,
      }),
    [answers, messages, directions.length],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, generating, showPreConfirm, offerSections]);

  const addAssistantMessage = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text }]);
  }, []);

  const persistSession = useCallback(
    async (
      nextAnswers: Record<string, unknown>,
      chatHistory: HistoryMessage[],
      patch?: Record<string, unknown>,
    ) => {
      if (!sessionId) return;
      const brandName = extractBrandName(nextAnswers);
      const payload = {
        ...nextAnswers,
        _chat_history: chatHistory.map(({ role, text }) => ({ role, text })),
      };
      const res = await fetch("/api/moodboard/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers: payload,
          brand_name: brandName !== "Your Brand" ? brandName : undefined,
          project_type: extractProjectType(nextAnswers),
          ...patch,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { session?: MoodboardSession };
        if (data.session) registerSession(data.session);
      } else {
        upsertSessionIndex({
          sessionId,
          brandName: brandName !== "Your Brand" ? brandName : null,
          status: String(patch?.status ?? "in_progress"),
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [sessionId],
  );

  const startGeneration = useCallback(
    async (
      nextAnswers: Record<string, unknown>,
      confirmations?: UserPreConfirmation | null,
    ) => {
      const brand = extractBrandName(nextAnswers);
      addAssistantMessage(
        confirmations
          ? "Generating your directions now…"
          : `Creating three moodboard directions for ${brand}…`,
      );
      setShowPreConfirm(false);
      setGenerating(true);
      setGenStatus("Building three distinct directions…");
      const answersWithConfirm = confirmations
        ? { ...nextAnswers, [PRE_CONFIRMATION_ANSWERS_KEY]: confirmations }
        : nextAnswers;
      const sections =
        getSelectedOutputSections(nextAnswers).length > 0
          ? getSelectedOutputSections(nextAnswers)
          : selectedOutputSections;
      await persistSession(answersWithConfirm, messagesRef.current, {
        status: "generating",
        selected_model: modelId,
      });
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
            extras: extrasRef.current,
            selectedOutputSections: sections,
            preConfirmation: confirmations ?? undefined,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Generation failed");

        const partialDirections: MoodboardPresentationDirection[] = [];

        const result = await readSseStream<{ directions: MoodboardPresentationDirection[] }>(
          res,
          (event) => {
            if (event.type === "status" && event.message) {
              setGenStatus(event.message);
            }
            if (event.type === "direction" && event.direction) {
              const dir = event.direction as MoodboardPresentationDirection;
              partialDirections.push(dir);
              setDirections([...partialDirections]);
              setGenStatus(`Direction ${event.directionIndex ?? partialDirections.length} ready…`);
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
        addAssistantMessage("Something went wrong generating directions. Please try again.");
      } finally {
        setGenerating(false);
      }
    },
    [addAssistantMessage, modelId, persistSession, selectedOutputSections, sessionId],
  );

  const requestPreConfirmation = useCallback(
    async (nextAnswers: Record<string, unknown>) => {
      pendingAnswersRef.current = nextAnswers;
      setLoadingPreConfirm(true);

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

  const handleSectionsConfirm = useCallback(
    async (sections: string[]) => {
      const nextAnswers = { ...answersRef.current, q_output_sections: sections };
      setAnswers(nextAnswers);
      answersRef.current = nextAnswers;
      setSelectedOutputSections(sections);
      await persistSession(nextAnswers, messagesRef.current);
      await requestPreConfirmation(nextAnswers);
    },
    [persistSession, requestPreConfirmation],
  );

  const triggerGeneration = useCallback(async () => {
    const sections = getSelectedOutputSections(answersRef.current);
    if (sections.length >= MIN_OUTPUT_SECTIONS) {
      await requestPreConfirmation(answersRef.current);
      return;
    }
    await handleSectionsConfirm(DEFAULT_MOODBOARD_PICKER_KEYS);
  }, [handleSectionsConfirm, requestPreConfirmation]);

  const handlePreConfirm = useCallback(
    async (selections: UserPreConfirmation) => {
      await startGeneration(pendingAnswersRef.current, selections);
    },
    [startGeneration],
  );

  const callIntakeChat = useCallback(
    async (chatMessages: HistoryMessage[]) => {
      const res = await fetch("/api/moodboard/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          modelId,
          messages: chatMessages.map(({ role, text }) => ({ role, text })),
          answers: answersRef.current,
          extras: extrasRef.current,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");
      return (await res.json()) as {
        type?: "chat" | "moodboard_output";
        reply?: string;
        directions?: MoodboardPresentationDirection[];
        answers: Record<string, unknown>;
        extras?: typeof extras;
        readyToGenerate: boolean;
        showSectionsPicker?: boolean;
        researched?: boolean;
      };
    },
    [modelId, sessionId],
  );

  const handleUserMessage = useCallback(
    async (text: string, options?: { isLanding?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      if (userNeedsPanelHelp(trimmed)) {
        addAssistantMessage(
          "The selector is pinned above the input — choose your elements, then press Continue.",
        );
        setComposerText("");
        return;
      }

      if (userRequestedGeneration(trimmed)) {
        setComposerText("");
        await triggerGeneration();
        return;
      }

      setBusy(true);
      setComposerText("");

      if (options?.isLanding) {
        setLandingFading(true);
        await new Promise((r) => setTimeout(r, 280));
        setConversationStarted(true);
        void trackMoodboardEvent(sessionId, "session_started", { openingMessage: trimmed });
      }

      const userMsg: HistoryMessage = { id: uid(), role: "user", text: trimmed };
      const chatMessages = [...messagesRef.current, userMsg];
      setMessages(chatMessages);

      setThinking(true);
      try {
        const data = await callIntakeChat(chatMessages);

        if (data.type === "moodboard_output" && data.directions?.length) {
          setDirections(data.directions);
          setAnswers(data.answers);
          answersRef.current = data.answers;
          if (data.extras) setExtras((prev) => ({ ...prev, ...data.extras }));
          setReadyToGenerate(data.readyToGenerate);
          void trackMoodboardEvent(sessionId, "generation_complete", {
            modelId,
            directionCount: data.directions.length,
            directionNames: data.directions.map((d) => d.directionName),
          });
          await persistSession(data.answers, chatMessages, { status: "complete" });
          setThinking(false);
          setBusy(false);
          return;
        }

        setAnswers(data.answers);
        answersRef.current = data.answers;
        if (data.extras) setExtras((prev) => ({ ...prev, ...data.extras }));
        setReadyToGenerate(data.readyToGenerate);
        if (getSelectedOutputSections(data.answers).length > 0) {
          setSelectedOutputSections(getSelectedOutputSections(data.answers));
        }

        const assistantMsg: HistoryMessage = {
          id: uid(),
          role: "assistant",
          text: data.reply ?? "",
        };
        const fullHistory = [...chatMessages, assistantMsg];
        setMessages(fullHistory);
        messagesRef.current = fullHistory;

        await persistSession(data.answers, fullHistory, { selected_model: modelId });
      } catch {
        addAssistantMessage(
          "Something went wrong on my end. Could you try sending that again?",
        );
      } finally {
        setThinking(false);
        setBusy(false);
      }
    },
    [
      addAssistantMessage,
      busy,
      callIntakeChat,
      modelId,
      persistSession,
      triggerGeneration,
      sessionId,
    ],
  );

  const handleLandingSubmit = useCallback(() => {
    void handleUserMessage(composerText, { isLanding: true });
  }, [composerText, handleUserMessage]);

  const handleComposerSubmit = useCallback(() => {
    void handleUserMessage(composerText);
  }, [composerText, handleUserMessage]);

  const handleSelectDirection = useCallback(
    async (direction: MoodboardPresentationDirection) => {
      if (!sessionId) return;
      await fetch("/api/moodboard/select-direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          directionIndex: direction.directionIndex,
          directionName: direction.directionName,
        }),
      });
      void trackMoodboardEvent(sessionId, "direction_selected", {
        directionIndex: direction.directionIndex,
        directionName: direction.directionName,
      });
    },
    [sessionId],
  );

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
        const sessionRes = sessionId
          ? await fetch("/api/moodboard/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            })
          : null;

        if (sessionRes?.ok) {
          const sessionData = (await sessionRes.json()) as { session?: MoodboardSession };
          if (sessionData.session) {
            registerSession(sessionData.session);
            const restored = restoreSessionState(sessionData.session);
            setAnswers(restored.answers);
            answersRef.current = restored.answers;
            setMessages(restored.messages);
            messagesRef.current = restored.messages;
            setDirections(restored.directions);
            setSelectedOutputSections(restored.selectedOutputSections);
            if (restored.modelId) setModelId(restored.modelId);
            setConversationStarted(restored.conversationStarted);
            setReadyToGenerate(restored.readyToGenerate);
          }
        }

        initializedRef.current = true;
      } catch {
        /* session load optional */
      } finally {
        setSessionReady(true);
      }
    }

    if (sessionId) void init();
    else setSessionReady(true);
  }, [sessionId]);

  const brandName = extractBrandName(answers);
  const presentationMode = directions.length > 0;
  const composerDisabled = busy || generating || loadingPreConfirm;
  const showElementPicker =
    offerSections && !presentationMode && !generating && !showPreConfirm;

  if (presentationMode) {
    return (
      <div className="relative flex min-h-screen flex-col bg-white">
        <MoodboardSessionsSidebar activeSessionId={sessionId} theme="light" />
        <MoodboardNav theme="light" />
        <div className="moodboard-output-enter flex-1">
          <MoodboardOutputShell
            messages={messages}
            brandName={brandName}
            directions={directions}
            selectedOutputSections={selectedOutputSections}
            sessionId={sessionId}
            generating={generating}
            genStatus={genStatus}
            onSelectDirection={handleSelectDirection}
            onRefine={handleRefine}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-screen flex-col ${
        conversationStarted ? "moodboard-chat-shell" : "bg-white"
      }`}
    >
      <MoodboardSessionsSidebar activeSessionId={sessionId} theme="light" />
      <MoodboardNav theme="light" />

      <div className="flex min-h-0 flex-1 flex-col bg-white">
          {!sessionReady ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-[#888]">Loading session…</p>
            </div>
          ) : !conversationStarted ? (
            <MoodboardLanding
              value={composerText}
              onChange={setComposerText}
              onSubmit={handleLandingSubmit}
              modelId={modelId}
              onModelChange={setModelId}
              disabled={composerDisabled}
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
                  />
                  <div ref={messagesEndRef} className="h-4 shrink-0" />
                </div>

                <div className="sticky bottom-0 z-10 shrink-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pb-2 pt-4">
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

                  {showElementPicker ? (
                    <p className="mb-2 text-center text-xs font-medium text-[#888]">
                      Step 2 — Select moodboard elements, then Generate 3 directions
                    </p>
                  ) : null}

                  {showElementPicker ? (
                    <div
                      className="moodboard-sections-picker-sticky mb-3"
                      data-testid="moodboard-sections-picker"
                    >
                      <MoodboardSectionsPicker
                        onConfirm={handleSectionsConfirm}
                        onSomethingElse={() => composerRef.current?.focus()}
                        loading={loadingPreConfirm || generating}
                      />
                    </div>
                  ) : null}

                  <MoodboardComposer
                    ref={composerRef}
                    value={composerText}
                    onChange={setComposerText}
                    onSubmit={handleComposerSubmit}
                    disabled={composerDisabled}
                    placeholder={showElementPicker ? "Or reply directly…" : "Write a message..."}
                    modelId={modelId}
                    onModelChange={setModelId}
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
    </div>
  );
}

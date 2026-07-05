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
import { MoodboardLanding } from "./moodboard-landing";
import { MoodboardShell } from "./moodboard-shell";
import { IntakeQuestionPanel } from "./intake-question-panel";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { readStoredValue, useClientSessionId } from "@/lib/client-storage";
import { restoreSessionState } from "@/lib/moodboard/session-restore";
import { registerSession, startNewSession, upsertSessionIndex, createFreshSessionId } from "@/lib/moodboard/session-index";
import { loadSessionSnapshot, saveSessionSnapshot } from "@/lib/moodboard/session-snapshot";
import type { MoodboardSession } from "@/lib/moodboard/db-types";
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
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
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
  const [sessionSyncing, setSessionSyncing] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [dismissedQuestionKeys, setDismissedQuestionKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const composerTextRef = useRef(composerText);
  useEffect(() => {
    composerTextRef.current = composerText;
  }, [composerText]);

  const pendingAnswersRef = useRef<Record<string, unknown>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionSyncGenRef = useRef(0);
  const composerRef = useRef<MoodboardComposerHandle>(null);
  const lastInitializedSessionIdRef = useRef<string | null>(null);
  const interactionStartedRef = useRef(false);
  const conversationLockedRef = useRef(false);
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
    setMessages((m) => {
      const next = [...m, { id: uid(), role: "assistant" as const, text }];
      messagesRef.current = next;
      return next;
    });
  }, []);

  const lockConversation = useCallback(() => {
    interactionStartedRef.current = true;
    conversationLockedRef.current = true;
    sessionSyncGenRef.current += 1;
    setConversationStarted(true);
  }, []);

  const resetForFreshLandingSession = useCallback(() => {
    const emptyAnswers: Record<string, unknown> = {};
    setMessages([]);
    messagesRef.current = [];
    setAnswers(emptyAnswers);
    answersRef.current = emptyAnswers;
    setDirections([]);
    setSelectedOutputSections([]);
    setExtras({});
    extrasRef.current = {};
    pendingAnswersRef.current = emptyAnswers;
    setReadyToGenerate(false);
    setPreConfirmation(null);
    setShowPreConfirm(false);
    setGenerating(false);
    setThinking(false);
    setGenStatus("");
    setLoadingPreConfirm(false);
    setDismissedQuestionKeys(new Set());
    interactionStartedRef.current = false;
    conversationLockedRef.current = false;
  }, []);

  const saveSnapshotNow = useCallback(
    (
      nextAnswers: Record<string, unknown>,
      chatHistory: HistoryMessage[],
      patch?: Partial<Parameters<typeof saveSessionSnapshot>[0]>,
    ) => {
      if (!sessionIdRef.current) return;
      saveSessionSnapshot({
        sessionId: sessionIdRef.current,
        answers: {
          ...nextAnswers,
          _chat_history: chatHistory.map(({ role, text }) => ({ role, text })),
        },
        messages: chatHistory.map(({ role, text }) => ({ role, text })),
        directions,
        selectedOutputSections,
        modelId,
        extras: extrasRef.current,
        savedAt: new Date().toISOString(),
        ...patch,
      });
    },
    [directions, modelId, selectedOutputSections],
  );

  const persistSession = useCallback(
    async (
      nextAnswers: Record<string, unknown>,
      chatHistory: HistoryMessage[],
      patch?: Record<string, unknown>,
    ) => {
      if (!sessionIdRef.current) return;
      const brandName = extractBrandName(nextAnswers);
      const payload = {
        ...nextAnswers,
        _chat_history: chatHistory.map(({ role, text }) => ({ role, text })),
      };
      const activeSessionId = sessionIdRef.current;
      const res = await fetch("/api/moodboard/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
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
          sessionId: activeSessionId,
          brandName: brandName !== "Your Brand" ? brandName : null,
          status: String(patch?.status ?? "in_progress"),
          updatedAt: new Date().toISOString(),
        });
      }

      saveSessionSnapshot({
        sessionId: activeSessionId,
        answers: payload,
        messages: chatHistory.map(({ role, text }) => ({ role, text })),
        directions,
        selectedOutputSections,
        modelId,
        extras: extrasRef.current,
        savedAt: new Date().toISOString(),
      });
    },
    [directions, modelId, selectedOutputSections],
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
      const activeSessionId = sessionIdRef.current;
      void trackMoodboardEvent(activeSessionId, "generation_started", {
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
            sessionId: activeSessionId,
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
          void trackMoodboardEvent(activeSessionId, "generation_complete", {
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
    [addAssistantMessage, modelId, persistSession, selectedOutputSections],
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
    async (chatMessages: HistoryMessage[], assistantId: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      try {
        const res = await fetch("/api/moodboard/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            modelId,
            stream: true,
            messages: chatMessages.map(({ role, text }) => ({ role, text })),
            answers: answersRef.current,
            extras: extrasRef.current,
          }),
        });

        if (!res.ok) throw new Error("Chat failed");

        const result = await readSseStream<{
          type?: "chat" | "moodboard_output";
          reply?: string;
          directions?: MoodboardPresentationDirection[];
          answers: Record<string, unknown>;
          extras?: typeof extras;
          readyToGenerate: boolean;
          showSectionsPicker?: boolean;
          researched?: boolean;
        }>(res, (event) => {
          if (event.type === "delta" && event.text) {
            setThinking(false);
            setMessages((prev) => {
              const next = prev.map((m) =>
                m.id === assistantId ? { ...m, text: event.text ?? "" } : m,
              );
              messagesRef.current = next;
              return next;
            });
          }
        });

        if (!result) throw new Error("Chat failed");
        return result;
      } finally {
        clearTimeout(timeout);
      }
    },
    [modelId],
  );

  const handleUserMessage = useCallback(
    async (text: string, options?: { isLanding?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      if (userNeedsPanelHelp(trimmed)) {
        lockConversation();
        addAssistantMessage(
          "The selector is pinned above the input — choose your elements, then press Continue.",
        );
        setComposerText("");
        return;
      }

      if (!options?.isLanding && userRequestedGeneration(trimmed)) {
        setComposerText("");
        lockConversation();
        await triggerGeneration();
        return;
      }

      setBusy(true);
      setComposerText("");
      lockConversation();

      if (options?.isLanding) {
        void trackMoodboardEvent(sessionIdRef.current, "session_started", {
          openingMessage: trimmed,
        });
      }

      void trackMoodboardEvent(sessionIdRef.current, "training_user_prompt", {
        text: trimmed,
        source: options?.isLanding ? "landing" : "chat",
        messageIndex: messagesRef.current.length,
      });

      const userMsg: HistoryMessage = { id: uid(), role: "user", text: trimmed };
      const chatMessages = [...messagesRef.current, userMsg];
      messagesRef.current = chatMessages;
      setMessages(chatMessages);

      setThinking(true);
      const assistantId = uid();
      const chatWithPlaceholder = [
        ...chatMessages,
        { id: assistantId, role: "assistant" as const, text: "" },
      ];
      messagesRef.current = chatWithPlaceholder;
      setMessages(chatWithPlaceholder);
      saveSnapshotNow(answersRef.current, chatMessages);

      try {
        const data = await callIntakeChat(chatMessages, assistantId);

        if (data.type === "moodboard_output" && data.directions?.length) {
          setDirections(data.directions);
          setAnswers(data.answers);
          answersRef.current = data.answers;
          if (data.extras) setExtras((prev) => ({ ...prev, ...data.extras }));
          setReadyToGenerate(data.readyToGenerate);
          void trackMoodboardEvent(sessionIdRef.current, "generation_complete", {
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
          id: assistantId,
          role: "assistant",
          text: data.reply ?? "",
        };
        const fullHistory = [...chatMessages, assistantMsg];
        messagesRef.current = fullHistory;
        setMessages(fullHistory);
        saveSnapshotNow(data.answers, fullHistory);

        void persistSession(data.answers, fullHistory, { selected_model: modelId });
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
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
      lockConversation,
      modelId,
      persistSession,
      saveSnapshotNow,
      triggerGeneration,
    ],
  );

  const handleAttachFiles = useCallback(
    async (files: File[]) => {
      const supportedMime = new Set([
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
      ]);
      const doc = files.find(
        (f) =>
          /\.(pdf|docx|txt|pptx|ppt)$/i.test(f.name) ||
          supportedMime.has(f.type),
      );
      if (!doc) {
        addAssistantMessage("Please upload a PDF, PowerPoint, DOCX, or TXT file.");
        if (!conversationStarted) {
          lockConversation();
        }
        return;
      }

      const inActiveIntake = messagesRef.current.some((m) => m.role === "user");
      let continueIntakeMessage: string | null = null;

      setBusy(true);
      try {
        const form = new FormData();
        form.append("file", doc);
        const res = await fetch("/api/moodboard/extract-document", {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || !data.text) {
          throw new Error(data.error ?? "Could not read file");
        }

        const nextExtras = {
          ...extrasRef.current,
          documentExtract: [extrasRef.current.documentExtract, data.text]
            .filter(Boolean)
            .join("\n\n"),
        };
        setExtras(nextExtras);
        extrasRef.current = nextExtras;

        const nextAnswers = {
          ...answersRef.current,
          q19: doc.name,
          _moodboard_extras: nextExtras,
        };
        setAnswers(nextAnswers);
        answersRef.current = nextAnswers;

        if (!interactionStartedRef.current) {
          lockConversation();
        }

        void persistSession(nextAnswers, messagesRef.current);

        if (inActiveIntake) {
          continueIntakeMessage = `I've uploaded **${doc.name}** — please use it as context and continue with the next question.`;
        } else {
          addAssistantMessage(
            `I've read **${doc.name}** — I'll use that as context. Tell me about the brand or project when you're ready.`,
          );
        }
      } catch (error) {
        addAssistantMessage(
          error instanceof Error
            ? error.message
            : "Could not read that file. Try PDF, PowerPoint, DOCX, or TXT.",
        );
        if (!conversationStarted) {
          lockConversation();
        }
      } finally {
        setBusy(false);
        if (continueIntakeMessage) {
          queueMicrotask(() => {
            void handleUserMessage(continueIntakeMessage!);
          });
        }
      }
    },
    [
      addAssistantMessage,
      conversationStarted,
      handleUserMessage,
      lockConversation,
      persistSession,
    ],
  );

  const handleLandingSubmit = useCallback(() => {
    const freshId = createFreshSessionId();
    sessionIdRef.current = freshId;
    sessionSyncGenRef.current += 1;
    resetForFreshLandingSession();
    void handleUserMessage(composerTextRef.current, { isLanding: true });
  }, [handleUserMessage, resetForFreshLandingSession]);

  const handleComposerSubmit = useCallback(() => {
    void handleUserMessage(composerText);
  }, [composerText, handleUserMessage]);

  const formatChipAnswer = useCallback((value: string | string[]) => {
    return Array.isArray(value) ? value.join(", ") : value;
  }, []);

  const handleChipAnswer = useCallback(
    async (question: MoodboardQuestion, value: string | string[]) => {
      if (busy) return;
      const display = formatChipAnswer(value);
      const nextAnswers = { ...answersRef.current, [question.key]: value };
      setAnswers(nextAnswers);
      answersRef.current = nextAnswers;

      void trackMoodboardEvent(sessionIdRef.current, "chip_answer", {
        questionKey: question.key,
        questionText: question.question_text,
        value: display,
      });

      await handleUserMessage(display);
    },
    [busy, formatChipAnswer, handleUserMessage],
  );

  const handleDismissChipQuestion = useCallback((questionKey: string) => {
    setDismissedQuestionKeys((prev) => new Set([...prev, questionKey]));
    void trackMoodboardEvent(sessionIdRef.current, "chip_question_dismissed", {
      questionKey,
    });
  }, []);

  const handleChipSomethingElse = useCallback(() => {
    composerRef.current?.focus();
  }, []);

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
          sessionId,
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
    setDismissedQuestionKeys(new Set());
    if (!sessionId || lastInitializedSessionIdRef.current === sessionId) return;
    lastInitializedSessionIdRef.current = sessionId;

    const cached = loadSessionSnapshot(sessionId);
    if (cached) {
      setAnswers(cached.answers);
      answersRef.current = cached.answers;
      const cachedMessages: HistoryMessage[] = cached.messages.map((m, i) => ({
        id: `snap-${i}`,
        role: m.role,
        text: m.text,
      }));
      setMessages(cachedMessages);
      messagesRef.current = cachedMessages;
      setDirections(cached.directions);
      setSelectedOutputSections(cached.selectedOutputSections);
      if (cached.modelId) setModelId(cached.modelId);
      if (cached.extras) setExtras(cached.extras);
      const storedExtras = cached.answers._moodboard_extras;
      if (storedExtras && typeof storedExtras === "object") {
        setExtras((prev) => ({ ...prev, ...(storedExtras as typeof extras) }));
      }
      const cachedHasAnswers = Object.keys(cached.answers ?? {}).some(
        (key) =>
          !key.startsWith("_") &&
          cached.answers[key] !== null &&
          cached.answers[key] !== undefined &&
          String(cached.answers[key]).trim() !== "",
      );
      setConversationStarted(
        cached.messages.length > 0 ||
          cached.directions.length > 0 ||
          cachedHasAnswers,
      );
      if (
        cached.messages.length > 0 ||
        cached.directions.length > 0 ||
        cachedHasAnswers
      ) {
        conversationLockedRef.current = true;
        interactionStartedRef.current = true;
      }
    }

    setSessionSyncing(true);
    const syncGeneration = sessionSyncGenRef.current;
    void (async () => {
      try {
        const sessionRes = await fetch("/api/moodboard/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (syncGeneration !== sessionSyncGenRef.current) return;

        if (sessionRes.ok) {
          const sessionData = (await sessionRes.json()) as { session?: MoodboardSession };
          if (sessionData.session) {
            if (syncGeneration !== sessionSyncGenRef.current) return;

            registerSession(sessionData.session);
            const restored = restoreSessionState(sessionData.session);

            if (restored.directions.length > 0) {
              setDirections(restored.directions);
              setAnswers(restored.answers);
              answersRef.current = restored.answers;
              setSelectedOutputSections(restored.selectedOutputSections);
              if (restored.modelId) setModelId(restored.modelId);
              setConversationStarted(true);
              conversationLockedRef.current = true;
              interactionStartedRef.current = true;
              saveSessionSnapshot({
                sessionId,
                answers: restored.answers,
                messages: restored.messages.map(({ role, text }) => ({ role, text })),
                directions: restored.directions,
                selectedOutputSections: restored.selectedOutputSections,
                modelId: restored.modelId,
                extras:
                  restored.answers._moodboard_extras &&
                  typeof restored.answers._moodboard_extras === "object"
                    ? (restored.answers._moodboard_extras as typeof extras)
                    : undefined,
                savedAt: new Date().toISOString(),
              });
              return;
            }

            if (
              syncGeneration !== sessionSyncGenRef.current ||
              interactionStartedRef.current ||
              conversationLockedRef.current ||
              messagesRef.current.length > 0
            ) {
              return;
            }

            setAnswers(restored.answers);
            answersRef.current = restored.answers;
            setMessages((prev) => {
              if (prev.length > 0) return prev;
              messagesRef.current = restored.messages;
              return restored.messages;
            });
            setDirections(restored.directions);
            setSelectedOutputSections(restored.selectedOutputSections);
            if (restored.modelId) setModelId(restored.modelId);
            setConversationStarted((prev) => prev || restored.conversationStarted);
            setReadyToGenerate(restored.readyToGenerate);

            saveSessionSnapshot({
              sessionId,
              answers: restored.answers,
              messages: restored.messages.map(({ role, text }) => ({ role, text })),
              directions: restored.directions,
              selectedOutputSections: restored.selectedOutputSections,
              modelId: restored.modelId,
              extras:
                restored.answers._moodboard_extras &&
                typeof restored.answers._moodboard_extras === "object"
                  ? (restored.answers._moodboard_extras as typeof extras)
                  : undefined,
              savedAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        /* server sync optional — local snapshot still works */
      } finally {
        if (syncGeneration === sessionSyncGenRef.current) {
          setSessionSyncing(false);
        }
      }
    })();
  }, [sessionId]);

  const brandName = extractBrandName(answers);
  const presentationMode = directions.length > 0;
  const composerDisabled = busy || generating || loadingPreConfirm;
  const showElementPicker =
    offerSections && !presentationMode && !generating && !showPreConfirm;

  const showIntakeQuestionPanel =
    conversationStarted &&
    !presentationMode &&
    !generating &&
    !showPreConfirm &&
    !showElementPicker &&
    !loadingPreConfirm;

  if (presentationMode) {
    return (
      <MoodboardShell sessionId={sessionId}>
        <div className="moodboard-output-enter flex min-h-0 flex-1 flex-col overflow-y-auto">
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
      </MoodboardShell>
    );
  }

  return (
    <MoodboardShell sessionId={sessionId}>
      {sessionSyncing ? (
        <p className="moodboard-sync-status" role="status">
          Syncing session…
        </p>
      ) : null}

      {!conversationStarted ? (
        <MoodboardLanding
          value={composerText}
          onChange={setComposerText}
          onSubmit={handleLandingSubmit}
          modelId={modelId}
          onModelChange={setModelId}
          disabled={composerDisabled}
          submitting={busy && !conversationStarted}
          onFilesSelected={handleAttachFiles}
        />
      ) : (
        <div className="moodboard-chat-view moodboard-chat-shell flex min-h-0 flex-1 flex-col" data-testid="moodboard-chat">
          <div className="moodboard-chat-scroll">
            <MoodboardChatHistory
              messages={messages}
              thinking={thinking}
              generating={generating}
              genStatus={genStatus}
            />
            <div ref={messagesEndRef} className="h-4 shrink-0" />
          </div>

          <div className="moodboard-composer-dock">
            {showPreConfirm && preConfirmation ? (
              <div className="moodboard-card-enter mb-4 rounded-lg border border-[var(--mb-border-strong)] bg-[var(--mb-bg-elevated)] p-4">
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
              <p className="mb-2 text-center text-xs text-[var(--mb-text-muted)]">
                Select moodboard elements, then continue
              </p>
            ) : null}

            {showIntakeQuestionPanel ? (
              <IntakeQuestionPanel
                answers={answers}
                dismissedKeys={dismissedQuestionKeys}
                disabled={composerDisabled || thinking}
                onAnswer={(q, v) => void handleChipAnswer(q, v)}
                onDismiss={handleDismissChipQuestion}
                onSomethingElse={handleChipSomethingElse}
              />
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

            <div className="moodboard-composer-frame moodboard-composer-frame--animated">
              <div className="moodboard-composer-frame-inner">
                <MoodboardComposer
                  ref={composerRef}
                  value={composerText}
                  onChange={setComposerText}
                  onSubmit={handleComposerSubmit}
                  disabled={composerDisabled}
                  placeholder={
                    showElementPicker ? "Or reply directly…" : "Describe an idea, brand, or project..."
                  }
                  modelId={modelId}
                  onModelChange={setModelId}
                  variant="chat"
                  showAttach
                  onFilesSelected={handleAttachFiles}
                  uploadAccept=".pdf,.docx,.txt,.ppt,.pptx"
                />
              </div>
            </div>

            <p className="moodboard-chat-footer">
              Powered by Claude · AI can make mistakes
            </p>
          </div>
        </div>
      )}
    </MoodboardShell>
  );
}

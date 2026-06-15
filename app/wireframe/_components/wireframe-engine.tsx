"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { readSseStream } from "@/lib/ai-sse";
import { PreConfirmationPanel } from "@/app/_components/pre-confirmation-panel";
import type { PreConfirmation, UserPreConfirmation } from "@/lib/pre-generation-types";
import {
  MoodboardChatHistory,
  type HistoryMessage,
} from "@/app/moodboard/_components/moodboard-chat-history";
import { FloatingStatusCard } from "@/app/moodboard/_components/active-question-card";
import { MoodboardComposer } from "@/app/moodboard/_components/moodboard-composer";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import type { WireframeScreen, WireframeSession } from "@/lib/wireframe/types";
import { WireframeOutputView } from "./wireframe-output-view";

type IaScreen = {
  id: string;
  screen_name: string;
  priority: "P1" | "P2" | "P3";
  level: number;
  user_access: string[];
  primary_content: string[];
  key_actions: string[];
};

type Phase = "intro" | "screen_notes" | "pre_confirm" | "generating" | "output";

const CHIP =
  "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40";
const CHIP_ACTIVE = "border-white/25 bg-white/10 text-white";

function uid() {
  return crypto.randomUUID();
}

export function WireframeEngine({ iaSessionId }: { iaSessionId: string }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<WireframeSession | null>(null);
  const [iaScreens, setIaScreens] = useState<IaScreen[]>([]);
  const [wireframeScreens, setWireframeScreens] = useState<WireframeScreen[]>([]);
  const [clientName, setClientName] = useState("Project");
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [screenNotes, setScreenNotes] = useState<Record<string, string>>({});
  const [notesIndex, setNotesIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [preConfirmation, setPreConfirmation] = useState<PreConfirmation | null>(null);
  const [showPreConfirm, setShowPreConfirm] = useState(false);
  const [loadingPreConfirm, setLoadingPreConfirm] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [modelId, setModelId] = useState<MoodboardModelId>("claude-sonnet");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const userConfirmationsRef = useRef<UserPreConfirmation | null>(null);

  const addMessage = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text }]);
  }, []);

  const commitExchange = useCallback((questionText: string, answerText: string) => {
    setMessages((m) => [
      ...m,
      { id: uid(), role: "assistant", text: questionText },
      { id: uid(), role: "user", text: answerText },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating, showPreConfirm, phase, notesIndex]);

  const persistSession = useCallback(
    async (patch: {
      selected_screens?: string[];
      screen_notes?: Record<string, string>;
      status?: WireframeSession["status"];
    }) => {
      if (!session?.session_id) return;
      const res = await fetch("/api/wireframe/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.session_id, ...patch }),
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
    },
    [session?.session_id],
  );

  const startGeneration = useCallback(
    async (confirmations?: UserPreConfirmation | null) => {
      if (!session) return;

      setShowPreConfirm(false);
      setPhase("generating");
      setGenerating(true);
      setGenStatus("Starting wireframe generation…");
      addMessage(
        confirmations
          ? "Got it. Generating wireframes with your preferences…"
          : "Perfect. Generating wireframes for your selected screens…",
      );

      try {
        const res = await fetch("/api/wireframe/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.session_id,
            iaSessionId,
            stream: true,
            userConfirmations: confirmations ?? undefined,
          }),
        });

        const result = await readSseStream<{ screens: WireframeScreen[] }>(res, (event) => {
          if (event.type === "status" && event.message) {
            setGenStatus(event.message);
          }
        });

        if (result?.screens) {
          setWireframeScreens(result.screens);
          setPhase("output");
          addMessage("Wireframes are ready. Review, refine components, and export JSX below.");
        }
      } catch {
        addMessage("Something went wrong generating wireframes. Please try again.");
        setPhase("pre_confirm");
      } finally {
        setGenerating(false);
      }
    },
    [addMessage, iaSessionId, session],
  );

  const requestPreConfirmation = useCallback(async () => {
    setLoadingPreConfirm(true);
    setPhase("pre_confirm");

    try {
      const res = await fetch("/api/pre-generation/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "wireframe",
          clientName,
          projectType: session?.project_name ?? undefined,
          sessionAnswers: {
            selected_screens: selectedScreens,
            screen_notes: screenNotes,
            ia_session_id: iaSessionId,
          },
        }),
      });
      const data = await res.json();
      const pre = data.preConfirmation as PreConfirmation;

      if (!pre || pre.skip_confirmation) {
        await startGeneration();
        return;
      }

      setPreConfirmation(pre);
      setShowPreConfirm(true);
      addMessage("Before I generate, here's the approach I'm planning:");
    } catch {
      await startGeneration();
    } finally {
      setLoadingPreConfirm(false);
    }
  }, [
    addMessage,
    clientName,
    iaSessionId,
    screenNotes,
    selectedScreens,
    session?.project_name,
    startGeneration,
  ]);

  const handleScreenSelectionContinue = useCallback(async () => {
    if (selectedScreens.length === 0 || busy) return;
    setBusy(true);

    const display = selectedScreens.join(", ");
    commitExchange(
      "Which screens from your IA should I wireframe?",
      display,
    );

    await persistSession({ selected_screens: selectedScreens });
    setNotesIndex(0);
    setPhase("screen_notes");
      addMessage(
        `Great — I'll wireframe ${selectedScreens.length} screen${selectedScreens.length > 1 ? "s" : ""}. Any specific notes for ${selectedScreens[0]}? (optional — press Enter to skip)`,
      );
    setBusy(false);
  }, [addMessage, busy, commitExchange, persistSession, selectedScreens]);

  const handleNotesSubmit = useCallback(async () => {
    if (busy || phase !== "screen_notes") return;
    const screenName = selectedScreens[notesIndex];
    if (!screenName) return;

    setBusy(true);
    const note = composerText.trim();
    const nextNotes = { ...screenNotes, [screenName]: note };
    setScreenNotes(nextNotes);
    commitExchange(
      `Any specific notes for ${screenName}?`,
      note || "No additional notes",
    );
    setComposerText("");

    const nextIndex = notesIndex + 1;
    if (nextIndex < selectedScreens.length) {
      setNotesIndex(nextIndex);
      addMessage(
        `Any specific notes for ${selectedScreens[nextIndex]}? (optional)`,
      );
      setBusy(false);
      return;
    }

    await persistSession({ screen_notes: nextNotes });
    addMessage("Thanks — reviewing context before generation…");
    await requestPreConfirmation();
    setBusy(false);
  }, [
    addMessage,
    busy,
    commitExchange,
    composerText,
    notesIndex,
    persistSession,
    phase,
    requestPreConfirmation,
    screenNotes,
    selectedScreens,
  ]);

  const handlePreConfirm = useCallback(
    async (selections: UserPreConfirmation) => {
      userConfirmationsRef.current = selections;
      await startGeneration(selections);
    },
    [startGeneration],
  );

  const toggleScreen = (name: string) => {
    setSelectedScreens((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  useEffect(() => {
    if (initializedRef.current) return;

    async function init() {
      try {
        const res = await fetch("/api/wireframe/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ iaSessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSession(data.session);
        setIaScreens(data.iaScreens ?? []);
        setWireframeScreens(data.wireframeScreens ?? []);
        setClientName(
          data.iaSession?.client_name ??
            data.iaSession?.project_name ??
            "Project",
        );

        if (data.session?.selected_screens?.length) {
          setSelectedScreens(data.session.selected_screens);
        }
        if (data.session?.screen_notes) {
          setScreenNotes(data.session.screen_notes);
        }

        initializedRef.current = true;

        if (
          data.session?.status === "complete" &&
          (data.wireframeScreens?.length ?? 0) > 0
        ) {
          setPhase("output");
          return;
        }

        setTimeout(() => {
          addMessage(
            `Hi — I've loaded your completed IA for ${data.iaSession?.client_name ?? "this project"}. Select which screens to wireframe using Shadcn UI components.`,
          );
        }, 300);
      } catch {
        addMessage("Couldn't load IA session. Please refresh or return to IA.");
      }
    }

    void init();
  }, [addMessage, iaSessionId]);

  const composerHidden = useMemo(() => {
    if (phase === "output" || phase === "intro" || generating) return true;
    if (showPreConfirm || loadingPreConfirm) return true;
    return phase !== "screen_notes";
  }, [generating, loadingPreConfirm, phase, showPreConfirm]);

  const projectLabel =
    session?.project_name ?? session?.client_name ?? clientName;

  if (phase === "output" && wireframeScreens.length > 0 && session) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
        <Link
          href="/"
          className="fixed left-4 top-4 z-30 text-sm text-white/80 transition hover:text-white"
        >
          designbyganesh
        </Link>

        <div className="mx-auto max-w-[680px] border-b border-white/10 px-4 pb-3 pt-14">
          <p className="text-sm font-medium text-white">{projectLabel}</p>
          <p className="text-xs text-zinc-500">
            {wireframeScreens.length} wireframe
            {wireframeScreens.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="moodboard-output-enter bg-white text-neutral-900">
          <WireframeOutputView
            screens={wireframeScreens}
            sessionId={session.session_id}
            onScreensChange={setWireframeScreens}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-zinc-100">
      <Link
        href="/"
        className="fixed left-4 top-4 z-30 text-sm text-white/80 transition hover:text-white"
      >
        designbyganesh
      </Link>

      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-4 pb-6 pt-14">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <MoodboardChatHistory
            messages={messages}
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
                brandName={clientName}
                variant="inline"
              />
            </div>
          ) : null}

          {loadingPreConfirm ? (
            <FloatingStatusCard
              title="Analyzing context…"
              subtitle="Preparing wireframe approach"
            />
          ) : null}

          {phase === "intro" && !generating && !showPreConfirm && !loadingPreConfirm ? (
            <div className="moodboard-card-enter mb-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[15px] leading-relaxed text-white">
                Which screens from your IA should I wireframe?
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {iaScreens.map((screen) => (
                  <button
                    key={screen.id}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleScreen(screen.screen_name)}
                    className={`${CHIP} ${selectedScreens.includes(screen.screen_name) ? CHIP_ACTIVE : ""}`}
                  >
                    {screen.screen_name}
                    <span className="ml-1 text-zinc-500">{screen.priority}</span>
                  </button>
                ))}
              </div>
              {iaScreens.length > 0 ? (
                <button
                  type="button"
                  disabled={busy || selectedScreens.length === 0}
                  onClick={() => void handleScreenSelectionContinue()}
                  className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <p className="mt-3 text-xs text-zinc-500">No screens found in IA inventory.</p>
              )}
            </div>
          ) : null}

          <MoodboardComposer
            value={composerText}
            onChange={setComposerText}
            onSubmit={() => void handleNotesSubmit()}
            disabled={busy || generating}
            hidden={composerHidden}
            placeholder="Add notes for this screen (optional)…"
            modelId={modelId}
            onModelChange={setModelId}
            showSkip={phase === "screen_notes" && !composerHidden}
            onSkip={() => {
              setComposerText("");
              void handleNotesSubmit();
            }}
          />
        </div>
      </div>
    </div>
  );
}

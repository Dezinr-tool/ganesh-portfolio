"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EANav } from "../_components/ea-nav";
import {
  loadChatMessages,
  notifyCalendarUpdated,
  saveChatMessages,
} from "@/lib/ea-client-storage";
import { DEFAULT_EA_NAME } from "@/lib/ea-settings-helpers";
import { extractMemoriesFromMessage } from "@/lib/memory-extractor";
import {
  isGreetingMessage,
  hasSchedulingIntent,
} from "@/lib/ea-scheduling-ui";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CalendarEventCreated = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  meetLink?: string;
  attendees?: string[];
  isAllDay: boolean;
};

const DEFAULT_MESSAGES: ChatMessage[] = [];

type LangMode = "en" | "hi" | "auto";
type VoiceState = "idle" | "listening" | "processing" | "speaking";

type MemoryItem = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
};

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const SILENCE_MS = 1500;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function recognitionLang(mode: LangMode): string {
  if (mode === "en") return "en-US";
  if (mode === "hi") return "hi-IN";
  return "en-US";
}

// Web Speech API (browser)
type SpeechRecognitionResultList = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    [index: number]: { transcript: string };
  };
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3Z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2Z" />
    </svg>
  );
}

function WaveformBars() {
  return (
    <div className="flex h-8 items-end justify-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-[var(--color-bg)]"
          style={{
            animation: "waveform 0.8s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
            height: "40%",
          }}
        />
      ))}
    </div>
  );
}

export default function EAChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<LangMode>("auto");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [calendarConfirmation, setCalendarConfirmation] =
    useState<CalendarEventCreated | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [autoplayBlocked, setAutoplayBlocked] = useState<Set<number>>(
    () => new Set(),
  );
  const [showVoiceBanner, setShowVoiceBanner] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);

  const messagesRef = useRef(messages);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const latestTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceModeRef = useRef(false);
  const langRef = useRef(lang);
  const historyRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const userGestureRef = useRef(false);
  const isBusyRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const showEmailInputRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
      setSpeechSupported(!!getSpeechRecognition());
      setShowVoiceBanner(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/ea/profile", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.needsOnboarding && !cancelled) {
          router.replace("/ea/onboarding");
        }
      } catch {
        // Profile API unavailable — chat works with default profile
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadMemories = useCallback(async () => {
    setMemoryLoading(true);
    try {
      const res = await fetch("/api/ea/memory?limit=20", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setMemories(Array.isArray(data.memories) ? data.memories : []);
      setMemoryCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      // keep existing count
    } finally {
      setMemoryLoading(false);
    }
  }, []);

  const persistImportantMemories = useCallback(
    async (userText: string, assistantText: string) => {
      const extracted = extractMemoriesFromMessage(userText, assistantText);
      if (extracted.length === 0) return;

      await Promise.all(
        extracted.map((memory) =>
          fetch("/api/ea/memory", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: memory.content,
              category: memory.category,
              source: "conversation",
              importance: memory.importance,
            }),
          }),
        ),
      );
    },
    [],
  );

  const handleDeleteMemory = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ea/memory/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) void loadMemories();
      } catch {
        // ignore
      }
    },
    [loadMemories],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSettingsAndMessages() {
      let name = DEFAULT_EA_NAME;
      try {
        const res = await fetch("/api/ea/settings", { credentials: "include" });
        const data = await res.json();
        if (typeof data.eaName === "string" && data.eaName.trim()) {
          name = data.eaName.trim();
        }
      } catch {
        // keep default name
      }

      if (cancelled) return;

      let loaded: ChatMessage[] | null = null;

      try {
        const convRes = await fetch("/api/ea/conversations", {
          credentials: "include",
        });
        if (convRes.ok) {
          const convData = await convRes.json();
          if (Array.isArray(convData.messages) && convData.messages.length > 0) {
            loaded = convData.messages as ChatMessage[];
          }
        }
      } catch {
        // fall back to localStorage
      }

      if (cancelled) return;

      if (loaded) {
        setMessages(loaded);
        messagesRef.current = loaded;
      } else {
        const stored = loadChatMessages<ChatMessage>();
        if (stored) {
          setMessages(stored);
          messagesRef.current = stored;
        } else {
          const initial = [
            {
              role: "assistant" as const,
              content: `Hi Ganesh — I'm ${name}, your Executive Assistant. Tap the mic to speak.`,
            },
          ];
          setMessages(initial);
          messagesRef.current = initial;
        }
      }
      setHydrated(true);
      void loadMemories();
    }

    void loadSettingsAndMessages();
    return () => {
      cancelled = true;
    };
  }, [loadMemories]);

  useEffect(() => {
    if (!hydrated) return;
    saveChatMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    showEmailInputRef.current = showEmailInput;
  }, [showEmailInput]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, liveTranscript, voiceState]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [clearSilenceTimer]);

  const stopSpeaking = useCallback(() => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        // already stopped
      }
      activeSourceRef.current = null;
    }
  }, []);

  const ensureAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!AudioCtx) return null;
      audioContextRef.current = new AudioCtx();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    return ctx;
  }, []);

  const markUserGesture = useCallback(async () => {
    userGestureRef.current = true;
    setVoiceEnabled(true);
    setShowVoiceBanner(false);
    await ensureAudioContext();
  }, [ensureAudioContext]);

  const playAudioBlob = useCallback(
    async (blob: Blob): Promise<boolean> => {
      if (!userGestureRef.current) {
        return false;
      }

      const ctx = await ensureAudioContext();
      if (!ctx) return false;

      stopSpeaking();

      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        return await new Promise<boolean>((resolve) => {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          activeSourceRef.current = source;

          source.onended = () => {
            if (activeSourceRef.current === source) {
              activeSourceRef.current = null;
            }
            resolve(true);
          };

          source.start(0);
        });
      } catch {
        return false;
      }
    },
    [ensureAudioContext, stopSpeaking],
  );

  const speak = useCallback(
    async (text: string): Promise<boolean> => {
      stopSpeaking();
      setVoiceState("speaking");

      try {
        if (userGestureRef.current) {
          await ensureAudioContext();
        }

        const res = await fetch("/api/ea/speak", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const contentType = res.headers.get("content-type") ?? "";

        if (res.ok && contentType.includes("audio")) {
          const blob = await res.blob();
          return await playAudioBlob(blob);
        }
      } catch {
        // ElevenLabs unavailable — text response still shown, no voice
      }

      return false;
    },
    [stopSpeaking, ensureAudioContext, playAudioBlob],
  );

  const replayMessage = useCallback(
    async (text: string, messageIndex: number) => {
      if (isBusyRef.current) return;

      isBusyRef.current = true;
      await markUserGesture();
      setAutoplayBlocked((prev) => {
        const next = new Set(prev);
        next.delete(messageIndex);
        return next;
      });

      try {
        const played = await speak(text);
        if (!played) {
          setAutoplayBlocked((prev) => new Set(prev).add(messageIndex));
        }
      } finally {
        setVoiceState("idle");
        isBusyRef.current = false;
      }
    },
    [markUserGesture, speak],
  );

  const sendMessage = useCallback(
    async (text: string, fromVoice = false) => {
      const trimmed = text.trim();
      if (!trimmed || isBusyRef.current) return;

      if (trimmed === "/clear") {
        isBusyRef.current = true;
        try {
          await fetch("/api/ea/conversations/clear", {
            method: "DELETE",
            credentials: "include",
          });
          const cleared = [
            {
              role: "assistant" as const,
              content: "Conversation history cleared.",
            },
          ];
          setMessages(cleared);
          messagesRef.current = cleared;
          saveChatMessages(cleared);
        } catch {
          setMessages([
            {
              role: "assistant" as const,
              content: "Could not clear history. Try again.",
            },
          ]);
        } finally {
          setInput("");
          isBusyRef.current = false;
        }
        return;
      }

      if (fromVoice) {
        await markUserGesture();
      }

      isBusyRef.current = true;
      voiceModeRef.current = fromVoice;
      stopListening();
      stopSpeaking();
      setLiveTranscript("");
      transcriptRef.current = "";
      latestTranscriptRef.current = "";

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const history = messagesRef.current;
      const nextMessages = [...history, userMessage];

      if (isGreetingMessage(trimmed)) {
        setShowEmailInput(false);
        setEmailInput("");
        setEmailError("");
        setCalendarConfirmation(null);
      }

      setMessages(nextMessages);
      setInput("");
      setVoiceState("processing");

      let reply = "Something went wrong. Please try again.";
      let askingForEmail = false;

      try {
        const res = await fetch("/api/ea/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.filter(
              (m) => m.role === "user" || m.role === "assistant",
            ),
            userMessage: trimmed,
            language: langRef.current,
          }),
        });

        const data = await res.json();
        reply = res.ok ? data.message : (data.error ?? reply);

        if (res.ok && data.calendarEvent) {
          setCalendarConfirmation(data.calendarEvent);
          notifyCalendarUpdated();
        } else if (res.ok && data.calendarPending) {
          setTimeout(() => notifyCalendarUpdated(), 3000);
        } else if (!hasSchedulingIntent(trimmed)) {
          setCalendarConfirmation(null);
        }

        if (res.ok) {
          await persistImportantMemories(trimmed, reply);
          await loadMemories();
        }

        askingForEmail = res.ok && data.needsGuestEmail === true;
      } catch {
        reply = "Connection error. Please try again.";
        askingForEmail = false;
      }

      const withReply = [
        ...nextMessages,
        { role: "assistant" as const, content: reply },
      ];
      setMessages(withReply);
      messagesRef.current = withReply;

      setShowEmailInput(askingForEmail);
      setEmailError("");
      if (askingForEmail) {
        voiceModeRef.current = false;
        stopListening();
        setTimeout(() => emailInputRef.current?.focus(), 100);
      } else {
        setEmailInput("");
      }

      const assistantIndex = withReply.length - 1;

      try {
        const played = await speak(reply);
        if (!played) {
          setAutoplayBlocked((prev) => new Set(prev).add(assistantIndex));
        }
      } finally {
        setVoiceState("idle");
        isBusyRef.current = false;

        if (
          voiceModeRef.current &&
          !askingForEmail &&
          getSpeechRecognition()
        ) {
          setTimeout(() => startListeningRef.current?.(), 400);
        }
      }
    },
    [markUserGesture, stopListening, stopSpeaking, speak, loadMemories, persistImportantMemories],
  );

  const startListeningRef = useRef<(() => void) | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (
      !SpeechRecognition ||
      isBusyRef.current ||
      showEmailInputRef.current ||
      voiceStateRef.current === "processing" ||
      voiceStateRef.current === "speaking"
    ) {
      return;
    }

    stopSpeaking();
    stopListening();

    transcriptRef.current = "";
    latestTranscriptRef.current = "";
    setLiveTranscript("");
    voiceModeRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.lang = recognitionLang(langRef.current);
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcriptRef.current += chunk;
        } else {
          interim += chunk;
        }
      }
      setLiveTranscript(transcriptRef.current + interim);
      latestTranscriptRef.current = transcriptRef.current + interim;
      setInput(transcriptRef.current + interim);

      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        const text = latestTranscriptRef.current.trim();
        if (text) {
          recognition.stop();
          void sendMessage(text, true);
        }
      }, SILENCE_MS);
    };

    recognition.onerror = () => {
      setVoiceState("idle");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setVoiceState((s) => (s === "listening" ? "idle" : s));
      }
    };

    recognitionRef.current = recognition;
    setVoiceState("listening");

    try {
      recognition.start();
    } catch {
      setVoiceState("idle");
    }
  }, [stopListening, stopSpeaking, clearSilenceTimer, sendMessage]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const handleTextSend = (event?: React.FormEvent | React.KeyboardEvent) => {
    event?.preventDefault();
    void markUserGesture();
    const value = inputRef.current?.value ?? input;
    const trimmed = value.trim();
    if (!trimmed || isBusyRef.current) return;
    voiceModeRef.current = false;
    setShowEmailInput(false);
    setEmailInput("");
    void sendMessage(trimmed, false);
  };

  const handleEmailSend = (event?: React.FormEvent | React.KeyboardEvent) => {
    event?.preventDefault();
    void markUserGesture();
    const trimmed = emailInput.trim();
    if (!trimmed || isBusyRef.current) return;

    if (!isValidEmail(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    setShowEmailInput(false);
    setEmailInput("");
    voiceModeRef.current = false;
    stopListening();
    void sendMessage(trimmed, false);
  };

  const toggleMic = () => {
    void markUserGesture();
    if (showEmailInput) return;
    if (voiceState === "listening") {
      stopListening();
      setVoiceState("idle");
      const text = liveTranscript.trim() || transcriptRef.current.trim();
      if (text) void sendMessage(text, true);
      return;
    }
    if (voiceState === "speaking") {
      stopSpeaking();
      setVoiceState("idle");
      isBusyRef.current = false;
      return;
    }
    startListening();
  };

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.abort();
      stopSpeaking();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [clearSilenceTimer, stopSpeaking]);

  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";
  const isProcessing = voiceState === "processing";

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--color-text)] text-[var(--color-text)]">
      <style>{`
        @keyframes waveform {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        @keyframes mic-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div className="shrink-0">
        <EANav />
      </div>

      <div className="mx-auto flex w-full min-h-0 max-w-lg flex-1 flex-col px-6 pb-4">
      {mounted && showVoiceBanner && !voiceEnabled ? (
        <button
          type="button"
          onClick={() => void markUserGesture()}
          className="mx-auto mt-3 flex w-full max-w-lg shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]"
        >
          🔊 Tap to enable voice
        </button>
      ) : null}

      {/* Language selector */}
      <div className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-between gap-2 pt-4">
        <button
          type="button"
          onClick={() => {
            setShowMemoryPanel(true);
            void loadMemories();
          }}
          className="rounded-full border border-[var(--color-text)] bg-[var(--color-bg)]/80 px-3 py-1 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] hover:text-[var(--color-text)]"
        >
          🧠 {memoryCount} {memoryCount === 1 ? "memory" : "memories"}
        </button>
        <div className="flex items-center gap-1">
          {(["en", "hi", "auto"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`rounded-full px-4 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
                lang === code
                  ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                  : "text-[var(--color-text)] hover:text-[var(--color-text)]"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {showMemoryPanel ? (
        <>
          <button
            type="button"
            aria-label="Close memories"
            className="fixed inset-0 z-40 bg-[var(--color-text)]/60"
            onClick={() => setShowMemoryPanel(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--color-text)] bg-[var(--color-bg)] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--color-bg)]">Saved memories</h2>
              <button
                type="button"
                onClick={() => setShowMemoryPanel(false)}
                className="text-xs text-[var(--color-text)] hover:text-[var(--color-text)]"
              >
                Close
              </button>
            </div>
            {memoryLoading ? (
              <p className="text-sm text-[var(--color-text)]">Loading…</p>
            ) : memories.length === 0 ? (
              <p className="text-sm text-[var(--color-text)]">
                No memories yet. Tell Virtual EA to remember something, or add one in
                Settings.
              </p>
            ) : (
              <ul className="space-y-3">
                {memories.map((memory) => (
                  <li
                    key={memory.id}
                    className="rounded-xl border border-[var(--color-text)] bg-[var(--color-text)]/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-[var(--color-text)]">{memory.content}</p>
                      <button
                        type="button"
                        onClick={() => void handleDeleteMemory(memory.id)}
                        className="shrink-0 text-xs text-[var(--color-text)] hover:text-[var(--color-accent)]"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text)]">
                        {memory.category}
                      </span>
                      <span className="text-[10px] text-[var(--color-text)]">
                        {new Date(memory.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

        {/* Calendar confirmation */}
        {calendarConfirmation ? (
          <div className="mb-4 shrink-0 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
              Meeting scheduled
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--color-bg)]">
              {calendarConfirmation.title}
            </p>
            <p className="mt-1 text-xs text-[var(--color-accent)]">
              {new Date(calendarConfirmation.start).toLocaleString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" — "}
              {new Date(calendarConfirmation.end).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {calendarConfirmation.location ? (
              <p className="mt-0.5 text-xs text-[var(--color-accent)]">
                {calendarConfirmation.location}
              </p>
            ) : null}
            {calendarConfirmation.attendees?.length ? (
              <p className="mt-1 text-xs text-[var(--color-accent)]">
                Guests: {calendarConfirmation.attendees.join(", ")}
              </p>
            ) : null}
            {calendarConfirmation.meetLink ? (
              <a
                href={calendarConfirmation.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-[var(--color-accent)] underline underline-offset-2 hover:text-[var(--color-accent)]"
              >
                Join Google Meet
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Conversation history */}
        <div
          ref={historyRef}
          data-lenis-prevent
          className="relative z-10 h-0 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain py-4 [-webkit-overflow-scrolling:touch]"
          style={{ overflowY: "auto" }}
        >
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                      : "text-[var(--color-text)]"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" ? (
                    <button
                      type="button"
                      onClick={() => void replayMessage(msg.content, i)}
                      disabled={isProcessing || isSpeaking}
                      className={`mt-2 block text-xs transition-colors disabled:opacity-40 ${
                        autoplayBlocked.has(i)
                          ? "text-[var(--color-accent)] hover:text-[var(--color-accent)]"
                          : "text-[var(--color-text)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      🔊 Tap to hear
                    </button>
                  ) : null}
                </div>
              </div>
            ))}

            {isProcessing ? (
              <div className="flex justify-start">
                <div className="flex gap-1 px-2 py-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-bg)] [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-bg)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-bg)] [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} aria-hidden="true" className="h-px shrink-0" />
          </div>
        </div>

        <div className="shrink-0">
        {/* Live transcript */}
        <div className="mb-4 min-h-[2.5rem] text-center">
          {mounted && isListening && liveTranscript ? (
            <p className="text-base font-light text-[var(--color-bg)]/90">{liveTranscript}</p>
          ) : mounted && isListening ? (
            <p className="text-sm text-[var(--color-text)]">Listening…</p>
          ) : null}
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center pb-6">
          {mounted && !speechSupported ? (
            <p className="mb-4 text-center text-xs text-[var(--color-text)]">
              Voice not supported in this browser. Use text input below.
            </p>
          ) : null}

          <div className="relative flex h-36 w-36 items-center justify-center">
            {mounted && isListening ? (
              <>
                <span
                  className="absolute inset-0 rounded-full border border-[var(--color-bg)]/20"
                  style={{ animation: "mic-pulse 1.5s ease-out infinite" }}
                />
                <span
                  className="absolute inset-0 rounded-full border border-[var(--color-bg)]/10"
                  style={{
                    animation: "mic-pulse 1.5s ease-out infinite",
                    animationDelay: "0.5s",
                  }}
                />
              </>
            ) : null}

            <button
              type="button"
              onClick={toggleMic}
              disabled={isProcessing || showEmailInput}
              aria-label={
                isListening
                  ? "Stop listening"
                  : isSpeaking
                    ? "Stop speaking"
                    : "Start listening"
              }
              className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300 disabled:opacity-40 ${
                isListening
                  ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-[0_0_60px_var(--color-bg)]"
                  : isSpeaking
                    ? "bg-[var(--color-bg)] text-[var(--color-bg)] ring-2 ring-[var(--color-bg)]"
                    : "bg-[var(--color-bg)] text-[var(--color-bg)] ring-1 ring-[var(--color-text)] hover:bg-[var(--color-bg)] hover:ring-[var(--color-text)]"
              }`}
            >
              {isSpeaking ? (
                <WaveformBars />
              ) : (
                <MicIcon className="h-10 w-10" />
              )}
            </button>
          </div>

          <p className="mt-4 text-xs text-[var(--color-text)]">
            {showEmailInput
              ? "Type the email below — voice won't work for email addresses"
              : mounted && isListening
              ? "Speak — I'll send when you pause"
              : mounted && isSpeaking
                ? "EA is speaking"
                : isProcessing
                  ? "Thinking…"
                  : "Tap to speak"}
          </p>
        </div>

        {showEmailInput ? (
          <form
            className="mb-3 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] p-4"
            onSubmit={handleEmailSend}
          >
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-accent)]">
              Enter guest email address
            </label>
            <div className="flex gap-2">
              <input
                ref={emailInputRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmailSend(e);
                }}
                placeholder="hello@designbyganesh.com"
                disabled={isProcessing || isSpeaking}
                className="flex-1 rounded-lg border border-[var(--color-accent)] bg-[var(--color-text)] px-3 py-2.5 text-sm text-[var(--color-bg)] outline-none placeholder:text-[var(--color-text)] focus:border-[var(--color-accent)] disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={isProcessing || isSpeaking || !emailInput.trim()}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {emailError ? (
              <p className="mt-2 text-xs text-[var(--color-accent)]">{emailError}</p>
            ) : null}
          </form>
        ) : null}

        {/* Secondary text input */}
        <form
          className="border-t border-[var(--color-text)] pt-3"
          onSubmit={handleTextSend}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleTextSend(e);
                }
              }}
              placeholder="Or type here…"
              disabled={isProcessing || isSpeaking}
              className="flex-1 rounded-lg border border-[var(--color-text)]/80 bg-transparent px-3 py-2 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text)] focus:border-[var(--color-text)] disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={isProcessing || isSpeaking || !input.trim()}
              className="rounded-lg px-3 py-2 text-xs text-[var(--color-text)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

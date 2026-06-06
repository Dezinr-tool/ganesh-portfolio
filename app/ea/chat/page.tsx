"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EANav } from "../_components/ea-nav";
import {
  loadChatMessages,
  notifyCalendarUpdated,
  saveChatMessages,
} from "@/lib/ea-client-storage";
import { DEFAULT_EA_NAME } from "@/lib/ea-settings-helpers";

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

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const SILENCE_MS = 1500;

const EMAIL_PROMPT_PATTERN =
  /\b(email address|email id|attendee email|guest email|their email|recipient email|invite email|ईमेल|email do|email bhej|email bhejo|email share)\b/i;

function isAskingForEmail(text: string): boolean {
  const normalized = text.toLowerCase();
  if (EMAIL_PROMPT_PATTERN.test(normalized)) return true;

  return (
    /\bemail\b/i.test(text) &&
    (/\?/.test(text) ||
      /\b(what|which|need|share|send|enter|type|provide|give|batao|dedo)\b/i.test(
        normalized,
      ))
  );
}

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
          className="w-1 rounded-full bg-white"
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
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<LangMode>("auto");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [input, setInput] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [calendarConfirmation, setCalendarConfirmation] =
    useState<CalendarEventCreated | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [autoplayBlocked, setAutoplayBlocked] = useState<Set<number>>(
    () => new Set(),
  );

  const messagesRef = useRef(messages);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const latestTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceModeRef = useRef(false);
  const langRef = useRef(lang);
  const historyRef = useRef<HTMLDivElement>(null);
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
      setHydrated(true);
    }

    void loadSettingsAndMessages();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  useEffect(() => {
    historyRef.current?.scrollTo({
      top: historyRef.current.scrollHeight,
      behavior: "smooth",
    });
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
        }
      } catch {
        reply = "Connection error. Please try again.";
      }

      const withReply = [
        ...nextMessages,
        { role: "assistant" as const, content: reply },
      ];
      setMessages(withReply);
      messagesRef.current = withReply;

      askingForEmail = isAskingForEmail(reply);
      setShowEmailInput(askingForEmail);
      setEmailError("");
      if (askingForEmail) {
        voiceModeRef.current = false;
        stopListening();
        setTimeout(() => emailInputRef.current?.focus(), 100);
      } else if (isValidEmail(trimmed)) {
        setShowEmailInput(false);
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
    [markUserGesture, stopListening, stopSpeaking, speak],
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

  startListeningRef.current = startListening;

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
    <div className="flex h-screen flex-col bg-black text-zinc-100">
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

      <EANav />

      {/* Language selector */}
      <div className="mx-auto flex w-full max-w-lg items-center justify-center gap-1 px-6 pt-4">
        {(["en", "hi", "auto"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`rounded-full px-4 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
              lang === code
                ? "bg-white text-black"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden px-6 pb-4">
        {/* Calendar confirmation */}
        {calendarConfirmation ? (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
              Meeting scheduled
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {calendarConfirmation.title}
            </p>
            <p className="mt-1 text-xs text-emerald-200/80">
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
              <p className="mt-0.5 text-xs text-emerald-200/60">
                {calendarConfirmation.location}
              </p>
            ) : null}
            {calendarConfirmation.attendees?.length ? (
              <p className="mt-1 text-xs text-emerald-200/70">
                Guests: {calendarConfirmation.attendees.join(", ")}
              </p>
            ) : null}
            {calendarConfirmation.meetLink ? (
              <a
                href={calendarConfirmation.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
              >
                Join Google Meet
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Conversation history */}
        <div
          ref={historyRef}
          className="min-h-0 flex-1 overflow-y-auto py-4 scrollbar-thin"
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
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400"
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
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-zinc-600 hover:text-zinc-400"
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
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Live transcript */}
        <div className="mb-4 min-h-[2.5rem] text-center">
          {isListening && liveTranscript ? (
            <p className="text-base font-light text-white/90">{liveTranscript}</p>
          ) : isListening ? (
            <p className="text-sm text-zinc-600">Listening…</p>
          ) : null}
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center pb-6">
          {!speechSupported ? (
            <p className="mb-4 text-center text-xs text-zinc-500">
              Voice not supported in this browser. Use text input below.
            </p>
          ) : null}

          <div className="relative flex h-36 w-36 items-center justify-center">
            {isListening ? (
              <>
                <span
                  className="absolute inset-0 rounded-full border border-white/20"
                  style={{ animation: "mic-pulse 1.5s ease-out infinite" }}
                />
                <span
                  className="absolute inset-0 rounded-full border border-white/10"
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
                  ? "bg-white text-black shadow-[0_0_60px_rgba(255,255,255,0.15)]"
                  : isSpeaking
                    ? "bg-zinc-800 text-white ring-2 ring-white/30"
                    : "bg-zinc-900 text-white ring-1 ring-zinc-700 hover:bg-zinc-800 hover:ring-zinc-500"
              }`}
            >
              {isSpeaking ? (
                <WaveformBars />
              ) : (
                <MicIcon className="h-10 w-10" />
              )}
            </button>
          </div>

          <p className="mt-4 text-xs text-zinc-600">
            {showEmailInput
              ? "Type the email below — voice won't work for email addresses"
              : isListening
              ? "Speak — I'll send when you pause"
              : isSpeaking
                ? "EA is speaking"
                : isProcessing
                  ? "Thinking…"
                  : "Tap to speak"}
          </p>
        </div>

        {showEmailInput ? (
          <form
            className="mb-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4"
            onSubmit={handleEmailSend}
          >
            <label className="mb-1.5 block text-xs font-medium text-sky-300">
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
                placeholder="name@company.com"
                disabled={isProcessing || isSpeaking}
                className="flex-1 rounded-lg border border-sky-500/30 bg-black px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-400 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={isProcessing || isSpeaking || !emailInput.trim()}
                className="rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-sky-300 disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {emailError ? (
              <p className="mt-2 text-xs text-red-400">{emailError}</p>
            ) : null}
          </form>
        ) : null}

        {/* Secondary text input */}
        <form
          className="border-t border-zinc-900 pt-3"
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
              className="flex-1 rounded-lg border border-zinc-800/80 bg-transparent px-3 py-2 text-xs text-zinc-400 outline-none placeholder:text-zinc-700 focus:border-zinc-700 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={isProcessing || isSpeaking || !input.trim()}
              className="rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

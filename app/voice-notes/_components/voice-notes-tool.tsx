"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VoiceNote = {
  text: string;
  time: string;
};

const STORAGE_KEY = "voice-notes-web";

// Errors that mean retrying won't help until the user acts (permission, hardware).
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);
// Errors that are just Chrome pausing recognition — safe to auto-restart.
const TRANSIENT_ERRORS = new Set(["no-speech", "aborted", "network"]);

const WATCHDOG_MS = 12000;
const MAX_CONSECUTIVE_RESTARTS = 8;

function loadNotes(): VoiceNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: VoiceNote[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* storage full or unavailable — notes stay in memory for this session */
  }
}

export function VoiceNotesTool() {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Click the mic to start");
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const restartCountRef = useRef(0);
  const lastActivityRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // onend always fires right after onerror — this flag stops it from stomping
  // a specific error message with the generic "Click the mic to start" reset.
  const suppressNextEndResetRef = useRef(false);

  useEffect(() => {
    setNotes(loadNotes());
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) setSupported(false);
  }, []);

  const addNote = useCallback((text: string) => {
    if (!text.trim()) return;
    setNotes((prev) => {
      const next = [{ text: text.trim(), time: new Date().toLocaleString() }, ...prev];
      saveNotes(next);
      return next;
    });
  }, []);

  const deleteNote = useCallback((index: number) => {
    setNotes((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveNotes(next);
      return next;
    });
  }, []);

  const stopWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const buildRecognition = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      lastActivityRef.current = Date.now();
      if (listeningRef.current) setStatus("Listening… speak now");
    };

    rec.onresult = (event) => {
      lastActivityRef.current = Date.now();
      restartCountRef.current = 0;
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          addNote(transcript);
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = (event) => {
      lastActivityRef.current = Date.now();
      if (TRANSIENT_ERRORS.has(event.error)) return;

      if (FATAL_ERRORS.has(event.error)) {
        listeningRef.current = false;
        setListening(false);
        stopWatchdog();
        suppressNextEndResetRef.current = true;
        const message =
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Mic permission denied — allow microphone access and try again."
            : "No microphone found.";
        setStatus(message);
        return;
      }

      console.error("Recognition error:", event.error);
      suppressNextEndResetRef.current = true;
      setStatus(`Error: ${event.error}`);
    };

    rec.onend = () => {
      if (!listeningRef.current) {
        setInterim("");
        if (suppressNextEndResetRef.current) {
          suppressNextEndResetRef.current = false;
          return;
        }
        setStatus("Click the mic to start");
        return;
      }

      restartCountRef.current += 1;
      if (restartCountRef.current > MAX_CONSECUTIVE_RESTARTS) {
        listeningRef.current = false;
        setListening(false);
        stopWatchdog();
        setStatus("Recognition kept failing — click the mic to try again.");
        return;
      }

      setStatus("Reconnecting…");
      setTimeout(() => {
        if (!listeningRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.start();
        } catch (err) {
          if (err instanceof DOMException && err.name === "InvalidStateError") return;
          console.error("Restart failed:", err);
        }
      }, 150);
    };

    return rec;
  }, [addNote, stopWatchdog]);

  const startWatchdog = useCallback(() => {
    stopWatchdog();
    watchdogRef.current = setInterval(() => {
      if (!listeningRef.current) return;
      if (Date.now() - lastActivityRef.current < WATCHDOG_MS) return;
      // No onstart/onresult/onend activity for a while — recognition silently stalled.
      // Force a clean restart rather than leaving the mic looking "on" but dead.
      lastActivityRef.current = Date.now();
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = buildRecognition();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setStatus("Reconnecting…");
        } catch {
          /* onend/onerror from the old instance will trigger the normal restart path */
        }
      }
    }, 3000);
  }, [buildRecognition, stopWatchdog]);

  useEffect(() => stopWatchdog, [stopWatchdog]);

  const toggleListening = useCallback(() => {
    if (!listening) {
      const rec = buildRecognition();
      if (!rec) {
        setStatus("Speech recognition isn't supported in this browser.");
        return;
      }
      recognitionRef.current = rec;
      listeningRef.current = true;
      restartCountRef.current = 0;
      lastActivityRef.current = Date.now();
      setListening(true);
      setStatus("Listening… speak now");
      try {
        rec.start();
        startWatchdog();
      } catch (err) {
        console.error("Mic start failed:", err);
        setStatus(`Couldn't start mic: ${err instanceof Error ? err.message : String(err)}`);
        listeningRef.current = false;
        setListening(false);
      }
    } else {
      listeningRef.current = false;
      setListening(false);
      setStatus("Stopped");
      setInterim("");
      stopWatchdog();
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.error("Mic stop failed:", err);
      }
    }
  }, [listening, buildRecognition, startWatchdog, stopWatchdog]);

  const handleExport = useCallback(() => {
    const text = notes.map((n) => `[${n.time}]\n${n.text}\n`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voice-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [notes]);

  const handleClear = useCallback(() => {
    if (!window.confirm("Delete all notes? This can't be undone.")) return;
    setNotes([]);
    saveNotes([]);
  }, []);

  return (
    <div className="flex flex-col bg-[#121212] px-5 py-6 text-[#f2f2f2]">
      <div className="mb-5 flex items-center gap-3.5">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!supported}
          data-testid="voice-notes-mic"
          className={`h-14 w-14 shrink-0 rounded-full border-none text-xl text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            listening ? "animate-pulse bg-[#ff453a]" : "bg-[#0a84ff]"
          }`}
        >
          🎙️
        </button>
        <div className="text-sm text-[#bbb]" data-testid="voice-notes-status">
          {status}
        </div>
      </div>

      <div className="mb-4 min-h-[24px] text-sm italic text-[#888]">{interim}</div>

      <div className="mb-4 flex gap-2.5">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md border border-[#333] bg-[#1e1e1e] px-3.5 py-2 text-[13px] text-[#f2f2f2] hover:bg-[#2a2a2a]"
        >
          Export as .txt
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-[#333] bg-[#1e1e1e] px-3.5 py-2 text-[13px] text-[#f2f2f2] hover:bg-[#2a2a2a]"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-2.5" data-testid="voice-notes-list">
        {notes.length === 0 ? (
          <p className="mt-10 text-center text-[13px] text-[#666]">
            No notes yet — click the mic and start talking.
          </p>
        ) : (
          notes.map((note, index) => (
            <div key={`${note.time}-${index}`} className="relative rounded-[10px] border border-[#2a2a2a] bg-[#1e1e1e] p-3.5">
              <button
                type="button"
                onClick={() => deleteNote(index)}
                aria-label="Delete note"
                className="absolute right-2.5 top-2 text-[13px] text-[#666] hover:text-[#ff453a]"
              >
                ✕
              </button>
              <div className="mb-1 text-[11px] text-[#777]">{note.time}</div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{note.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

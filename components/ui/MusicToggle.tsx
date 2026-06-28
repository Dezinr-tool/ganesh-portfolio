"use client";

import { useEffect, useRef, useState } from "react";
import "./music-toggle.css";

const STORAGE_KEY = "portfolio-music-muted";
const DEFAULT_VOLUME = 0.4;

function SpeakerOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Start as muted until user explicitly unmutes or has previously enabled
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  // On mount, check if user previously chose to play (not muted)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // null = first visit → stay muted. "0" = user previously unmuted → auto-play
    if (saved === "0") {
      setMuted(false);
    }
  }, []);

  // Start audio on first user interaction anywhere on the page
  useEffect(() => {
    if (started) return;
    const handleInteraction = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = DEFAULT_VOLUME;
      audio.muted = muted;
      audio.play().catch(() => {});
      setStarted(true);
    };
    window.addEventListener("pointerdown", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    window.addEventListener("scroll", handleInteraction, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
    };
  }, [started, muted]);

  // Sync muted state to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (!muted && started) {
      audio.play().catch(() => {});
    }
  }, [muted, started]);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    // If first toggle-on before any interaction, start playing now
    if (!next && !started) {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = DEFAULT_VOLUME;
        audio.muted = false;
        audio.play().catch(() => {});
        setStarted(true);
      }
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/bg-music.mp3"
        loop
        preload="none"
        muted
      />
      <button
        className="music-toggle"
        onClick={toggle}
        aria-label={muted ? "Unmute background music" : "Mute background music"}
        title={muted ? "Play music" : "Mute music"}
      >
        {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
        <span className="music-toggle__label">{muted ? "music" : "music"}</span>
      </button>
    </>
  );
}

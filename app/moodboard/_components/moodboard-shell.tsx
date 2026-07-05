"use client";

import type { ReactNode } from "react";
import { HeroMotionBackground } from "@/components/hero-motion-background";
import { MoodboardSidebar } from "./moodboard-sidebar";

export function MoodboardShell({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  return (
    <div className="moodboard-app">
      <div className="moodboard-layout">
        <MoodboardSidebar activeSessionId={sessionId} />
        <main className="moodboard-main">
          <HeroMotionBackground idPrefix="moodboard-hero" />
          <div className="moodboard-main-scrim" aria-hidden />
          <div className="moodboard-main-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

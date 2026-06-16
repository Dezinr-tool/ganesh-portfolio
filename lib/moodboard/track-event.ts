"use client";

type MoodboardEventPayload = Record<string, unknown>;

const questionStartedAt = new Map<string, number>();

export function markQuestionStarted(questionKey: string) {
  questionStartedAt.set(questionKey, Date.now());
}

export function getQuestionDurationMs(questionKey: string): number | undefined {
  const started = questionStartedAt.get(questionKey);
  if (!started) return undefined;
  questionStartedAt.delete(questionKey);
  return Date.now() - started;
}

export async function trackMoodboardEvent(
  sessionId: string | null | undefined,
  eventType: string,
  payload: MoodboardEventPayload = {},
  durationMs?: number,
) {
  if (!sessionId) return;
  try {
    await fetch("/api/moodboard/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        eventType,
        payload,
        durationMs,
      }),
    });
  } catch {
    /* analytics must not block UX */
  }
}

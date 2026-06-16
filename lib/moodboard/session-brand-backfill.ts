import type { MoodboardSession } from "./db-types";
import { getSessionEvents } from "./analytics";
import { extractBrandFromOpeningMessage } from "./intake-helpers";
import { normalizeAnswer } from "./question-flow";
import { updateSession } from "./db-store";

export async function backfillBrandFromOpening(
  session: MoodboardSession,
): Promise<MoodboardSession> {
  if (normalizeAnswer(session.answers?.q1)) return session;

  let openingMessage = session.answers?._opening_message;
  if (!openingMessage) {
    const events = await getSessionEvents(session.session_id);
    const started = events.find((event) => event.event_type === "session_started");
    const fromEvent = started?.payload?.openingMessage;
    if (typeof fromEvent === "string" && fromEvent.trim()) {
      openingMessage = fromEvent.trim();
    }
  }

  if (!openingMessage) return session;

  const openingText = String(openingMessage);
  const inferred = extractBrandFromOpeningMessage(openingText);
  const nextAnswers = {
    ...session.answers,
    _opening_message: openingText,
    ...(inferred ? { q1: inferred } : {}),
  };

  const updated = await updateSession(session.session_id, {
    answers: nextAnswers,
    ...(inferred ? { brand_name: inferred } : {}),
  });

  return updated ?? session;
}

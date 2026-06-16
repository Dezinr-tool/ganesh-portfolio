import type { MoodboardSession } from "./db-types";
import { getSessionEvents } from "./analytics";
import {
  extractFromMessage,
  mergeExtractedIntoAnswers,
} from "./context-extraction";
import { extractBrandName, extractProjectType, normalizeAnswer } from "./question-flow";
import { updateSession } from "./db-store";

export async function backfillBrandFromOpening(
  session: MoodboardSession,
): Promise<MoodboardSession> {
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
  const extracted = extractFromMessage(openingText);
  const nextAnswers = mergeExtractedIntoAnswers(
    { ...session.answers, _opening_message: openingText },
    extracted,
  );

  if (JSON.stringify(nextAnswers) === JSON.stringify(session.answers)) {
    return session;
  }

  const brandName = extractBrandName(nextAnswers);
  const projectType = extractProjectType(nextAnswers);

  const updated = await updateSession(session.session_id, {
    answers: nextAnswers,
    ...(brandName !== "Your Brand" ? { brand_name: brandName } : {}),
    ...(normalizeAnswer(nextAnswers.q3) ? { project_type: projectType } : {}),
  });

  return updated ?? session;
}

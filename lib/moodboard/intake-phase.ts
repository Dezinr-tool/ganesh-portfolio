import { countCoreFields, isReadyToGenerate } from "./intake-fields";
import { getSelectedOutputSections, MIN_OUTPUT_SECTIONS } from "./output-sections";
import { replySignalsSectionsPicker } from "./sections-picker-question";

export type MoodboardIntakePhase = "chat" | "sections" | "generating" | "done";

export const GENERATE_INTENT =
  /\b(generate|create|go ahead|yes,? generate|start generation|build (?:the )?moodboard|just create|make (?:the )?moodboard|create (?:the )?moodboard)\b/i;

export const PANEL_HELP_PATTERN =
  /\b(can'?t see|cannot see|don'?t see|do not see|not see(?:ing)?|missing panel|no panel|where(?:'s| is) the panel|panel (?:is )?missing|cant see panel)\b/i;

type MessageLike = { role: string; text: string };

export function conversationSignalsSections(messages: MessageLike[]): boolean {
  return messages.some(
    (m) => m.role === "assistant" && replySignalsSectionsPicker(m.text),
  );
}

export function userRequestedGeneration(text: string): boolean {
  return GENERATE_INTENT.test(text.trim());
}

export function userNeedsPanelHelp(text: string): boolean {
  return PANEL_HELP_PATTERN.test(text.trim());
}

export function shouldOfferSectionsPhase(opts: {
  answers: Record<string, unknown>;
  messages: MessageLike[];
  directionsCount: number;
  showSectionsPicker?: boolean;
}): boolean {
  if (opts.directionsCount > 0) return false;

  const userTurns = opts.messages.filter((m) => m.role === "user").length;

  return (
    opts.showSectionsPicker === true ||
    isReadyToGenerate(opts.answers) ||
    countCoreFields(opts.answers) >= 4 ||
    conversationSignalsSections(opts.messages) ||
    (userTurns >= 2 && countCoreFields(opts.answers) >= 3)
  );
}

export function hasPendingSectionSelection(answers: Record<string, unknown>): boolean {
  return getSelectedOutputSections(answers).length < MIN_OUTPUT_SECTIONS;
}

export function resolveIntakePhase(opts: {
  directionsCount: number;
  generating: boolean;
  offerSections: boolean;
  sectionsConfirmed: boolean;
}): MoodboardIntakePhase {
  if (opts.directionsCount > 0) return "done";
  if (opts.generating) return "generating";
  if (opts.offerSections && opts.sectionsConfirmed) return "generating";
  if (opts.offerSections) return "sections";
  return "chat";
}

import Anthropic from "@anthropic-ai/sdk";
import { getModelConfig } from "./models";
import {
  countCoreFields,
  formatCollectedForPrompt,
  formatMissingForPrompt,
  isReadyToGenerate,
} from "./intake-fields";
import type { MoodboardModelId } from "./types";

export type IntakeChatMessage = {
  role: "user" | "assistant";
  text: string;
};

function intakeModel(modelId: MoodboardModelId): string {
  const config = getModelConfig(modelId);
  if (config.provider === "anthropic") return config.model;
  return "claude-haiku-4-5-20251001";
}

export function buildIntakeSystemPrompt(
  answers: Record<string, unknown>,
  extras?: {
    websiteAnalysis?: string;
    brandResearch?: string;
  },
): string {
  const collected = formatCollectedForPrompt(answers);
  const missing = formatMissingForPrompt(answers);
  const coreCount = countCoreFields(answers);
  const ready = isReadyToGenerate(answers);

  let researchBlock = "";
  if (extras?.websiteAnalysis) {
    researchBlock += `\n\nWebsite research (already done — do NOT ask for the URL again):\n${extras.websiteAnalysis}`;
  }
  if (extras?.brandResearch) {
    researchBlock += `\n\nBrand research:\n${extras.brandResearch}`;
  }

  return `You are a moodboard creation assistant for a premium design tool.
Your goal is to collect enough information to generate 3 visual moodboard directions.

Information to collect:
- Brand name
- What the brand does (business description)
- Project type (website / app / brand identity / campaign / logo)
- New brand or redesign
- If redesign: existing website URL (research may already be done)
- Target audience
- Brand values and visual feel (3–5 descriptive words)
- Color direction
- References or inspiration
- Things to avoid

TONE:
Be warm and professional — like a senior creative director, not a cheerleader.
Avoid: "chef's kiss", "love that!", "amazing!", "perfect!", excessive enthusiasm.
Instead: confident, considered, specific observations.
Example: "Dark luxury with celestial restraint — that's a strong direction."
NOT: "Those words are chef's kiss!"

RULES:
1. Read the ENTIRE conversation — never ask for something already provided.
2. NEVER ask more than ONE question per message. If you need multiple things, pick the most important one and ask that first. Wait for the user's response before asking the next thing.
3. Acknowledge what you understood before asking what's missing.
4. If the user says "verbaflo" or "moodboard for X" — X is the brand name.
5. If they mention website/app/logo/campaign — that's the project type.
6. Never repeat a question they already answered.
7. Do not use numbered lists or robotic survey language.
8. Keep replies under 120 words unless summarizing research.
9. You may use **bold** for emphasis on key terms sparingly.
10. NEVER output moodboard directions as markdown, prose, or bullet lists. Do not use --- dividers or **Direction 1** headers. When the user is ready to generate, tell them to choose moodboard elements in the panel below and click "Generate 3 directions" — do not generate directions yourself in chat.
${ready ? `11. You have ${coreCount} core fields — enough to generate. Direct the user to the element picker below (colors, typography, icons, etc.) and the Generate button.` : `11. Need at least 5 core fields before offering generation (currently ${coreCount}/5).`}

Already collected:
${collected}

Still missing (only ask about these if needed):
${missing}${researchBlock}

Reply naturally as the assistant. No JSON — plain text only.`;
}

export async function generateIntakeReply(
  messages: IntakeChatMessage[],
  answers: Record<string, unknown>,
  modelId: MoodboardModelId,
  extras?: {
    websiteAnalysis?: string;
    brandResearch?: string;
  },
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackReply(answers);
  }

  const anthropic = new Anthropic({ apiKey });
  const system = buildIntakeSystemPrompt(answers, extras);

  const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  if (apiMessages.length === 0) {
    return "Tell me about the brand or project you'd like to explore.";
  }

  try {
    const response = await anthropic.messages.create({
      model: intakeModel(modelId),
      max_tokens: 450,
      system,
      messages: apiMessages,
    });

    const block = response.content.find((b) => b.type === "text");
    const text = block?.type === "text" ? block.text.trim() : "";
    return text || fallbackReply(answers);
  } catch {
    return fallbackReply(answers);
  }
}

function fallbackReply(answers: Record<string, unknown>): string {
  if (isReadyToGenerate(answers)) {
    return "I have enough to work with — ready to generate your moodboard directions whenever you are.";
  }
  const missing = formatMissingForPrompt(answers);
  return `Got it. I'd love to learn more — could you tell me about ${missing.split(",")[0]?.toLowerCase() ?? "your project"}?`;
}

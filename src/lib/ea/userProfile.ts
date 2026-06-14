import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import { scoreSentiment } from "@/lib/memory-extractor";

export type CommunicationStyle =
  | "direct"
  | "collaborative"
  | "analytical"
  | "casual";

export type UserProfile = {
  sessionId: string;
  name: string;
  role: string;
  industry: string;
  communicationStyle: CommunicationStyle;
  timezone: string;
  workStyle: string | null;
  onboardingCompleted: boolean;
};

export type UserProfileInput = {
  name: string;
  role: string;
  industry: string;
  communicationStyle: CommunicationStyle;
  timezone: string;
  workStyle?: string | null;
};

type ProfileRow = {
  session_id: string;
  name: string;
  role: string;
  industry: string;
  communication_style: string;
  timezone: string;
  work_style: string | null;
  onboarding_completed: boolean;
};

const VALID_STYLES = new Set<CommunicationStyle>([
  "direct",
  "collaborative",
  "analytical",
  "casual",
]);

let profileTableAvailable: boolean | null = null;

function rowToProfile(row: ProfileRow): UserProfile {
  const style = VALID_STYLES.has(row.communication_style as CommunicationStyle)
    ? (row.communication_style as CommunicationStyle)
    : "casual";

  return {
    sessionId: row.session_id,
    name: row.name,
    role: row.role,
    industry: row.industry,
    communicationStyle: style,
    timezone: row.timezone || "Asia/Kolkata",
    workStyle: row.work_style,
    onboardingCompleted: row.onboarding_completed,
  };
}

/** Fallback profile so chat keeps working when DB is unavailable or no row exists. */
export function getDefaultUserProfile(sessionId: string): UserProfile {
  return {
    sessionId,
    name: "Ganesh",
    role: "Design Manager",
    industry: "Design / Technology",
    communicationStyle: "casual",
    timezone: "Asia/Kolkata",
    workStyle: null,
    onboardingCompleted: true,
  };
}

export async function getUserProfile(
  sessionId: string,
): Promise<UserProfile | null> {
  try {
    const { rows } = await sql<ProfileRow>`
      SELECT session_id, name, role, industry, communication_style,
             timezone, work_style, onboarding_completed
      FROM ea_user_profiles
      WHERE session_id = ${sessionId}
      LIMIT 1
    `;
    profileTableAvailable = true;
    return rows[0] ? rowToProfile(rows[0]) : null;
  } catch (err) {
    console.error("[userProfile] getUserProfile failed:", err);
    profileTableAvailable = false;
    return null;
  }
}

/** Profile for prompts — never throws; uses defaults when no stored profile. */
export async function getEffectiveUserProfile(
  sessionId: string,
): Promise<UserProfile> {
  const stored = await getUserProfile(sessionId);
  return stored ?? getDefaultUserProfile(sessionId);
}

export async function needsOnboarding(sessionId: string): Promise<boolean> {
  if (profileTableAvailable === false) return false;
  const stored = await getUserProfile(sessionId);
  if (!stored) return profileTableAvailable === true;
  return !stored.onboardingCompleted;
}

export async function saveUserProfile(
  sessionId: string,
  input: UserProfileInput,
): Promise<UserProfile> {
  const workStyle = input.workStyle?.trim() || null;
  const style = VALID_STYLES.has(input.communicationStyle)
    ? input.communicationStyle
    : "casual";

  await sql`
    INSERT INTO ea_user_profiles (
      session_id, name, role, industry, communication_style,
      timezone, work_style, onboarding_completed, updated_at
    )
    VALUES (
      ${sessionId},
      ${input.name.trim()},
      ${input.role.trim()},
      ${input.industry.trim()},
      ${style},
      ${input.timezone.trim() || "Asia/Kolkata"},
      ${workStyle},
      TRUE,
      NOW()
    )
    ON CONFLICT (session_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      industry = EXCLUDED.industry,
      communication_style = EXCLUDED.communication_style,
      timezone = EXCLUDED.timezone,
      work_style = EXCLUDED.work_style,
      onboarding_completed = TRUE,
      updated_at = NOW()
  `;

  profileTableAvailable = true;
  const saved = await getUserProfile(sessionId);
  if (!saved) {
    throw new Error("Failed to load profile after save.");
  }
  return saved;
}

const EMOTION_RULES: { label: string; pattern: RegExp }[] = [
  { label: "frustrated", pattern: /\b(frustrated|annoyed|irritated|pareshan|gussa)\b/i },
  { label: "excited", pattern: /\b(excited|thrilled|pumped|can't wait|jaldi)\b/i },
  { label: "stressed", pattern: /\b(stressed|overwhelmed|pressure|deadline|tension)\b/i },
  { label: "confused", pattern: /\b(confused|unsure|samajh nahi|clarify|not clear)\b/i },
  { label: "grateful", pattern: /\b(thanks|thank you|shukriya|appreciate|grateful)\b/i },
  { label: "curious", pattern: /\b(curious|wondering|how does|what if|batao|explain)\b/i },
];

export function inferEmotionLabel(content: string): string {
  for (const rule of EMOTION_RULES) {
    if (rule.pattern.test(content)) return rule.label;
  }
  const score = scoreSentiment(content);
  if (score > 0.25) return "positive";
  if (score < -0.25) return "negative";
  return "neutral";
}

export function analyzeMessageSentiment(content: string): {
  sentimentScore: number;
  emotionLabel: string;
} {
  return {
    sentimentScore: scoreSentiment(content),
    emotionLabel: inferEmotionLabel(content),
  };
}

export async function logMessageSentiment(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  if (!content.trim()) return;

  const { sentimentScore, emotionLabel } = analyzeMessageSentiment(content);
  const id = randomUUID();

  try {
    await sql`
      INSERT INTO ea_message_sentiment (
        id, session_id, role, content, sentiment_score, emotion_label, created_at
      )
      VALUES (
        ${id},
        ${sessionId},
        ${role},
        ${content.slice(0, 4000)},
        ${sentimentScore},
        ${emotionLabel},
        NOW()
      )
    `;
  } catch (err) {
    console.error("[userProfile] logMessageSentiment failed:", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { markOnboardingComplete } from "@/lib/auth-service";
import {
  getDefaultUserProfile,
  getUserProfile,
  needsOnboarding,
  saveUserProfile,
  type CommunicationStyle,
  type UserProfileInput,
} from "@/src/lib/ea/userProfile";

function isValidStyle(value: string): value is CommunicationStyle {
  return ["direct", "collaborative", "analytical", "casual"].includes(value);
}

function parseProfileInput(body: unknown): UserProfileInput | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const role = typeof data.role === "string" ? data.role.trim() : "";
  const industry = typeof data.industry === "string" ? data.industry.trim() : "";
  const timezone =
    typeof data.timezone === "string" && data.timezone.trim()
      ? data.timezone.trim()
      : "Asia/Kolkata";
  const communicationStyle =
    typeof data.communicationStyle === "string" &&
    isValidStyle(data.communicationStyle)
      ? data.communicationStyle
      : "casual";
  const workStyle =
    typeof data.workStyle === "string" ? data.workStyle.trim() : null;

  if (!name || !role || !industry) return null;

  return {
    name,
    role,
    industry,
    communicationStyle,
    timezone,
    workStyle: workStyle || null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  const stored = await getUserProfile(auth.sessionId);
  const profile = stored ?? getDefaultUserProfile(auth.sessionId);
  const onboardingRequired = await needsOnboarding(auth.sessionId);

  return NextResponse.json({
    profile,
    needsOnboarding: onboardingRequired,
    hasStoredProfile: Boolean(stored),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = parseProfileInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Name, role, and industry are required." },
      { status: 400 },
    );
  }

  try {
    const profile = await saveUserProfile(auth.sessionId, input);

    try {
      await markOnboardingComplete(auth.sessionId);
    } catch {
      // ea_users may not exist for legacy password sessions
    }

    return NextResponse.json({ profile, needsOnboarding: false });
  } catch (err) {
    console.error("[ea/profile] save failed:", err);
    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 },
    );
  }
}

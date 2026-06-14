import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import {
  CALENDAR_OAUTH_REDIRECT_URI,
  decodeCalendarOAuthState,
  exchangeCodeForTokens,
  getCalendarOAuthRedirectUri,
} from "@/lib/google-calendar";

const LOCAL_SETTINGS_ORIGIN = "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateSessionId = decodeCalendarOAuthState(searchParams.get("state"));
  const cookieSessionId = await resolveEaSessionId(request);
  const sessionId = stateSessionId ?? cookieSessionId;
  const redirectUri = getCalendarOAuthRedirectUri();

  console.info("[ea/calendar/callback] saving tokens for sessionId:", sessionId, {
    fromOAuthState: stateSessionId,
    fromCookie: cookieSessionId,
  });
  console.info(
    "[ea/calendar/callback] EXACT redirect_uri for token exchange:",
    redirectUri,
  );
  console.info(
    "[ea/calendar/callback] hardcoded local redirect_uri constant:",
    CALENDAR_OAUTH_REDIRECT_URI,
  );

  const settingsUrl = new URL("/ea/settings", LOCAL_SETTINGS_ORIGIN);

  if (error) {
    console.error("[ea/calendar/callback] Google OAuth error:", error);
    settingsUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(settingsUrl);
  }

  if (!sessionId) {
    console.error("[ea/calendar/callback] missing sessionId — cannot save tokens");
    settingsUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    await exchangeCodeForTokens(sessionId, code);
    settingsUrl.searchParams.set("calendar", "connected");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("calendar callback error:", err);
    settingsUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(settingsUrl);
  }
}

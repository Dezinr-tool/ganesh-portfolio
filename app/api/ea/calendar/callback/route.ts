import { NextRequest, NextResponse } from "next/server";
import {
  decodeCalendarOAuthState,
  exchangeCodeForTokens,
  getCalendarOAuthRedirectUri,
} from "@/lib/google-calendar";
import { resolveEaSessionId } from "@/lib/ea-api-auth";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateSessionId = decodeCalendarOAuthState(searchParams.get("state"));
  const cookieSessionId = await resolveEaSessionId(request);
  const sessionId = stateSessionId ?? cookieSessionId;
  const redirectUri = getCalendarOAuthRedirectUri(origin);

  console.info("[ea/calendar/callback] request origin:", origin);
  console.info("[ea/calendar/callback] saving tokens for sessionId:", sessionId, {
    fromOAuthState: stateSessionId,
    fromCookie: cookieSessionId,
  });
  console.info(
    "[ea/calendar/callback] EXACT redirect_uri for token exchange:",
    redirectUri,
  );

  const settingsUrl = new URL("/ea/settings", origin);

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
    await exchangeCodeForTokens(sessionId, code, origin);
    settingsUrl.searchParams.set("calendar", "connected");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("calendar callback error:", err);
    settingsUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(settingsUrl);
  }
}

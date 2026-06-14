import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import {
  CALENDAR_OAUTH_REDIRECT_URI,
  getAuthUrl,
  getCalendarOAuthRedirectUri,
} from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const redirectUri = getCalendarOAuthRedirectUri();
    const url = getAuthUrl(sessionId);
    const parsed = new URL(url);
    const redirectParam = parsed.searchParams.get("redirect_uri");

    console.info("[ea/calendar/auth] sessionId:", sessionId);
    console.info(
      "[ea/calendar/auth] EXACT client_id sent to Google:",
      process.env.GOOGLE_CLIENT_ID ?? "(missing)",
    );
    console.info(
      "[ea/calendar/auth] EXACT redirect_uri sent to Google:",
      redirectUri,
    );
    console.info(
      "[ea/calendar/auth] EXACT redirect_uri in OAuth URL param:",
      redirectParam,
    );
    console.info("[ea/calendar/auth] EXACT full OAuth URL:", url);
    console.info(
      "[ea/calendar/auth] hardcoded local redirect_uri constant:",
      CALENDAR_OAUTH_REDIRECT_URI,
    );

    if (redirectParam !== redirectUri) {
      console.error("[ea/calendar/auth] redirect_uri mismatch in URL", {
        expected: redirectUri,
        actual: redirectParam,
      });
      return NextResponse.json(
        {
          error: "OAuth redirect_uri mismatch in generated URL.",
          expected: redirectUri,
          actual: redirectParam,
        },
        { status: 500 },
      );
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("calendar auth error:", error);
    return NextResponse.json(
      { error: "Failed to start Google Calendar authorization." },
      { status: 500 },
    );
  }
}

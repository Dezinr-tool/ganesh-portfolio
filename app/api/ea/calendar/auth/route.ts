import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import {
  getAuthUrl,
  getCalendarOAuthRedirectUri,
} from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const origin = request.nextUrl.origin;
    const redirectUri = getCalendarOAuthRedirectUri(origin);
    const url = getAuthUrl(sessionId, origin);
    const parsed = new URL(url);
    const redirectParam = parsed.searchParams.get("redirect_uri");
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";

    console.info("[ea/calendar/auth] sessionId:", sessionId);
    console.info("[ea/calendar/auth] request origin:", origin);
    console.info(
      "[ea/calendar/auth] EXACT client_id sent to Google:",
      clientId || "(missing — add GOOGLE_CLIENT_ID to Vercel!)",
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

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_CLIENT_ID is not configured. Add it to Vercel environment variables.",
        },
        { status: 500 },
      );
    }

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

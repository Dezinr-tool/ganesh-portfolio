import { NextRequest, NextResponse } from "next/server";
import {
  getCalendarOAuthRedirectUri,
  GOOGLE_CONSOLE_REDIRECT_URIS,
} from "@/lib/google-calendar";

/** Public — shows exact OAuth config for Google Console setup (no secrets). */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = getCalendarOAuthRedirectUri(origin);
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";

  return NextResponse.json({
    origin,
    vercelEnv: process.env.VERCEL_ENV ?? "local",
    clientId: clientId || null,
    clientIdConfigured: Boolean(clientId),
    clientSecretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    redirectUriUsedForThisOrigin: redirectUri,
    registerAllOfTheseInGoogleConsole: GOOGLE_CONSOLE_REDIRECT_URIS,
    googleCloudConsoleUrl:
      "https://console.cloud.google.com/apis/credentials",
    hint: clientId
      ? "Add every URI in registerAllOfTheseInGoogleConsole to Authorized redirect URIs on this OAuth client."
      : "GOOGLE_CLIENT_ID is missing — add it to Vercel alongside GOOGLE_CLIENT_SECRET.",
  });
}

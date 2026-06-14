import { NextRequest, NextResponse } from "next/server";
import {
  createOAuth2Client,
  getCalendarOAuthRedirectUri,
  GOOGLE_CONSOLE_REDIRECT_URIS,
} from "@/lib/google-calendar";

/** Public — shows exact OAuth config for Google Console setup (no secrets). */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = getCalendarOAuthRedirectUri(origin);
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";

  let sampleAuthUrl: string | null = null;
  if (clientId) {
    try {
      const oauth2Client = createOAuth2Client(origin);
      sampleAuthUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: "debug",
      });
    } catch {
      sampleAuthUrl = null;
    }
  }

  const sampleRedirectParam = sampleAuthUrl
    ? new URL(sampleAuthUrl).searchParams.get("redirect_uri")
    : null;

  return NextResponse.json({
    origin,
    vercelEnv: process.env.VERCEL_ENV ?? "local",
    clientId: clientId || null,
    clientIdConfigured: Boolean(clientId),
    clientSecretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    redirectUriUsedForThisOrigin: redirectUri,
    sampleRedirectUriInAuthUrl: sampleRedirectParam,
    redirectUriMatches: sampleRedirectParam === redirectUri,
    registerTheseRedirectUris: [
      "http://localhost:3000/api/ea/calendar/callback",
      "https://www.designbyganesh.com/api/ea/calendar/callback",
    ],
    registerTheseJavaScriptOrigins: [
      "http://localhost:3000",
      "https://www.designbyganesh.com",
    ],
    allRedirectUrisForReference: GOOGLE_CONSOLE_REDIRECT_URIS,
    sampleAuthUrl,
    googleCloudConsoleUrl:
      "https://console.cloud.google.com/apis/credentials",
    steps: [
      "Open Google Cloud Console → Credentials",
      `Click OAuth client: ${clientId || "(GOOGLE_CLIENT_ID missing on Vercel)"}`,
      "Application type must be: Web application",
      "Under Authorized redirect URIs, add BOTH URIs from registerTheseRedirectUris (no trailing slash)",
      "Under Authorized JavaScript origins, add both from registerTheseJavaScriptOrigins",
      "Save, wait 1–2 minutes, hard refresh /ea/settings and try Connect again",
    ],
  });
}

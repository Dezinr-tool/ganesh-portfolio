import { NextRequest, NextResponse } from "next/server";
import { getEaSessionId } from "@/lib/ea-auth";
import {
  EA_AUTH_COOKIE,
  EA_TOKEN_COOKIE,
  isValidEaTokenFormat,
} from "@/lib/ea-token-edge";
import { getSessionUserId } from "@/lib/session-service";

export async function requireEaSession(
  request: NextRequest,
): Promise<{ sessionId: string } | NextResponse> {
  const sessionId = await resolveEaSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return { sessionId };
}

/** Resolves session id from SaaS token or legacy ea_auth cookie. */
export async function resolveEaSessionId(
  request: NextRequest,
): Promise<string | null> {
  const eaToken = request.cookies.get(EA_TOKEN_COOKIE)?.value;

  if (isValidEaTokenFormat(eaToken)) {
    try {
      const userId = await getSessionUserId(eaToken!);
      if (userId) {
        return userId;
      }
    } catch {
      // ea_users / ea_sessions may not exist yet — fall through to legacy auth
    }
  }

  return getEaSessionId(request.cookies.get(EA_AUTH_COOKIE)?.value);
}

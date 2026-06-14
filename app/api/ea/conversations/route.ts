import { NextRequest, NextResponse } from "next/server";
import { getEaSessionId, EA_AUTH_COOKIE } from "@/lib/ea-auth";
import { getRecentConversationMessages } from "@/lib/ea-conversations-store";

export async function GET(request: NextRequest) {
  const sessionId = getEaSessionId(
    request.cookies.get(EA_AUTH_COOKIE)?.value,
  );

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const messages = await getRecentConversationMessages(sessionId, 20);
    return NextResponse.json({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  } catch (error) {
    console.error("[ea/conversations] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load conversation history." },
      { status: 500 },
    );
  }
}

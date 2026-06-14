import { NextRequest, NextResponse } from "next/server";
import { EA_AUTH_COOKIE, getEaSessionId } from "@/lib/ea-auth";
import { clearConversationMessages } from "@/lib/ea-conversations-store";

export async function DELETE(request: NextRequest) {
  const sessionId = getEaSessionId(request.cookies.get(EA_AUTH_COOKIE)?.value);

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const count = await clearConversationMessages(sessionId);
    return NextResponse.json({ cleared: true, count });
  } catch (error) {
    console.error("[ea/conversations/clear] error:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation history." },
      { status: 500 },
    );
  }
}

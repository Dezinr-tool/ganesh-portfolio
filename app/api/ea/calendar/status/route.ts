import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import {
  disconnectCalendar,
  getCalendarConnectionStatus,
} from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    console.info("[ea/calendar/status] checking connection for sessionId:", sessionId);

    const status = await getCalendarConnectionStatus(sessionId);
    return NextResponse.json({ ...status, sessionId });
  } catch {
    return NextResponse.json(
      { error: "Failed to load calendar status." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    console.info("[ea/calendar/status] disconnecting sessionId:", sessionId);
    await disconnectCalendar(sessionId);
    return NextResponse.json({ connected: false, email: null, sessionId });
  } catch {
    return NextResponse.json(
      { error: "Failed to disconnect calendar." },
      { status: 500 },
    );
  }
}

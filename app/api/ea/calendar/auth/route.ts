import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("calendar auth error:", error);
    return NextResponse.json(
      { error: "Failed to start Google Calendar authorization." },
      { status: 500 },
    );
  }
}

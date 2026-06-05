import { NextRequest, NextResponse } from "next/server";
import { loadEASettings, saveEASettings } from "@/lib/ea-settings";
import { DEFAULT_EA_SETTINGS } from "@/lib/ea-settings-helpers";

export async function GET() {
  try {
    const settings = await loadEASettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[ea/settings GET] error:", error);
    return NextResponse.json(DEFAULT_EA_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await saveEASettings({ eaName: body.eaName });

    console.log("[ea/settings POST] saved:", settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[ea/settings POST] error:", error);
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 },
    );
  }
}

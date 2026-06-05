import { NextResponse } from "next/server";
import {
  getDefaultSignature,
  saveDefaultSignature,
} from "@/lib/settings-store";

export async function GET() {
  try {
    const signature = await getDefaultSignature();
    return NextResponse.json({ signature });
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { signature?: string };

    if (!body.signature?.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid signature image." },
        { status: 400 },
      );
    }

    await saveDefaultSignature(body.signature);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 },
    );
  }
}

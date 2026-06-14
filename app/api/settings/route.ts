import { NextResponse } from "next/server";
import {
  getDefaultSignature,
  getHourlyRate,
  saveDefaultSignature,
  setHourlyRate,
} from "@/lib/settings-store";

export async function GET() {
  try {
    const [signature, hourlyRate] = await Promise.all([
      getDefaultSignature(),
      getHourlyRate(),
    ]);
    return NextResponse.json({ signature, hourlyRate });
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { hourlyRate?: number };

    if (body.hourlyRate === undefined) {
      return NextResponse.json(
        { error: "Missing hourlyRate." },
        { status: 400 },
      );
    }

    const hourlyRate = Number(body.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      return NextResponse.json(
        { error: "Invalid hourly rate." },
        { status: 400 },
      );
    }

    await setHourlyRate(hourlyRate);
    return NextResponse.json({ hourlyRate });
  } catch {
    return NextResponse.json(
      { error: "Failed to save settings." },
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

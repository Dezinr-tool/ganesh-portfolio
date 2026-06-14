import { NextResponse } from "next/server";
import {
  type BillingSettingsPatch,
  getBillingSettings,
  getDefaultSignature,
  saveDefaultSignature,
  updateBillingSettings,
} from "@/lib/settings-store";

export async function GET() {
  try {
    const [signature, billing] = await Promise.all([
      getDefaultSignature(),
      getBillingSettings(),
    ]);
    return NextResponse.json({ signature, ...billing });
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as BillingSettingsPatch;

    const hasBillingField =
      body.hourlyRate !== undefined ||
      body.upiId !== undefined ||
      body.bankAccountHolder !== undefined ||
      body.bankName !== undefined ||
      body.bankAccountNumber !== undefined ||
      body.bankIfsc !== undefined ||
      body.panNumber !== undefined;

    if (!hasBillingField) {
      return NextResponse.json(
        { error: "No settings to update." },
        { status: 400 },
      );
    }

    const billing = await updateBillingSettings(body);
    return NextResponse.json(billing);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save settings.";
    return NextResponse.json({ error: message }, { status: 400 });
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

import { NextResponse } from "next/server";
import {
  type DesignTokensPatch,
  getDesignTokens,
  updateDesignTokens,
} from "@/lib/design-tokens";
import {
  type BillingSettingsPatch,
  getBillingSettings,
  getDefaultSignature,
  saveDefaultSignature,
  updateBillingSettings,
} from "@/lib/settings-store";

export async function GET() {
  try {
    const [signature, billing, designTokens] = await Promise.all([
      getDefaultSignature(),
      getBillingSettings(),
      getDesignTokens(),
    ]);
    return NextResponse.json({ signature, designTokens, ...billing });
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as BillingSettingsPatch & {
      designTokens?: DesignTokensPatch;
    };

    const hasBillingField =
      body.hourlyRate !== undefined ||
      body.upiId !== undefined ||
      body.bankAccountHolder !== undefined ||
      body.bankName !== undefined ||
      body.bankAccountNumber !== undefined ||
      body.bankIfsc !== undefined ||
      body.panNumber !== undefined;

    const hasDesignTokenField =
      body.designTokens?.bg !== undefined ||
      body.designTokens?.text !== undefined ||
      body.designTokens?.accent !== undefined;

    if (!hasBillingField && !hasDesignTokenField) {
      return NextResponse.json(
        { error: "No settings to update." },
        { status: 400 },
      );
    }

    const [billing, designTokens] = await Promise.all([
      hasBillingField ? updateBillingSettings(body) : getBillingSettings(),
      hasDesignTokenField
        ? updateDesignTokens(body.designTokens ?? {})
        : getDesignTokens(),
    ]);

    return NextResponse.json({ ...billing, designTokens });
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

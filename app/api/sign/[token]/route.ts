import { NextResponse } from "next/server";
import { getAgreementByToken, signAsClient } from "@/lib/agreements-store";
import { sendSignedConfirmationToGanesh } from "@/lib/email";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const agreement = await getAgreementByToken(token);

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found or link expired." },
        { status: 404 },
      );
    }

    return NextResponse.json(agreement);
  } catch {
    return NextResponse.json(
      { error: "Failed to load agreement." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as { signature?: string };
    const existing = await getAgreementByToken(token);

    if (!existing) {
      return NextResponse.json(
        { error: "Agreement not found or link expired." },
        { status: 404 },
      );
    }

    if (existing.clientSignedAt) {
      return NextResponse.json(
        { error: "This agreement has already been signed." },
        { status: 400 },
      );
    }

    if (!body.signature?.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Valid signature image is required." },
        { status: 400 },
      );
    }

    const agreement = await signAsClient(token, body.signature);

    if (!agreement) {
      return NextResponse.json(
        { error: "Failed to sign agreement." },
        { status: 500 },
      );
    }

    await sendSignedConfirmationToGanesh(
      agreement.title,
      agreement.clientName,
      agreement.clientCompany,
    );

    return NextResponse.json(agreement);
  } catch (error) {
    console.error("Failed to sign agreement:", error);
    return NextResponse.json(
      { error: "Failed to sign agreement." },
      { status: 500 },
    );
  }
}

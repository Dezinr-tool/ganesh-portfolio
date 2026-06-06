import { NextResponse } from "next/server";
import { getAgreementById, sendToClient } from "@/lib/agreements-store";
import { sendAgreementToClient } from "@/lib/email";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const existing = await getAgreementById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Agreement not found." },
        { status: 404 },
      );
    }

    if (!existing.ganeshSignedAt) {
      return NextResponse.json(
        { error: "You must sign the agreement before sending to client." },
        { status: 400 },
      );
    }

    const agreement = await sendToClient(id);

    if (!agreement || !agreement.clientSignToken) {
      return NextResponse.json(
        { error: "Failed to prepare agreement for sending." },
        { status: 500 },
      );
    }

    await sendAgreementToClient(
      agreement.clientEmail,
      agreement.clientName,
      agreement.title,
      agreement.clientSignToken,
      "onboarding@resend.dev", // TODO: revert to RESEND_FROM_EMAIL after testing
    );

    return NextResponse.json(agreement);
  } catch (error) {
    console.error("Failed to send agreement:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send agreement to client.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

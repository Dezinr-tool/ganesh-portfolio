import { NextResponse } from "next/server";
import type { CreateAgreementInput } from "@/app/dashboard/_lib/agreements";
import { upsertClientFromForm } from "@/lib/clients-store";
import {
  deleteAgreement,
  getAgreementById,
  signAsGanesh,
  updateAgreement,
  updateClientEmail,
} from "@/lib/agreements-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const agreement = await getAgreementById(id);

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found." },
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

function validateAgreementFields(body: CreateAgreementInput): string | null {
  if (
    !body.title?.trim() ||
    !body.clientName?.trim() ||
    !body.clientCompany?.trim() ||
    !body.clientEmail?.trim() ||
    !body.clientRepresentative?.trim() ||
    !body.projectOverview?.trim() ||
    !body.timeline?.trim() ||
    !Array.isArray(body.scopeOfWork) ||
    body.scopeOfWork.length === 0 ||
    !Array.isArray(body.deliverables) ||
    body.deliverables.length === 0
  ) {
    return "Missing required agreement fields.";
  }

  const validScope = body.scopeOfWork.every(
    (item) => item.task?.trim() && item.hours > 0,
  );
  const validDeliverables = body.deliverables.every(
    (item) => item.item?.trim() && ["P0", "P1", "P2"].includes(item.priority),
  );

  if (!validScope || !validDeliverables) {
    return "Invalid scope of work or deliverables.";
  }

  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: string;
      signature?: string;
      clientEmail?: string;
    } & Partial<CreateAgreementInput>;

    if (body.action === "sign_ganesh") {
      if (!body.signature?.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Valid signature image is required." },
          { status: 400 },
        );
      }

      const agreement = await signAsGanesh(id, body.signature);

      if (!agreement) {
        return NextResponse.json(
          { error: "Agreement not found." },
          { status: 404 },
        );
      }

      return NextResponse.json(agreement);
    }

    if (body.action === "update_email") {
      if (!body.clientEmail?.trim()) {
        return NextResponse.json(
          { error: "Client email is required." },
          { status: 400 },
        );
      }

      const agreement = await updateClientEmail(id, body.clientEmail.trim());

      if (!agreement) {
        return NextResponse.json(
          { error: "Agreement not found or cannot be edited." },
          { status: 404 },
        );
      }

      return NextResponse.json(agreement);
    }

    if (body.action === "update") {
      const existing = await getAgreementById(id);

      if (!existing) {
        return NextResponse.json(
          { error: "Agreement not found." },
          { status: 404 },
        );
      }

      if (existing.status === "signed") {
        return NextResponse.json(
          { error: "Signed agreements cannot be edited." },
          { status: 400 },
        );
      }

      if (!["draft", "awaiting_client"].includes(existing.status)) {
        return NextResponse.json(
          { error: "This agreement cannot be edited." },
          { status: 400 },
        );
      }

      const validationError = validateAgreementFields(
        body as CreateAgreementInput,
      );
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const resetSigning = existing.status === "awaiting_client";

      const agreement = await updateAgreement(
        id,
        {
          title: body.title!.trim(),
          clientName: body.clientName!.trim(),
          clientCompany: body.clientCompany!.trim(),
          clientEmail: body.clientEmail!.trim(),
          clientRepresentative: body.clientRepresentative!.trim(),
          projectOverview: body.projectOverview!.trim(),
          scopeOfWork: body.scopeOfWork!,
          deliverables: body.deliverables!,
          timeline: body.timeline!.trim(),
          hourlyRate: body.hourlyRate ?? null,
          fixedCost: body.fixedCost ?? null,
          advancePercent: body.advancePercent ?? 50,
          paymentNotes: body.paymentNotes?.trim() ?? "",
        },
        resetSigning,
      );

      if (!agreement) {
        return NextResponse.json(
          { error: "Failed to update agreement." },
          { status: 500 },
        );
      }

      await upsertClientFromForm({
        name: body.clientName!.trim(),
        email: body.clientEmail!.trim(),
        phone: body.clientPhone,
        company: body.clientCompany,
        address: body.clientAddress,
        gstNumber: body.clientGstNumber,
      }).catch(() => null);

      return NextResponse.json(agreement);
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update agreement." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteAgreement(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Agreement not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete agreement." },
      { status: 500 },
    );
  }
}

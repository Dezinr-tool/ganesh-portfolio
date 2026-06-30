import { NextResponse } from "next/server";
import type { CreateAgreementInput } from "@/app/dashboard/_lib/agreements";
import { buildAgreementInput, hasValidClientEmails } from "@/app/dashboard/_lib/agreements";
import { upsertClientFromForm } from "@/lib/clients-store";
import { createAgreement, readAgreements } from "@/lib/agreements-store";

export async function GET() {
  try {
    const agreements = await readAgreements();
    return NextResponse.json({ agreements });
  } catch {
    return NextResponse.json(
      { error: "Failed to load agreements." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateAgreementInput;

    if (
      !body.title?.trim() ||
      !body.clientName?.trim() ||
      !body.clientCompany?.trim() ||
      !hasValidClientEmails(body.clientEmails, body.clientEmail) ||
      !body.clientRepresentative?.trim() ||
      !body.projectOverview?.trim() ||
      !body.timeline?.trim() ||
      !Array.isArray(body.scopeOfWork) ||
      body.scopeOfWork.length === 0 ||
      !Array.isArray(body.deliverables) ||
      body.deliverables.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required agreement fields." },
        { status: 400 },
      );
    }

    const validScope = body.scopeOfWork.every((item) => item.task?.trim());
    const validDeliverables = body.deliverables.every(
      (item) => item.item?.trim() && ["P0", "P1", "P2"].includes(item.priority),
    );

    if (!validScope || !validDeliverables) {
      return NextResponse.json(
        { error: "Invalid scope of work or deliverables." },
        { status: 400 },
      );
    }

    const input = buildAgreementInput(body);
    const agreement = await createAgreement(input);

    await upsertClientFromForm({
      name: input.clientName,
      email: input.clientEmail,
      phone: input.clientPhone,
      company: input.clientCompany,
      address: input.clientAddress,
      gstNumber: input.clientGstNumber,
      representativeName: input.clientRepresentative,
    }).catch(() => null);

    return NextResponse.json(agreement, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create agreement." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import type { CreateClientInput } from "@/app/dashboard/_lib/clients";
import { createClient, readClients } from "@/lib/clients-store";

export async function GET() {
  try {
    const clients = await readClients();
    return NextResponse.json({ clients });
  } catch {
    return NextResponse.json(
      { error: "Failed to load clients." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateClientInput;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 },
      );
    }

    const client = await createClient({
      name: body.name.trim(),
      email: body.email,
      phone: body.phone,
      company: body.company,
      address: body.address,
      gstNumber: body.gstNumber,
      representativeName: body.representativeName,
    });

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save client." },
      { status: 500 },
    );
  }
}

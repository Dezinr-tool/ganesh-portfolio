import { NextResponse } from "next/server";
import type { UpdateClientInput } from "@/app/dashboard/_lib/clients";
import { deleteClient, getClientById, updateClient } from "@/lib/clients-store";

function parseClientId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseClientId(rawId);

    if (!id) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }

    const body = (await request.json()) as UpdateClientInput;

    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 },
      );
    }

    const client = await updateClient(id, body);

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch {
    return NextResponse.json(
      { error: "Failed to update client." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseClientId(rawId);

    if (!id) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }

    const existing = await getClientById(id);
    if (!existing) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    await deleteClient(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete client." },
      { status: 500 },
    );
  }
}

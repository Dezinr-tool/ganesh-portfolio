import { NextResponse } from "next/server";
import {
  createFixedItem,
  deleteFixedItem,
  listFixedItems,
  updateFixedItem,
} from "@/lib/expense-tracker-store";

export async function GET() {
  try {
    const items = await listFixedItems();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Failed to load fixed expenses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; amount?: number };
    if (!body.name?.trim() || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "name and amount are required." },
        { status: 400 },
      );
    }
    const item = await createFixedItem({
      name: body.name,
      amount: body.amount,
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create fixed expense." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      amount?: number;
      active?: boolean;
    };
    if (!body.id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    const item = await updateFixedItem(body.id, {
      name: body.name,
      amount: body.amount,
      active: body.active,
    });
    if (!item) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Failed to update fixed expense." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    const ok = await deleteFixedItem(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete fixed expense." },
      { status: 500 },
    );
  }
}

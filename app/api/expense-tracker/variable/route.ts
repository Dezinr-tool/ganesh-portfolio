import { NextResponse } from "next/server";
import {
  createVariableItem,
  currentMonthKey,
  deleteVariableItem,
  listVariableItems,
  updateVariableItem,
} from "@/lib/expense-tracker-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("month") || currentMonthKey();
    const items = await listVariableItems(monthKey);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Failed to load variable expenses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      monthKey?: string;
      name?: string;
      amount?: number;
    };
    if (!body.name?.trim() || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "name and amount are required." },
        { status: 400 },
      );
    }
    const item = await createVariableItem({
      monthKey: body.monthKey || currentMonthKey(),
      name: body.name,
      amount: body.amount,
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create variable expense." },
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
    };
    if (!body.id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    const item = await updateVariableItem(body.id, {
      name: body.name,
      amount: body.amount,
    });
    if (!item) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Failed to update variable expense." },
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
    const ok = await deleteVariableItem(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete variable expense." },
      { status: 500 },
    );
  }
}

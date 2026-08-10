import { NextResponse } from "next/server";
import {
  addNextSheetMonth,
  currentMonthKey,
  EXPENSE_SHEET_START,
  fetchFreelanceForMonth,
  getExpenseMonthView,
  getSheetMonths,
  setMonthFreelanceAmount,
  setMonthSalary,
} from "@/lib/expense-tracker-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("month") || EXPENSE_SHEET_START;
    if (!/^\d{4}-\d{2}$/.test(monthKey) || monthKey < EXPENSE_SHEET_START) {
      return NextResponse.json({ error: "Invalid month." }, { status: 400 });
    }
    const view = await getExpenseMonthView(monthKey);
    return NextResponse.json(view);
  } catch (error) {
    console.error("expense-tracker GET", error);
    return NextResponse.json(
      { error: "Failed to load expense month." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      monthKey?: string;
      salary?: number;
      freelanceAmount?: number;
      fetchFreelance?: boolean;
      addMonth?: boolean;
    };

    if (body.addMonth) {
      const next = await addNextSheetMonth();
      const months = await getSheetMonths();
      return NextResponse.json({ monthKey: next, months });
    }

    const monthKey = body.monthKey || currentMonthKey();
    if (!/^\d{4}-\d{2}$/.test(monthKey) || monthKey < EXPENSE_SHEET_START) {
      return NextResponse.json({ error: "Invalid month." }, { status: 400 });
    }

    if (typeof body.salary === "number") {
      await setMonthSalary(monthKey, body.salary);
    }

    if (typeof body.freelanceAmount === "number") {
      await setMonthFreelanceAmount(monthKey, body.freelanceAmount);
    }

    if (body.fetchFreelance) {
      await fetchFreelanceForMonth(monthKey);
    }

    const view = await getExpenseMonthView(monthKey);
    return NextResponse.json(view);
  } catch (error) {
    console.error("expense-tracker PATCH", error);
    return NextResponse.json(
      { error: "Failed to update expense month." },
      { status: 500 },
    );
  }
}

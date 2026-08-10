import {
  EXPENSE_SHEET_START,
  getExpenseMonthView,
  getExpenseOverview,
} from "@/lib/expense-tracker-store";
import { ExpenseTrackerApp } from "./expense-tracker-app";

export const dynamic = "force-dynamic";

export default async function ExpenseTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const overview = await getExpenseOverview();
  const selectedMonth =
    params.month &&
    /^\d{4}-\d{2}$/.test(params.month) &&
    params.month >= EXPENSE_SHEET_START
      ? params.month
      : null;

  const monthView = await getExpenseMonthView(
    selectedMonth ?? overview.currentMonthKey ?? EXPENSE_SHEET_START,
  );

  return (
    <ExpenseTrackerApp
      overview={overview}
      selectedMonth={selectedMonth}
      monthView={monthView}
    />
  );
}

import "server-only";

import { sql } from "@/lib/db";
import { readInvoices } from "@/lib/invoices-store";
import { currentMonthKey, monthLabel, shiftMonthKey } from "@/lib/expense-tracker-month";
import type {
  ExpenseFixedItem,
  ExpenseMonthView,
  ExpenseVariableItem,
} from "@/lib/expense-tracker-types";

export type {
  ExpenseFixedItem,
  ExpenseMonthView,
  ExpenseVariableItem,
} from "@/lib/expense-tracker-types";
export { currentMonthKey, monthLabel, shiftMonthKey } from "@/lib/expense-tracker-month";

export type ExpenseMonthSnapshot = {
  monthKey: string;
  salary: number | null;
  freelanceAmount: number;
  freelanceFetchedAt: string | null;
  freelanceInvoiceIds: string[];
};

let schemaReady = false;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

async function ensureExpenseSchema() {
  if (schemaReady) return;

  await sql.query(`
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at DATE;

    CREATE TABLE IF NOT EXISTS expense_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expense_fixed_items (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expense_variable_items (
      id UUID PRIMARY KEY,
      month_key TEXT NOT NULL,
      name TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS expense_variable_items_month_idx
      ON expense_variable_items (month_key);

    CREATE TABLE IF NOT EXISTS expense_month_state (
      month_key TEXT PRIMARY KEY,
      salary NUMERIC(12, 2),
      freelance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      freelance_fetched_at TIMESTAMPTZ,
      freelance_invoice_ids JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);

  schemaReady = true;
}

async function getDefaultSalary(): Promise<number> {
  const { rows } = await sql<{ value: string }>`
    SELECT value FROM expense_settings WHERE key = 'default_salary' LIMIT 1
  `;
  return roundMoney(parseNumber(rows[0]?.value ?? 0));
}

export async function setDefaultSalary(amount: number): Promise<number> {
  await ensureExpenseSchema();
  const value = String(roundMoney(Math.max(0, amount)));
  await sql`
    INSERT INTO expense_settings (key, value, updated_at)
    VALUES ('default_salary', ${value}, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return roundMoney(Number(value));
}

async function getMonthState(monthKey: string): Promise<ExpenseMonthSnapshot> {
  const { rows } = await sql<{
    month_key: string;
    salary: string | number | null;
    freelance_amount: string | number;
    freelance_fetched_at: Date | string | null;
    freelance_invoice_ids: string[] | string;
  }>`
    SELECT month_key, salary, freelance_amount, freelance_fetched_at, freelance_invoice_ids
    FROM expense_month_state
    WHERE month_key = ${monthKey}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return {
      monthKey,
      salary: null,
      freelanceAmount: 0,
      freelanceFetchedAt: null,
      freelanceInvoiceIds: [],
    };
  }

  const ids =
    typeof row.freelance_invoice_ids === "string"
      ? (JSON.parse(row.freelance_invoice_ids) as string[])
      : row.freelance_invoice_ids ?? [];

  return {
    monthKey: row.month_key,
    salary: row.salary === null ? null : roundMoney(parseNumber(row.salary)),
    freelanceAmount: roundMoney(parseNumber(row.freelance_amount)),
    freelanceFetchedAt: row.freelance_fetched_at
      ? new Date(row.freelance_fetched_at).toISOString()
      : null,
    freelanceInvoiceIds: ids,
  };
}

export async function listFixedItems(): Promise<ExpenseFixedItem[]> {
  await ensureExpenseSchema();
  const { rows } = await sql<{
    id: string;
    name: string;
    amount: string | number;
    active: boolean;
    sort_order: number;
  }>`
    SELECT id, name, amount, active, sort_order
    FROM expense_fixed_items
    ORDER BY sort_order ASC, created_at ASC
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: roundMoney(parseNumber(row.amount)),
    active: row.active,
    sortOrder: row.sort_order,
  }));
}

export async function createFixedItem(input: {
  name: string;
  amount: number;
}): Promise<ExpenseFixedItem> {
  await ensureExpenseSchema();
  const id = crypto.randomUUID();
  const name = input.name.trim();
  const amount = roundMoney(Math.max(0, input.amount));

  const { rows } = await sql<{ sort_order: number }>`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS sort_order FROM expense_fixed_items
  `;
  const sortOrder = rows[0]?.sort_order ?? 0;

  await sql`
    INSERT INTO expense_fixed_items (id, name, amount, active, sort_order)
    VALUES (${id}, ${name}, ${amount}, TRUE, ${sortOrder})
  `;

  return { id, name, amount, active: true, sortOrder };
}

export async function updateFixedItem(
  id: string,
  patch: Partial<{ name: string; amount: number; active: boolean }>,
): Promise<ExpenseFixedItem | null> {
  await ensureExpenseSchema();
  const items = await listFixedItems();
  const current = items.find((item) => item.id === id);
  if (!current) return null;

  const name = patch.name?.trim() ?? current.name;
  const amount =
    patch.amount === undefined
      ? current.amount
      : roundMoney(Math.max(0, patch.amount));
  const active = patch.active ?? current.active;

  await sql`
    UPDATE expense_fixed_items
    SET name = ${name}, amount = ${amount}, active = ${active}
    WHERE id = ${id}
  `;

  return { ...current, name, amount, active };
}

export async function deleteFixedItem(id: string): Promise<boolean> {
  await ensureExpenseSchema();
  const { rows } = await sql<{ id: string }>`
    DELETE FROM expense_fixed_items WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

export async function listVariableItems(
  monthKey: string,
): Promise<ExpenseVariableItem[]> {
  await ensureExpenseSchema();
  const { rows } = await sql<{
    id: string;
    month_key: string;
    name: string;
    amount: string | number;
  }>`
    SELECT id, month_key, name, amount
    FROM expense_variable_items
    WHERE month_key = ${monthKey}
    ORDER BY created_at ASC
  `;

  return rows.map((row) => ({
    id: row.id,
    monthKey: row.month_key,
    name: row.name,
    amount: roundMoney(parseNumber(row.amount)),
  }));
}

export async function createVariableItem(input: {
  monthKey: string;
  name: string;
  amount: number;
}): Promise<ExpenseVariableItem> {
  await ensureExpenseSchema();
  const id = crypto.randomUUID();
  const name = input.name.trim();
  const amount = roundMoney(Math.max(0, input.amount));

  await sql`
    INSERT INTO expense_variable_items (id, month_key, name, amount)
    VALUES (${id}, ${input.monthKey}, ${name}, ${amount})
  `;

  return { id, monthKey: input.monthKey, name, amount };
}

export async function updateVariableItem(
  id: string,
  patch: Partial<{ name: string; amount: number }>,
): Promise<ExpenseVariableItem | null> {
  await ensureExpenseSchema();
  const { rows: existing } = await sql<{
    id: string;
    month_key: string;
    name: string;
    amount: string | number;
  }>`
    SELECT id, month_key, name, amount FROM expense_variable_items WHERE id = ${id} LIMIT 1
  `;
  const row = existing[0];
  if (!row) return null;

  const name = patch.name?.trim() ?? row.name;
  const amount =
    patch.amount === undefined
      ? roundMoney(parseNumber(row.amount))
      : roundMoney(Math.max(0, patch.amount));

  await sql`
    UPDATE expense_variable_items
    SET name = ${name}, amount = ${amount}
    WHERE id = ${id}
  `;

  return { id, monthKey: row.month_key, name, amount };
}

export async function deleteVariableItem(id: string): Promise<boolean> {
  await ensureExpenseSchema();
  const { rows } = await sql<{ id: string }>`
    DELETE FROM expense_variable_items WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

export async function setMonthSalary(
  monthKey: string,
  salary: number,
): Promise<void> {
  await ensureExpenseSchema();
  const value = roundMoney(Math.max(0, salary));
  await sql`
    INSERT INTO expense_month_state (month_key, salary)
    VALUES (${monthKey}, ${value})
    ON CONFLICT (month_key) DO UPDATE SET salary = EXCLUDED.salary
  `;
  // Also keep default in sync so new months inherit last set salary.
  await setDefaultSalary(value);
}

export async function setMonthFreelanceAmount(
  monthKey: string,
  amount: number,
): Promise<void> {
  await ensureExpenseSchema();
  const value = roundMoney(Math.max(0, amount));
  await sql`
    INSERT INTO expense_month_state (
      month_key,
      freelance_amount,
      freelance_fetched_at,
      freelance_invoice_ids
    )
    VALUES (
      ${monthKey},
      ${value},
      NULL,
      '[]'::jsonb
    )
    ON CONFLICT (month_key) DO UPDATE SET
      freelance_amount = EXCLUDED.freelance_amount,
      freelance_fetched_at = NULL,
      freelance_invoice_ids = '[]'::jsonb
  `;
}

export async function fetchFreelanceForMonth(monthKey: string): Promise<{
  amount: number;
  invoiceIds: string[];
  invoiceCount: number;
}> {
  await ensureExpenseSchema();
  const invoices = await readInvoices();
  const matched = invoices.filter((inv) => {
    if (inv.status !== "Paid" || !inv.paidAt) return false;
    return inv.paidAt.slice(0, 7) === monthKey;
  });

  const amount = roundMoney(matched.reduce((sum, inv) => sum + inv.total, 0));
  const invoiceIds = matched.map((inv) => inv.id);

  await sql`
    INSERT INTO expense_month_state (
      month_key,
      freelance_amount,
      freelance_fetched_at,
      freelance_invoice_ids
    )
    VALUES (
      ${monthKey},
      ${amount},
      NOW(),
      ${JSON.stringify(invoiceIds)}::jsonb
    )
    ON CONFLICT (month_key) DO UPDATE SET
      freelance_amount = EXCLUDED.freelance_amount,
      freelance_fetched_at = EXCLUDED.freelance_fetched_at,
      freelance_invoice_ids = EXCLUDED.freelance_invoice_ids
  `;

  return { amount, invoiceIds, invoiceCount: matched.length };
}

export async function getExpenseMonthView(
  monthKey: string,
): Promise<ExpenseMonthView> {
  await ensureExpenseSchema();

  const [defaultSalary, state, fixedItems, variableItems] = await Promise.all([
    getDefaultSalary(),
    getMonthState(monthKey),
    listFixedItems(),
    listVariableItems(monthKey),
  ]);

  const salary = state.salary ?? defaultSalary;
  const activeFixed = fixedItems.filter((item) => item.active);
  const fixedTotal = roundMoney(
    activeFixed.reduce((sum, item) => sum + item.amount, 0),
  );
  const variableTotal = roundMoney(
    variableItems.reduce((sum, item) => sum + item.amount, 0),
  );
  const incomeTotal = roundMoney(salary + state.freelanceAmount);
  const expenseTotal = roundMoney(fixedTotal + variableTotal);

  return {
    monthKey,
    defaultSalary,
    salary,
    freelanceAmount: state.freelanceAmount,
    freelanceFetchedAt: state.freelanceFetchedAt,
    freelanceInvoiceIds: state.freelanceInvoiceIds,
    fixedItems,
    variableItems,
    fixedTotal,
    variableTotal,
    incomeTotal,
    expenseTotal,
    remaining: roundMoney(incomeTotal - expenseTotal),
  };
}

/** Sheet starts at August 2026 — no earlier months in the rail. */
export const EXPENSE_SHEET_START = "2026-08";
const SHEET_MONTHS_KEY = "sheet_months";

async function readSheetMonthKeys(): Promise<string[]> {
  const { rows } = await sql<{ value: string }>`
    SELECT value FROM expense_settings WHERE key = ${SHEET_MONTHS_KEY} LIMIT 1
  `;
  if (!rows[0]?.value) return [EXPENSE_SHEET_START];
  try {
    const parsed = JSON.parse(rows[0].value) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [EXPENSE_SHEET_START];
    const keys = parsed
      .filter((k): k is string => typeof k === "string" && /^\d{4}-\d{2}$/.test(k))
      .filter((k) => k >= EXPENSE_SHEET_START)
      .sort();
    return keys.length > 0 ? keys : [EXPENSE_SHEET_START];
  } catch {
    return [EXPENSE_SHEET_START];
  }
}

async function writeSheetMonthKeys(keys: string[]): Promise<string[]> {
  const unique = [...new Set(keys.filter((k) => k >= EXPENSE_SHEET_START))].sort();
  const next = unique.length > 0 ? unique : [EXPENSE_SHEET_START];
  await sql`
    INSERT INTO expense_settings (key, value, updated_at)
    VALUES (${SHEET_MONTHS_KEY}, ${JSON.stringify(next)}, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return next;
}

/** One-time: seed sheet at August; move July 2026 draft data into August if needed. */
async function ensureSheetSeeded(): Promise<string[]> {
  await ensureExpenseSchema();
  const { rows } = await sql<{ value: string }>`
    SELECT value FROM expense_settings WHERE key = ${SHEET_MONTHS_KEY} LIMIT 1
  `;

  if (!rows[0]) {
    await writeSheetMonthKeys([EXPENSE_SHEET_START]);

    // Preserve salary/freelance entered under July into August when August is empty.
    const july = await getMonthState("2026-07");
    const august = await getMonthState(EXPENSE_SHEET_START);
    if (
      (july.salary !== null || july.freelanceAmount > 0) &&
      august.salary === null &&
      august.freelanceAmount === 0
    ) {
      await sql`
        INSERT INTO expense_month_state (
          month_key, salary, freelance_amount, freelance_fetched_at, freelance_invoice_ids
        )
        VALUES (
          ${EXPENSE_SHEET_START},
          ${july.salary},
          ${july.freelanceAmount},
          ${july.freelanceFetchedAt},
          ${JSON.stringify(july.freelanceInvoiceIds)}::jsonb
        )
        ON CONFLICT (month_key) DO UPDATE SET
          salary = COALESCE(expense_month_state.salary, EXCLUDED.salary),
          freelance_amount = CASE
            WHEN expense_month_state.freelance_amount = 0 THEN EXCLUDED.freelance_amount
            ELSE expense_month_state.freelance_amount
          END,
          freelance_fetched_at = COALESCE(
            expense_month_state.freelance_fetched_at,
            EXCLUDED.freelance_fetched_at
          ),
          freelance_invoice_ids = CASE
            WHEN expense_month_state.freelance_amount = 0 THEN EXCLUDED.freelance_invoice_ids
            ELSE expense_month_state.freelance_invoice_ids
          END
      `;
    }

    const julyVars = await listVariableItems("2026-07");
    const augVars = await listVariableItems(EXPENSE_SHEET_START);
    if (julyVars.length > 0 && augVars.length === 0) {
      for (const item of julyVars) {
        await createVariableItem({
          monthKey: EXPENSE_SHEET_START,
          name: item.name,
          amount: item.amount,
        });
      }
    }
  }

  return readSheetMonthKeys();
}

export async function getSheetMonths(): Promise<string[]> {
  return ensureSheetSeeded();
}

export async function addNextSheetMonth(): Promise<string> {
  const keys = await ensureSheetSeeded();
  const last = keys[keys.length - 1] ?? EXPENSE_SHEET_START;
  const next = shiftMonthKey(last, 1);
  if (!keys.includes(next)) {
    await writeSheetMonthKeys([...keys, next]);
  }
  return next;
}

export async function listMonthSummaries(): Promise<
  Array<{
    monthKey: string;
    label: string;
    salary: number;
    freelanceAmount: number;
    expenseTotal: number;
    remaining: number;
    hasFetched: boolean;
    isCurrent: boolean;
  }>
> {
  const keys = await ensureSheetSeeded();
  const nowKey = currentMonthKey();

  return Promise.all(
    keys.map(async (monthKey) => {
      const view = await getExpenseMonthView(monthKey);
      return {
        monthKey,
        label: monthLabel(monthKey),
        salary: view.salary,
        freelanceAmount: view.freelanceAmount,
        expenseTotal: view.expenseTotal,
        remaining: view.remaining,
        hasFetched: Boolean(view.freelanceFetchedAt),
        isCurrent: monthKey === nowKey,
      };
    }),
  );
}

export async function getExpenseOverview() {
  const summaries = await listMonthSummaries();
  const focus =
    summaries.find((s) => s.monthKey === EXPENSE_SHEET_START) ?? summaries[0];
  const focusKey = focus?.monthKey ?? EXPENSE_SHEET_START;

  const income = roundMoney(
    summaries.reduce((sum, s) => sum + s.salary + s.freelanceAmount, 0),
  );
  const expense = roundMoney(
    summaries.reduce((sum, s) => sum + s.expenseTotal, 0),
  );

  return {
    months: summaries,
    currentMonthKey: focusKey,
    currentRemaining: focus?.remaining ?? 0,
    trailingIncome: income,
    trailingExpense: expense,
    trailingRemaining: roundMoney(income - expense),
    sheetStart: EXPENSE_SHEET_START,
  };
}

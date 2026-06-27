import {
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceLineItem,
  type InvoiceStatus,
  DEFAULT_PROCESSING_FEE_PERCENT,
  calculateTotals,
  generateInvoiceNumber,
} from "@/app/dashboard/_lib/invoices";
import { sql } from "@/lib/db";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_company: string;
  client_address: string;
  issue_date: Date | string;
  due_date: Date | string;
  line_items: InvoiceLineItem[] | string;
  subtotal: string | number;
  tax_percent: string | number | null;
  processing_fee_percent: string | number | null;
  processing_fee_amount: string | number | null;
  total: string | number;
  notes: string | null;
  status: string;
  created_at: Date | string;
};

type StoredLineItem = InvoiceLineItem & { quantity?: number };

function normalizeLineItems(items: StoredLineItem[]): InvoiceLineItem[] {
  return items.map((item) => ({
    id: item.id,
    description: item.description,
    effortHrs: item.effortHrs ?? item.quantity ?? 0,
    rate: item.rate,
    amount: item.amount,
  }));
}

function toDateString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function toTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function parseNumber(value: string | number | null): number {
  if (value === null) return 0;
  return typeof value === "number" ? value : Number(value);
}

function statusFromDb(status: string): InvoiceStatus {
  return status.toLowerCase() === "paid" ? "Paid" : "Unpaid";
}

function statusToDb(status: InvoiceStatus): string {
  return status.toLowerCase();
}

function rowToInvoice(row: InvoiceRow): Invoice {
  const subtotal = parseNumber(row.subtotal);
  const taxPercent =
    row.tax_percent === null ? null : parseNumber(row.tax_percent);
  const taxAmount =
    taxPercent === null
      ? 0
      : Math.round(subtotal * (taxPercent / 100) * 100) / 100;

  const processingFeePercent =
    row.processing_fee_percent === null
      ? DEFAULT_PROCESSING_FEE_PERCENT
      : parseNumber(row.processing_fee_percent);

  const lineItems = normalizeLineItems(
    typeof row.line_items === "string"
      ? (JSON.parse(row.line_items) as StoredLineItem[])
      : row.line_items,
  );

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    issueDate: toDateString(row.issue_date),
    dueDate: toDateString(row.due_date),
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientCompany: row.client_company,
    clientAddress: row.client_address ?? "",
    lineItems,
    subtotal,
    taxPercent,
    taxAmount,
    processingFeePercent,
    processingFeeAmount: parseNumber(row.processing_fee_amount),
    total: parseNumber(row.total),
    notes: row.notes ?? "",
    status: statusFromDb(row.status),
    createdAt: toTimestamp(row.created_at),
  };
}

export async function readInvoices(): Promise<Invoice[]> {
  const { rows } = await sql<InvoiceRow>`
    SELECT
      id,
      invoice_number,
      client_name,
      client_email,
      client_company,
      client_address,
      issue_date,
      due_date,
      line_items,
      subtotal,
      tax_percent,
      COALESCE(processing_fee_percent, ${DEFAULT_PROCESSING_FEE_PERCENT}) AS processing_fee_percent,
      COALESCE(processing_fee_amount, 0) AS processing_fee_amount,
      total,
      notes,
      status,
      created_at
    FROM invoices
    ORDER BY created_at DESC
  `;

  return rows.map(rowToInvoice);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const { rows } = await sql<InvoiceRow>`
    SELECT
      id,
      invoice_number,
      client_name,
      client_email,
      client_company,
      client_address,
      issue_date,
      due_date,
      line_items,
      subtotal,
      tax_percent,
      COALESCE(processing_fee_percent, ${DEFAULT_PROCESSING_FEE_PERCENT}) AS processing_fee_percent,
      COALESCE(processing_fee_amount, 0) AS processing_fee_amount,
      total,
      notes,
      status,
      created_at
    FROM invoices
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  return row ? rowToInvoice(row) : null;
}

export async function getNextInvoiceNumber(): Promise<string> {
  const { rows } = await sql<{ invoice_number: string }>`
    SELECT invoice_number FROM invoices
  `;

  return generateInvoiceNumber(
    rows.map((row) => ({ invoiceNumber: row.invoice_number }) as Invoice),
  );
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const processingFeePercent =
    input.processingFeePercent ?? DEFAULT_PROCESSING_FEE_PERCENT;

  const { subtotal, processingFeeAmount, total } = calculateTotals(
    input.lineItems,
    input.taxPercent,
    processingFeePercent,
  );

  const id = crypto.randomUUID();
  const invoiceNumber = await getNextInvoiceNumber();
  const status = input.status ?? "Unpaid";
  const notes = input.notes?.trim() ?? "";

  const { rows } = await sql<InvoiceRow>`
    INSERT INTO invoices (
      id,
      invoice_number,
      client_name,
      client_email,
      client_company,
      client_address,
      issue_date,
      due_date,
      line_items,
      subtotal,
      tax_percent,
      processing_fee_percent,
      processing_fee_amount,
      total,
      notes,
      status
    ) VALUES (
      ${id},
      ${invoiceNumber},
      ${input.clientName},
      ${input.clientEmail},
      ${input.clientCompany},
      ${input.clientAddress ?? ""},
      ${input.issueDate},
      ${input.dueDate},
      ${JSON.stringify(input.lineItems)},
      ${subtotal},
      ${input.taxPercent},
      ${processingFeePercent},
      ${processingFeeAmount},
      ${total},
      ${notes || null},
      ${statusToDb(status)}
    )
    RETURNING
      id,
      invoice_number,
      client_name,
      client_email,
      client_company,
      client_address,
      issue_date,
      due_date,
      line_items,
      subtotal,
      tax_percent,
      processing_fee_percent,
      processing_fee_amount,
      total,
      notes,
      status,
      created_at
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to create invoice.");
  }

  return rowToInvoice(row);
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<Invoice | null> {
  const { rows } = await sql<InvoiceRow>`
    UPDATE invoices
    SET status = ${statusToDb(status)}
    WHERE id = ${id}
    RETURNING
      id,
      invoice_number,
      client_name,
      client_email,
      client_company,
      client_address,
      issue_date,
      due_date,
      line_items,
      subtotal,
      tax_percent,
      COALESCE(processing_fee_percent, ${DEFAULT_PROCESSING_FEE_PERCENT}) AS processing_fee_percent,
      COALESCE(processing_fee_amount, 0) AS processing_fee_amount,
      total,
      notes,
      status,
      created_at
  `;

  const row = rows[0];
  return row ? rowToInvoice(row) : null;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const { rows } = await sql<{ id: string }>`
    DELETE FROM invoices
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}

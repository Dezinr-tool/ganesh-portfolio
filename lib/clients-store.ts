import "server-only";

import type {
  CreateClientInput,
  SavedClient,
  UpdateClientInput,
  UpsertClientInput,
} from "@/app/dashboard/_lib/clients";
import { sql } from "@/lib/db";

type ClientRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  gst_number: string | null;
  created_at: Date | string;
};

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function rowToClient(row: ClientRow): SavedClient {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address,
    gstNumber: row.gst_number,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function readClients(): Promise<SavedClient[]> {
  const { rows } = await sql<ClientRow>`
    SELECT id, name, email, phone, company, address, gst_number, created_at
    FROM clients
    ORDER BY name ASC
  `;
  return rows.map(rowToClient);
}

export async function getClientById(id: number): Promise<SavedClient | null> {
  const { rows } = await sql<ClientRow>`
    SELECT id, name, email, phone, company, address, gst_number, created_at
    FROM clients
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToClient(row) : null;
}

export async function getClientByEmail(
  email: string,
): Promise<SavedClient | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { rows } = await sql<ClientRow>`
    SELECT id, name, email, phone, company, address, gst_number, created_at
    FROM clients
    WHERE LOWER(TRIM(email)) = ${normalized}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToClient(row) : null;
}

export async function createClient(
  input: CreateClientInput,
): Promise<SavedClient> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Client name is required.");
  }

  const email = normalizeOptional(input.email);
  const phone = normalizeOptional(input.phone);
  const company = normalizeOptional(input.company);
  const address = normalizeOptional(input.address);
  const gstNumber = normalizeOptional(input.gstNumber);

  const { rows } = await sql<ClientRow>`
    INSERT INTO clients (name, email, phone, company, address, gst_number)
    VALUES (${name}, ${email}, ${phone}, ${company}, ${address}, ${gstNumber})
    RETURNING id, name, email, phone, company, address, gst_number, created_at
  `;

  return rowToClient(rows[0]);
}

export async function updateClient(
  id: number,
  input: UpdateClientInput,
): Promise<SavedClient | null> {
  const existing = await getClientById(id);
  if (!existing) return null;

  const name =
    input.name !== undefined ? input.name.trim() : existing.name;
  if (!name) {
    throw new Error("Client name is required.");
  }

  const email =
    input.email !== undefined
      ? normalizeOptional(input.email)
      : existing.email;
  const phone =
    input.phone !== undefined
      ? normalizeOptional(input.phone)
      : existing.phone;
  const company =
    input.company !== undefined
      ? normalizeOptional(input.company)
      : existing.company;
  const address =
    input.address !== undefined
      ? normalizeOptional(input.address)
      : existing.address;
  const gstNumber =
    input.gstNumber !== undefined
      ? normalizeOptional(input.gstNumber)
      : existing.gstNumber;

  const { rows } = await sql<ClientRow>`
    UPDATE clients
    SET name = ${name},
        email = ${email},
        phone = ${phone},
        company = ${company},
        address = ${address},
        gst_number = ${gstNumber}
    WHERE id = ${id}
    RETURNING id, name, email, phone, company, address, gst_number, created_at
  `;

  return rowToClient(rows[0]);
}

export async function deleteClient(id: number): Promise<boolean> {
  const result = await sql`DELETE FROM clients WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

/** Match by email when present; otherwise insert a new client. */
export async function upsertClientFromForm(
  input: UpsertClientInput,
): Promise<SavedClient | null> {
  const name = input.name.trim();
  if (!name) return null;

  const payload = {
    name,
    email: normalizeOptional(input.email),
    phone: normalizeOptional(input.phone),
    company: normalizeOptional(input.company),
    address: normalizeOptional(input.address),
    gstNumber: normalizeOptional(input.gstNumber),
  };

  if (payload.email) {
    const existing = await getClientByEmail(payload.email);
    if (existing) {
      return updateClient(existing.id, payload);
    }
  }

  return createClient(payload);
}

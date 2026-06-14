import {
  type Agreement,
  type AgreementStatus,
  type CreateAgreementInput,
  type DeliverableItem,
  type ScopeOfWorkItem,
} from "@/app/dashboard/_lib/agreements";
import { sql } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

type AgreementRow = {
  id: string;
  title: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_representative: string;
  project_overview: string;
  scope_of_work: ScopeOfWorkItem[] | string;
  deliverables: DeliverableItem[] | string;
  timeline: string;
  hourly_rate: string | number | null;
  fixed_cost: string | number | null;
  advance_percent: number;
  payment_notes: string | null;
  status: string;
  ganesh_signature: string | null;
  client_signature: string | null;
  ganesh_signed_at: Date | string | null;
  client_signed_at: Date | string | null;
  client_sign_token: string | null;
  created_at: Date | string;
};

function parseJson<T>(value: T[] | string): T[] {
  return typeof value === "string" ? (JSON.parse(value) as T[]) : value;
}

function parseNumber(value: string | number | null): number | null {
  if (value === null) return null;
  return typeof value === "number" ? value : Number(value);
}

function toTimestamp(value: Date | string | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function rowToAgreement(row: AgreementRow): Agreement {
  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmail: row.client_email,
    clientRepresentative: row.client_representative,
    projectOverview: row.project_overview,
    scopeOfWork: parseJson<ScopeOfWorkItem>(row.scope_of_work),
    deliverables: parseJson<DeliverableItem>(row.deliverables),
    timeline: row.timeline,
    hourlyRate: parseNumber(row.hourly_rate),
    fixedCost: parseNumber(row.fixed_cost),
    advancePercent: row.advance_percent,
    paymentNotes: row.payment_notes ?? "",
    status: row.status as AgreementStatus,
    ganeshSignature: row.ganesh_signature,
    clientSignature: row.client_signature,
    ganeshSignedAt: toTimestamp(row.ganesh_signed_at),
    clientSignedAt: toTimestamp(row.client_signed_at),
    clientSignToken: row.client_sign_token,
    createdAt: toTimestamp(row.created_at)!,
  };
}

export async function readAgreements(): Promise<Agreement[]> {
  const { rows } = await sql<AgreementRow>`
    SELECT
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
    FROM agreements
    ORDER BY created_at DESC
  `;

  return rows.map(rowToAgreement);
}

export async function getAgreementById(id: string): Promise<Agreement | null> {
  const { rows } = await sql<AgreementRow>`
    SELECT
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
    FROM agreements
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}

export async function getAgreementByToken(
  token: string,
): Promise<Agreement | null> {
  const { rows } = await sql<AgreementRow>`
    SELECT
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
    FROM agreements
    WHERE client_sign_token = ${token}
    LIMIT 1
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}

export async function createAgreement(
  input: CreateAgreementInput,
): Promise<Agreement> {
  const id = uuidv4();

  const { rows } = await sql<AgreementRow>`
    INSERT INTO agreements (
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes
    ) VALUES (
      ${id},
      ${input.title},
      ${input.clientName},
      ${input.clientCompany},
      ${input.clientEmail},
      ${input.clientRepresentative},
      ${input.projectOverview},
      ${JSON.stringify(input.scopeOfWork)},
      ${JSON.stringify(input.deliverables)},
      ${input.timeline},
      ${input.hourlyRate},
      ${input.fixedCost},
      ${input.advancePercent},
      ${input.paymentNotes || null}
    )
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
  `;

  const row = rows[0];
  if (!row) throw new Error("Failed to create agreement.");
  return rowToAgreement(row);
}

export async function signAsGanesh(
  id: string,
  signature: string,
): Promise<Agreement | null> {
  const { rows } = await sql<AgreementRow>`
    UPDATE agreements
    SET
      ganesh_signature = ${signature},
      ganesh_signed_at = NOW(),
      status = 'awaiting_client'
    WHERE id = ${id}
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}

export async function sendToClient(
  id: string,
  token?: string,
): Promise<Agreement | null> {
  const signToken = token ?? uuidv4();

  const { rows } = await sql<AgreementRow>`
    UPDATE agreements
    SET
      client_sign_token = ${signToken},
      status = 'sent'
    WHERE id = ${id}
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}

export async function signAsClient(
  token: string,
  signature: string,
): Promise<Agreement | null> {
  const { rows } = await sql<AgreementRow>`
    UPDATE agreements
    SET
      client_signature = ${signature},
      client_signed_at = NOW(),
      status = 'signed'
    WHERE client_sign_token = ${token}
      AND client_signed_at IS NULL
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}

export async function deleteAgreement(id: string): Promise<boolean> {
  const { rows } = await sql<{ id: string }>`
    DELETE FROM agreements
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}

export async function updateAgreement(
  id: string,
  input: CreateAgreementInput,
  resetSigning: boolean,
): Promise<Agreement | null> {
  if (resetSigning) {
    const { rows } = await sql<AgreementRow>`
      UPDATE agreements
      SET
        title = ${input.title},
        client_name = ${input.clientName},
        client_company = ${input.clientCompany},
        client_email = ${input.clientEmail},
        client_representative = ${input.clientRepresentative},
        project_overview = ${input.projectOverview},
        scope_of_work = ${JSON.stringify(input.scopeOfWork)},
        deliverables = ${JSON.stringify(input.deliverables)},
        timeline = ${input.timeline},
        hourly_rate = ${input.hourlyRate},
        fixed_cost = ${input.fixedCost},
        advance_percent = ${input.advancePercent},
        payment_notes = ${input.paymentNotes || null},
        client_sign_token = NULL,
        ganesh_signed_at = NULL,
        ganesh_signature = NULL,
        status = 'draft'
      WHERE id = ${id}
        AND status IN ('draft', 'awaiting_client')
      RETURNING
        id,
        title,
        client_name,
        client_company,
        client_email,
        client_representative,
        project_overview,
        scope_of_work,
        deliverables,
        timeline,
        hourly_rate,
        fixed_cost,
        advance_percent,
        payment_notes,
        status,
        ganesh_signature,
        client_signature,
        ganesh_signed_at,
        client_signed_at,
        client_sign_token,
        created_at
    `;

    const row = rows[0];
    return row ? rowToAgreement(row) : null;
  }

  const { rows } = await sql<AgreementRow>`
    UPDATE agreements
    SET
      title = ${input.title},
      client_name = ${input.clientName},
      client_company = ${input.clientCompany},
      client_email = ${input.clientEmail},
      client_representative = ${input.clientRepresentative},
      project_overview = ${input.projectOverview},
      scope_of_work = ${JSON.stringify(input.scopeOfWork)},
      deliverables = ${JSON.stringify(input.deliverables)},
      timeline = ${input.timeline},
      hourly_rate = ${input.hourlyRate},
      fixed_cost = ${input.fixedCost},
      advance_percent = ${input.advancePercent},
      payment_notes = ${input.paymentNotes || null}
    WHERE id = ${id}
      AND status IN ('draft', 'awaiting_client')
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}

export async function updateClientEmail(
  id: string,
  clientEmail: string,
): Promise<Agreement | null> {
  const { rows } = await sql<AgreementRow>`
    UPDATE agreements
    SET client_email = ${clientEmail}
    WHERE id = ${id}
      AND status != 'signed'
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_representative,
      project_overview,
      scope_of_work,
      deliverables,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      status,
      ganesh_signature,
      client_signature,
      ganesh_signed_at,
      client_signed_at,
      client_sign_token,
      created_at
  `;

  const row = rows[0];
  return row ? rowToAgreement(row) : null;
}


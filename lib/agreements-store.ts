import {
  type Agreement,
  type AgreementStatus,
  type AgreementCurrency,
  type CreateAgreementInput,
  type DeliverableItem,
  type MilestoneItem,
  type PaymentStructure,
  type ScopeOfWorkItem,
  DEFAULT_GOVERNING_LAW,
  parseClientEmails,
  serializeClientEmails,
} from "@/app/dashboard/_lib/agreements";
import { sql } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

type AgreementRow = {
  id: string;
  title: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string | null;
  client_address: string | null;
  client_gst_number: string | null;
  client_representative: string;
  agreement_date: Date | string | null;
  project_overview: string;
  scope_of_work: ScopeOfWorkItem[] | string;
  deliverables: DeliverableItem[] | string;
  milestones: MilestoneItem[] | string | null;
  timeline: string;
  hourly_rate: string | number | null;
  fixed_cost: string | number | null;
  advance_percent: number | null;
  payment_notes: string | null;
  payment_structure: string;
  custom_payment_terms: string | null;
  late_payment_clause: boolean;
  revisions_included: number;
  revision_scope_note: string | null;
  ip_transfer: boolean;
  confidentiality: boolean;
  kill_fee: boolean;
  kill_fee_percent: number | null;
  late_payment_days: number | null;
  late_payment_interest: string | number | null;
  portfolio_rights: boolean | null;
  out_of_scope_clause: boolean | null;
  out_of_scope_rate: number | null;
  review_window_days: number | null;
  deemed_acceptance: boolean | null;
  limitation_of_liability: boolean | null;
  termination_notice_days: number | null;
  currency: string | null;
  governing_law: string;
  status: string;
  ganesh_signature: string | null;
  client_signature: string | null;
  ganesh_signed_at: Date | string | null;
  client_signed_at: Date | string | null;
  client_sign_token: string | null;
  created_at: Date | string;
};

function parseJson<T>(value: T[] | string | null): T[] {
  if (value === null) return [];
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

function toDateString(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function rowToAgreement(row: AgreementRow): Agreement {
  const clientEmails = parseClientEmails(row.client_email);
  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmails,
    clientEmail: clientEmails[0] ?? "",
    clientPhone: row.client_phone ?? "",
    clientAddress: row.client_address ?? "",
    clientGstNumber: row.client_gst_number ?? "",
    clientRepresentative: row.client_representative,
    agreementDate: toDateString(row.agreement_date),
    projectOverview: row.project_overview,
    scopeOfWork: parseJson<ScopeOfWorkItem>(row.scope_of_work),
    deliverables: parseJson<DeliverableItem>(row.deliverables),
    milestones: parseJson<MilestoneItem>(row.milestones),
    timeline: row.timeline,
    hourlyRate: parseNumber(row.hourly_rate),
    fixedCost: parseNumber(row.fixed_cost),
    advancePercent: row.advance_percent,
    paymentNotes: row.payment_notes ?? "",
    paymentStructure: row.payment_structure as PaymentStructure,
    customPaymentTerms: row.custom_payment_terms ?? "",
    latePaymentClause: row.late_payment_clause,
    latePaymentDays: row.late_payment_days ?? 7,
    latePaymentInterest: Number(row.late_payment_interest ?? 2),
    revisionsIncluded: row.revisions_included,
    revisionScopeNote: row.revision_scope_note ?? "",
    ipTransfer: row.ip_transfer,
    confidentiality: row.confidentiality,
    killFee: row.kill_fee,
    killFeePercent: row.kill_fee_percent ?? 50,
    portfolioRights: row.portfolio_rights ?? true,
    outOfScopeClause: row.out_of_scope_clause ?? true,
    outOfScopeRate: row.out_of_scope_rate,
    reviewWindowDays: row.review_window_days ?? 5,
    deemedAcceptance: row.deemed_acceptance ?? true,
    limitationOfLiability: row.limitation_of_liability ?? true,
    terminationNoticeDays: row.termination_notice_days ?? 7,
    currency: (row.currency ?? "INR") as AgreementCurrency,
    governingLaw: row.governing_law,
    status: row.status as AgreementStatus,
    ganeshSignature: row.ganesh_signature,
    clientSignature: row.client_signature,
    ganeshSignedAt: toTimestamp(row.ganesh_signed_at),
    clientSignedAt: toTimestamp(row.client_signed_at),
    clientSignToken: row.client_sign_token,
    createdAt: toTimestamp(row.created_at)!,
  };
}

function normalizeAgreementInput(input: CreateAgreementInput) {
  const paymentStructure = input.paymentStructure ?? "50_50";
  return {
    paymentStructure,
    customPaymentTerms: input.customPaymentTerms?.trim() ?? "",
    latePaymentClause: input.latePaymentClause ?? true,
    latePaymentDays: input.latePaymentDays ?? 7,
    latePaymentInterest: input.latePaymentInterest ?? 2,
    revisionsIncluded: input.revisionsIncluded ?? 2,
    revisionScopeNote: input.revisionScopeNote?.trim() ?? "",
    ipTransfer: input.ipTransfer ?? true,
    confidentiality: input.confidentiality ?? true,
    killFee: input.killFee ?? true,
    killFeePercent: input.killFeePercent ?? 50,
    portfolioRights: input.portfolioRights ?? true,
    outOfScopeClause: input.outOfScopeClause ?? true,
    outOfScopeRate: input.outOfScopeRate ?? null,
    reviewWindowDays: input.reviewWindowDays ?? 5,
    deemedAcceptance: input.deemedAcceptance ?? true,
    limitationOfLiability: input.limitationOfLiability ?? true,
    terminationNoticeDays: input.terminationNoticeDays ?? 7,
    currency: input.currency ?? "INR",
    governingLaw: input.governingLaw?.trim() || DEFAULT_GOVERNING_LAW,
    clientPhone: input.clientPhone?.trim() || null,
    clientAddress: input.clientAddress?.trim() || null,
    clientGstNumber: input.clientGstNumber?.trim() || null,
    agreementDate: input.agreementDate?.trim() || toDateString(null),
    milestonesJson:
      paymentStructure === "milestone" && input.milestones.length > 0
        ? JSON.stringify(input.milestones)
        : null,
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
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
  const normalized = normalizeAgreementInput(input);

  const { rows } = await sql<AgreementRow>`
    INSERT INTO agreements (
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law
    ) VALUES (
      ${id},
      ${input.title},
      ${input.clientName},
      ${input.clientCompany},
      ${serializeClientEmails(input.clientEmails)},
      ${normalized.clientPhone},
      ${normalized.clientAddress},
      ${normalized.clientGstNumber},
      ${input.clientRepresentative},
      ${normalized.agreementDate},
      ${input.projectOverview},
      ${JSON.stringify(input.scopeOfWork)},
      ${JSON.stringify(input.deliverables)},
      ${normalized.milestonesJson},
      ${input.timeline},
      ${input.hourlyRate},
      ${input.fixedCost},
      ${input.advancePercent},
      ${input.paymentNotes || null},
      ${normalized.paymentStructure},
      ${normalized.customPaymentTerms || null},
      ${normalized.latePaymentClause},
      ${normalized.revisionsIncluded},
      ${normalized.revisionScopeNote || null},
      ${normalized.ipTransfer},
      ${normalized.confidentiality},
      ${normalized.killFee},
      ${normalized.killFeePercent},
      ${normalized.latePaymentDays},
      ${normalized.latePaymentInterest},
      ${normalized.portfolioRights},
      ${normalized.outOfScopeClause},
      ${normalized.outOfScopeRate},
      ${normalized.reviewWindowDays},
      ${normalized.deemedAcceptance},
      ${normalized.limitationOfLiability},
      ${normalized.terminationNoticeDays},
      ${normalized.currency},
      ${normalized.governingLaw}
    )
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
  const normalized = normalizeAgreementInput(input);

  if (resetSigning) {
    const { rows } = await sql<AgreementRow>`
      UPDATE agreements
      SET
        title = ${input.title},
        client_name = ${input.clientName},
        client_company = ${input.clientCompany},
        client_email = ${serializeClientEmails(input.clientEmails)},
        client_phone = ${normalized.clientPhone},
        client_address = ${normalized.clientAddress},
        client_gst_number = ${normalized.clientGstNumber},
        client_representative = ${input.clientRepresentative},
        agreement_date = ${normalized.agreementDate},
        project_overview = ${input.projectOverview},
        scope_of_work = ${JSON.stringify(input.scopeOfWork)},
        deliverables = ${JSON.stringify(input.deliverables)},
        milestones = ${normalized.milestonesJson},
        timeline = ${input.timeline},
        hourly_rate = ${input.hourlyRate},
        fixed_cost = ${input.fixedCost},
        advance_percent = ${input.advancePercent},
        payment_notes = ${input.paymentNotes || null},
        payment_structure = ${normalized.paymentStructure},
        custom_payment_terms = ${normalized.customPaymentTerms || null},
        late_payment_clause = ${normalized.latePaymentClause},
        revisions_included = ${normalized.revisionsIncluded},
        revision_scope_note = ${normalized.revisionScopeNote || null},
        ip_transfer = ${normalized.ipTransfer},
        confidentiality = ${normalized.confidentiality},
        kill_fee = ${normalized.killFee},
        kill_fee_percent = ${normalized.killFeePercent},
        late_payment_days = ${normalized.latePaymentDays},
        late_payment_interest = ${normalized.latePaymentInterest},
        portfolio_rights = ${normalized.portfolioRights},
        out_of_scope_clause = ${normalized.outOfScopeClause},
        out_of_scope_rate = ${normalized.outOfScopeRate},
        review_window_days = ${normalized.reviewWindowDays},
        deemed_acceptance = ${normalized.deemedAcceptance},
        limitation_of_liability = ${normalized.limitationOfLiability},
        termination_notice_days = ${normalized.terminationNoticeDays},
        currency = ${normalized.currency},
        governing_law = ${normalized.governingLaw},
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
        client_phone,
        client_address,
        client_gst_number,
        client_representative,
        agreement_date,
        project_overview,
        scope_of_work,
        deliverables,
        milestones,
        timeline,
        hourly_rate,
        fixed_cost,
        advance_percent,
        payment_notes,
        payment_structure,
        custom_payment_terms,
        late_payment_clause,
        revisions_included,
        revision_scope_note,
        ip_transfer,
        confidentiality,
        kill_fee,
        kill_fee_percent,
        late_payment_days,
        late_payment_interest,
        portfolio_rights,
        out_of_scope_clause,
        out_of_scope_rate,
        review_window_days,
        deemed_acceptance,
        limitation_of_liability,
        termination_notice_days,
        currency,
        governing_law,
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
      client_email = ${serializeClientEmails(input.clientEmails)},
      client_phone = ${normalized.clientPhone},
      client_address = ${normalized.clientAddress},
      client_gst_number = ${normalized.clientGstNumber},
      client_representative = ${input.clientRepresentative},
      agreement_date = ${normalized.agreementDate},
      project_overview = ${input.projectOverview},
      scope_of_work = ${JSON.stringify(input.scopeOfWork)},
      deliverables = ${JSON.stringify(input.deliverables)},
      milestones = ${normalized.milestonesJson},
      timeline = ${input.timeline},
      hourly_rate = ${input.hourlyRate},
      fixed_cost = ${input.fixedCost},
      advance_percent = ${input.advancePercent},
      payment_notes = ${input.paymentNotes || null},
      payment_structure = ${normalized.paymentStructure},
      custom_payment_terms = ${normalized.customPaymentTerms || null},
      late_payment_clause = ${normalized.latePaymentClause},
      revisions_included = ${normalized.revisionsIncluded},
      revision_scope_note = ${normalized.revisionScopeNote || null},
      ip_transfer = ${normalized.ipTransfer},
      confidentiality = ${normalized.confidentiality},
      kill_fee = ${normalized.killFee},
      kill_fee_percent = ${normalized.killFeePercent},
      late_payment_days = ${normalized.latePaymentDays},
      late_payment_interest = ${normalized.latePaymentInterest},
      portfolio_rights = ${normalized.portfolioRights},
      out_of_scope_clause = ${normalized.outOfScopeClause},
      out_of_scope_rate = ${normalized.outOfScopeRate},
      review_window_days = ${normalized.reviewWindowDays},
      deemed_acceptance = ${normalized.deemedAcceptance},
      limitation_of_liability = ${normalized.limitationOfLiability},
      termination_notice_days = ${normalized.terminationNoticeDays},
      currency = ${normalized.currency},
      governing_law = ${normalized.governingLaw}
    WHERE id = ${id}
      AND status IN ('draft', 'awaiting_client')
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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
  clientEmails: string[],
): Promise<Agreement | null> {
  const storedEmail = serializeClientEmails(clientEmails);
  const { rows } = await sql<AgreementRow>`
    UPDATE agreements
    SET client_email = ${storedEmail}
    WHERE id = ${id}
      AND status != 'signed'
    RETURNING
      id,
      title,
      client_name,
      client_company,
      client_email,
      client_phone,
      client_address,
      client_gst_number,
      client_representative,
      agreement_date,
      project_overview,
      scope_of_work,
      deliverables,
      milestones,
      timeline,
      hourly_rate,
      fixed_cost,
      advance_percent,
      payment_notes,
      payment_structure,
      custom_payment_terms,
      late_payment_clause,
      revisions_included,
      revision_scope_note,
      ip_transfer,
      confidentiality,
      kill_fee,
      kill_fee_percent,
      late_payment_days,
      late_payment_interest,
      portfolio_rights,
      out_of_scope_clause,
      out_of_scope_rate,
      review_window_days,
      deemed_acceptance,
      limitation_of_liability,
      termination_notice_days,
      currency,
      governing_law,
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

import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export type FollowUpStatus = "draft" | "approved" | "sent";

export type EAFollowUp = {
  id: string;
  sessionId: string;
  meetingId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  body: string;
  status: FollowUpStatus;
  sentAt: string | null;
  emailId: string | null;
  createdAt: string;
  meetingTitle?: string | null;
};

type FollowUpRow = {
  id: string;
  session_id: string;
  meeting_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  status: string;
  sent_at: Date | string | null;
  email_id: string | null;
  created_at: Date | string;
  meeting_title?: string | null;
};

function rowToFollowUp(row: FollowUpRow): EAFollowUp {
  return {
    id: row.id,
    sessionId: row.session_id,
    meetingId: row.meeting_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    subject: row.subject,
    body: row.body,
    status: (row.status as FollowUpStatus) || "draft",
    sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    emailId: row.email_id,
    createdAt: new Date(row.created_at).toISOString(),
    meetingTitle: row.meeting_title ?? null,
  };
}

export async function listFollowUps(
  sessionId: string,
): Promise<EAFollowUp[]> {
  const { rows } = await sql<FollowUpRow>`
    SELECT f.*, m.title AS meeting_title
    FROM ea_followups f
    LEFT JOIN ea_meetings m ON m.id = f.meeting_id
    WHERE f.session_id = ${sessionId}
    ORDER BY f.created_at DESC
  `;
  return rows.map(rowToFollowUp);
}

export async function countPendingFollowUps(
  sessionId: string,
): Promise<number> {
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM ea_followups
    WHERE session_id = ${sessionId} AND status = 'draft'
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getFollowUpById(
  id: string,
  sessionId: string,
): Promise<EAFollowUp | null> {
  const { rows } = await sql<FollowUpRow>`
    SELECT f.*, m.title AS meeting_title
    FROM ea_followups f
    LEFT JOIN ea_meetings m ON m.id = f.meeting_id
    WHERE f.id = ${id} AND f.session_id = ${sessionId}
    LIMIT 1
  `;
  return rows[0] ? rowToFollowUp(rows[0]) : null;
}

export type CreateFollowUpInput = {
  meetingId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  status?: FollowUpStatus;
};

export async function createFollowUp(
  sessionId: string,
  input: CreateFollowUpInput,
): Promise<EAFollowUp> {
  const id = randomUUID();
  const status = input.status ?? "draft";

  await sql`
    INSERT INTO ea_followups (
      id, session_id, meeting_id, recipient_email, recipient_name,
      subject, body, status
    ) VALUES (
      ${id}, ${sessionId}, ${input.meetingId ?? null},
      ${input.recipientEmail}, ${input.recipientName ?? null},
      ${input.subject}, ${input.body}, ${status}
    )
  `;

  const created = await getFollowUpById(id, sessionId);
  if (!created) {
    throw new Error("Failed to create follow-up.");
  }
  return created;
}

export type UpdateFollowUpInput = {
  subject?: string;
  body?: string;
  status?: FollowUpStatus;
  sentAt?: string | null;
  emailId?: string | null;
};

export async function updateFollowUp(
  id: string,
  sessionId: string,
  input: UpdateFollowUpInput,
): Promise<EAFollowUp | null> {
  const existing = await getFollowUpById(id, sessionId);
  if (!existing) return null;

  await sql`
    UPDATE ea_followups
    SET
      subject = ${input.subject ?? existing.subject},
      body = ${input.body ?? existing.body},
      status = ${input.status ?? existing.status},
      sent_at = ${input.sentAt !== undefined ? input.sentAt : existing.sentAt},
      email_id = ${input.emailId !== undefined ? input.emailId : existing.emailId}
    WHERE id = ${id} AND session_id = ${sessionId}
  `;

  return getFollowUpById(id, sessionId);
}

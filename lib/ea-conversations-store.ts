import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export type EAConversationMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ConversationRow = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: Date | string;
};

function rowToMessage(row: ConversationRow): EAConversationMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role as "user" | "assistant",
    content: row.content,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function saveConversationMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const id = randomUUID();
  await sql`
    INSERT INTO ea_conversations (id, session_id, role, content, created_at)
    VALUES (${id}, ${sessionId}, ${role}, ${content}, NOW())
  `;
}

export async function getRecentConversationMessages(
  sessionId: string,
  limit = 20,
): Promise<EAConversationMessage[]> {
  const { rows } = await sql<ConversationRow>`
    SELECT id, session_id, role, content, created_at
    FROM ea_conversations
    WHERE session_id = ${sessionId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map(rowToMessage).reverse();
}

export async function clearConversationMessages(
  sessionId: string,
): Promise<number> {
  const { rows } = await sql<{ count: string }>`
    WITH deleted AS (
      DELETE FROM ea_conversations WHERE session_id = ${sessionId} RETURNING id
    )
    SELECT COUNT(*)::text AS count FROM deleted
  `;
  return Number(rows[0]?.count ?? 0);
}

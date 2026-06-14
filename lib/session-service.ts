import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import { rowToUser, type EAUser, type UserRow } from "@/lib/auth-types";

export async function createSession(userId: string): Promise<string> {
  const token = `${randomUUID()}-${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO ea_sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function getSessionUser(token: string): Promise<EAUser | null> {
  const { rows } = await sql<UserRow>`
    SELECT u.*
    FROM ea_users u
    JOIN ea_sessions s ON s.user_id = u.id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM ea_sessions WHERE token = ${token}`;
}

/**
 * Node.js runtime only — validates ea_token against ea_sessions in the DB.
 * Not imported by middleware.
 */
export async function getSessionUserId(token: string): Promise<string | null> {
  const user = await getSessionUser(token);
  return user?.id ?? null;
}

import { sql } from "@/lib/db";
import { isValidMoodboardSessionId } from "./analytics";

export async function deleteMoodboardSession(sessionId: string): Promise<boolean> {
  if (!isValidMoodboardSessionId(sessionId)) return false;

  await sql`DELETE FROM moodboard_events WHERE session_id = ${sessionId}`;
  await sql`DELETE FROM moodboard_directions WHERE session_id = ${sessionId}`;

  const result = await sql`
    DELETE FROM moodboard_sessions
    WHERE session_id = ${sessionId}
    RETURNING id
  `;

  return result.rows.length > 0;
}

export async function deleteMoodboardSessionsBulk(sessionIds: string[]): Promise<number> {
  const unique = [...new Set(sessionIds.filter(isValidMoodboardSessionId))];
  let deleted = 0;
  for (const sessionId of unique) {
    if (await deleteMoodboardSession(sessionId)) deleted++;
  }
  return deleted;
}

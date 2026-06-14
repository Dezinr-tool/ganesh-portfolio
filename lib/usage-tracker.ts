import { sql } from "@/lib/db";

export async function trackMessage(userId: string): Promise<number> {
  const { rows } = await sql<{ message_count: number }>`
    INSERT INTO ea_usage (user_id, usage_date, message_count)
    VALUES (${userId}, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET message_count = ea_usage.message_count + 1
    RETURNING message_count
  `;
  return rows[0]?.message_count ?? 1;
}

export async function getDailyUsage(userId: string): Promise<number> {
  const { rows } = await sql<{ message_count: string }>`
    SELECT COALESCE(message_count, 0)::text AS message_count
    FROM ea_usage
    WHERE user_id = ${userId} AND usage_date = CURRENT_DATE
    LIMIT 1
  `;
  return Number(rows[0]?.message_count ?? 0);
}

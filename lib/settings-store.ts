import { sql } from "@/lib/db";

export const GANESH_DEFAULT_SIGNATURE_KEY = "ganesh_default_signature";

export async function getSetting(key: string): Promise<string | null> {
  const { rows } = await sql<{ value: string }>`
    SELECT value FROM settings WHERE key = ${key} LIMIT 1
  `;
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  `;
}

export async function getDefaultSignature(): Promise<string | null> {
  return getSetting(GANESH_DEFAULT_SIGNATURE_KEY);
}

export async function saveDefaultSignature(base64: string): Promise<void> {
  await setSetting(GANESH_DEFAULT_SIGNATURE_KEY, base64);
}

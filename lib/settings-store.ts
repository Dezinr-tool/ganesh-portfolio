import { sql } from "@/lib/db";

export const GANESH_DEFAULT_SIGNATURE_KEY = "ganesh_default_signature";

export const BILLING_SETTING_KEYS = {
  hourlyRate: "hourly_rate",
  upiId: "upi_id",
  bankAccountHolder: "bank_account_holder",
  bankName: "bank_name",
  bankAccountNumber: "bank_account_number",
  bankIfsc: "bank_ifsc",
  panNumber: "pan_number",
} as const;

export type BillingSettings = {
  hourlyRate: number;
  upiId: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  panNumber: string;
};

export type BillingSettingsPatch = Partial<BillingSettings>;

const BILLING_DEFAULTS: Record<string, string> = {
  [BILLING_SETTING_KEYS.hourlyRate]: "0",
  [BILLING_SETTING_KEYS.upiId]: "7304492888@ptaxis",
  [BILLING_SETTING_KEYS.bankAccountHolder]: "Ganesh Das",
  [BILLING_SETTING_KEYS.bankName]: "State Bank Of India",
  [BILLING_SETTING_KEYS.bankAccountNumber]: "39643511245",
  [BILLING_SETTING_KEYS.bankIfsc]: "SBIN0014915",
  [BILLING_SETTING_KEYS.panNumber]: "BIKPD1450N",
};

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

export async function ensureBillingDefaults(): Promise<void> {
  for (const [key, value] of Object.entries(BILLING_DEFAULTS)) {
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO NOTHING
    `;
  }
}

function parseHourlyRate(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getBillingSettings(): Promise<BillingSettings> {
  await ensureBillingDefaults();

  const [
    hourlyRateRaw,
    upiId,
    bankAccountHolder,
    bankName,
    bankAccountNumber,
    bankIfsc,
    panNumber,
  ] = await Promise.all([
    getSetting(BILLING_SETTING_KEYS.hourlyRate),
    getSetting(BILLING_SETTING_KEYS.upiId),
    getSetting(BILLING_SETTING_KEYS.bankAccountHolder),
    getSetting(BILLING_SETTING_KEYS.bankName),
    getSetting(BILLING_SETTING_KEYS.bankAccountNumber),
    getSetting(BILLING_SETTING_KEYS.bankIfsc),
    getSetting(BILLING_SETTING_KEYS.panNumber),
  ]);

  return {
    hourlyRate: parseHourlyRate(hourlyRateRaw),
    upiId: upiId ?? BILLING_DEFAULTS[BILLING_SETTING_KEYS.upiId],
    bankAccountHolder:
      bankAccountHolder ?? BILLING_DEFAULTS[BILLING_SETTING_KEYS.bankAccountHolder],
    bankName: bankName ?? BILLING_DEFAULTS[BILLING_SETTING_KEYS.bankName],
    bankAccountNumber:
      bankAccountNumber ?? BILLING_DEFAULTS[BILLING_SETTING_KEYS.bankAccountNumber],
    bankIfsc: bankIfsc ?? BILLING_DEFAULTS[BILLING_SETTING_KEYS.bankIfsc],
    panNumber: panNumber ?? BILLING_DEFAULTS[BILLING_SETTING_KEYS.panNumber],
  };
}

export async function updateBillingSettings(
  patch: BillingSettingsPatch,
): Promise<BillingSettings> {
  const updates: Promise<void>[] = [];

  if (patch.hourlyRate !== undefined) {
    if (!Number.isFinite(patch.hourlyRate) || patch.hourlyRate < 0) {
      throw new Error("Invalid hourly rate.");
    }
    updates.push(
      setSetting(BILLING_SETTING_KEYS.hourlyRate, String(patch.hourlyRate)),
    );
  }

  if (patch.upiId !== undefined) {
    updates.push(setSetting(BILLING_SETTING_KEYS.upiId, patch.upiId.trim()));
  }

  if (patch.bankAccountHolder !== undefined) {
    updates.push(
      setSetting(
        BILLING_SETTING_KEYS.bankAccountHolder,
        patch.bankAccountHolder.trim(),
      ),
    );
  }

  if (patch.bankName !== undefined) {
    updates.push(
      setSetting(BILLING_SETTING_KEYS.bankName, patch.bankName.trim()),
    );
  }

  if (patch.bankAccountNumber !== undefined) {
    updates.push(
      setSetting(
        BILLING_SETTING_KEYS.bankAccountNumber,
        patch.bankAccountNumber.trim(),
      ),
    );
  }

  if (patch.bankIfsc !== undefined) {
    updates.push(
      setSetting(BILLING_SETTING_KEYS.bankIfsc, patch.bankIfsc.trim()),
    );
  }

  if (patch.panNumber !== undefined) {
    updates.push(
      setSetting(BILLING_SETTING_KEYS.panNumber, patch.panNumber.trim()),
    );
  }

  if (updates.length === 0) {
    throw new Error("No settings to update.");
  }

  await Promise.all(updates);
  return getBillingSettings();
}

export async function getDefaultSignature(): Promise<string | null> {
  return getSetting(GANESH_DEFAULT_SIGNATURE_KEY);
}

export async function saveDefaultSignature(base64: string): Promise<void> {
  await setSetting(GANESH_DEFAULT_SIGNATURE_KEY, base64);
}

/** @deprecated Use getBillingSettings().hourlyRate */
export async function getHourlyRate(): Promise<number> {
  const settings = await getBillingSettings();
  return settings.hourlyRate;
}

/** @deprecated Use updateBillingSettings({ hourlyRate }) */
export async function setHourlyRate(rate: number): Promise<void> {
  await updateBillingSettings({ hourlyRate: rate });
}

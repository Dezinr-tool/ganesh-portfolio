"use server";

import fs from "fs/promises";
import path from "path";
import {
  DEFAULT_EA_SETTINGS,
  normalizeEASettings,
  type EASettings,
} from "@/lib/ea-settings-helpers";

const SETTINGS_PATH = path.join(process.cwd(), ".ea-settings.json");

export type { EASettings } from "@/lib/ea-settings-helpers";

export async function loadEASettings(): Promise<EASettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    return normalizeEASettings(JSON.parse(raw) as Partial<EASettings>);
  } catch {
    return DEFAULT_EA_SETTINGS;
  }
}

export async function saveEASettings(settings: EASettings): Promise<EASettings> {
  const normalized = normalizeEASettings(settings);
  await fs.writeFile(
    SETTINGS_PATH,
    JSON.stringify(normalized, null, 2),
    "utf8",
  );
  return normalized;
}

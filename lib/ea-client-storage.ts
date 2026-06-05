export const EA_CHAT_STORAGE_KEY = "ea_chat_messages";
export const EA_CALENDAR_UPDATED_KEY = "ea_calendar_updated_at";
export const EA_SETTINGS_STORAGE_KEY = "ea_settings";

export { DEFAULT_EA_NAME } from "@/lib/ea-settings-helpers";
export type { EASettings } from "@/lib/ea-settings-helpers";

import type { EASettings } from "@/lib/ea-settings-helpers";

export function notifyCalendarUpdated(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EA_CALENDAR_UPDATED_KEY, String(Date.now()));
  window.dispatchEvent(new Event("ea-calendar-updated"));
}

export function loadChatMessages<T>(): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EA_CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveChatMessages(messages: unknown[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EA_CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function loadLocalEASettings(): EASettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EA_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EASettings;
    if (typeof parsed.eaName === "string" && parsed.eaName.trim()) {
      return { eaName: parsed.eaName.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLocalEASettings(settings: EASettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EA_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function notifyEASettingsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ea-settings-updated"));
}

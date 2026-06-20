"use client";

import { useCallback, useSyncExternalStore } from "react";

const SESSION_ID_CHANGED = "client-session-id-changed";

function getServerSessionSnapshot() {
  return "";
}

export function ensureStoredId(storageKey: string): string {
  let sid = localStorage.getItem(storageKey);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(storageKey, sid);
  }
  return sid;
}

/** Persist a new client session id and notify subscribers (no page reload). */
export function setClientSessionId(storageKey: string, id: string): void {
  localStorage.setItem(storageKey, id);
  window.dispatchEvent(
    new CustomEvent(SESSION_ID_CHANGED, { detail: { storageKey } }),
  );
}

/** Client session id — getSnapshot runs on first client paint with real localStorage value. */
export function useClientSessionId(storageKey: string): string {
  const getSnapshot = useCallback(() => ensureStoredId(storageKey), [storageKey]);
  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (event: Event) => {
        const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
        if (!detail?.storageKey || detail.storageKey === storageKey) {
          callback();
        }
      };
      window.addEventListener(SESSION_ID_CHANGED, handler);
      return () => window.removeEventListener(SESSION_ID_CHANGED, handler);
    },
    [storageKey],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSessionSnapshot);
}

export function readStoredValue<T extends string>(
  storageKey: string,
  isValid: (value: string) => value is T,
  fallback: T,
): T {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(storageKey);
  return stored && isValid(stored) ? stored : fallback;
}

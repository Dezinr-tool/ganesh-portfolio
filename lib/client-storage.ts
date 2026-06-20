"use client";

import { useCallback, useEffect, useState } from "react";

export function ensureStoredId(storageKey: string): string {
  let sid = localStorage.getItem(storageKey);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(storageKey, sid);
  }
  return sid;
}

/** Stable session id from first client paint — avoids empty id during hydration. */
export function useClientSessionId(storageKey: string): string {
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    return ensureStoredId(storageKey);
  });

  useEffect(() => {
    if (!sessionId) {
      setSessionId(ensureStoredId(storageKey));
    }
  }, [sessionId, storageKey]);

  return sessionId;
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

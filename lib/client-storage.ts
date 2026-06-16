"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

function getServerEmpty() {
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

export function useClientSessionId(storageKey: string): string {
  const getSnapshot = useCallback(() => ensureStoredId(storageKey), [storageKey]);
  return useSyncExternalStore(subscribeNoop, getSnapshot, getServerEmpty);
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

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_EA_NAME,
  loadLocalEASettings,
  notifyEASettingsUpdated,
  saveLocalEASettings,
} from "@/lib/ea-client-storage";

export function useEASettings() {
  const [eaName, setEaName] = useState(
    () => loadLocalEASettings()?.eaName ?? DEFAULT_EA_NAME,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ea/settings", { credentials: "include" });
      const data = await res.json();
      const name =
        typeof data.eaName === "string" && data.eaName.trim()
          ? data.eaName.trim()
          : DEFAULT_EA_NAME;
      setEaName(name);
      saveLocalEASettings({ eaName: name });
    } catch {
      const local = loadLocalEASettings();
      if (local?.eaName) setEaName(local.eaName);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/ea/settings", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        const name =
          typeof data.eaName === "string" && data.eaName.trim()
            ? data.eaName.trim()
            : DEFAULT_EA_NAME;
        setEaName(name);
        saveLocalEASettings({ eaName: name });
      } catch {
        if (cancelled) return;
        const local = loadLocalEASettings();
        if (local?.eaName) setEaName(local.eaName);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const onUpdated = () => {
      void refresh();
    };
    window.addEventListener("ea-settings-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("ea-settings-updated", onUpdated);
    };
  }, [refresh]);

  return { eaName, loading, refresh };
}

export async function saveEASettingsClient(eaName: string): Promise<string> {
  const res = await fetch("/api/ea/settings", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eaName }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to save settings.");
  }

  const name =
    typeof data.eaName === "string" && data.eaName.trim()
      ? data.eaName.trim()
      : DEFAULT_EA_NAME;

  saveLocalEASettings({ eaName: name });
  notifyEASettingsUpdated();
  return name;
}

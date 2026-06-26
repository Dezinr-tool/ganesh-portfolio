"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClientFormValues, SavedClient } from "@/app/dashboard/_lib/clients";

type ClientSelectorProps = {
  values: ClientFormValues;
  onChange: (patch: Partial<ClientFormValues>) => void;
};

function clientToFormValues(client: SavedClient): Partial<ClientFormValues> {
  return {
    clientName: client.name,
    clientEmail: client.email ?? "",
    clientPhone: client.phone ?? "",
    clientCompany: client.company ?? "",
    clientAddress: client.address ?? "",
    gstNumber: client.gstNumber ?? "",
  };
}

export function ClientSelector({ values, onChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then(async (res) => {
        if (res.status === 401) {
          setActionError("Session expired. Please log in again.");
          return;
        }
        if (!res.ok) {
          setActionError("Could not load saved clients.");
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.clients)) {
          setClients(data.clients);
        }
      })
      .catch(() => setActionError("Could not load saved clients."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((client) => {
      const name = client.name.toLowerCase();
      const company = (client.company ?? "").toLowerCase();
      return name.includes(term) || company.includes(term);
    });
  }, [clients, query]);

  const selectedLabel = useMemo(() => {
    if (selectedId === null) return null;
    const client = clients.find((item) => item.id === selectedId);
    if (!client) return null;
    return client.company
      ? `${client.name} — ${client.company}`
      : client.name;
  }, [clients, selectedId]);

  function handleSelect(client: SavedClient) {
    setSelectedId(client.id);
    onChange(clientToFormValues(client));
    setOpen(false);
    setQuery("");
    setActionError(null);
  }

  async function handleSaveAsNew() {
    if (!values.clientName.trim()) {
      setActionError("Enter a client name before saving.");
      return;
    }

    setSavingNew(true);
    setActionError(null);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.clientName.trim(),
          email: values.clientEmail.trim() || null,
          phone: values.clientPhone.trim() || null,
          company: values.clientCompany.trim() || null,
          address: values.clientAddress.trim() || null,
          gstNumber: values.gstNumber.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionError(data.error ?? "Failed to save client.");
        return;
      }

      setClients((current) =>
        [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedId(data.id);
      onChange(clientToFormValues(data));
      setOpen(false);
      setQuery("");
    } catch {
      setActionError("Failed to save client.");
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative space-y-2"
      style={{ color: "#111111" }}
    >
      <label
        htmlFor="client-selector-search"
        className="block text-sm font-medium"
        style={{ color: "#111111" }}
      >
        Select Client
      </label>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-10 w-full items-center justify-between gap-2 border px-3 py-2 text-left text-sm"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "#111111",
          color: "#111111",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={selectedLabel ? "" : "opacity-60"}>
          {loading
            ? "Loading clients…"
            : selectedLabel ?? "Choose a saved client or enter details below"}
        </span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute z-50 mt-1 w-full border shadow-sm"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#111111" }}
          role="listbox"
        >
          <div
            className="flex items-center gap-2 border-b px-3 py-2"
            style={{ borderColor: "#111111" }}
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              id="client-selector-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or company"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "#111111" }}
              autoFocus
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredClients.length === 0 ? (
              <li
                className="px-3 py-2 text-sm opacity-60"
                style={{ color: "#111111" }}
              >
                {loading ? "Loading…" : "No matching clients."}
              </li>
            ) : (
              filteredClients.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(client)}
                    className="w-full px-3 py-2 text-left text-sm hover:opacity-80"
                    style={{
                      backgroundColor:
                        selectedId === client.id ? "#111111" : "#FFFFFF",
                      color: selectedId === client.id ? "#FFFFFF" : "#111111",
                    }}
                  >
                    <span className="block font-medium">{client.name}</span>
                    {client.company ? (
                      <span className="block text-xs opacity-80">
                        {client.company}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>

          <button
            type="button"
            onClick={handleSaveAsNew}
            disabled={savingNew}
            className="w-full border-t px-3 py-2 text-left text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "#111111",
              color: "#FF1E00",
            }}
          >
            {savingNew ? "Saving…" : "+ Save as new client"}
          </button>
        </div>
      ) : null}

      {actionError ? (
        <p className="text-sm" style={{ color: "#FF1E00" }} role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

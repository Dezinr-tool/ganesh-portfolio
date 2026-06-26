"use client";

import { ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { ClientFormValues, SavedClient } from "@/app/dashboard/_lib/clients";

type ClientSelectorProps = {
  values: ClientFormValues;
  onChange: (patch: Partial<ClientFormValues>) => void;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function normalizeSavedClient(raw: unknown): SavedClient | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "number") return null;

  const name = String(record.name ?? record.client_name ?? "").trim();
  if (!name) return null;

  return {
    id: record.id,
    name,
    email: asNullableString(record.email ?? record.client_email),
    phone: asNullableString(record.phone ?? record.client_phone),
    company: asNullableString(record.company ?? record.client_company),
    address: asNullableString(record.address ?? record.client_address),
    gstNumber: asNullableString(record.gstNumber ?? record.gst_number),
    createdAt: String(record.createdAt ?? record.created_at ?? ""),
  };
}

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
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          setClients(
            data.clients
              .map(normalizeSavedClient)
              .filter((client: SavedClient | null): client is SavedClient =>
                client !== null,
              ),
          );
        }
      })
      .catch(() => setActionError("Could not load saved clients."))
      .finally(() => setLoading(false));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
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

      const savedClient = normalizeSavedClient(data);
      if (!savedClient) {
        setActionError("Failed to save client.");
        return;
      }

      setClients((current) =>
        [...current, savedClient].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedId(savedClient.id);
      onChange(clientToFormValues(savedClient));
      setOpen(false);
      setQuery("");
    } catch {
      setActionError("Failed to save client.");
    } finally {
      setSavingNew(false);
    }
  }

  const dropdown =
    open && dropdownPosition
      ? createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] border shadow-sm"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              backgroundColor: "#FFFFFF",
              borderColor: "#111111",
            }}
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
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelect(client);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:opacity-80"
                      style={{
                        backgroundColor:
                          selectedId === client.id ? "#111111" : "#FFFFFF",
                        color:
                          selectedId === client.id ? "#FFFFFF" : "#111111",
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
              onMouseDown={(event) => event.preventDefault()}
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
          </div>,
          document.body,
        )
      : null;

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
        ref={triggerRef}
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

      {dropdown}

      {actionError ? (
        <p className="text-sm" style={{ color: "#FF1E00" }} role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

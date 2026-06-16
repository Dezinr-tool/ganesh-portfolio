"use client";

import { useEffect, useState } from "react";
import { KnowledgeAdminPanel } from "./_components/knowledge-admin-panel";
import { DesignToolNav } from "@/app/_components/design-tool-nav";

export default function KnowledgeAdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/knowledge/list").then((res) => {
      if (!cancelled) setAuthed(res.ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/ea/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setPassword("");
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <DesignToolNav
        title="Knowledge Admin"
        links={[
          { href: "/tools", label: "All Tools" },
          { href: "/knowledge-admin", label: "Admin", match: "exact" },
        ]}
      />

      {authed === null ? (
        <p className="py-20 text-center text-sm text-zinc-500">Loading…</p>
      ) : !authed ? (
        <form
          onSubmit={handleLogin}
          className="mx-auto mt-24 max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <h2 className="text-center text-sm font-medium">Admin access</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="EA password"
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-zinc-600"
          />
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-white py-2 text-sm font-medium text-black"
          >
            Sign in
          </button>
        </form>
      ) : (
        <KnowledgeAdminPanel />
      )}
    </div>
  );
}

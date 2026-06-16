"use client";

import { useEffect, useState } from "react";
import { SessionsDashboard } from "./_components/sessions-dashboard";
import type { SessionAnalyticsSummary } from "@/lib/moodboard/analytics";
import { MoodboardNav } from "../_components/moodboard-nav";

export default function MoodboardSessionsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<SessionAnalyticsSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/moodboard/admin/questions")
      .then((res) => {
        if (!cancelled) setAuthed(res.ok);
        return res.ok ? fetch("/api/moodboard/admin/sessions") : null;
      })
      .then(async (res) => {
        if (!res?.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setSessions(data.sessions ?? []);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
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
      const dataRes = await fetch("/api/moodboard/admin/sessions");
      if (dataRes.ok) {
        const data = await dataRes.json();
        setSessions(data.sessions ?? []);
      }
    } else {
      setError("Invalid password");
    }
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
        <MoodboardNav />
        <p className="py-20 text-center text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
        <MoodboardNav />
        <div className="mx-auto flex max-w-sm flex-col px-4 py-20">
          <h1 className="text-xl font-medium text-white">Sessions</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Owner access — enter EA password to view tester journeys.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-900"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <SessionsDashboard sessions={sessions} />;
}

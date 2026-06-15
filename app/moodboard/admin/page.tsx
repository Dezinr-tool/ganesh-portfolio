"use client";

import { useCallback, useEffect, useState } from "react";
import { MoodboardNav } from "../_components/moodboard-nav";
import { AdminEditor } from "./_components/admin-editor";

export default function MoodboardAdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/moodboard/admin/questions");
    setAuthed(res.ok);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
          <h1 className="text-xl font-medium text-white">Admin</h1>
          <p className="mt-2 text-sm text-zinc-500">Enter EA password to edit questions.</p>
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

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <MoodboardNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-light text-white">Question Editor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit intake questions — changes save immediately.
        </p>
        <AdminEditor />
      </main>
    </div>
  );
}

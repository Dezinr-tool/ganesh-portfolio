"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoodboardNav } from "../../_components/moodboard-nav";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = searchParams.get("from") ?? "/moodboard/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/moodboard/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, from }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Incorrect password");
        return;
      }

      router.push(typeof data.redirect === "string" ? data.redirect : from);
      router.refresh();
    } catch {
      setError("Incorrect password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-[var(--color-text)] bg-[var(--color-bg)] p-6"
    >
      <h1 className="text-center text-lg font-medium text-[var(--color-bg)]">Admin Access</h1>
      <p className="mt-2 text-center text-sm text-[var(--color-text)]">
        Enter password to continue
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        className="mt-6 w-full rounded-xl border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-bg)] outline-none placeholder:text-[var(--color-text)] focus:border-[var(--color-text)]"
      />
      {error ? (
        <p className="mt-3 text-center text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-4 w-full rounded-xl bg-[var(--color-bg)] py-3 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-50"
      >
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export default function MoodboardAdminLoginPage() {
  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <MoodboardNav />
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4">
        <Suspense
          fallback={
            <div className="w-full max-w-sm rounded-2xl border border-[var(--color-text)] bg-[var(--color-bg)] p-6 text-center text-sm text-[var(--color-text)]">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

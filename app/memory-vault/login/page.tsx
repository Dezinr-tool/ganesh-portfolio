"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = searchParams.get("from") ?? "/memory-vault";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/memory-vault/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Incorrect password");
        return;
      }

      router.push(from);
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
      className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0a0a0a] p-6"
    >
      <h1 className="text-center text-lg font-medium text-white">Memory Vault</h1>
      <p className="mt-2 text-center text-sm text-white/60">
        Enter password to continue
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
      />
      {error ? (
        <p className="mt-3 text-center text-sm text-red-400">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
      >
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export default function MemoryVaultLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0a0a0a] p-6 text-center text-sm text-white/60">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

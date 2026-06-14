"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useEASettings } from "../_components/use-ea-settings";
import { buildEAPreview } from "@/lib/ea-settings-helpers";

export default function EALoginPage() {
  const { eaName } = useEASettings();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legacyPassword, setLegacyPassword] = useState("");
  const [showLegacy, setShowLegacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ea/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/ea/chat");
        return;
      }

      const data = await res.json();
      setError(data.error ?? "Invalid email or password.");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLegacyLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ea/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: legacyPassword }),
      });

      if (res.ok) {
        router.push("/ea/chat");
        return;
      }

      setError("Wrong password");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-900 text-white border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-zinc-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-sm p-8">
        <h1 className="mb-2 text-2xl font-light text-white">{eaName}</h1>
        <p className="mb-8 text-sm text-zinc-500">{buildEAPreview(eaName)}</p>

        {!showLegacy ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Legacy access password"
              value={legacyPassword}
              onChange={(e) => setLegacyPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLegacyLogin()}
              className={inputClass}
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="button"
              onClick={handleLegacyLogin}
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Entering…" : "Enter"}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-zinc-500">
            No account?{" "}
            <Link
              href="/ea/signup"
              className="text-zinc-300 underline hover:text-white"
            >
              Sign up
            </Link>
          </p>
          <button
            type="button"
            onClick={() => {
              setShowLegacy((value) => !value);
              setError("");
            }}
            className="text-zinc-600 underline hover:text-zinc-400"
          >
            {showLegacy ? "Use email login" : "Legacy password access"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    "w-full rounded-lg border border-[#111111]/30 bg-[#FFFFFF] px-4 py-3 text-[#111111] outline-none placeholder:text-[#111111]/45 focus:border-[#111111]";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-[#FFFFFF]">
      <div className="w-full max-w-sm p-8">
        <h1 className="mb-2 text-2xl font-light text-[#FFFFFF]">{eaName}</h1>
        <p className="mb-8 text-sm text-[#FFFFFF]/70">{buildEAPreview(eaName)}</p>

        {!showLegacy ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-[#FFFFFF]/60">
                Email
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-[#FFFFFF]/60">
                Password
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </label>

            {error ? <p className="text-sm text-[#FF1E00]">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#FFFFFF] py-3 font-medium text-[#111111] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-[#FFFFFF]/60">
                Access password
              </span>
              <input
                type="password"
                placeholder="Enter password"
                value={legacyPassword}
                onChange={(e) => setLegacyPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLegacyLogin()}
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
            {error ? <p className="text-sm text-[#FF1E00]">{error}</p> : null}
            <button
              type="button"
              onClick={() => void handleLegacyLogin()}
              disabled={loading}
              className="w-full rounded-lg bg-[#FFFFFF] py-3 font-medium text-[#111111] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Entering…" : "Enter"}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3 text-center text-sm text-[#FFFFFF]/70">
          <p>
            No account?{" "}
            <Link
              href="/ea/signup"
              className="text-[#FFFFFF] underline underline-offset-2 hover:text-[#FF1E00]"
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
            className="text-[#FFFFFF]/70 underline underline-offset-2 hover:text-[#FFFFFF]"
          >
            {showLegacy ? "Use email login" : "Legacy password access"}
          </button>
        </div>
      </div>
    </div>
  );
}

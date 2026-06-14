"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useEASettings } from "../_components/use-ea-settings";
import { buildEAPreview } from "@/lib/ea-settings-helpers";

export default function EASignupPage() {
  const { eaName } = useEASettings();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ea/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, industry }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed.");
        setLoading(false);
        return;
      }

      router.replace("/ea/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-900 text-white border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-zinc-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-light text-white">Start with {eaName}</h1>
        <p className="mb-8 text-sm text-zinc-500">{buildEAPreview(eaName)}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Role (e.g. Design Manager)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Industry (e.g. Design / Technology)"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            className={inputClass}
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-3 font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/ea/login" className="text-zinc-300 underline hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

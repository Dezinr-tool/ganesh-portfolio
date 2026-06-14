"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useEASettings } from "../_components/use-ea-settings";

const COMMUNICATION_STYLES = [
  {
    id: "casual",
    label: "Casual",
    hint: "Relaxed, friendly — like a colleague on Slack",
  },
  {
    id: "direct",
    label: "Direct",
    hint: "Short and to the point — answer first",
  },
  {
    id: "collaborative",
    label: "Collaborative",
    hint: "Warm, options-oriented, team-player vibe",
  },
  {
    id: "analytical",
    label: "Analytical",
    hint: "Structured, precise, trade-offs when helpful",
  },
] as const;

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Singapore",
];

export default function EAOnboardingPage() {
  const router = useRouter();
  const { eaName } = useEASettings();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [communicationStyle, setCommunicationStyle] =
    useState<(typeof COMMUNICATION_STYLES)[number]["id"]>("casual");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ea/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          industry: industry.trim(),
          communicationStyle,
          timezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save profile.");
        setLoading(false);
        return;
      }

      router.replace("/ea/chat");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <p className="text-zinc-500 text-sm mb-2">Welcome to {eaName}</p>
        <h1 className="text-2xl font-light mb-2">Quick setup</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Tell me a bit about you so I can match your style and timezone.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-zinc-400 text-sm">Your name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ganesh"
              className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </label>

          <label className="block">
            <span className="text-zinc-400 text-sm">Role</span>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Design Manager"
              className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </label>

          <label className="block">
            <span className="text-zinc-400 text-sm">Industry</span>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Design / Technology"
              className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </label>

          <fieldset>
            <legend className="text-zinc-400 text-sm mb-2">
              Preferred communication style
            </legend>
            <div className="grid gap-2">
              {COMMUNICATION_STYLES.map((style) => (
                <label
                  key={style.id}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                    communicationStyle === style.id
                      ? "border-white bg-zinc-900"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="communicationStyle"
                    value={style.id}
                    checked={communicationStyle === style.id}
                    onChange={() => setCommunicationStyle(style.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm">{style.label}</span>
                    <span className="block text-zinc-500 text-xs mt-0.5">
                      {style.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-zinc-400 text-sm">Timezone</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-600"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-lg py-3 font-medium hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Continue to chat"}
          </button>
        </form>
      </div>
    </div>
  );
}

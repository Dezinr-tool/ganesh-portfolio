import Link from "next/link";
import { MaxShell } from "./_components/max-shell";

const FEATURES = [
  {
    icon: "📅",
    title: "Calendar management",
    desc: "Schedule, detect conflicts, daily briefings",
  },
  {
    icon: "📧",
    title: "Meeting follow-ups",
    desc: "AI-generated drafts — you approve before send",
  },
  {
    icon: "🎙️",
    title: "Voice-first",
    desc: "Talk to Virtual EA naturally in English or Hinglish",
  },
  {
    icon: "🧠",
    title: "AI memory",
    desc: "Remembers preferences and context across sessions",
  },
];

const PLANS = [
  {
    name: "Free trial",
    price: "14 days",
    features: ["All Pro features", "No card required"],
  },
  {
    name: "Starter",
    price: "$29/mo",
    features: ["100 msgs/day", "Calendar + voice", "Meeting summaries"],
  },
  {
    name: "Pro",
    price: "$79/mo",
    features: ["Unlimited messages", "Follow-ups + memory", "Priority support"],
  },
];

export default function MaxLandingPage() {
  return (
    <MaxShell>
      <main>
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-4xl font-light text-white sm:text-5xl">
            Your AI Executive Assistant
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Virtual EA handles scheduling, follow-ups, and meeting notes — so you can
            focus on the work that matters.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 font-medium text-black hover:bg-zinc-200"
            >
              Start free trial
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-zinc-700 px-6 py-3 text-white hover:bg-zinc-900"
            >
              See how it works
            </a>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-800/80 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 font-medium text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-800/80 py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-2xl font-light text-white">
              Instead of… Virtual EA does it
            </h2>
            <div className="mt-8 space-y-3 text-sm">
              {[
                ["Manual follow-up emails", "Auto-generated drafts for your review"],
                ["Checking calendar conflicts", "Instant conflict detection"],
                ["Taking meeting notes", "AI transcription + summary"],
                ["Scheduling back and forth", "Propose slots, confirm in one click"],
              ].map(([before, after]) => (
                <div
                  key={before}
                  className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-zinc-500 line-through">{before}</span>
                  <span className="text-emerald-400">{after}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-800/80 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                <p className="mt-2 text-2xl font-light text-white">{plan.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-800/80 py-20 text-center">
          <h2 className="text-2xl font-light text-white">Ready to try Virtual EA?</h2>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-medium text-black hover:bg-zinc-200"
          >
            Start free trial
          </Link>
        </section>
      </main>
    </MaxShell>
  );
}

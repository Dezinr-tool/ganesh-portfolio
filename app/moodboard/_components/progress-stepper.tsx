"use client";

export function ProgressStepper({
  steps,
  current,
  labels,
}: {
  steps: number;
  current: number;
  labels?: string[];
}) {
  return (
    <div className="mb-6">
      <div className="flex gap-1.5">
        {Array.from({ length: steps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= current ? "bg-zinc-400" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
      {labels?.[current] ? (
        <p className="mt-2 text-xs text-zinc-500">{labels[current]}</p>
      ) : null}
    </div>
  );
}

export const GENERATION_STATUS = [
  "Analyzing your brief…",
  "Exploring visual territories…",
  "Building color systems…",
  "Pairing typography…",
  "Crafting three distinct directions…",
  "Finalizing moodboard concepts…",
];

export const SCRAPE_STATUS = [
  "Fetching page structure…",
  "Analyzing brand personality…",
  "Extracting color palette…",
  "Reading typography signals…",
  "Identifying visual patterns…",
];

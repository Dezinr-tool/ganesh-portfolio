import { hasStoredAnswer, normalizeAnswer } from "./question-flow";

/** Fields the intake assistant aims to collect (maps to session.answers keys). */
export const INTAKE_FIELDS: Array<{ key: string; label: string; required?: boolean }> = [
  { key: "q1", label: "Brand name", required: true },
  { key: "q2", label: "Business description", required: true },
  { key: "q3", label: "Project type", required: true },
  { key: "q4", label: "New brand or redesign" },
  { key: "q4a", label: "Existing URL" },
  { key: "q5", label: "Industry" },
  { key: "q6", label: "Target audience", required: true },
  { key: "q14", label: "Brand values / visual feel", required: true },
  { key: "q15", label: "Color direction" },
  { key: "q12", label: "References / inspiration" },
  { key: "q18", label: "Things to avoid" },
];

const CORE_GENERATION_KEYS = ["q1", "q2", "q3", "q6", "q14"];

export function countIntakeFields(answers: Record<string, unknown>): number {
  return INTAKE_FIELDS.filter((f) => hasStoredAnswer(answers[f.key], f.key)).length;
}

export function countCoreFields(answers: Record<string, unknown>): number {
  return CORE_GENERATION_KEYS.filter((k) => hasStoredAnswer(answers[k], k)).length;
}

export function isReadyToGenerate(answers: Record<string, unknown>): boolean {
  return countCoreFields(answers) >= 5;
}

export function formatCollectedForPrompt(answers: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const field of INTAKE_FIELDS) {
    const val = normalizeAnswer(answers[field.key]);
    if (val) lines.push(`- ${field.label}: ${val}`);
  }
  return lines.length ? lines.join("\n") : "(nothing collected yet)";
}

export function formatMissingForPrompt(answers: Record<string, unknown>): string {
  const missing = INTAKE_FIELDS.filter((f) => !hasStoredAnswer(answers[f.key], f.key)).map(
    (f) => f.label,
  );
  return missing.length ? missing.join(", ") : "(all key fields collected)";
}

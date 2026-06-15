import type { PreConfirmation, UserPreConfirmation } from "@/lib/pre-generation-types";

export function buildUserPreConfirmationFromUI(input: {
  preConfirmation: PreConfirmation;
  rejectedFrameworkKeys: string[];
  rejectedRuleKeys: string[];
  observationAnswers: Record<number, string>;
  questionAnswers: Record<string, string>;
}): UserPreConfirmation {
  const { preConfirmation, rejectedFrameworkKeys, rejectedRuleKeys, observationAnswers, questionAnswers } =
    input;

  const confirmed_frameworks = preConfirmation.proposed_frameworks
    .filter((f) => !rejectedFrameworkKeys.includes(f.key))
    .map((f) => f.name);
  const rejected_frameworks = preConfirmation.proposed_frameworks
    .filter((f) => rejectedFrameworkKeys.includes(f.key))
    .map((f) => f.name);

  const confirmed_rules = preConfirmation.proposed_rules
    .filter((r) => !rejectedRuleKeys.includes(r.key))
    .map((r) => r.name);
  const rejected_rules = preConfirmation.proposed_rules
    .filter((r) => rejectedRuleKeys.includes(r.key))
    .map((r) => r.name);

  const observation_answers = preConfirmation.meeting_observations
    .map((obs, i) => ({
      observation: obs.observation,
      answer: observationAnswers[i] ?? "Yes, apply this",
      source: obs.source,
    }))
    .filter((o) => o.answer !== "No, skip");

  const question_answers = preConfirmation.confirmation_questions.map((q) => ({
    key: q.key,
    question: q.question,
    answer: questionAnswers[q.key] ?? q.default_answer ?? "",
  }));

  return {
    confirmed_frameworks,
    rejected_frameworks,
    confirmed_rules,
    rejected_rules,
    observation_answers,
    question_answers,
  };
}

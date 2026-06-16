import type { UnifiedContext } from "@/lib/context-loader";
import type { ClientProfile } from "@/lib/unified-db";

/** Rough token estimate (~4 chars per token for English prose). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function formatClientProfile(profile: ClientProfile): string {
  return `Name: ${profile.client_name}
Industry: ${profile.industry ?? "—"}
Business: ${profile.business_description ?? "—"}
Target Audience: ${JSON.stringify(profile.target_audience ?? [])}
Brand Values: ${(profile.brand_values ?? []).join(", ") || "—"}
Visual Preferences: ${JSON.stringify(profile.visual_preferences ?? {})}
UX Preferences: ${JSON.stringify(profile.ux_preferences ?? {})}
Pain Points: ${(profile.pain_points ?? []).join(", ") || "—"}
Competitors: ${(profile.competitors ?? []).join(", ") || "—"}
Tone of Voice: ${profile.tone_of_voice ?? "—"}`;
}

export function formatContextForAI(context: UnifiedContext): string {
  const sections: string[] = [
    "=== UNIFIED INTELLIGENCE CONTEXT ===",
    "[Only use this context to inform your response.",
    "Do not repeat it back. Do not reference it directly.",
    "Just use it to be smarter and more specific.]",
    "",
  ];

  if (context.client_profile) {
    sections.push(
      "CLIENT PROFILE:",
      formatClientProfile(context.client_profile),
      "",
    );
  }

  if (context.client_intelligence.length > 0) {
    sections.push(
      "CLIENT INTELLIGENCE (cross-tool):",
      ...context.client_intelligence.slice(0, 12).map(
        (i) =>
          `- [${i.category}] ${i.insight} (importance: ${i.importance}, confidence: ${i.confidence})`,
      ),
      "",
    );
  }

  if (context.ea_meetings.length > 0) {
    sections.push(
      "MEETING INTELLIGENCE (from EA):",
      ...context.ea_meetings.map(
        (m) => `- [${m.category}] ${m.insight} (confidence: ${m.confidence})`,
      ),
      "",
    );
  }

  if (context.ea_memories.length > 0) {
    sections.push(
      "EA MEMORY:",
      ...context.ea_memories.map((m) => `- [${m.category}] ${m.content}`),
      "",
    );
  }

  if (context.previous_moodboards.length > 0) {
    sections.push(
      "PREVIOUS MOODBOARD WORK FOR THIS CLIENT:",
      ...context.previous_moodboards.map(
        (d) => `- Direction "${d.direction_name}": ${d.tagline || "—"}`,
      ),
      "",
    );
  }

  if (context.previous_audits.length > 0) {
    sections.push(
      "PREVIOUS AUDIT FINDINGS FOR THIS CLIENT:",
      ...context.previous_audits.map(
        (a) =>
          `- Score: ${a.overall_score}/10. Top issues: ${a.critical_issues.slice(0, 3).join(", ") || "—"}`,
      ),
      "",
    );
  }

  if (context.visual_frameworks.length > 0) {
    sections.push(
      "VISUAL FRAMEWORK DECISIONS:",
      ...context.visual_frameworks.map(
        (v) =>
          `- ${v.framework_type}: ${JSON.stringify(v.content).slice(0, 200)}`,
      ),
      "",
    );
  }

  if (context.ux_frameworks.length > 0) {
    sections.push(
      "UX FRAMEWORK DECISIONS:",
      ...context.ux_frameworks.map(
        (u) =>
          `- ${u.framework_type}: ${JSON.stringify(u.content).slice(0, 200)}`,
      ),
      "",
    );
  }

  if (context.ux_rules.length > 0) {
    sections.push(
      "UX RULES & STANDARDS IN EFFECT:",
      context.ux_rules.map((r) => r.slice(0, 500)).join("\n---\n"),
      "",
    );
  }

  if (context.frameworks.length > 0) {
    sections.push(
      "DESIGN FRAMEWORKS IN USE:",
      context.frameworks.map((f) => f.slice(0, 300)).join("\n---\n"),
      "",
    );
  }

  if (context.ia_knowledge.length > 0) {
    sections.push(
      "IA KNOWLEDGE BASE IN EFFECT:",
      context.ia_knowledge.map((r) => r.slice(0, 800)).join("\n---\n"),
      "",
    );
  }

  sections.push("=== END CONTEXT ===");
  return sections.join("\n");
}

import type { DesignAuditResult } from "./types";
import { DIMENSION_LABELS, ALL_DIMENSION_KEYS } from "./types";

export function auditToMarkdown(
  result: DesignAuditResult,
  context?: { product?: string; targetUser?: string },
): string {
  const lines: string[] = [
    "# Design Audit Report",
    "",
    `**Overall Score: ${result.overall_score}/10**`,
    "",
    result.summary,
    "",
  ];

  if (context?.product) lines.push(`**Product:** ${context.product}`, "");
  if (context?.targetUser) lines.push(`**Target user:** ${context.targetUser}`, "");

  lines.push("## Priority Issues", "");

  if (result.priority_issues.critical.length) {
    lines.push("### 🔴 Critical", "");
    result.priority_issues.critical.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }
  if (result.priority_issues.important.length) {
    lines.push("### 🟡 Important", "");
    result.priority_issues.important.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }
  if (result.priority_issues.nice_to_have.length) {
    lines.push("### 🟢 Nice to have", "");
    result.priority_issues.nice_to_have.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }

  if (result.annotated_issues.length) {
    lines.push("## Annotated Issues", "");
    result.annotated_issues.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }

  for (const key of ALL_DIMENSION_KEYS) {
    const dim = result.dimensions[key];
    const label = DIMENSION_LABELS[key];
    const statusIcon =
      dim.status === "good" ? "✅" : dim.status === "needs_work" ? "⚠️" : "❌";

    lines.push(`## ${label} — ${dim.score}/10 ${statusIcon}`, "");
    if (dim.working.length) {
      lines.push("**What's working:**", "");
      dim.working.forEach((w) => lines.push(`- ${w}`));
      lines.push("");
    }
    if (dim.issues.length) {
      lines.push("**Issues:**", "");
      dim.issues.forEach((i) => lines.push(`- ${i}`));
      lines.push("");
    }
    if (dim.fixes.length) {
      lines.push("**How to fix:**", "");
      dim.fixes.forEach((f) => lines.push(`- ${f}`));
      lines.push("");
    }
    if (dim.effort_estimate) {
      lines.push(`**Effort:** ${dim.effort_estimate}`, "");
    }
  }

  return lines.join("\n");
}

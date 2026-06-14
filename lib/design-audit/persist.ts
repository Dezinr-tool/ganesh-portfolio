import { saveIntelligence } from "@/lib/intelligence-store";
import type { IntelligenceItem } from "@/lib/intelligence-extractor";
import type { DesignAuditResult } from "./types";
import { ALL_DIMENSION_KEYS, DIMENSION_LABELS } from "./types";

export async function persistAuditFindings(
  sessionId: string,
  result: DesignAuditResult,
  sourceId?: string,
): Promise<number> {
  const items: IntelligenceItem[] = [];

  for (const key of ALL_DIMENSION_KEYS) {
    const dim = result.dimensions[key];
    for (const issue of dim.issues.slice(0, 2)) {
      items.push({
        category: "design",
        subcategory: key,
        insight: `[${DIMENSION_LABELS[key]} ${dim.score}/10] ${issue}`,
        sentiment: dim.status === "critical" ? -0.5 : -0.2,
        confidence: 0.85,
        importance: dim.status === "critical" ? 8 : 6,
        tags: ["design_audit", key, dim.status],
      });
    }
  }

  for (const critical of result.priority_issues.critical.slice(0, 5)) {
    items.push({
      category: "design",
      subcategory: "audit_critical",
      insight: critical,
      sentiment: -0.6,
      confidence: 0.9,
      importance: 9,
      tags: ["design_audit", "critical"],
    });
  }

  if (items.length === 0) return 0;
  return saveIntelligence(sessionId, items, "design_audit", sourceId);
}

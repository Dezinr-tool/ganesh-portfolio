import {
  enrichClientFromTool,
  saveIntelligence,
  saveUXFramework,
  saveVisualFramework,
  upsertClientProfile,
  createToolSession,
} from "@/lib/unified-db";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import type { DesignAuditResult } from "@/lib/design-audit/types";
import { ALL_DIMENSION_KEYS, DIMENSION_LABELS } from "@/lib/design-audit/types";

export async function saveMoodboardLearnings(input: {
  clientName: string;
  projectName?: string;
  projectType?: string;
  sessionId?: string;
  answers?: Record<string, unknown>;
  directions: MoodboardPresentationDirection[];
}): Promise<void> {
  const clientName = input.clientName.trim();
  if (!clientName) return;

  let toolSessionId: string | undefined;
  try {
    const session = await createToolSession("moodboard", clientName, input.projectName);
    toolSessionId = session.session_id;
  } catch {
    /* session registry optional */
  }

  const selected =
    input.directions.find((d) => d.directionName) ?? input.directions[0];
  if (!selected) return;

  if (selected.colorPalette?.length) {
    await saveVisualFramework({
      clientName,
      projectName: input.projectName,
      frameworkType: "color_system",
      title: `${clientName} — Color System`,
      content: {
        palette: selected.colorPalette,
        direction: selected.directionName,
      },
      source: "moodboard",
      toolSessionId,
    });
  }

  if (selected.typography) {
    await saveVisualFramework({
      clientName,
      projectName: input.projectName,
      frameworkType: "typography_system",
      title: `${clientName} — Typography`,
      content: { typography: selected.typography, direction: selected.directionName },
      source: "moodboard",
      toolSessionId,
    });
  }

  if (selected.persona?.name || selected.persona?.description) {
    await saveIntelligence(
      toolSessionId ?? input.sessionId ?? "moodboard",
      "moodboard",
      "user_persona",
      `Persona ${selected.persona.name ?? "Primary"}: ${selected.persona.description ?? selected.tagline ?? ""}`,
      "moodboard",
      { clientName, projectName: input.projectName, importance: 8 },
    );
  }

  if (selected.brandVoice?.toneDescription || selected.persona?.toneOfVoice) {
    await saveIntelligence(
      toolSessionId ?? input.sessionId ?? "moodboard",
      "moodboard",
      "brand",
      `Tone: ${selected.brandVoice?.toneDescription ?? selected.persona?.toneOfVoice ?? ""}`,
      "moodboard",
      { clientName, importance: 7 },
    );
  }

  await enrichClientFromTool(clientName, "moodboard", {
    tone_of_voice:
      selected.brandVoice?.toneDescription ?? selected.persona?.toneOfVoice,
    visual_preferences: {
      last_direction: selected.directionName,
      mood_keywords: selected.moodKeywords ?? [],
      color_palette: selected.colorPalette ?? [],
    },
    pain_points: selected.persona?.painPoints?.map(String) ?? [],
  });

  await upsertClientProfile(clientName, {
    last_tool_used: "moodboard",
    tools_used: ["moodboard"],
  });
}

export async function saveAuditLearnings(input: {
  clientName: string;
  projectName?: string;
  sessionId?: string;
  result: DesignAuditResult;
}): Promise<void> {
  const clientName = input.clientName.trim();
  if (!clientName) return;

  let toolSessionId: string | undefined;
  try {
    const session = await createToolSession("design_audit", clientName, input.projectName);
    toolSessionId = session.session_id;
  } catch {
    /* optional */
  }

  for (const critical of input.result.priority_issues.critical.slice(0, 5)) {
    await saveIntelligence(
      toolSessionId ?? input.sessionId ?? "design_audit",
      "design_audit",
      "ux",
      critical,
      "audit",
      { clientName, importance: 9, confidence: 0.9 },
    );
  }

  const topDimensions = ALL_DIMENSION_KEYS.map((key) => ({
    key,
    dim: input.result.dimensions[key],
  }))
    .filter((d) => d.dim.score < 7)
    .sort((a, b) => a.dim.score - b.dim.score)
    .slice(0, 3);

  for (const { key, dim } of topDimensions) {
    await saveUXFramework({
      clientName,
      projectName: input.projectName,
      frameworkType: "heuristics",
      title: `${DIMENSION_LABELS[key]} — Audit Finding`,
      content: {
        dimension: key,
        score: dim.score,
        issues: dim.issues.slice(0, 3),
        fixes: dim.fixes.slice(0, 3),
      },
      source: "audit",
      toolSessionId,
    });
  }

  const uxPrefs: Record<string, unknown> = {};
  for (const key of ALL_DIMENSION_KEYS) {
    const dim = input.result.dimensions[key];
    if (dim.score < 6) {
      uxPrefs[key] = { score: dim.score, top_issue: dim.issues[0] };
    }
  }

  await enrichClientFromTool(clientName, "design_audit", {
    ux_preferences: uxPrefs,
    pain_points: input.result.priority_issues.critical.slice(0, 3),
  });

  await upsertClientProfile(clientName, {
    last_tool_used: "design_audit",
    tools_used: ["design_audit"],
  });
}

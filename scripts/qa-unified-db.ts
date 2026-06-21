import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  createToolSession,
  getToolSession,
  saveIntelligence,
  getIntelligenceForClient,
  upsertClientProfile,
  getClientProfile,
  createMoodboardSession,
  saveMoodboardDirection,
  getMoodboardSession,
  createAuditSession,
  saveAuditReport,
  getAuditSession,
  saveUXFramework,
  saveVisualFramework,
  getFrameworksForClient,
  getMoodboardQuestions,
  getMoodboardOutputSections,
  buildUnifiedToolContext,
} from "../lib/unified-db";

type Check = { name: string; pass: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  const testClient = `QA Unified ${Date.now()}`;

  try {
    const toolSession = await createToolSession("moodboard", testClient, "QA Project");
    checks.push({ name: "tool_sessions insert", pass: !!toolSession.session_id });
    checks.push({
      name: "tool_sessions fetch",
      pass: !!(await getToolSession(toolSession.session_id)),
    });

    const intel = await saveIntelligence(
      toolSession.session_id,
      "moodboard",
      "brand",
      "Prefers minimal, editorial visual direction",
      "manual",
      { clientName: testClient, importance: 8 },
    );
    checks.push({ name: "tool_intelligence insert", pass: !!intel.id });
    checks.push({
      name: "tool_intelligence fetch",
      pass: (await getIntelligenceForClient(testClient)).length > 0,
    });

    const profile = await upsertClientProfile(testClient, {
      industry: "Fintech",
      business_description: "QA test client",
      pain_points: ["Complex onboarding"],
    });
    checks.push({ name: "client_profiles upsert", pass: profile.client_name === testClient });
    checks.push({
      name: "client_profiles fetch",
      pass: !!(await getClientProfile(testClient)),
    });

    const questions = await getMoodboardQuestions();
    checks.push({
      name: "moodboard_question_tree seeded",
      pass: questions.length >= 19,
      detail: `${questions.length} questions`,
    });

    const sections = await getMoodboardOutputSections();
    checks.push({
      name: "moodboard_output_sections seeded",
      pass: sections.length >= 14,
      detail: `${sections.length} sections`,
    });

    const mbSession = await createMoodboardSession({
      toolSessionId: toolSession.session_id,
      clientName: testClient,
      projectName: "QA Project",
      projectType: "website",
    });
    checks.push({ name: "moodboard_sessions insert", pass: !!mbSession.session_id });
    checks.push({
      name: "moodboard_sessions fetch",
      pass: !!(await getMoodboardSession(mbSession.session_id)),
    });

    await saveMoodboardDirection(mbSession.session_id, {
      direction_index: 1,
      direction_name: "Clear and Confident",
      tagline: "Trust through clarity",
      color_palette: [{ hex: "var(--color-text)", name: "Ink", role: "Primary" }],
    });
    checks.push({ name: "moodboard_directions insert", pass: true });

    const auditSession = await createAuditSession({
      toolSessionId: toolSession.session_id,
      clientName: testClient,
      inputType: "url",
      inputSource: "https://example.com",
    });
    checks.push({ name: "design_audit_sessions insert", pass: !!auditSession.session_id });
    checks.push({
      name: "design_audit_sessions fetch",
      pass: !!(await getAuditSession(auditSession.session_id)),
    });

    await saveAuditReport(auditSession.session_id, {
      overall_score: 7.2,
      overall_summary: "Solid foundation with spacing issues.",
      visual_hierarchy: { score: 7, status: "good", working: [], issues: [], fixes: [], effort: "medium" },
    });
    checks.push({ name: "design_audit_reports insert", pass: true });

    await saveUXFramework({
      clientName: testClient,
      frameworkType: "ia",
      title: "QA IA Framework",
      content: { sections: ["Home", "Dashboard"] },
      source: "manual",
      toolSessionId: toolSession.session_id,
    });
    checks.push({ name: "ux_frameworks insert", pass: true });

    await saveVisualFramework({
      clientName: testClient,
      frameworkType: "color_system",
      title: "QA Color System",
      content: { primary: "var(--color-text)" },
      source: "manual",
      toolSessionId: toolSession.session_id,
    });
    checks.push({ name: "visual_frameworks insert", pass: true });

    const frameworks = await getFrameworksForClient(testClient);
    checks.push({
      name: "frameworks fetch",
      pass: frameworks.ux.length > 0 && frameworks.visual.length > 0,
    });

    const ctx = await buildUnifiedToolContext({
      type: "moodboard",
      client_name: testClient,
    });
    checks.push({
      name: "buildUnifiedToolContext",
      pass: ctx.client_profile !== null && ctx.intelligence.length > 0,
    });
  } catch (error) {
    checks.push({
      name: "QA run",
      pass: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass);

  console.log("\n=== UNIFIED DB QA ===\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

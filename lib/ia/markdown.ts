import type { IaOutput } from "./types";

export function iaToMarkdown(output: IaOutput): string {
  const lines: string[] = [
    `# Information Architecture: ${output.product_overview.product_name}`,
    "",
    "## 1. Product Overview",
    `- **Type:** ${output.product_overview.product_type}`,
    `- **Primary goal:** ${output.product_overview.primary_goal}`,
    "",
    "### User Types",
    ...output.product_overview.user_types.map(
      (u) => `- **${u.name}:** ${u.needs.join("; ")}`,
    ),
    "",
    "### Key Tasks",
    ...output.product_overview.key_tasks.map((t) => `- ${t}`),
    "",
    "## 2. Navigation Structure",
    "### Primary",
    ...output.navigation_structure.primary.map(
      (n) => `- **${n.label}** — ${n.purpose} (${n.access_level})`,
    ),
    "### Secondary",
    ...output.navigation_structure.secondary.map(
      (n) => `- **${n.label}** — ${n.purpose}`,
    ),
    "### Utility",
    ...output.navigation_structure.utility.map(
      (n) => `- **${n.label}** — ${n.purpose}`,
    ),
    "",
    "## 3. Sitemap",
  ];

  function walk(nodes: IaOutput["sitemap"], depth = 0) {
    for (const n of nodes) {
      lines.push(
        `${"  ".repeat(depth)}- ${n.screen_name} [${n.priority}] (${n.user_access.join(", ")})`,
      );
      if (n.children?.length) walk(n.children, depth + 1);
    }
  }
  walk(output.sitemap);

  lines.push("", "## 4. User Flows");
  for (const flow of output.user_flows) {
    lines.push(`### ${flow.flow_name}`, flow.flow_goal, "");
    for (const step of flow.steps) {
      lines.push(`${step.step}. ${step.label}${step.screen ? ` → ${step.screen}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## 5. Content Hierarchy");
  for (const ch of output.content_hierarchy) {
    lines.push(`### ${ch.screen_name}`);
    lines.push(`- Primary: ${ch.primary.join(", ")}`);
    lines.push(`- Secondary: ${ch.secondary.join(", ")}`);
    lines.push(`- Actions: ${ch.key_actions.join(", ")}`);
    lines.push("");
  }

  lines.push(
    "## 6. Navigation Patterns",
    `- **Pattern:** ${output.navigation_patterns.pattern}`,
    `- **Rationale:** ${output.navigation_patterns.rationale}`,
    "",
    "## 7. IA Health Score",
    `- Depth: ${output.health_score.depth_score}/10`,
    `- Breadth: ${output.health_score.breadth_score}/10`,
    `- ${output.health_score.balance_assessment}`,
    "",
    "### Recommendations",
    ...output.health_score.recommendations.map((r) => `- ${r}`),
  );

  return lines.join("\n");
}

export function iaToJsonExport(output: IaOutput): string {
  return JSON.stringify(output, null, 2);
}

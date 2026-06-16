import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { loadAndFormatContext } from "@/lib/context-loader";
import type { IaOutput, IaUxControversyDecision } from "@/lib/ia/types";
import type { WireframeScreenSpec } from "./types";
import { SHADCN_COMPONENTS } from "./types";
import { specToJsx, collectComponents } from "./jsx-export";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";

const MODEL = "claude-sonnet-4-6";

function buildSystemPrompt(): string {
  return `You are a senior product designer creating high-fidelity wireframes using ONLY these Shadcn UI components:
${SHADCN_COMPONENTS.join(", ")}

Also use layout primitives: div, header, main, section, h1, h2, p

Return JSON for ONE screen:
{
  "screen_name": string,
  "description": string,
  "layout": "stack"|"sidebar"|"split"|"dashboard",
  "nav_pattern": string,
  "elements": [{
    "id": string,
    "component": string,
    "props": { "className"?: string, "variant"?: string, ... },
    "children": string | nested elements[]
  }],
  "annotations": [{
    "element_id": string,
    "note": string,
    "ux_rule": string,
    "shadcn_component": string,
    "audit_finding": string (optional)
  }]
}

Rules:
- Use REAL placeholder content from IA (not Lorem ipsum)
- Reflect content hierarchy from IA (primary/secondary/tertiary)
- Include all key actions as Button or links
- Match navigation pattern from IA
- Address any audit findings mentioned in context
- Return ONLY valid JSON`;
}

function parseSpec(text: string): WireframeScreenSpec {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  const spec = JSON.parse(json) as WireframeScreenSpec;

  function assignIds(els: WireframeScreenSpec["elements"]): WireframeScreenSpec["elements"] {
    return els.map((el) => ({
      ...el,
      id: el.id || randomUUID(),
      children: Array.isArray(el.children) ? assignIds(el.children) : el.children,
    }));
  }

  spec.elements = assignIds(spec.elements);
  return spec;
}

export async function generateWireframeScreen(input: {
  screenName: string;
  screenNotes?: string;
  iaOutput: IaOutput;
  clientName?: string;
  userConfirmations?: UserPreConfirmation;
  moodboardDirection?: string;
  appliedControversies?: IaUxControversyDecision[];
  onStatus?: (msg: string) => void;
}): Promise<{ spec: WireframeScreenSpec; jsxCode: string; componentsUsed: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  input.onStatus?.("Loading context…");
  const { block } = await loadAndFormatContext({
    tool: "wireframe",
    client_name: input.clientName,
    project_type: input.iaOutput.product_overview.product_type,
    userConfirmations: input.userConfirmations,
  });

  const contentHierarchy = input.iaOutput.content_hierarchy.find(
    (c) => c.screen_name.toLowerCase() === input.screenName.toLowerCase(),
  );

  const screenFromSitemap = findScreenInTree(input.iaOutput.sitemap, input.screenName);

  const anthropic = new Anthropic({ apiKey });
  input.onStatus?.(`Wireframing ${input.screenName}…`);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 12000,
    system: `${buildSystemPrompt()}\n\n${block}`,
    messages: [
      {
        role: "user",
        content: `Generate wireframe for screen: "${input.screenName}"

IA Context:
- Product: ${input.iaOutput.product_overview.product_name}
- Nav pattern: ${input.iaOutput.navigation_patterns.pattern}
- Primary goal: ${input.iaOutput.product_overview.primary_goal}
${screenFromSitemap ? `- Screen priority: ${screenFromSitemap.priority}\n- User access: ${screenFromSitemap.user_access.join(", ")}\n- Key actions: ${screenFromSitemap.key_actions.join(", ")}` : ""}
${contentHierarchy ? `- Primary content: ${contentHierarchy.primary.join(", ")}\n- Secondary: ${contentHierarchy.secondary.join(", ")}\n- Actions: ${contentHierarchy.key_actions.join(", ")}` : ""}
${input.screenNotes ? `\nAdditional notes: ${input.screenNotes}` : ""}
${input.moodboardDirection ? `\nVisual direction from moodboard: ${input.moodboardDirection}` : ""}
${input.appliedControversies?.length ? `\nApplied UX controversy decisions (MUST follow in wireframe):\n${input.appliedControversies.map((c) => `- ${c.title}: ${c.decision}`).join("\n")}` : ""}`,
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const spec = parseSpec(text);
  spec.screen_name = input.screenName;
  const jsxCode = specToJsx(spec);
  const componentsUsed = collectComponents(spec);

  return { spec, jsxCode, componentsUsed };
}

function findScreenInTree(
  nodes: IaOutput["sitemap"],
  name: string,
): IaOutput["sitemap"][0] | null {
  for (const n of nodes) {
    if (n.screen_name.toLowerCase() === name.toLowerCase()) return n;
    if (n.children?.length) {
      const found = findScreenInTree(n.children, name);
      if (found) return found;
    }
  }
  return null;
}

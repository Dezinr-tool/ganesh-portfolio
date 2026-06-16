/**
 * @deprecated Use loadAndFormatContext from @/lib/context-loader instead.
 */
import { loadAndFormatContext } from "@/lib/context-loader";

const EA_UX_KEYWORDS =
  /\b(ux|ui|usability|heuristic|accessibility|wcag|a11y|wireframe|persona|journey|conversion|onboarding|design system|figma|prototype|research|usability test|double diamond|design sprint|jtbd|jobs to be done)\b/i;

export function isUxRelatedQuery(message: string): boolean {
  return EA_UX_KEYWORDS.test(message);
}

export async function getRelevantKnowledge(
  tool: string,
  context?: string,
): Promise<string> {
  const isMobile =
    context?.toLowerCase().includes("mobile") ||
    context?.toLowerCase().includes("ios") ||
    context?.toLowerCase().includes("android");

  const { block } = await loadAndFormatContext({
    tool: tool as "moodboard" | "design_audit" | "ea_chat",
    user_message: context,
    input_type: isMobile ? "mobile" : undefined,
  });
  return block;
}

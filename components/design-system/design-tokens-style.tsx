import { designTokensCssText, getDesignTokens } from "@/lib/design-tokens";

/** Injects brand CSS variables from Postgres into `:root`. */
export async function DesignTokensStyle() {
  const tokens = await getDesignTokens();

  return (
    <style
      id="design-tokens"
      dangerouslySetInnerHTML={{ __html: designTokensCssText(tokens) }}
    />
  );
}

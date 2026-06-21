import type { CSSProperties, ReactNode } from "react";
import type { DesignTokens } from "@/lib/design-tokens-shared";
import { designTokensToCssProperties } from "@/lib/design-tokens-shared";

type DesignTokensScopeProps = {
  tokens: DesignTokens;
  children: ReactNode;
  className?: string;
};

/** Scopes brand tokens to a subtree (agreement preview, live settings preview). */
export function DesignTokensScope({
  tokens,
  children,
  className,
}: DesignTokensScopeProps) {
  const style = designTokensToCssProperties(tokens) as CSSProperties;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

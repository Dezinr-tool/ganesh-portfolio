import { getDesignTokens } from "@/lib/design-tokens";
import { ClientSignPage } from "./client-sign-page";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const designTokens = await getDesignTokens();
  return <ClientSignPage token={token} designTokens={designTokens} />;
}

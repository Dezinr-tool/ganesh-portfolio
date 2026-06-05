import { ClientSignPage } from "./client-sign-page";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientSignPage token={token} />;
}

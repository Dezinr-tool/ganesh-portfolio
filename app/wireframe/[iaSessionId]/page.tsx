import { redirect } from "next/navigation";
import { getIaSession } from "@/lib/ia/db-store";
import { WireframeEngine } from "../_components/wireframe-engine";
import "../../moodboard/moodboard.css";

export default async function WireframePage({
  params,
}: {
  params: Promise<{ iaSessionId: string }>;
}) {
  const { iaSessionId } = await params;
  const session = await getIaSession(iaSessionId);

  if (!session || session.status !== "complete") {
    redirect("/ia");
  }

  return <WireframeEngine iaSessionId={iaSessionId} />;
}

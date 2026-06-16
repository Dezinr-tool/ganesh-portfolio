import { notFound } from "next/navigation";
import {
  getSessionAnalytics,
  isValidMoodboardSessionId,
} from "@/lib/moodboard/analytics";
import { SessionDetailView } from "../_components/session-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MoodboardSessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!isValidMoodboardSessionId(id)) {
    notFound();
  }

  const summary = await getSessionAnalytics(id);
  if (!summary) {
    notFound();
  }

  return <SessionDetailView summary={summary} />;
}

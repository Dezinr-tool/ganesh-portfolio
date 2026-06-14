import type { EAMeeting } from "@/lib/meetings-store";
import { updateMeeting } from "@/lib/meetings-store";
import {
  extractIntelligence,
  type ExtractionResult,
  type IntelligenceItem,
} from "@/lib/intelligence-extractor";
import {
  saveIntelligence,
  upsertClientProfile,
  upsertPatterns,
} from "@/lib/intelligence-store";
import {
  processMeetingTranscript,
  type ProcessedMeetingResult,
} from "@/lib/meeting-processor";
import { saveMemory } from "@/lib/memory-store";

const HIGH_IMPORTANCE_THRESHOLD = 7;

export type IntelligencePersistResult = {
  intelligenceExtracted: number;
  intelligenceSaved: number;
  clientProfilesUpdated: number;
  patternsFound: number;
  highImportanceMemories: number;
  meetingSentimentOverall: number;
  keyMoments: string[];
};

export type FullMeetingProcessResult = ProcessedMeetingResult &
  IntelligencePersistResult;

function buildExtractionContext(meeting: EAMeeting) {
  return {
    meetingTitle: meeting.title ?? undefined,
    clientName: meeting.attendees?.[0] ?? undefined,
    projectName: meeting.title ?? undefined,
    meetingType: "client_meeting" as const,
  };
}

async function syncHighImportanceMemories(
  sessionId: string,
  items: IntelligenceItem[],
): Promise<number> {
  const important = items.filter(
    (item) => item.importance >= HIGH_IMPORTANCE_THRESHOLD,
  );
  if (important.length === 0) return 0;

  await Promise.all(
    important.map((item) =>
      saveMemory(
        sessionId,
        item.insight,
        "context",
        "meeting",
        item.importance,
        {
          clientName: item.clientName ?? null,
          projectName: item.projectName ?? null,
          sentimentScore: item.sentiment,
        },
      ),
    ),
  );

  return important.length;
}

async function persistIntelligenceExtraction(
  sessionId: string,
  meetingId: string,
  extraction: ExtractionResult,
): Promise<IntelligencePersistResult> {
  const [intelligenceSaved, clientProfilesUpdated, , highImportanceMemories] =
    await Promise.all([
      saveIntelligence(
        sessionId,
        extraction.intelligence,
        "meeting",
        meetingId,
      ),
      Promise.all(
        extraction.clientProfiles.map((profile) =>
          upsertClientProfile(sessionId, profile),
        ),
      ).then((results) => results.length),
      extraction.patterns.length > 0
        ? upsertPatterns(sessionId, extraction.patterns)
        : Promise.resolve(),
      syncHighImportanceMemories(sessionId, extraction.intelligence),
    ]);

  return {
    intelligenceExtracted: extraction.intelligence.length,
    intelligenceSaved,
    clientProfilesUpdated,
    patternsFound: extraction.patterns.length,
    highImportanceMemories,
    meetingSentimentOverall: extraction.meetingSentimentOverall,
    keyMoments: extraction.keyMoments,
  };
}

/**
 * Full meeting pipeline: summary + action items, then Sonnet intelligence extraction.
 * Replaces duplicate heuristic + AI memory paths with a single intelligence pass.
 */
export async function processMeetingFull(
  meeting: EAMeeting,
  transcript: string,
  sessionId: string,
): Promise<FullMeetingProcessResult> {
  const trimmed = transcript.trim();

  const [summaryResult, extraction] = await Promise.all([
    processMeetingTranscript(meeting, trimmed, sessionId),
    extractIntelligence(trimmed, buildExtractionContext(meeting)),
  ]);

  const intelligence = await persistIntelligenceExtraction(
    sessionId,
    meeting.id,
    extraction,
  );

  return { ...summaryResult, ...intelligence };
}

/** Mark meeting as processing before async transcript upload handlers run. */
export async function markMeetingProcessing(
  meetingId: string,
  sessionId: string,
): Promise<void> {
  await updateMeeting(meetingId, sessionId, { status: "processing" });
}

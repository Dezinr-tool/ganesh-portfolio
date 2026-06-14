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
import { extractMemoriesFromTranscript } from "@/lib/memory-extractor";
import {
  generateFollowUpDraft,
  parseAttendeesFromMeeting,
} from "@/lib/followup-generator";
import { createFollowUp } from "@/lib/followups-store";
import { getEffectiveUserProfile } from "@/src/lib/ea/userProfile";

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
  IntelligencePersistResult & {
    transcriptMemoriesSaved: number;
    followUpDraftsCreated: number;
  };

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

async function persistTranscriptMemories(
  sessionId: string,
  transcript: string,
  meeting: EAMeeting,
): Promise<number> {
  const memories = extractMemoriesFromTranscript(transcript, {
    meetingTitle: meeting.title ?? undefined,
    projectName: meeting.title ?? undefined,
  });

  if (memories.length === 0) return 0;

  await Promise.all(
    memories.map((memory) =>
      saveMemory(
        sessionId,
        memory.content,
        memory.category,
        "meeting",
        memory.importance,
        {
          clientName: memory.clientName ?? null,
          projectName: memory.projectName ?? null,
          sentimentScore: memory.sentimentScore ?? null,
        },
      ),
    ),
  );

  return memories.length;
}

async function autoDraftFollowUps(
  sessionId: string,
  meeting: EAMeeting,
  transcript: string,
  summary: string,
  actionItems: string[],
  attendees: string[],
): Promise<number> {
  const parsedAttendees = parseAttendeesFromMeeting(meeting, attendees);
  if (parsedAttendees.length === 0) return 0;

  const profile = await getEffectiveUserProfile(sessionId);
  const senderName = profile.name.trim() || "Ganesh";
  let created = 0;

  for (const attendee of parsedAttendees) {
    try {
      const draft = await generateFollowUpDraft(meeting, attendee, {
        transcript,
        summary,
        actionItems,
        senderName,
      });

      await createFollowUp(sessionId, {
        meetingId: meeting.id,
        recipientEmail: attendee.email,
        recipientName: attendee.name ?? null,
        subject: draft.subject,
        body: draft.body,
        status: "draft",
      });
      created += 1;
    } catch (err) {
      console.error(
        "[meeting-pipeline] follow-up draft failed:",
        attendee.email,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return created;
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

  const [transcriptMemoriesSaved, followUpDraftsCreated] = await Promise.all([
    persistTranscriptMemories(sessionId, trimmed, meeting),
    autoDraftFollowUps(
      sessionId,
      meeting,
      trimmed,
      summaryResult.summary,
      summaryResult.actionItems,
      summaryResult.attendees,
    ),
  ]);

  return {
    ...summaryResult,
    ...intelligence,
    transcriptMemoriesSaved,
    followUpDraftsCreated,
  };
}

/** Mark meeting as processing before async transcript upload handlers run. */
export async function markMeetingProcessing(
  meetingId: string,
  sessionId: string,
): Promise<void> {
  await updateMeeting(meetingId, sessionId, { status: "processing" });
}

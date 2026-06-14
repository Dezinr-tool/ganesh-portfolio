import { getMeetingById, updateMeeting } from "@/lib/meetings-store";

const MEET_API_BASE = "https://meet.googleapis.com/v2";

type MeetListResponse<T> = {
  conferenceRecords?: T[];
  transcripts?: T[];
  transcriptEntries?: T[];
  nextPageToken?: string;
};

type ConferenceRecord = {
  name?: string;
  startTime?: string;
  endTime?: string;
  space?: string;
};

type Transcript = {
  name?: string;
  state?: string;
};

type TranscriptEntry = {
  text?: string;
  startTime?: string;
  endTime?: string;
  participant?: string;
};

function normalizeConferenceRecordId(meetingId: string): string {
  const trimmed = meetingId.trim();
  if (trimmed.startsWith("conferenceRecords/")) {
    return trimmed;
  }
  return `conferenceRecords/${trimmed}`;
}

function extractMeetCode(meetingUrl: string): string | null {
  const match = meetingUrl.match(
    /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i,
  );
  return match?.[1]?.toLowerCase() ?? null;
}

async function meetApiGet<T>(
  path: string,
  accessToken: string,
): Promise<T | null> {
  try {
    const response = await fetch(`${MEET_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 404 || response.status === 403) return null;
    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function meetApiPost<T>(
  path: string,
  accessToken: string,
  body: unknown,
): Promise<T | null> {
  try {
    const response = await fetch(`${MEET_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function listTranscriptEntries(
  transcriptName: string,
  accessToken: string,
): Promise<string> {
  const lines: string[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (pageToken) query.set("pageToken", pageToken);

    const data = await meetApiGet<MeetListResponse<TranscriptEntry>>(
      `/${transcriptName}/entries?${query.toString()}`,
      accessToken,
    );

    if (!data?.transcriptEntries?.length) break;

    for (const entry of data.transcriptEntries) {
      if (entry.text?.trim()) lines.push(entry.text.trim());
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return lines.join("\n").trim();
}

/**
 * Fetch transcript text from Google Meet REST API for a conference record.
 * @param meetingId — conference record ID (with or without `conferenceRecords/` prefix)
 * @param accessToken — OAuth access token with Meet scopes
 * @returns transcript text or null if unavailable
 */
export async function fetchMeetTranscript(
  meetingId: string,
  accessToken: string,
): Promise<string | null> {
  if (!meetingId?.trim() || !accessToken?.trim()) return null;

  const parent = normalizeConferenceRecordId(meetingId);

  const list = await meetApiGet<MeetListResponse<Transcript>>(
    `/${parent}/transcripts?pageSize=10`,
    accessToken,
  );

  const transcripts = list?.transcripts ?? [];
  if (transcripts.length === 0) {
    // Fallback: v1 path shape (legacy) — same host, may 404 on v2-only accounts
    const v1List = await fetch(
      `https://meet.googleapis.com/v1/${parent}/transcripts`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (v1List.ok) {
      const v1Data = (await v1List.json()) as MeetListResponse<Transcript>;
      if (v1Data.transcripts?.length) {
        transcripts.push(...v1Data.transcripts);
      }
    }
  }

  if (transcripts.length === 0) return null;

  const transcriptName = transcripts[0].name;
  if (!transcriptName) return null;

  const text = await listTranscriptEntries(transcriptName, accessToken);
  return text || null;
}

async function resolveConferenceRecordId(
  meetingUrl: string,
  accessToken: string,
  scheduledAt: string | null,
): Promise<string | null> {
  const meetCode = extractMeetCode(meetingUrl);
  if (!meetCode) return null;

  const space = await meetApiPost<{ name?: string }>(
    "/spaces:lookup",
    accessToken,
    { meetingCode: meetCode },
  );

  if (space?.name) {
    let pageToken: string | undefined;
    do {
      const query = new URLSearchParams({ pageSize: "25" });
      if (pageToken) query.set("pageToken", pageToken);

      const records = await meetApiGet<MeetListResponse<ConferenceRecord>>(
        `/conferenceRecords?${query.toString()}`,
        accessToken,
      );

      for (const record of records?.conferenceRecords ?? []) {
        if (record.space === space.name && record.name) {
          return record.name;
        }
      }

      pageToken = records?.nextPageToken;
    } while (pageToken);
  }

  // Fallback: scan recent conference records near scheduled time
  const records = await meetApiGet<MeetListResponse<ConferenceRecord>>(
    "/conferenceRecords?pageSize=25",
    accessToken,
  );

  if (!records?.conferenceRecords?.length) return null;

  if (scheduledAt) {
    const target = new Date(scheduledAt).getTime();
    let best: ConferenceRecord | null = null;
    let bestDelta = Infinity;

    for (const record of records.conferenceRecords) {
      if (!record.name || !record.startTime) continue;
      const delta = Math.abs(new Date(record.startTime).getTime() - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = record;
      }
    }

    if (best?.name && bestDelta < 24 * 60 * 60 * 1000) {
      return best.name;
    }
  }

  return records.conferenceRecords[0]?.name ?? null;
}

/**
 * Resolve conference record from ea_meeting, fetch transcript, save to DB.
 */
export async function fetchAndSaveMeetTranscript(
  eaMeetingId: string,
  sessionId: string,
  accessToken: string,
): Promise<string | null> {
  const meeting = await getMeetingById(eaMeetingId, sessionId);
  if (!meeting) return null;

  if (meeting.rawTranscript?.trim()) {
    return meeting.rawTranscript.trim();
  }

  if (!meeting.meetingUrl || meeting.meetingPlatform !== "google_meet") {
    return null;
  }

  const conferenceRecordId = await resolveConferenceRecordId(
    meeting.meetingUrl,
    accessToken,
    meeting.scheduledAt,
  );

  if (!conferenceRecordId) return null;

  const transcript = await fetchMeetTranscript(conferenceRecordId, accessToken);
  if (!transcript) return null;

  await updateMeeting(eaMeetingId, sessionId, {
    rawTranscript: transcript,
    status: "processing",
  });

  return transcript;
}

import type { CalendarEventItem } from "@/lib/google-calendar";

export type MeetingPlatform = "google_meet" | "zoom" | "teams";

export type DetectedMeeting = {
  meetingUrl: string;
  platform: MeetingPlatform;
  title: string;
  scheduledAt: string;
  eventId: string;
};

function detectPlatform(url: string): MeetingPlatform | null {
  const lower = url.toLowerCase();
  if (lower.includes("meet.google.com")) return "google_meet";
  if (lower.includes("zoom.us")) return "zoom";
  if (lower.includes("teams.microsoft.com")) return "teams";
  return null;
}

function extractUrlsFromEvent(event: CalendarEventItem): string[] {
  const urls = new Set<string>();
  const sources = [
    event.meetLink,
    event.location,
    event.description,
  ].filter(Boolean) as string[];

  // Anchor on the host so bare domains (meet.google.com/…) and subdomains (acme.zoom.us/…) both
  // match, but a platform name in some other site's path or query does not.
  const urlPattern =
    /https?:\/\/(?:[a-z0-9-]+\.)*(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)(?:[/?#][^\s<>"']*)?/gi;

  for (const source of sources) {
    const matches = source.match(urlPattern) ?? [];
    for (const match of matches) {
      urls.add(match.replace(/[),.;]+$/, ""));
    }
  }

  return [...urls];
}

export function detectMeetingLinks(
  events: CalendarEventItem[],
): DetectedMeeting[] {
  const detected: DetectedMeeting[] = [];

  for (const event of events) {
    const urls = extractUrlsFromEvent(event);
    for (const meetingUrl of urls) {
      const platform = detectPlatform(meetingUrl);
      if (!platform) continue;

      detected.push({
        meetingUrl,
        platform,
        title: event.title,
        scheduledAt: event.start,
        eventId: event.id,
      });
    }
  }

  return detected;
}

export function platformLabel(platform: MeetingPlatform): string {
  switch (platform) {
    case "google_meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "teams":
      return "Microsoft Teams";
  }
}

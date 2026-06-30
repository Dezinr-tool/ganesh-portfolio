export function parseClientEmails(stored: string): string[] {
  const trimmed = stored?.trim() ?? "";
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      /* fall through to plain string */
    }
  }

  return [trimmed];
}

export function serializeClientEmails(emails: string[]): string {
  const cleaned = emails.map((email) => email.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0]!;
  return JSON.stringify(cleaned);
}

export function normalizeClientEmails(
  emails: string[] | undefined,
  fallbackEmail?: string,
): string[] {
  const source =
    emails?.length && emails.some((email) => email.trim())
      ? emails
      : fallbackEmail?.trim()
        ? [fallbackEmail.trim()]
        : [];

  return source.map((email) => email.trim()).filter(Boolean);
}

export function formatClientEmails(emails: string[]): string {
  return emails.filter(Boolean).join(", ");
}

export function hasValidClientEmails(
  emails: string[] | undefined,
  fallbackEmail?: string,
): boolean {
  return normalizeClientEmails(emails, fallbackEmail).length > 0;
}

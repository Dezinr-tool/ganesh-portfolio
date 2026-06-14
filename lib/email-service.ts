import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "hello@designbyganesh.com";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export type SendEmailResult = {
  id: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
  });

  if (error) {
    console.error("[email-service] sendEmail error:", error);
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Email sent but no ID returned.");
  }

  return { id: data.id };
}

export async function sendFollowUpEmail(input: {
  to: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const greeting = input.recipientName?.trim()
    ? `Hi ${input.recipientName.trim()},`
    : "Hi,";

  const htmlBody = input.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");

  const html = `${greeting}<br/><br/>${htmlBody}`;

  return sendEmail({
    to: input.to,
    subject: input.subject,
    html,
    replyTo: input.replyTo,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

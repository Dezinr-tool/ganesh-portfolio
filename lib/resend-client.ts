import { Resend } from "resend";

let client: Resend | null = null;

/** Created on first send, so importing email code never needs the key (e.g. during `next build`). */
export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set; cannot send email.");
  client ??= new Resend(apiKey);
  return client;
}

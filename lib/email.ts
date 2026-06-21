import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "hello@designbyganesh.com";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://designbyganesh.com";

const GANESH_EMAIL = "hello@designbyganesh.com";

export async function sendAgreementToClient(
  clientEmail: string,
  clientName: string,
  title: string,
  token: string,
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const from = FROM_EMAIL;

  const signUrl = `${SITE_URL}/sign/${token}`;

  const { error } = await resend.emails.send({
    from,
    to: clientEmail,
    replyTo: GANESH_EMAIL,
    subject: `Agreement: ${title}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Please review and sign the agreement for <strong>${title}</strong>.</p>
      <p><a href="${signUrl}" style="display:inline-block;padding:12px 24px;background:var(--color-text);color:var(--color-bg);text-decoration:none;border-radius:6px;">Review & Sign Agreement</a></p>
      <p>Or copy this link: <a href="${signUrl}">${signUrl}</a></p>
      <p>— Ganesh Das</p>
    `,
  });

  if (error) {
    console.error("[sendAgreementToClient] Resend error:", error);
    throw new Error(error.message);
  }
}

export async function sendSignedConfirmationToGanesh(
  title: string,
  clientName: string,
  clientCompany: string,
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: GANESH_EMAIL,
    replyTo: GANESH_EMAIL,
    subject: `Agreement Signed: ${title}`,
    html: `
      <p>Hi Ganesh,</p>
      <p><strong>${clientName}</strong> from <strong>${clientCompany}</strong> has signed the agreement:</p>
      <p><strong>${title}</strong></p>
      <p>Both parties have now signed this agreement.</p>
    `,
  });
}

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send a transactional email via Resend.
 * Logs to console in dev / when API key missing.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; id?: string }> {
  const from = opts.from ?? process.env.EMAIL_FROM ?? "NexusAdmin <noreply@example.com>";

  if (!resend) {
    console.log("[email:dev] →", opts.to, "·", opts.subject);
    console.log(opts.text ?? opts.html.replace(/<[^>]+>/g, ""));
    return { ok: true };
  }

  const res = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  return { ok: !res.error, id: res.data?.id };
}

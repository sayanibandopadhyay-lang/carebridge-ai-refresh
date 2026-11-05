// Resend adapter. Docs: https://resend.com/docs/api-reference/emails/send-email (checked 2026-11-04)
// POST https://api.resend.com/emails, Authorization: Bearer <key>. Body: from, to, subject, html, text, headers.
// Response: { "id": "<uuid>" }. Idempotency-Key header supported (24h, max 256 chars).
import { env, notConfigured, request, run, httpFailure, maskEmail, type SendResult } from "../http.ts";
import { type EmailInput, unsubscribeHeaders, missingInput } from "./types.ts";

export const name = "resend";
export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const key = env("EMAIL_PROVIDER_KEY"), from = env("EMAIL_FROM");
  const missing = [!key && "EMAIL_PROVIDER_KEY", !from && "EMAIL_FROM"].filter(Boolean) as string[];
  if (missing.length) return notConfigured(...missing);
  const bad = missingInput(input); if (bad) return { messageId: null, status: "failed", error: bad };
  return run(name, async () => {
    const res = await request("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}) },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text, headers: unsubscribeHeaders(input.unsubscribeUrl) }),
    });
    if (!res.ok) return httpFailure(name, res);
    const j: any = await res.json().catch(() => ({}));
    console.log(`[email:resend] sent to ${maskEmail(input.to)} id=${j.id}`);
    return { messageId: j.id ?? null, status: "sent" };
  });
}

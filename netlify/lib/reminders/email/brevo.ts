// Brevo adapter. Docs: https://developers.brevo.com/reference/sendtransacemail (checked 2026-11-04)
// POST https://api.brevo.com/v3/smtp/email, header api-key: <key>. Body: sender{email,name}, to[{email}],
// subject, htmlContent, textContent, headers. Response 201: { "messageId": "<...@relay...>" }.
// VERIFY: Brevo says standard email headers are not accepted in "headers"; confirm List-Unsubscribe is passed through
// (Brevo may add its own unsubscribe header for transactional mail).
import { env, notConfigured, request, run, httpFailure, maskEmail, parseFrom, type SendResult } from "../http.ts";
import { type EmailInput, unsubscribeHeaders, missingInput } from "./types.ts";

export const name = "brevo";
export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const key = env("EMAIL_PROVIDER_KEY"), from = env("EMAIL_FROM");
  const missing = [!key && "EMAIL_PROVIDER_KEY", !from && "EMAIL_FROM"].filter(Boolean) as string[];
  if (missing.length) return notConfigured(...missing);
  const bad = missingInput(input); if (bad) return { messageId: null, status: "failed", error: bad };
  const sender = parseFrom(from);
  return run(name, async () => {
    const res = await request("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender, to: [{ email: input.to }], subject: input.subject, htmlContent: input.html, textContent: input.text,
        headers: { ...unsubscribeHeaders(input.unsubscribeUrl), ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}) },
      }),
    });
    if (!res.ok) return httpFailure(name, res);
    const j: any = await res.json().catch(() => ({}));
    const id = j.messageId ?? j.messageIds?.[0] ?? null;
    console.log(`[email:brevo] sent to ${maskEmail(input.to)} id=${id}`);
    return { messageId: id, status: "sent" };
  });
}

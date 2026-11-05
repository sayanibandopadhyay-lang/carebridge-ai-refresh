// SendGrid adapter. Docs: https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send (checked 2026-11-04)
// POST https://api.sendgrid.com/v3/mail/send, Authorization: Bearer <key>. Success = 202 with no body.
// The message id is returned in the X-Message-Id response header.
// VERIFY: X-Message-Id is the prefix of sg_message_id in Event Webhook payloads (matched by prefix in delivery-webhook).
// VERIFY: EU subusers must use https://api.eu.sendgrid.com – set SENDGRID_API_HOST if so.
import { env, notConfigured, request, run, httpFailure, maskEmail, parseFrom, type SendResult } from "../http.ts";
import { type EmailInput, unsubscribeHeaders, missingInput } from "./types.ts";

export const name = "sendgrid";
export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const key = env("EMAIL_PROVIDER_KEY"), from = env("EMAIL_FROM");
  const missing = [!key && "EMAIL_PROVIDER_KEY", !from && "EMAIL_FROM"].filter(Boolean) as string[];
  if (missing.length) return notConfigured(...missing);
  const bad = missingInput(input); if (bad) return { messageId: null, status: "failed", error: bad };
  const host = env("SENDGRID_API_HOST") || "https://api.sendgrid.com";
  return run(name, async () => {
    const res = await request(host + "/v3/mail/send", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }], ...(input.idempotencyKey ? { custom_args: { reminder_id: input.idempotencyKey } } : {}) }],
        from: parseFrom(from), subject: input.subject,
        content: [{ type: "text/plain", value: input.text }, { type: "text/html", value: input.html }], // text/plain must come first
        headers: unsubscribeHeaders(input.unsubscribeUrl),
      }),
    });
    if (!res.ok) return httpFailure(name, res);
    const id = res.headers.get("x-message-id");
    console.log(`[email:sendgrid] sent to ${maskEmail(input.to)} id=${id}`);
    return { messageId: id, status: "sent" };
  });
}

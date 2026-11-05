import type { SendResult } from "../http.ts";
export interface EmailInput {
  to: string; subject: string; html: string; text: string;
  unsubscribeUrl?: string; // added to the List-Unsubscribe header where supported
  idempotencyKey?: string; // e.g. the reminder row id
}
export type EmailAdapter = { name: string; sendEmail(input: EmailInput): Promise<SendResult> };

/** RFC 2369 / RFC 8058 one-click unsubscribe headers. */
export function unsubscribeHeaders(url?: string): Record<string, string> {
  return url ? { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {};
}
export const missingInput = (i: EmailInput) => (!i?.to || !i.subject || !i.html || !i.text ? "to, subject, html and text are all required" : null);

// Console email adapter: sends nothing. Logs the exact subject and body with a masked address.
import { maskEmail, type SendResult } from "../http.ts";
import type { EmailInput } from "./types.ts";

export const name = "console";
export async function sendEmail({ to, subject, html, text, unsubscribeUrl }: EmailInput): Promise<SendResult> {
  const messageId = "test-" + crypto.randomUUID();
  console.log(`[email:console] to=${maskEmail(to)} id=${messageId}\nSubject: ${subject}\nList-Unsubscribe: ${unsubscribeUrl || "-"}\n--- text ---\n${text}\n--- html (${html.length} chars) ---`);
  return { messageId, status: "sent" };
}

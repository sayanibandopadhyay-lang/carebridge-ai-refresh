// Email adapter registry. EMAIL_PROVIDER = resend | brevo | sendgrid | console.
// In REMINDER_MODE=test (the default) the console adapter is always used.
import { env, isTestMode } from "../http.ts";
import type { EmailAdapter, EmailInput } from "./types.ts";
import * as consoleA from "./console.ts";
import * as resend from "./resend.ts";
import * as brevo from "./brevo.ts";
import * as sendgrid from "./sendgrid.ts";

export const EMAIL_ADAPTERS: Record<string, EmailAdapter> = { console: consoleA, resend, brevo, sendgrid };

export function getEmailAdapter(): EmailAdapter {
  if (isTestMode()) return consoleA;
  const p = env("EMAIL_PROVIDER").toLowerCase() || "console";
  const a = EMAIL_ADAPTERS[p];
  if (!a) { console.warn(`[email] WARNING: unknown EMAIL_PROVIDER "${p}". Falling back to console – NO EMAIL WILL BE SENT.`); return consoleA; }
  return a;
}
export const sendEmail = (input: EmailInput) => getEmailAdapter().sendEmail(input);
export type { EmailInput, EmailAdapter };

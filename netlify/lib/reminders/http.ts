// Shared helpers for provider adapters: env access, masking, 10-second timeout, retry on network/5xx only,
// and plain-language error messages. No database imports, so adapters can be tested standalone.

export type SendStatus = "sent" | "failed" | "not_configured";
export interface SendResult { messageId: string | null; status: SendStatus; error?: string; httpStatus?: number }

export const env = (k: string) => (process.env[k] || "").trim();
export const isTestMode = () => env("REMINDER_MODE").toLowerCase() !== "live"; // default: test

export const maskEmail = (e?: string | null) => {
  if (!e) return "-";
  const [u, d = ""] = e.split("@");
  return (u.slice(0, 1) || "*") + "***@" + d.replace(/^[^.]+/, (m) => m.slice(0, 1) + "***");
};
export const maskPhone = (p?: string | null) => (p ? p.slice(0, 3) + "******" + p.slice(-2) : "-");

export const notConfigured = (...vars: string[]): SendResult => ({ messageId: null, status: "not_configured", error: "Missing " + vars.join(", ") });

export const TIMEOUT_MS = 10_000;
export const RETRY_DELAYS_MS = [500, 1500]; // up to 2 quick retries inside one send; the scheduler adds longer backoff

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Plain-language message for an HTTP status from a provider. */
export function describeStatus(status: number): string {
  if (status === 401 || status === 403) return "The provider rejected the API key or account settings.";
  if (status === 400 || status === 422) return "The provider rejected the message details (address, number, sender or template).";
  if (status === 404) return "The provider endpoint or account was not found.";
  if (status === 429) return "The provider is rate-limiting requests. Try again later.";
  if (status >= 500) return "The provider had a temporary error.";
  return "The provider could not send this message (HTTP " + status + ").";
}

/**
 * fetch with a 10s timeout per attempt. Retries on network errors, timeouts and 5xx; never on 4xx.
 * Returns the final Response, or throws { kind: "timeout" | "network" } after the last attempt.
 */
export async function request(url: string, init: RequestInit, opts: { delays?: number[]; timeoutMs?: number } = {}): Promise<Response> {
  const delays = opts.delays ?? RETRY_DELAYS_MS, timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  let lastErr: any;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    if (attempt > 0) await sleep(delays[attempt - 1]);
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 500 && attempt < delays.length) { lastErr = { kind: "http", status: res.status }; continue; }
      return res;
    } catch (e: any) {
      const timeout = e?.name === "TimeoutError" || e?.name === "AbortError";
      lastErr = { kind: timeout ? "timeout" : "network" };
    }
  }
  throw lastErr;
}

/** Runs a provider call and converts any outcome into a SendResult. */
export async function run(provider: string, fn: () => Promise<SendResult>): Promise<SendResult> {
  try {
    return await fn();
  } catch (e: any) {
    const error = e?.kind === "timeout" ? "The provider did not respond within 10 seconds."
      : e?.kind === "network" ? "Could not reach the provider (network error)."
      : "Unexpected error while sending.";
    console.error(`[${provider}] send failed: ${error}`);
    return { messageId: null, status: "failed", error };
  }
}

export async function httpFailure(provider: string, res: Response): Promise<SendResult> {
  let detail = "";
  try { detail = (await res.text()).slice(0, 200); } catch {}
  console.error(`[${provider}] HTTP ${res.status}: ${detail.replace(/\+?\d{8,}/g, "[number]").replace(/\S+@\S+/g, "[email]")}`);
  return { messageId: null, status: "failed", error: describeStatus(res.status), httpStatus: res.status };
}

/** "CareBridge <noreply@x.in>" → { email, name } */
export function parseFrom(from: string) {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, "") || undefined, email: m[2] } : { email: from.trim(), name: undefined };
}

// Shared helpers for the reminder functions: config, validation, masking, Asia/Kolkata time and rate limiting.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../../../db/index.js";

export const env = (k: string) => (process.env[k] || "").trim();
export const isLive = () => env("REMINDER_MODE").toLowerCase() === "live"; // default: test
export const baseUrl = () => (env("APP_BASE_URL") || env("URL") || "http://localhost:8888").replace(/\/+$/, "");

export const LANGS = ["EN", "HI", "BN", "TE", "TA"] as const;
export type Lang = (typeof LANGS)[number];
export const KINDS = ["CONFIRMATION", "REMINDER_24H", "REMINDER_2H"] as const;
export type Kind = (typeof KINDS)[number];
export const CHANNELS = ["email", "sms"] as const;
export type Channel = (typeof CHANNELS)[number];
export const MAX_ATTEMPTS = 4; // first try + 3 retries
export const BACKOFF_MIN = [5, 15, 45]; // minutes before retry 1, 2, 3
export const RETENTION_DAYS = 30;
export const CONSENT_TEXT = "The patient has agreed to receive appointment reminders by email and SMS.";

/** The page sends its language select value (English, Hindi, …); accept that or the code. */
export function toLang(v: unknown): Lang {
  const s = String(v || "").trim().toUpperCase();
  const map: Record<string, Lang> = { ENGLISH: "EN", HINDI: "HI", BENGALI: "BN", TELUGU: "TE", TAMIL: "TA" };
  if ((LANGS as readonly string[]).includes(s)) return s as Lang;
  return map[s] || "EN";
}

// ---------- sanitising and validation ----------
/** Removes control characters, angle brackets and extra spaces; caps the length. */
export function clean(v: unknown, max = 120): string {
  return String(v ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F<>{}​‪-‮]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
export function normEmail(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s || s.length > 254 || !EMAIL_RE.test(s)) return null;
  const tld = s.split(".").pop() || "";
  return /^[a-z]{2,24}$/.test(tld) || /^xn--[a-z0-9-]+$/.test(tld) ? s : null;
}

/** Converts an Indian or international number to E.164. A bare 10-digit number is treated as +91. */
export function toE164(v: unknown): string | null {
  let s = String(v ?? "").trim().replace(/[\s().-]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0\d{10}$/.test(s)) s = s.slice(1); // 0 98765 43210
  if (/^\d{10}$/.test(s)) s = "+91" + s;
  if (/^91\d{10}$/.test(s)) s = "+" + s;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  if (s.startsWith("+91") && !/^\+91[6-9]\d{9}$/.test(s)) return null; // Indian mobiles are 10 digits starting 6–9
  return s;
}

export function cleanPhoneDisplay(v: unknown): string | null {
  const s = clean(v, 24);
  return /^\+?[0-9][0-9 -]{5,20}$/.test(s) ? s : null;
}

// ---------- masking for logs ----------
export const maskEmail = (e?: string | null) => {
  if (!e) return "-";
  const [u, d] = e.split("@");
  return (u.slice(0, 1) || "*") + "***@" + (d ? d.replace(/^[^.]+/, (m) => m.slice(0, 1) + "***") : "***");
};
export const maskPhone = (p?: string | null) => (p ? p.slice(0, 3) + "******" + p.slice(-2) : "-");
export const mask = (to: string) => (to.includes("@") ? maskEmail(to) : maskPhone(to));

// ---------- tokens and hashes ----------
export const token = () => randomBytes(24).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export const optOutHash = (channel: Channel, value: string) => sha256(channel + ":" + value.toLowerCase());

// ---------- Asia/Kolkata time (UTC+05:30 all year, no daylight saving) ----------
const IST_MS = 330 * 60 * 1000;
/** "2026-11-05" + "10:30" in Asia/Kolkata → Date (UTC instant). */
export function istToDate(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = time.split(":").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return null;
  const t = Date.UTC(y, m - 1, d, hh, mm) - IST_MS;
  const back = new Date(t + IST_MS);
  return back.getUTCDate() === d ? new Date(t) : null;
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Short, language-neutral date and time for SMS variables, e.g. "05 Nov 2026" and "10:30 AM". */
export function istParts(at: Date) {
  const x = new Date(at.getTime() + IST_MS);
  const h = x.getUTCHours(), m = String(x.getUTCMinutes()).padStart(2, "0");
  return {
    date: String(x.getUTCDate()).padStart(2, "0") + " " + MON[x.getUTCMonth()] + " " + x.getUTCFullYear(),
    time: ((h % 12) || 12) + ":" + m + " " + (h < 12 ? "AM" : "PM"),
    ymd: x.toISOString().slice(0, 10),
  };
}
/** Days between today and the appointment day, both in Asia/Kolkata. */
export function istDaysUntil(at: Date, now = new Date()) {
  const a = Date.parse(istParts(at).ymd), b = Date.parse(istParts(now).ymd);
  return Math.round((a - b) / 86400000);
}

// ---------- HTTP helpers ----------
export const noStore = { "cache-control": "no-store" };
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });
export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);
export async function readJson(req: Request, maxBytes = 40000): Promise<any> {
  const t = await req.text();
  if (t.length > maxBytes) throw new Error("too_large");
  return t ? JSON.parse(t) : {};
}

/** Fixed-window rate limit stored in the database. Returns true when the request is allowed. */
export async function rateLimit(name: string, ip: string | undefined, limit: number, windowSec: number) {
  const key = name + ":" + sha256(ip || "unknown").slice(0, 24);
  try {
    const r: any = await db.execute(sql`
      INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, now(), 1)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}) THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}) THEN now() ELSE rate_limits.window_start END
      RETURNING count`);
    const rows = r.rows ?? r;
    return Number(rows?.[0]?.count ?? 0) <= limit;
  } catch (e) {
    console.error("[rate-limit] check failed, allowing request:", (e as Error).message);
    return true;
  }
}
export const tooMany = () => fail(429, "Too many requests. Please wait a few minutes and try again.");

/** Plain-language versions of common errors, shown to the hospital user. */
export function friendlyError(code: string, detail = ""): string {
  const m: Record<string, string> = {
    not_configured: "This channel is not set up yet. Ask your administrator to add the provider keys and template IDs.",
    opted_out: "The patient has opted out of reminders, so nothing was sent.",
    invalid_recipient: "The email address or mobile number was rejected. Please check it.",
    auth: "The messaging provider rejected the account key. Ask your administrator to check it.",
    rate_limited: "The messaging provider is busy. CareBridge will try again shortly.",
    network: "Could not reach the messaging provider. CareBridge will try again shortly.",
    provider: "The messaging provider could not send this message.",
    bounced: "The message bounced: the address or number may be wrong or unreachable.",
    interrupted: "Sending was interrupted and the result is unknown. Check before retrying so the patient is not messaged twice.",
    too_late: "The appointment time has passed, so this reminder was not sent.",
  };
  return (m[code] || m.provider) + (detail ? " (" + clean(detail, 160) + ")" : "");
}

// CareBridge appointment reminders – database schema (Netlify Database, managed Postgres).
// Row-level security is enabled on every table. There are no policies, so only the table owner
// (the server-side role the Netlify Functions use) can read or write. No public/anon access exists.
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";

export const appointments = pgTable.withRLS(
  "appointments",
  {
    id: uuid().primaryKey().defaultRandom(),
    patientName: text("patient_name").notNull(),
    hospitalName: text("hospital_name").notNull(),
    hospitalPhone: text("hospital_phone").notNull(),
    appointmentAt: timestamp("appointment_at", { withTimezone: true }).notNull(),
    language: text().notNull().default("EN"),
    channels: text().notNull(), // "email", "sms" or "email,sms"
    friendlyMessages: jsonb("friendly_messages").$type<Record<string, string>>(), // non-medical reminder text for emails
    status: text().notNull().default("active"), // active | cancelled
    manageTokenHash: text("manage_token_hash").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    consentText: text("consent_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("appointments_appointment_at_idx").on(t.appointmentAt)],
);

export const contacts = pgTable.withRLS(
  "contacts",
  {
    id: uuid().primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
    email: text(),
    phone: text(), // E.164, e.g. +919876543210
    optedOut: boolean("opted_out").notNull().default(false),
    optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    consentText: text("consent_text").notNull(),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contacts_appointment_idx").on(t.appointmentId), index("contacts_email_idx").on(t.email), index("contacts_phone_idx").on(t.phone)],
);

export const reminders = pgTable.withRLS(
  "reminders",
  {
    id: uuid().primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
    kind: text().notNull(), // CONFIRMATION | REMINDER_24H | REMINDER_2H
    channel: text().notNull(), // email | sms
    sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
    status: text().notNull().default("scheduled"),
    // scheduled | sending | sent | sent_test | delivered | failed | bounced | not_configured | opted_out | cancelled
    attempts: integer().notNull().default(0),
    provider: text(),
    providerMessageId: text("provider_message_id"),
    error: text(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reminders_due_idx").on(t.status, t.sendAt),
    index("reminders_appointment_idx").on(t.appointmentId),
    index("reminders_provider_msg_idx").on(t.providerMessageId),
  ],
);

// Permanent opt-out list. Stores only SHA-256 hashes of the email address / phone number, so an
// opt-out is still honoured after the appointment data has been deleted, without keeping the contact itself.
export const optOuts = pgTable.withRLS("opt_outs", {
  hash: text().primaryKey(),
  channel: text().notNull(), // email | sms
  source: text().notNull(), // unsubscribe_link | sms_stop | provider
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Fixed-window rate limiting per endpoint and hashed client IP.
export const rateLimits = pgTable.withRLS("rate_limits", {
  key: text().primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  count: integer().notNull().default(0),
});

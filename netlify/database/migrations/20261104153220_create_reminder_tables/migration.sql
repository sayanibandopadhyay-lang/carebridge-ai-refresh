CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_name" text NOT NULL,
	"hospital_name" text NOT NULL,
	"hospital_phone" text NOT NULL,
	"appointment_at" timestamp with time zone NOT NULL,
	"language" text DEFAULT 'EN' NOT NULL,
	"channels" text NOT NULL,
	"friendly_messages" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"manage_token_hash" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"appointment_id" uuid NOT NULL,
	"email" text,
	"phone" text,
	"opted_out" boolean DEFAULT false NOT NULL,
	"opted_out_at" timestamp with time zone,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_text" text NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "opt_outs" (
	"hash" text PRIMARY KEY,
	"channel" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opt_outs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"appointment_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"channel" text NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"error" text,
	"locked_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "appointments_appointment_at_idx" ON "appointments" ("appointment_at");--> statement-breakpoint
CREATE INDEX "contacts_appointment_idx" ON "contacts" ("appointment_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" ("email");--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" ("phone");--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" ("status","send_at");--> statement-breakpoint
CREATE INDEX "reminders_appointment_idx" ON "reminders" ("appointment_id");--> statement-breakpoint
CREATE INDEX "reminders_provider_msg_idx" ON "reminders" ("provider_message_id");--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_appointment_id_appointments_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_appointment_id_appointments_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE;
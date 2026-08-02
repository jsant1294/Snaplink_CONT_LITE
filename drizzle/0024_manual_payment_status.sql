ALTER TABLE "agent_profiles" ADD COLUMN "manual_payment_status" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "manual_payment_note" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "manual_payment_set_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "manual_payment_set_by" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "manual_payment_status" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "manual_payment_note" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "manual_payment_set_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "manual_payment_set_by" text;
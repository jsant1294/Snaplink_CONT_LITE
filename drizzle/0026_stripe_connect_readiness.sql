ALTER TABLE "contractors" ADD COLUMN "stripe_details_submitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_charges_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_payouts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_requirements_currently_due" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_disabled_reason" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_connect_status" text DEFAULT 'not_connected' NOT NULL;--> statement-breakpoint
CREATE INDEX "contractors_stripe_account_idx" ON "contractors" USING btree ("stripe_account_id");

ALTER TABLE "agent_profiles" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "display_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "office_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "team_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "license_state" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "cover_photo_url" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "preferred_language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "sms_phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "whatsapp" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "website" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "booking_link" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "facebook" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "instagram" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "linkedin" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "categories" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "neighborhoods" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "service_radius" integer;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "snaplink_status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "southline_status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "onboarding_status" text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "marketplace_summary" text;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "modules" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profiles_username_idx" ON "agent_profiles" USING btree ("username");
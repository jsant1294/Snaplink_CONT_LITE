CREATE TABLE "agent_profile_events" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_profile_id" text NOT NULL,
	"event_type" text NOT NULL,
	"anonymous_session_id" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"pin" text,
	"name" text NOT NULL,
	"brokerage_name" text DEFAULT '' NOT NULL,
	"license_number" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"service_area" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tagline" text,
	"photo_url" text,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"service_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"years_experience" integer,
	"tier" text,
	"billing_tenant_id" text,
	"billing_organization_id" text,
	"billing_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_profile_events" ADD CONSTRAINT "agent_profile_events_agent_profile_id_agent_profiles_id_fk" FOREIGN KEY ("agent_profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_profile_events_profile_idx" ON "agent_profile_events" USING btree ("agent_profile_id","event_type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profiles_slug_idx" ON "agent_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_profiles_status_idx" ON "agent_profiles" USING btree ("status");
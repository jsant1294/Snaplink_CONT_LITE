CREATE TABLE "real_estate_analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"event_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"anonymous_id" text,
	"source" text DEFAULT 'app' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"member_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_calendar_id" text,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_calendar_member_provider_unique" UNIQUE("member_id","provider")
);
--> statement-breakpoint
CREATE TABLE "real_estate_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"property_id" text,
	"name" text NOT NULL,
	"campaign_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_communications" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_email" text NOT NULL,
	"role" text NOT NULL,
	"agent_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_memberships_tenant_email_unique" UNIQUE("tenant_id","user_email")
);
--> statement-breakpoint
CREATE TABLE "real_estate_open_house_attendees" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"open_house_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"working_with_realtor" boolean DEFAULT false NOT NULL,
	"pre_approved" boolean DEFAULT false NOT NULL,
	"budget" text DEFAULT '' NOT NULL,
	"timeline" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_agent_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"title" text NOT NULL,
	"remind_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD CONSTRAINT "real_estate_calendar_connections_member_id_real_estate_memberships_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD CONSTRAINT "real_estate_campaigns_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD CONSTRAINT "real_estate_campaigns_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_memberships" ADD CONSTRAINT "real_estate_memberships_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_open_house_attendees" ADD CONSTRAINT "real_estate_open_house_attendees_open_house_id_real_estate_open_houses_id_fk" FOREIGN KEY ("open_house_id") REFERENCES "public"."real_estate_open_houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD CONSTRAINT "real_estate_reminders_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "real_estate_analytics_tenant_event_idx" ON "real_estate_analytics_events" USING btree ("tenant_id","event_name");--> statement-breakpoint
CREATE INDEX "real_estate_analytics_entity_idx" ON "real_estate_analytics_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "real_estate_calendar_tenant_idx" ON "real_estate_calendar_connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_campaigns_tenant_idx" ON "real_estate_campaigns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_campaigns_property_idx" ON "real_estate_campaigns" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "real_estate_communications_tenant_idx" ON "real_estate_communications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_communications_status_idx" ON "real_estate_communications" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "real_estate_memberships_tenant_idx" ON "real_estate_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_memberships_agent_idx" ON "real_estate_memberships" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "real_estate_attendees_tenant_idx" ON "real_estate_open_house_attendees" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_attendees_open_house_idx" ON "real_estate_open_house_attendees" USING btree ("open_house_id");--> statement-breakpoint
CREATE INDEX "real_estate_reminders_tenant_date_idx" ON "real_estate_reminders" USING btree ("tenant_id","remind_at");--> statement-breakpoint
CREATE INDEX "real_estate_reminders_agent_idx" ON "real_estate_reminders" USING btree ("assigned_agent_id");
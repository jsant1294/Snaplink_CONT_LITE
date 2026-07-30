CREATE TABLE "real_estate_automation_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp with time zone,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_runs_dedupe_unique" UNIQUE("workflow_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_automation_workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"trigger" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_communication_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"contact_type" text NOT NULL,
	"contact_id" text,
	"email" text,
	"phone" text,
	"email_opt_in" boolean DEFAULT false NOT NULL,
	"sms_opt_in" boolean DEFAULT false NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"transactional_consent" boolean DEFAULT true NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"sms_stopped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_communication_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"template_type" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"channel" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_templates_tenant_name_language_unique" UNIQUE("tenant_id","name","language")
);
--> statement-breakpoint
CREATE TABLE "real_estate_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"membership_id" text,
	"type" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_nurture_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"assigned_agent_id" text,
	"sequence_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_action_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_nurture_active_unique" UNIQUE("tenant_id","lead_id","sequence_type")
);
--> statement-breakpoint
CREATE TABLE "real_estate_qr_links" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"destination_type" text NOT NULL,
	"destination_id" text NOT NULL,
	"destination_url" text NOT NULL,
	"campaign_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_qr_destination_unique" UNIQUE("tenant_id","destination_type","destination_id","campaign_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_qr_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"qr_link_id" text NOT NULL,
	"campaign_id" text,
	"anonymous_session_id" text,
	"device" text,
	"referrer" text,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD COLUMN "audience_type" text DEFAULT 'leads' NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD COLUMN "audience_filters" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD COLUMN "template_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "real_estate_campaigns" ADD COLUMN "launched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "sender_membership_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "sender" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "provider" text DEFAULT 'disabled' NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "template_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "rendered_content" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "property_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "lead_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "buyer_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "seller_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "campaign_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "showing_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "open_house_id" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD COLUMN "channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD COLUMN "max_retries" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "real_estate_automation_runs" ADD CONSTRAINT "real_estate_automation_runs_workflow_id_real_estate_automation_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."real_estate_automation_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_automation_workflows" ADD CONSTRAINT "real_estate_automation_workflows_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_communication_templates" ADD CONSTRAINT "real_estate_communication_templates_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_notifications" ADD CONSTRAINT "real_estate_notifications_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_nurture_enrollments" ADD CONSTRAINT "real_estate_nurture_enrollments_lead_id_real_estate_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."real_estate_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_nurture_enrollments" ADD CONSTRAINT "real_estate_nurture_enrollments_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_qr_links" ADD CONSTRAINT "real_estate_qr_links_campaign_id_real_estate_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."real_estate_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_qr_scans" ADD CONSTRAINT "real_estate_qr_scans_qr_link_id_real_estate_qr_links_id_fk" FOREIGN KEY ("qr_link_id") REFERENCES "public"."real_estate_qr_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_qr_scans" ADD CONSTRAINT "real_estate_qr_scans_campaign_id_real_estate_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."real_estate_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "real_estate_runs_tenant_status_idx" ON "real_estate_automation_runs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "real_estate_workflows_tenant_idx" ON "real_estate_automation_workflows" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_preferences_tenant_idx" ON "real_estate_communication_preferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "real_estate_preferences_tenant_email_idx" ON "real_estate_communication_preferences" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "real_estate_preferences_tenant_phone_idx" ON "real_estate_communication_preferences" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "real_estate_templates_tenant_idx" ON "real_estate_communication_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_notifications_tenant_idx" ON "real_estate_notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_notifications_member_idx" ON "real_estate_notifications" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "real_estate_nurture_tenant_idx" ON "real_estate_nurture_enrollments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_qr_tenant_idx" ON "real_estate_qr_links" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_qr_scans_tenant_idx" ON "real_estate_qr_scans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_qr_scans_link_idx" ON "real_estate_qr_scans" USING btree ("qr_link_id");--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD CONSTRAINT "real_estate_communications_sender_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("sender_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_reminders" ADD CONSTRAINT "real_estate_reminders_dedupe_unique" UNIQUE("tenant_id","dedupe_key");
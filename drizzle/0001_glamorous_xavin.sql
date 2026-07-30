CREATE TABLE "real_estate_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"actor_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_agents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"brokerage_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"photo_url" text,
	"biography" text DEFAULT '' NOT NULL,
	"license_number" text DEFAULT '' NOT NULL,
	"license_state" text DEFAULT '' NOT NULL,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"service_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"certifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_agents_tenant_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "real_estate_brokerages" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"description" text DEFAULT '' NOT NULL,
	"address_line_1" text DEFAULT '' NOT NULL,
	"address_line_2" text,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"website" text,
	"brand_color" text,
	"service_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_brokerages_tenant_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "real_estate_buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_agent_id" text,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"budget_min_cents" integer,
	"budget_max_cents" integer,
	"preferred_cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bedrooms" real,
	"bathrooms" real,
	"property_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"financing_status" text DEFAULT 'unknown' NOT NULL,
	"pipeline_stage" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_agent_id" text,
	"buyer_id" text,
	"seller_id" text,
	"lead_type" text DEFAULT 'general' NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_open_houses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"property_id" text NOT NULL,
	"assigned_agent_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"attendee_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_sellers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_agent_id" text,
	"owner_name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"property_address" text NOT NULL,
	"timeline" text DEFAULT '' NOT NULL,
	"asking_expectation_cents" integer,
	"repairs" text DEFAULT '' NOT NULL,
	"mortgage_estimate_cents" integer,
	"pipeline_stage" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_showings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"property_id" text NOT NULL,
	"buyer_id" text,
	"assigned_agent_id" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_agent_id" text,
	"title" text NOT NULL,
	"due_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "real_estate_agents" ADD CONSTRAINT "real_estate_agents_brokerage_id_real_estate_brokerages_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "public"."real_estate_brokerages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_buyers" ADD CONSTRAINT "real_estate_buyers_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_leads" ADD CONSTRAINT "real_estate_leads_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_leads" ADD CONSTRAINT "real_estate_leads_buyer_id_real_estate_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."real_estate_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_leads" ADD CONSTRAINT "real_estate_leads_seller_id_real_estate_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."real_estate_sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_open_houses" ADD CONSTRAINT "real_estate_open_houses_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_open_houses" ADD CONSTRAINT "real_estate_open_houses_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_sellers" ADD CONSTRAINT "real_estate_sellers_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_showings" ADD CONSTRAINT "real_estate_showings_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_showings" ADD CONSTRAINT "real_estate_showings_buyer_id_real_estate_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."real_estate_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_showings" ADD CONSTRAINT "real_estate_showings_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_tasks" ADD CONSTRAINT "real_estate_tasks_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "real_estate_activities_tenant_idx" ON "real_estate_activities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_activities_entity_idx" ON "real_estate_activities" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "real_estate_agents_tenant_idx" ON "real_estate_agents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_agents_brokerage_idx" ON "real_estate_agents" USING btree ("brokerage_id");--> statement-breakpoint
CREATE INDEX "real_estate_brokerages_tenant_idx" ON "real_estate_brokerages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_brokerages_org_idx" ON "real_estate_brokerages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "real_estate_buyers_tenant_idx" ON "real_estate_buyers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_buyers_agent_idx" ON "real_estate_buyers" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "real_estate_leads_tenant_idx" ON "real_estate_leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_leads_agent_idx" ON "real_estate_leads" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "real_estate_leads_stage_idx" ON "real_estate_leads" USING btree ("tenant_id","stage");--> statement-breakpoint
CREATE INDEX "real_estate_open_houses_tenant_idx" ON "real_estate_open_houses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_open_houses_date_idx" ON "real_estate_open_houses" USING btree ("tenant_id","starts_at");--> statement-breakpoint
CREATE INDEX "real_estate_sellers_tenant_idx" ON "real_estate_sellers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_sellers_agent_idx" ON "real_estate_sellers" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "real_estate_showings_tenant_idx" ON "real_estate_showings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_showings_date_idx" ON "real_estate_showings" USING btree ("tenant_id","requested_at");--> statement-breakpoint
CREATE INDEX "real_estate_tasks_tenant_idx" ON "real_estate_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_tasks_agent_idx" ON "real_estate_tasks" USING btree ("assigned_agent_id");
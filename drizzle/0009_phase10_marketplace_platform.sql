CREATE TABLE "real_estate_custom_domains" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"domain" text NOT NULL,
	"verification_token" text NOT NULL,
	"verification_method" text DEFAULT 'dns_txt' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_feature_rollouts" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_key" text NOT NULL,
	"strategy" text DEFAULT 'off' NOT NULL,
	"rollout_percentage" integer DEFAULT 0 NOT NULL,
	"allowlist_tenant_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_mls_entity_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"internal_id" text NOT NULL,
	"external_id" text NOT NULL,
	"external_updated_at" timestamp with time zone,
	"conflict_status" text DEFAULT 'none' NOT NULL,
	"conflict_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_mls_mapping_external_unique" UNIQUE("tenant_id","installation_id","entity_type","external_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_mls_sync_cursors" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"provider_key" text NOT NULL,
	"sync_type" text NOT NULL,
	"cursor" text,
	"status" text DEFAULT 'idle' NOT NULL,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_mls_cursor_unique" UNIQUE("tenant_id","installation_id","sync_type")
);
--> statement-breakpoint
CREATE TABLE "real_estate_platform_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"audience" text DEFAULT 'all' NOT NULL,
	"tenant_id" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_tenant_branding" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text,
	"secondary_color" text,
	"accent_color" text,
	"font_family" text,
	"email_from_name" text,
	"email_logo_url" text,
	"login_headline" text,
	"portal_headline" text,
	"pwa_name" text,
	"pwa_theme_color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_tenant_branding_scope_unique" UNIQUE("tenant_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_tenant_licenses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"feature" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"granted_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_tenant_license_unique" UNIQUE("tenant_id","feature")
);
--> statement-breakpoint
CREATE TABLE "real_estate_tenant_lifecycle_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"event_type" text NOT NULL,
	"reason" text,
	"actor_email" text NOT NULL,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "real_estate_custom_domains" ADD CONSTRAINT "real_estate_custom_domains_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_feature_rollouts" ADD CONSTRAINT "real_estate_feature_rollouts_updated_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("updated_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_mls_entity_mappings" ADD CONSTRAINT "real_estate_mls_entity_mappings_installation_id_real_estate_integration_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."real_estate_integration_installations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_mls_sync_cursors" ADD CONSTRAINT "real_estate_mls_sync_cursors_installation_id_real_estate_integration_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."real_estate_integration_installations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_platform_announcements" ADD CONSTRAINT "real_estate_platform_announcements_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_tenant_branding" ADD CONSTRAINT "real_estate_tenant_branding_updated_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("updated_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_tenant_licenses" ADD CONSTRAINT "real_estate_tenant_licenses_granted_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("granted_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "re_custom_domain_unique" ON "real_estate_custom_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "re_custom_domain_tenant_idx" ON "real_estate_custom_domains" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "re_feature_rollout_key_unique" ON "real_estate_feature_rollouts" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "re_mls_mapping_internal_idx" ON "real_estate_mls_entity_mappings" USING btree ("tenant_id","installation_id","entity_type","internal_id");--> statement-breakpoint
CREATE INDEX "re_mls_cursor_tenant_idx" ON "real_estate_mls_sync_cursors" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "re_announcement_external_unique" ON "real_estate_platform_announcements" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "re_announcement_audience_idx" ON "real_estate_platform_announcements" USING btree ("audience","tenant_id","published_at");--> statement-breakpoint
CREATE INDEX "re_tenant_license_tenant_idx" ON "real_estate_tenant_licenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "re_tenant_lifecycle_tenant_idx" ON "real_estate_tenant_lifecycle_events" USING btree ("tenant_id","created_at");
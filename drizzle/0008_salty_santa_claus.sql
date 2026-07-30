CREATE TABLE "real_estate_api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"secret_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ip_allowlist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requests_per_minute" integer DEFAULT 60 NOT NULL,
	"monthly_quota" integer DEFAULT 10000 NOT NULL,
	"usage_month" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_api_keys_external_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_backup_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"environment" text NOT NULL,
	"backup_reference_hash" text NOT NULL,
	"database_status" text NOT NULL,
	"blob_status" text NOT NULL,
	"integrity_status" text NOT NULL,
	"safe_report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verified_by" text NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_enterprise_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"node_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"enterprise_role" text NOT NULL,
	"inherits_to_children" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_enterprise_assignment_unique" UNIQUE("tenant_id","node_id","membership_id","enterprise_role")
);
--> statement-breakpoint
CREATE TABLE "real_estate_enterprise_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"parent_id" text,
	"node_type" text NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_enterprise_nodes_external_unique" UNIQUE("tenant_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_enterprise_resource_scopes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"node_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_enterprise_resource_scope_unique" UNIQUE("tenant_id","resource_type","resource_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_external_identifiers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_external_identifier_resource_unique" UNIQUE("tenant_id","resource_type","resource_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_import_export_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"external_id" text NOT NULL,
	"direction" text NOT NULL,
	"resource_type" text NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'preview' NOT NULL,
	"blob_url" text,
	"cursor" integer DEFAULT 0 NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"safe_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_import_export_idempotency_unique" UNIQUE("tenant_id","idempotency_key"),
	CONSTRAINT "re_import_export_external_unique" UNIQUE("tenant_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_integration_installations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"external_id" text NOT NULL,
	"provider_key" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'configured' NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safe_configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"credential_reference" text,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_integration_install_external_unique" UNIQUE("tenant_id","external_id"),
	CONSTRAINT "re_integration_install_provider_unique" UNIQUE("tenant_id","organization_id","provider_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_hash" text NOT NULL,
	"name" text NOT NULL,
	"redirect_uris" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_confidential" boolean DEFAULT true NOT NULL,
	"created_by_membership_id" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_oauth_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"client_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"grant_type" text NOT NULL,
	"token_hash" text NOT NULL,
	"family_id" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"redirect_uri" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_operational_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"organization_id" text,
	"metric" text NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"value" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_outbound_webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"response_status" integer,
	"safe_error" text,
	"next_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_outbound_delivery_event_unique" UNIQUE("subscription_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_outbound_webhook_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"secret_hash" text NOT NULL,
	"encrypted_signing_secret" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_outbound_webhooks_external_unique" UNIQUE("tenant_id","external_id")
);
--> statement-breakpoint
ALTER TABLE "real_estate_api_keys" ADD CONSTRAINT "real_estate_api_keys_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_enterprise_assignments" ADD CONSTRAINT "real_estate_enterprise_assignments_node_id_real_estate_enterprise_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."real_estate_enterprise_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_enterprise_assignments" ADD CONSTRAINT "real_estate_enterprise_assignments_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_enterprise_resource_scopes" ADD CONSTRAINT "real_estate_enterprise_resource_scopes_node_id_real_estate_enterprise_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."real_estate_enterprise_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_import_export_jobs" ADD CONSTRAINT "real_estate_import_export_jobs_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_integration_installations" ADD CONSTRAINT "real_estate_integration_installations_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_oauth_clients" ADD CONSTRAINT "real_estate_oauth_clients_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_oauth_grants" ADD CONSTRAINT "real_estate_oauth_grants_client_id_real_estate_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."real_estate_oauth_clients"("client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_oauth_grants" ADD CONSTRAINT "real_estate_oauth_grants_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_outbound_webhook_deliveries" ADD CONSTRAINT "real_estate_outbound_webhook_deliveries_subscription_id_real_estate_outbound_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."real_estate_outbound_webhook_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_outbound_webhook_subscriptions" ADD CONSTRAINT "real_estate_outbound_webhook_subscriptions_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "re_api_keys_prefix_idx" ON "real_estate_api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "re_api_keys_scope_idx" ON "real_estate_api_keys" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE INDEX "re_backup_verification_idx" ON "real_estate_backup_verifications" USING btree ("environment","verified_at");--> statement-breakpoint
CREATE INDEX "re_enterprise_assignment_member_idx" ON "real_estate_enterprise_assignments" USING btree ("tenant_id","membership_id");--> statement-breakpoint
CREATE INDEX "re_enterprise_nodes_scope_idx" ON "real_estate_enterprise_nodes" USING btree ("tenant_id","organization_id","node_type");--> statement-breakpoint
CREATE INDEX "re_enterprise_nodes_parent_idx" ON "real_estate_enterprise_nodes" USING btree ("tenant_id","parent_id");--> statement-breakpoint
CREATE INDEX "re_enterprise_resource_node_idx" ON "real_estate_enterprise_resource_scopes" USING btree ("tenant_id","node_id","resource_type");--> statement-breakpoint
CREATE UNIQUE INDEX "re_external_identifier_public_unique" ON "real_estate_external_identifiers" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "re_import_export_queue_idx" ON "real_estate_import_export_jobs" USING btree ("tenant_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "re_oauth_clients_client_idx" ON "real_estate_oauth_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "re_oauth_clients_scope_idx" ON "real_estate_oauth_clients" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "re_oauth_grants_token_idx" ON "real_estate_oauth_grants" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "re_oauth_grants_family_idx" ON "real_estate_oauth_grants" USING btree ("tenant_id","family_id");--> statement-breakpoint
CREATE INDEX "re_operational_metrics_scope_idx" ON "real_estate_operational_metrics" USING btree ("tenant_id","metric","occurred_at");--> statement-breakpoint
CREATE INDEX "re_outbound_delivery_queue_idx" ON "real_estate_outbound_webhook_deliveries" USING btree ("tenant_id","status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "re_outbound_webhooks_scope_idx" ON "real_estate_outbound_webhook_subscriptions" USING btree ("tenant_id","organization_id");
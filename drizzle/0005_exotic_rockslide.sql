CREATE TABLE "real_estate_calendar_event_links" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"internal_event_type" text NOT NULL,
	"internal_event_id" text NOT NULL,
	"external_calendar_id" text NOT NULL,
	"external_event_id" text,
	"provider_etag" text,
	"synchronized_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_calendar_link_unique" UNIQUE("connection_id","internal_event_type","internal_event_id","external_calendar_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_communication_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"communication_id" text NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"provider_event_id" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_communication_event_unique" UNIQUE("provider","provider_event_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_contact_suppressions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"channel" text NOT NULL,
	"recipient_hash" text NOT NULL,
	"suppression_type" text NOT NULL,
	"source" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "real_estate_suppression_active_unique" UNIQUE("tenant_id","channel","recipient_hash","suppression_type")
);
--> statement-breakpoint
CREATE TABLE "real_estate_dead_letters" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" text NOT NULL,
	"job_type" text NOT NULL,
	"safe_error_code" text,
	"safe_error_message" text,
	"attempt_count" integer NOT NULL,
	"requeued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_dead_letters_job_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_deliverability_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"day" text NOT NULL,
	"provider" text NOT NULL,
	"campaign_id" text,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_deliverability_daily_unique" UNIQUE("tenant_id","day","provider","campaign_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_job_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"worker_id" text NOT NULL,
	"status" text NOT NULL,
	"safe_error_code" text,
	"safe_error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_job_locks" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "real_estate_job_locks_job_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payload_version" integer DEFAULT 1 NOT NULL,
	"idempotency_key" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"lock_expires_at" timestamp with time zone,
	"locked_by" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_message" text,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_jobs_tenant_idempotency_unique" UNIQUE("tenant_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_oauth_states" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"provider" text NOT NULL,
	"state_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_oauth_state_hash_unique" UNIQUE("state_hash")
);
--> statement-breakpoint
CREATE TABLE "real_estate_operational_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"incident_key" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"safe_message" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"last_notified_at" timestamp with time zone,
	CONSTRAINT "real_estate_incident_key_unique" UNIQUE("incident_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_provider_health_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"safe_failure_code" text,
	"safe_failure_message" text,
	"latency_ms" integer
);
--> statement-breakpoint
CREATE TABLE "real_estate_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text,
	"event_type" text NOT NULL,
	"signature_verified" boolean NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"status" text DEFAULT 'received' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"payload_hash" text NOT NULL,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_webhook_provider_event_unique" UNIQUE("provider","provider_event_id"),
	CONSTRAINT "real_estate_webhook_provider_hash_unique" UNIQUE("provider","payload_hash")
);
--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "status" text DEFAULT 'disconnected' NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "sync_direction" text DEFAULT 'outbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "timezone" text DEFAULT 'America/New_York' NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "encryption_version" integer;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "attention_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "last_error_code" text;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_connections" ADD COLUMN "last_error_message" text;--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "real_estate_calendar_event_links" ADD CONSTRAINT "real_estate_calendar_event_links_connection_id_real_estate_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."real_estate_calendar_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_communication_events" ADD CONSTRAINT "real_estate_communication_events_communication_id_real_estate_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."real_estate_communications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_dead_letters" ADD CONSTRAINT "real_estate_dead_letters_job_id_real_estate_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."real_estate_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_job_attempts" ADD CONSTRAINT "real_estate_job_attempts_job_id_real_estate_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."real_estate_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_job_locks" ADD CONSTRAINT "real_estate_job_locks_job_id_real_estate_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."real_estate_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_jobs" ADD CONSTRAINT "real_estate_jobs_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_oauth_states" ADD CONSTRAINT "real_estate_oauth_states_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "real_estate_calendar_external_idx" ON "real_estate_calendar_event_links" USING btree ("connection_id","external_event_id");--> statement-breakpoint
CREATE INDEX "real_estate_calendar_link_tenant_idx" ON "real_estate_calendar_event_links" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_communication_events_tenant_idx" ON "real_estate_communication_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_communication_events_message_idx" ON "real_estate_communication_events" USING btree ("communication_id");--> statement-breakpoint
CREATE INDEX "real_estate_suppressions_tenant_idx" ON "real_estate_contact_suppressions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_dead_letters_tenant_idx" ON "real_estate_dead_letters" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_deliverability_tenant_idx" ON "real_estate_deliverability_daily" USING btree ("tenant_id","day");--> statement-breakpoint
CREATE INDEX "real_estate_job_attempts_job_idx" ON "real_estate_job_attempts" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "real_estate_job_attempts_tenant_idx" ON "real_estate_job_attempts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "real_estate_job_locks_expiry_idx" ON "real_estate_job_locks" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "real_estate_jobs_claim_idx" ON "real_estate_jobs" USING btree ("status","available_at","priority");--> statement-breakpoint
CREATE INDEX "real_estate_jobs_tenant_status_idx" ON "real_estate_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "real_estate_oauth_state_expiry_idx" ON "real_estate_oauth_states" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "real_estate_incident_tenant_idx" ON "real_estate_operational_incidents" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "real_estate_health_provider_idx" ON "real_estate_provider_health_checks" USING btree ("provider","checked_at");--> statement-breakpoint
CREATE INDEX "real_estate_health_tenant_idx" ON "real_estate_provider_health_checks" USING btree ("tenant_id","checked_at");--> statement-breakpoint
CREATE INDEX "real_estate_webhook_status_idx" ON "real_estate_webhook_events" USING btree ("status","received_at");--> statement-breakpoint
CREATE INDEX "real_estate_communications_provider_message_idx" ON "real_estate_communications" USING btree ("provider","provider_message_id");--> statement-breakpoint
ALTER TABLE "real_estate_communications" ADD CONSTRAINT "real_estate_communications_tenant_idempotency_unique" UNIQUE("tenant_id","idempotency_key");
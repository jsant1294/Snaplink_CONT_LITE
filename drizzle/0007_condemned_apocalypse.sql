CREATE TABLE "real_estate_ai_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"request_id" text NOT NULL,
	"result_id" text NOT NULL,
	"feature" text NOT NULL,
	"rating" text NOT NULL,
	"comment" text,
	"actor_membership_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_ai_feedback_actor_unique" UNIQUE("result_id","actor_membership_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_ai_health_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"latency_ms" integer,
	"safe_failure_code" text,
	"safe_failure_message" text
);
--> statement-breakpoint
CREATE TABLE "real_estate_ai_prompt_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"feature" text NOT NULL,
	"prompt_key" text NOT NULL,
	"version" integer NOT NULL,
	"content_hash" text NOT NULL,
	"risk_level" text NOT NULL,
	"requires_review" boolean DEFAULT true NOT NULL,
	"allowed_inputs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_schema_key" text NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone,
	CONSTRAINT "re_ai_prompt_version_unique" UNIQUE("prompt_key","version")
);
--> statement-breakpoint
CREATE TABLE "real_estate_ai_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"requested_by_membership_id" text,
	"portal_user_id" text,
	"feature" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_hash" text NOT NULL,
	"input_hash" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"estimated_input_tokens" integer DEFAULT 0 NOT NULL,
	"actual_input_tokens" integer DEFAULT 0 NOT NULL,
	"actual_output_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_micros" integer DEFAULT 0 NOT NULL,
	"actual_cost_micros" integer DEFAULT 0 NOT NULL,
	"provider_request_id" text,
	"queued_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"safe_error_code" text,
	"safe_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_ai_request_idempotency_unique" UNIQUE("tenant_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_ai_results" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"request_id" text NOT NULL,
	"result_type" text NOT NULL,
	"structured_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rendered_text" text DEFAULT '' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"requires_review" boolean DEFAULT true NOT NULL,
	"source_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_membership_id" text,
	"rejected_at" timestamp with time zone,
	"rejected_by_membership_id" text,
	"rejection_reason" text,
	"applied_at" timestamp with time zone,
	"stale_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_ai_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monthly_tenant_limit" integer DEFAULT 500 NOT NULL,
	"daily_user_limit" integer DEFAULT 25 NOT NULL,
	"human_approval_required" boolean DEFAULT true NOT NULL,
	"retention_days" integer DEFAULT 90 NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_ai_settings_scope_unique" UNIQUE("tenant_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_ai_usage_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"membership_id" text,
	"day" text NOT NULL,
	"feature" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"blocked_count" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_micros" integer DEFAULT 0 NOT NULL,
	"actual_cost_micros" integer DEFAULT 0 NOT NULL,
	"latency_ms_total" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_ai_usage_daily_unique" UNIQUE("tenant_id","membership_id","day","feature","provider","model")
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_extraction_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"extraction_id" text NOT NULL,
	"field_key" text NOT NULL,
	"value" jsonb,
	"confidence" integer NOT NULL,
	"source_page" integer,
	"source_start" integer,
	"source_end" integer,
	"selected_for_apply" boolean DEFAULT false NOT NULL,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_doc_extraction_field_unique" UNIQUE("extraction_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_extractions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"document_id" text NOT NULL,
	"request_id" text NOT NULL,
	"suggested_document_type" text NOT NULL,
	"classification_confidence" integer NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"source_version_id" text,
	"source_hash" text NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_lead_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"request_id" text,
	"score" integer NOT NULL,
	"grade" text NOT NULL,
	"confidence" integer NOT NULL,
	"factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"missing_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_next_action" text,
	"source_hash" text NOT NULL,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"overridden_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "real_estate_ai_feedback" ADD CONSTRAINT "real_estate_ai_feedback_request_id_real_estate_ai_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."real_estate_ai_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_feedback" ADD CONSTRAINT "real_estate_ai_feedback_result_id_real_estate_ai_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."real_estate_ai_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_feedback" ADD CONSTRAINT "real_estate_ai_feedback_actor_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_requests" ADD CONSTRAINT "real_estate_ai_requests_requested_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("requested_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_requests" ADD CONSTRAINT "real_estate_ai_requests_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_requests" ADD CONSTRAINT "real_estate_ai_requests_prompt_version_id_real_estate_ai_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."real_estate_ai_prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_results" ADD CONSTRAINT "real_estate_ai_results_request_id_real_estate_ai_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."real_estate_ai_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_results" ADD CONSTRAINT "real_estate_ai_results_approved_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("approved_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_results" ADD CONSTRAINT "real_estate_ai_results_rejected_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("rejected_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ai_usage_daily" ADD CONSTRAINT "real_estate_ai_usage_daily_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_extraction_fields" ADD CONSTRAINT "real_estate_document_extraction_fields_extraction_id_real_estate_document_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."real_estate_document_extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_extractions" ADD CONSTRAINT "real_estate_document_extractions_document_id_real_estate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_extractions" ADD CONSTRAINT "real_estate_document_extractions_request_id_real_estate_ai_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."real_estate_ai_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_extractions" ADD CONSTRAINT "real_estate_document_extractions_source_version_id_real_estate_document_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."real_estate_document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_extractions" ADD CONSTRAINT "real_estate_document_extractions_approved_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("approved_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_lead_scores" ADD CONSTRAINT "real_estate_lead_scores_lead_id_real_estate_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."real_estate_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_lead_scores" ADD CONSTRAINT "real_estate_lead_scores_request_id_real_estate_ai_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."real_estate_ai_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_lead_scores" ADD CONSTRAINT "real_estate_lead_scores_overridden_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("overridden_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "re_ai_feedback_scope_idx" ON "real_estate_ai_feedback" USING btree ("tenant_id","feature","created_at");--> statement-breakpoint
CREATE INDEX "re_ai_health_provider_idx" ON "real_estate_ai_health_checks" USING btree ("provider","model","checked_at");--> statement-breakpoint
CREATE INDEX "re_ai_prompt_feature_idx" ON "real_estate_ai_prompt_versions" USING btree ("feature","activated_at");--> statement-breakpoint
CREATE INDEX "re_ai_requests_scope_idx" ON "real_estate_ai_requests" USING btree ("tenant_id","organization_id","created_at");--> statement-breakpoint
CREATE INDEX "re_ai_requests_source_idx" ON "real_estate_ai_requests" USING btree ("tenant_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "re_ai_requests_feature_idx" ON "real_estate_ai_requests" USING btree ("tenant_id","feature","created_at");--> statement-breakpoint
CREATE INDEX "re_ai_requests_status_idx" ON "real_estate_ai_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "re_ai_requests_member_idx" ON "real_estate_ai_requests" USING btree ("requested_by_membership_id","created_at");--> statement-breakpoint
CREATE INDEX "re_ai_results_request_idx" ON "real_estate_ai_results" USING btree ("tenant_id","request_id");--> statement-breakpoint
CREATE INDEX "re_ai_results_review_idx" ON "real_estate_ai_results" USING btree ("tenant_id","requires_review","approved_at","rejected_at");--> statement-breakpoint
CREATE INDEX "re_ai_settings_tenant_idx" ON "real_estate_ai_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "re_ai_usage_scope_idx" ON "real_estate_ai_usage_daily" USING btree ("tenant_id","organization_id","day");--> statement-breakpoint
CREATE INDEX "re_ai_usage_member_idx" ON "real_estate_ai_usage_daily" USING btree ("membership_id","day");--> statement-breakpoint
CREATE INDEX "re_doc_extraction_fields_idx" ON "real_estate_document_extraction_fields" USING btree ("tenant_id","extraction_id");--> statement-breakpoint
CREATE INDEX "re_doc_extractions_scope_idx" ON "real_estate_document_extractions" USING btree ("tenant_id","organization_id","document_id","created_at");--> statement-breakpoint
CREATE INDEX "re_doc_extractions_request_idx" ON "real_estate_document_extractions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "re_lead_scores_scope_idx" ON "real_estate_lead_scores" USING btree ("tenant_id","organization_id","lead_id","created_at");--> statement-breakpoint
CREATE INDEX "re_lead_scores_request_idx" ON "real_estate_lead_scores" USING btree ("request_id");
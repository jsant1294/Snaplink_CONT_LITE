CREATE TABLE "real_estate_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_membership_id" text,
	"actor_portal_user_id" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"transaction_id" text,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"user_agent_summary" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_commission_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"transaction_commission_id" text NOT NULL,
	"adjustment_type" text NOT NULL,
	"amount_cents" integer,
	"rate_basis_points" integer,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_commission_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"calculation_type" text NOT NULL,
	"rate_basis_points" integer,
	"flat_amount_cents" integer,
	"broker_split_basis_points" integer,
	"agent_split_basis_points" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_access_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"document_id" text NOT NULL,
	"version_id" text,
	"actor_membership_id" text,
	"actor_portal_user_id" text,
	"action" text NOT NULL,
	"ip_hash" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_access_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"document_id" text NOT NULL,
	"membership_id" text,
	"portal_user_id" text,
	"can_download" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"requested_from_portal_user_id" text NOT NULL,
	"requested_by_membership_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"due_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"fulfilled_document_id" text,
	"client_explanation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_share_events" (
	"id" text PRIMARY KEY NOT NULL,
	"share_link_id" text NOT NULL,
	"action" text NOT NULL,
	"ip_hash" text,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"document_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"password_hash" text,
	"recipient_email_hash" text,
	"expires_at" timestamp with time zone NOT NULL,
	"max_downloads" integer,
	"download_count" integer DEFAULT 0 NOT NULL,
	"one_time" boolean DEFAULT false NOT NULL,
	"download_allowed" boolean DEFAULT true NOT NULL,
	"watermark" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_by_membership_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_document_share_token_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "real_estate_document_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"document_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"blob_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"safe_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"checksum" text NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"uploaded_by_membership_id" text,
	"uploaded_by_portal_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_document_version_unique" UNIQUE("document_id","version_number"),
	CONSTRAINT "re_document_blob_key_unique" UNIQUE("blob_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text,
	"property_id" text,
	"folder_id" text,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending_scan' NOT NULL,
	"visibility" text DEFAULT 'internal' NOT NULL,
	"current_version_id" text,
	"uploaded_by_membership_id" text,
	"uploaded_by_portal_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_escrow_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"escrow_record_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_membership_id" text NOT NULL,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_escrow_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"escrow_company_name" text,
	"escrow_contact_name" text,
	"escrow_contact_email" text,
	"escrow_contact_phone" text,
	"amount_cents" integer,
	"due_date" timestamp with time zone,
	"deposit_date" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"release_date" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference_number" text,
	"receipt_document_id" text,
	"notes" text DEFAULT '' NOT NULL,
	"client_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_inspection_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"inspection_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"severity" text DEFAULT 'normal' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"client_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"inspector_name" text,
	"inspector_company" text,
	"inspector_email" text,
	"inspector_phone" text,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"report_document_id" text,
	"status" text DEFAULT 'not_scheduled' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"client_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_message_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"message_id" text NOT NULL,
	"document_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_message_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"membership_id" text,
	"portal_user_id" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_message_read_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"message_id" text NOT NULL,
	"membership_id" text,
	"portal_user_id" text,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_message_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text,
	"thread_type" text NOT NULL,
	"title" text NOT NULL,
	"client_visible" boolean DEFAULT false NOT NULL,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"sender_membership_id" text,
	"sender_portal_user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_offer_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"offer_price_cents" integer NOT NULL,
	"earnest_money_amount_cents" integer,
	"due_diligence_amount_cents" integer,
	"financing_type" text,
	"financing_amount_cents" integer,
	"down_payment_amount_cents" integer,
	"closing_date" timestamp with time zone,
	"expiration_at" timestamp with time zone,
	"possession_date" timestamp with time zone,
	"contingencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"offer_document_id" text,
	"created_by_membership_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_offer_revision_unique" UNIQUE("offer_id","revision_number")
);
--> statement-breakpoint
CREATE TABLE "real_estate_offer_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"revision_id" text,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_membership_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"property_id" text,
	"offer_number" text NOT NULL,
	"current_revision_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"buyer_id" text,
	"seller_id" text,
	"submitted_by_membership_id" text,
	"received_by_membership_id" text,
	"submitted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_offers_tx_number_unique" UNIQUE("transaction_id","offer_number")
);
--> statement-breakpoint
CREATE TABLE "real_estate_portal_access_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"portal_user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_portal_grant_unique" UNIQUE("portal_user_id","transaction_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_portal_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_membership_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_portal_invite_token_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "real_estate_portal_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"portal_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_portal_session_token_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "real_estate_portal_users" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_portal_user_tenant_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "real_estate_repair_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"inspection_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"estimated_cost_cents" integer,
	"requested_resolution" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"assigned_to" text,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completion_document_id" text,
	"client_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_repair_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"repair_request_id" text NOT NULL,
	"actor_membership_id" text,
	"actor_portal_user_id" text,
	"status" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_transaction_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"membership_id" text,
	"plan_id" text,
	"snapshot" jsonb NOT NULL,
	"gross_commission_cents" integer NOT NULL,
	"brokerage_share_cents" integer NOT NULL,
	"agent_share_cents" integer NOT NULL,
	"estimated_net_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_transaction_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"milestone_type" text NOT NULL,
	"title" text NOT NULL,
	"due_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"client_visible" boolean DEFAULT true NOT NULL,
	"manually_adjusted" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_transaction_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"author_membership_id" text,
	"author_portal_user_id" text,
	"body" text NOT NULL,
	"client_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_transaction_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"role" text NOT NULL,
	"membership_id" text,
	"portal_user_id" text,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"client_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_transaction_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_membership_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_tx_status_idempotency_unique" UNIQUE("transaction_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "real_estate_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"brokerage_id" text NOT NULL,
	"transaction_number" text NOT NULL,
	"transaction_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"property_id" text,
	"lead_id" text,
	"buyer_id" text,
	"seller_id" text,
	"listing_agent_membership_id" text,
	"buyer_agent_membership_id" text,
	"transaction_coordinator_membership_id" text,
	"purchase_price_cents" integer,
	"list_price_cents" integer,
	"earnest_money_amount_cents" integer,
	"due_diligence_amount_cents" integer,
	"financing_amount_cents" integer,
	"down_payment_amount_cents" integer,
	"contract_date" timestamp with time zone,
	"binding_agreement_date" timestamp with time zone,
	"due_diligence_deadline" timestamp with time zone,
	"inspection_deadline" timestamp with time zone,
	"financing_deadline" timestamp with time zone,
	"appraisal_deadline" timestamp with time zone,
	"closing_date" timestamp with time zone,
	"possession_date" timestamp with time zone,
	"closing_attorney_name" text,
	"closing_attorney_email" text,
	"closing_attorney_phone" text,
	"lender_name" text,
	"lender_contact_name" text,
	"lender_email" text,
	"lender_phone" text,
	"title_company_name" text,
	"title_contact_name" text,
	"title_email" text,
	"title_phone" text,
	"escrow_company_name" text,
	"escrow_contact_name" text,
	"escrow_email" text,
	"escrow_phone" text,
	"notes" text DEFAULT '' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"created_by_membership_id" text NOT NULL,
	"updated_by_membership_id" text,
	"closed_by_membership_id" text,
	"cancelled_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "re_transactions_tenant_number_unique" UNIQUE("tenant_id","transaction_number")
);
--> statement-breakpoint
ALTER TABLE "real_estate_commission_adjustments" ADD CONSTRAINT "real_estate_commission_adjustments_transaction_commission_id_real_estate_transaction_commissions_id_fk" FOREIGN KEY ("transaction_commission_id") REFERENCES "public"."real_estate_transaction_commissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_access_events" ADD CONSTRAINT "real_estate_document_access_events_document_id_real_estate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_access_events" ADD CONSTRAINT "real_estate_document_access_events_version_id_real_estate_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."real_estate_document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_access_grants" ADD CONSTRAINT "real_estate_document_access_grants_document_id_real_estate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_access_grants" ADD CONSTRAINT "real_estate_document_access_grants_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_access_grants" ADD CONSTRAINT "real_estate_document_access_grants_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_folders" ADD CONSTRAINT "real_estate_document_folders_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_requests" ADD CONSTRAINT "real_estate_document_requests_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_requests" ADD CONSTRAINT "real_estate_document_requests_requested_from_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("requested_from_portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_requests" ADD CONSTRAINT "real_estate_document_requests_requested_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("requested_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_requests" ADD CONSTRAINT "real_estate_document_requests_fulfilled_document_id_real_estate_documents_id_fk" FOREIGN KEY ("fulfilled_document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_share_events" ADD CONSTRAINT "real_estate_document_share_events_share_link_id_real_estate_document_share_links_id_fk" FOREIGN KEY ("share_link_id") REFERENCES "public"."real_estate_document_share_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_share_links" ADD CONSTRAINT "real_estate_document_share_links_document_id_real_estate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_share_links" ADD CONSTRAINT "real_estate_document_share_links_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_versions" ADD CONSTRAINT "real_estate_document_versions_document_id_real_estate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_versions" ADD CONSTRAINT "real_estate_document_versions_uploaded_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_document_versions" ADD CONSTRAINT "real_estate_document_versions_uploaded_by_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("uploaded_by_portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_documents" ADD CONSTRAINT "real_estate_documents_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_documents" ADD CONSTRAINT "real_estate_documents_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_documents" ADD CONSTRAINT "real_estate_documents_folder_id_real_estate_document_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."real_estate_document_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_documents" ADD CONSTRAINT "real_estate_documents_uploaded_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_documents" ADD CONSTRAINT "real_estate_documents_uploaded_by_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("uploaded_by_portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_escrow_events" ADD CONSTRAINT "real_estate_escrow_events_escrow_record_id_real_estate_escrow_records_id_fk" FOREIGN KEY ("escrow_record_id") REFERENCES "public"."real_estate_escrow_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_escrow_events" ADD CONSTRAINT "real_estate_escrow_events_actor_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_escrow_records" ADD CONSTRAINT "real_estate_escrow_records_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_inspection_items" ADD CONSTRAINT "real_estate_inspection_items_inspection_id_real_estate_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."real_estate_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_inspections" ADD CONSTRAINT "real_estate_inspections_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_attachments" ADD CONSTRAINT "real_estate_message_attachments_message_id_real_estate_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."real_estate_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_attachments" ADD CONSTRAINT "real_estate_message_attachments_document_id_real_estate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."real_estate_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_participants" ADD CONSTRAINT "real_estate_message_participants_thread_id_real_estate_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."real_estate_message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_participants" ADD CONSTRAINT "real_estate_message_participants_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_participants" ADD CONSTRAINT "real_estate_message_participants_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_read_receipts" ADD CONSTRAINT "real_estate_message_read_receipts_message_id_real_estate_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."real_estate_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_read_receipts" ADD CONSTRAINT "real_estate_message_read_receipts_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_read_receipts" ADD CONSTRAINT "real_estate_message_read_receipts_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_threads" ADD CONSTRAINT "real_estate_message_threads_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_message_threads" ADD CONSTRAINT "real_estate_message_threads_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_messages" ADD CONSTRAINT "real_estate_messages_thread_id_real_estate_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."real_estate_message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_messages" ADD CONSTRAINT "real_estate_messages_sender_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("sender_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_messages" ADD CONSTRAINT "real_estate_messages_sender_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("sender_portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offer_revisions" ADD CONSTRAINT "real_estate_offer_revisions_offer_id_real_estate_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."real_estate_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offer_revisions" ADD CONSTRAINT "real_estate_offer_revisions_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offer_status_history" ADD CONSTRAINT "real_estate_offer_status_history_offer_id_real_estate_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."real_estate_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offer_status_history" ADD CONSTRAINT "real_estate_offer_status_history_revision_id_real_estate_offer_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."real_estate_offer_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offer_status_history" ADD CONSTRAINT "real_estate_offer_status_history_actor_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offers" ADD CONSTRAINT "real_estate_offers_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offers" ADD CONSTRAINT "real_estate_offers_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offers" ADD CONSTRAINT "real_estate_offers_buyer_id_real_estate_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."real_estate_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offers" ADD CONSTRAINT "real_estate_offers_seller_id_real_estate_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."real_estate_sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offers" ADD CONSTRAINT "real_estate_offers_submitted_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("submitted_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_offers" ADD CONSTRAINT "real_estate_offers_received_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("received_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_portal_access_grants" ADD CONSTRAINT "real_estate_portal_access_grants_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_portal_access_grants" ADD CONSTRAINT "real_estate_portal_access_grants_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_portal_invitations" ADD CONSTRAINT "real_estate_portal_invitations_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_portal_invitations" ADD CONSTRAINT "real_estate_portal_invitations_invited_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("invited_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_portal_sessions" ADD CONSTRAINT "real_estate_portal_sessions_portal_user_id_real_estate_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."real_estate_portal_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_repair_requests" ADD CONSTRAINT "real_estate_repair_requests_inspection_id_real_estate_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."real_estate_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_repair_updates" ADD CONSTRAINT "real_estate_repair_updates_repair_request_id_real_estate_repair_requests_id_fk" FOREIGN KEY ("repair_request_id") REFERENCES "public"."real_estate_repair_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_repair_updates" ADD CONSTRAINT "real_estate_repair_updates_actor_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_commissions" ADD CONSTRAINT "real_estate_transaction_commissions_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_commissions" ADD CONSTRAINT "real_estate_transaction_commissions_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_commissions" ADD CONSTRAINT "real_estate_transaction_commissions_plan_id_real_estate_commission_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."real_estate_commission_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_milestones" ADD CONSTRAINT "real_estate_transaction_milestones_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_notes" ADD CONSTRAINT "real_estate_transaction_notes_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_notes" ADD CONSTRAINT "real_estate_transaction_notes_author_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("author_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_participants" ADD CONSTRAINT "real_estate_transaction_participants_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_participants" ADD CONSTRAINT "real_estate_transaction_participants_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_status_history" ADD CONSTRAINT "real_estate_transaction_status_history_transaction_id_real_estate_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."real_estate_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transaction_status_history" ADD CONSTRAINT "real_estate_transaction_status_history_actor_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_brokerage_id_real_estate_brokerages_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "public"."real_estate_brokerages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_lead_id_real_estate_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."real_estate_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_buyer_id_real_estate_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."real_estate_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_seller_id_real_estate_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."real_estate_sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_listing_agent_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("listing_agent_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_buyer_agent_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("buyer_agent_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_transaction_coordinator_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("transaction_coordinator_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_updated_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("updated_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_closed_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("closed_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_cancelled_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("cancelled_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "re_audit_scope_idx" ON "real_estate_audit_events" USING btree ("tenant_id","organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "re_audit_resource_idx" ON "real_estate_audit_events" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "re_audit_transaction_idx" ON "real_estate_audit_events" USING btree ("transaction_id","occurred_at");--> statement-breakpoint
CREATE INDEX "re_commission_adjustments_idx" ON "real_estate_commission_adjustments" USING btree ("tenant_id","transaction_commission_id");--> statement-breakpoint
CREATE INDEX "re_commission_plans_scope_idx" ON "real_estate_commission_plans" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE INDEX "re_document_access_idx" ON "real_estate_document_access_events" USING btree ("tenant_id","document_id","occurred_at");--> statement-breakpoint
CREATE INDEX "re_document_grants_idx" ON "real_estate_document_access_grants" USING btree ("tenant_id","document_id","portal_user_id");--> statement-breakpoint
CREATE INDEX "re_doc_folders_scope_idx" ON "real_estate_document_folders" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_document_requests_due_idx" ON "real_estate_document_requests" USING btree ("tenant_id","status","due_at");--> statement-breakpoint
CREATE INDEX "re_document_requests_tx_idx" ON "real_estate_document_requests" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "re_document_share_events_idx" ON "real_estate_document_share_events" USING btree ("share_link_id","created_at");--> statement-breakpoint
CREATE INDEX "re_document_share_expiry_idx" ON "real_estate_document_share_links" USING btree ("expires_at","revoked_at");--> statement-breakpoint
CREATE INDEX "re_document_versions_tenant_idx" ON "real_estate_document_versions" USING btree ("tenant_id","document_id");--> statement-breakpoint
CREATE INDEX "re_documents_scope_idx" ON "real_estate_documents" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_documents_visibility_idx" ON "real_estate_documents" USING btree ("transaction_id","visibility","status");--> statement-breakpoint
CREATE INDEX "re_escrow_events_idx" ON "real_estate_escrow_events" USING btree ("tenant_id","escrow_record_id","created_at");--> statement-breakpoint
CREATE INDEX "re_escrow_scope_idx" ON "real_estate_escrow_records" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_escrow_due_idx" ON "real_estate_escrow_records" USING btree ("tenant_id","status","due_date");--> statement-breakpoint
CREATE INDEX "re_inspection_items_idx" ON "real_estate_inspection_items" USING btree ("tenant_id","inspection_id");--> statement-breakpoint
CREATE INDEX "re_inspections_scope_idx" ON "real_estate_inspections" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_inspections_date_idx" ON "real_estate_inspections" USING btree ("tenant_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "re_message_attachments_idx" ON "real_estate_message_attachments" USING btree ("tenant_id","message_id");--> statement-breakpoint
CREATE INDEX "re_message_participant_thread_idx" ON "real_estate_message_participants" USING btree ("tenant_id","thread_id");--> statement-breakpoint
CREATE INDEX "re_message_participant_portal_idx" ON "real_estate_message_participants" USING btree ("portal_user_id");--> statement-breakpoint
CREATE INDEX "re_message_receipts_idx" ON "real_estate_message_read_receipts" USING btree ("tenant_id","message_id");--> statement-breakpoint
CREATE INDEX "re_message_threads_scope_idx" ON "real_estate_message_threads" USING btree ("tenant_id","organization_id","transaction_id","updated_at");--> statement-breakpoint
CREATE INDEX "re_messages_page_idx" ON "real_estate_messages" USING btree ("tenant_id","thread_id","created_at");--> statement-breakpoint
CREATE INDEX "re_offer_revision_scope_idx" ON "real_estate_offer_revisions" USING btree ("tenant_id","offer_id");--> statement-breakpoint
CREATE INDEX "re_offer_status_idx" ON "real_estate_offer_status_history" USING btree ("tenant_id","offer_id","created_at");--> statement-breakpoint
CREATE INDEX "re_offers_scope_idx" ON "real_estate_offers" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_offers_status_idx" ON "real_estate_offers" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "re_portal_grant_scope_idx" ON "real_estate_portal_access_grants" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_portal_invite_scope_idx" ON "real_estate_portal_invitations" USING btree ("tenant_id","email","expires_at");--> statement-breakpoint
CREATE INDEX "re_portal_invite_tx_idx" ON "real_estate_portal_invitations" USING btree ("tenant_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_portal_session_expiry_idx" ON "real_estate_portal_sessions" USING btree ("portal_user_id","expires_at");--> statement-breakpoint
CREATE INDEX "re_portal_users_tenant_idx" ON "real_estate_portal_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "re_repairs_due_idx" ON "real_estate_repair_requests" USING btree ("tenant_id","status","due_date");--> statement-breakpoint
CREATE INDEX "re_repairs_inspection_idx" ON "real_estate_repair_requests" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "re_repair_updates_idx" ON "real_estate_repair_updates" USING btree ("tenant_id","repair_request_id","created_at");--> statement-breakpoint
CREATE INDEX "re_tx_commission_scope_idx" ON "real_estate_transaction_commissions" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_tx_commission_member_idx" ON "real_estate_transaction_commissions" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "re_milestones_due_idx" ON "real_estate_transaction_milestones" USING btree ("tenant_id","status","due_at");--> statement-breakpoint
CREATE INDEX "re_milestones_tx_idx" ON "real_estate_transaction_milestones" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "re_tx_notes_idx" ON "real_estate_transaction_notes" USING btree ("tenant_id","transaction_id","created_at");--> statement-breakpoint
CREATE INDEX "re_tx_participants_scope_idx" ON "real_estate_transaction_participants" USING btree ("tenant_id","organization_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_tx_status_scope_idx" ON "real_estate_transaction_status_history" USING btree ("tenant_id","transaction_id");--> statement-breakpoint
CREATE INDEX "re_transactions_tenant_org_idx" ON "real_estate_transactions" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE INDEX "re_transactions_status_idx" ON "real_estate_transactions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "re_transactions_property_idx" ON "real_estate_transactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "re_transactions_closing_idx" ON "real_estate_transactions" USING btree ("tenant_id","closing_date");--> statement-breakpoint
CREATE INDEX "re_transactions_agents_idx" ON "real_estate_transactions" USING btree ("listing_agent_membership_id","buyer_agent_membership_id");--> statement-breakpoint
CREATE FUNCTION real_estate_prevent_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'real_estate_audit_events is append-only';
END;
$$;--> statement-breakpoint
CREATE TRIGGER real_estate_audit_events_immutable
BEFORE UPDATE OR DELETE ON real_estate_audit_events
FOR EACH ROW EXECUTE FUNCTION real_estate_prevent_audit_mutation();

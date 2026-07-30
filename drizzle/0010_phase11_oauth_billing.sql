CREATE TABLE "real_estate_billing_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"external_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"amount_due_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_billing_invoice_external_unique" UNIQUE("tenant_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate_billing_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_key" text,
	"name" text NOT NULL,
	"billing_period" text DEFAULT 'monthly' NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"metered_unit" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_billing_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"installation_id" text,
	"status" text DEFAULT 'trialing' NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at" timestamp with time zone,
	"external_customer_reference" text,
	"created_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"canceled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate_billing_usage_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"metered_unit" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_oauth_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"client_id" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "re_oauth_consent_unique" UNIQUE("tenant_id","membership_id","client_id")
);
--> statement-breakpoint
ALTER TABLE "real_estate_billing_invoices" ADD CONSTRAINT "real_estate_billing_invoices_subscription_id_real_estate_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."real_estate_billing_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_billing_plans" ADD CONSTRAINT "real_estate_billing_plans_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_billing_subscriptions" ADD CONSTRAINT "real_estate_billing_subscriptions_plan_id_real_estate_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."real_estate_billing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_billing_subscriptions" ADD CONSTRAINT "real_estate_billing_subscriptions_installation_id_real_estate_integration_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."real_estate_integration_installations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_billing_subscriptions" ADD CONSTRAINT "real_estate_billing_subscriptions_created_by_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_billing_usage_records" ADD CONSTRAINT "real_estate_billing_usage_records_subscription_id_real_estate_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."real_estate_billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_oauth_consents" ADD CONSTRAINT "real_estate_oauth_consents_membership_id_real_estate_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."real_estate_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "re_billing_invoice_sub_idx" ON "real_estate_billing_invoices" USING btree ("tenant_id","subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "re_billing_plan_name_unique" ON "real_estate_billing_plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX "re_billing_sub_tenant_idx" ON "real_estate_billing_subscriptions" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE INDEX "re_billing_sub_status_idx" ON "real_estate_billing_subscriptions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "re_billing_usage_sub_idx" ON "real_estate_billing_usage_records" USING btree ("tenant_id","subscription_id","occurred_at");--> statement-breakpoint
CREATE INDEX "re_oauth_consent_member_idx" ON "real_estate_oauth_consents" USING btree ("tenant_id","membership_id");
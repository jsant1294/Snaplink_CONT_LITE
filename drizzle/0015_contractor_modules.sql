CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"contractor_id" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title_en" text DEFAULT '' NOT NULL,
	"title_es" text DEFAULT '' NOT NULL,
	"body_en" text DEFAULT '' NOT NULL,
	"body_es" text DEFAULT '' NOT NULL,
	"media_url" text,
	"cta_type" text DEFAULT 'phone' NOT NULL,
	"cta_value" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_contractor_slug_unique" UNIQUE("contractor_id","slug")
);
--> statement-breakpoint
CREATE TABLE "flip_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"contractor_id" text NOT NULL,
	"slug" text NOT NULL,
	"public_token" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"share_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "flip_campaigns_contractor_slug_unique" UNIQUE("contractor_id","slug")
);
--> statement-breakpoint
CREATE TABLE "flip_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"page_type" text DEFAULT 'image' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"media_url" text,
	"cta_type" text,
	"cta_label" text,
	"cta_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"contractor_id" text NOT NULL,
	"lead_id" text,
	"public_token" text NOT NULL,
	"provider_invoice_id" text,
	"hosted_invoice_url" text,
	"invoice_pdf_url" text,
	"client_name" text DEFAULT '' NOT NULL,
	"client_email" text DEFAULT '' NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_customer_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"contractor_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"stripe_customer_id" text,
	"client_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_customer_mappings_account_email_unique" UNIQUE("stripe_account_id","client_email")
);
--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "stripe_onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "flip_pages" ADD CONSTRAINT "flip_pages_campaign_id_flip_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."flip_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_contractor_idx" ON "campaigns" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "flip_campaigns_contractor_idx" ON "flip_campaigns" USING btree ("contractor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flip_campaigns_token_idx" ON "flip_campaigns" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "flip_pages_campaign_idx" ON "flip_pages" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "flip_pages_sort_idx" ON "flip_pages" USING btree ("campaign_id","sort_order");--> statement-breakpoint
CREATE INDEX "invoices_contractor_idx" ON "invoices" USING btree ("contractor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_token_idx" ON "invoices" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "invoices_provider_invoice_idx" ON "invoices" USING btree ("provider_invoice_id");--> statement-breakpoint
CREATE INDEX "stripe_customer_mappings_contractor_idx" ON "stripe_customer_mappings" USING btree ("contractor_id");
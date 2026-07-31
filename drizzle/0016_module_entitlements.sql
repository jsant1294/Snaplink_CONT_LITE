CREATE TABLE "professional_module_entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"professional_source" text DEFAULT 'contractor' NOT NULL,
	"professional_id" text NOT NULL,
	"module_key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"enabled_by" text,
	"enabled_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "professional_module_entitlements_unique" ON "professional_module_entitlements" USING btree ("professional_source","professional_id","module_key");--> statement-breakpoint
CREATE INDEX "professional_module_entitlements_professional_idx" ON "professional_module_entitlements" USING btree ("professional_source","professional_id");
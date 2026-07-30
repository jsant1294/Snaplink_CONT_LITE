CREATE TABLE "real_estate_properties" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"brokerage_id" text NOT NULL,
	"listing_agent_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"property_type" text NOT NULL,
	"property_status" text DEFAULT 'draft' NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"bedrooms" real DEFAULT 0 NOT NULL,
	"bathrooms" real DEFAULT 0 NOT NULL,
	"square_feet" integer DEFAULT 0 NOT NULL,
	"lot_size" text,
	"year_built" integer,
	"short_description" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hero_image" text,
	"published_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "real_estate_properties_tenant_slug_unique" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "real_estate_property_media" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"url" text NOT NULL,
	"filename" text DEFAULT 'property-image.jpg' NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_hero" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "real_estate_property_media" ADD CONSTRAINT "real_estate_property_media_property_id_real_estate_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "real_estate_properties_tenant_idx" ON "real_estate_properties" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "real_estate_properties_org_idx" ON "real_estate_properties" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "real_estate_properties_brokerage_idx" ON "real_estate_properties" USING btree ("brokerage_id");
--> statement-breakpoint
CREATE INDEX "real_estate_properties_agent_idx" ON "real_estate_properties" USING btree ("listing_agent_id");
--> statement-breakpoint
CREATE INDEX "real_estate_properties_published_idx" ON "real_estate_properties" USING btree ("is_published");
--> statement-breakpoint
CREATE INDEX "real_estate_properties_status_idx" ON "real_estate_properties" USING btree ("property_status");
--> statement-breakpoint
CREATE INDEX "real_estate_properties_deleted_idx" ON "real_estate_properties" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "real_estate_property_media_property_idx" ON "real_estate_property_media" USING btree ("property_id");
--> statement-breakpoint
CREATE INDEX "real_estate_property_media_tenant_idx" ON "real_estate_property_media" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "real_estate_property_media_sort_idx" ON "real_estate_property_media" USING btree ("property_id","sort_order");
--> statement-breakpoint
CREATE INDEX "real_estate_property_media_deleted_idx" ON "real_estate_property_media" USING btree ("deleted_at");

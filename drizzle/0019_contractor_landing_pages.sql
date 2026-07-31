CREATE TABLE "contractor_landing_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"contractor_id" text NOT NULL,
	"template_key" text,
	"published" boolean DEFAULT false NOT NULL,
	"headline_en" text,
	"headline_es" text,
	"subheadline_en" text,
	"subheadline_es" text,
	"cta_label_en" text,
	"cta_label_es" text,
	"cta_url" text,
	"location_text" text,
	"hours_text" text,
	"note_text" text,
	"hero_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contractor_landing_pages_contractor_idx" ON "contractor_landing_pages" USING btree ("contractor_id");
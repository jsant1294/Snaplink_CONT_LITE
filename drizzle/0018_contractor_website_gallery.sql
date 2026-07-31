ALTER TABLE "contractors" ADD COLUMN "gallery_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "website" text;
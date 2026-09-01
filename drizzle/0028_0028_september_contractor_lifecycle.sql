ALTER TABLE "contractors" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
-- Backfill: existing non-demo contractors keep today's "exists = publicly visible"
-- behavior. Demo contractors stay 'draft' so they are never publicly eligible.
-- New contractors default to 'draft' (hidden) until an operator publishes them.
UPDATE "contractors" SET "status" = 'published' WHERE "status" = 'draft' AND "is_demo" = false;
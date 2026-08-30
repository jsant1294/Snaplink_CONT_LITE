ALTER TABLE "contractors" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
-- Backfill: existing contractors keep today's "exists = publicly visible" behavior.
-- New contractors default to 'draft' (hidden) until an operator publishes them.
UPDATE "contractors" SET "status" = 'published' WHERE "status" = 'draft';
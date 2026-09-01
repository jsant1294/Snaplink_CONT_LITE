ALTER TABLE "agent_profiles" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Mark the known public demo contractor so the lifecycle backfill below never
-- promotes it to published and it stays excluded from public discovery.
UPDATE "contractors" SET "is_demo" = true WHERE "username" = 'ridgeline-demo';
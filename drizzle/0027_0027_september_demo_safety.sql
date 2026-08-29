ALTER TABLE "agent_profiles" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;
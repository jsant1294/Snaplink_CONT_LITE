CREATE TABLE "professional_intake_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"flagged_question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "professional_intake_sessions_owner_idx" ON "professional_intake_sessions" USING btree ("owner_type","owner_id");
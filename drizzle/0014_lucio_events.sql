CREATE TABLE "lucio_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"session_id" text,
	"page_type" text,
	"page_ref" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lucio_events_type_idx" ON "lucio_events" USING btree ("event_type","created_at");
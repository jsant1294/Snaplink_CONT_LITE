CREATE TABLE "zip_centroids" (
	"zip" text PRIMARY KEY NOT NULL,
	"city" text,
	"state" text,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6)
);
--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "service_zip" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "service_zip" text;--> statement-breakpoint
ALTER TABLE "contractors" ADD COLUMN "service_radius_miles" real;--> statement-breakpoint
CREATE INDEX "zip_centroids_state_idx" ON "zip_centroids" USING btree ("state");
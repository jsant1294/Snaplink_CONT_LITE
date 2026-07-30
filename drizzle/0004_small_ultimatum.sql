CREATE TABLE "real_estate_appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_agent_id" text,
	"lead_id" text,
	"appointment_type" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "real_estate_appointments" ADD CONSTRAINT "real_estate_appointments_assigned_agent_id_real_estate_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."real_estate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_appointments" ADD CONSTRAINT "real_estate_appointments_lead_id_real_estate_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."real_estate_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "real_estate_appointments_tenant_date_idx" ON "real_estate_appointments" USING btree ("tenant_id","starts_at");--> statement-breakpoint
CREATE INDEX "real_estate_appointments_agent_idx" ON "real_estate_appointments" USING btree ("assigned_agent_id");
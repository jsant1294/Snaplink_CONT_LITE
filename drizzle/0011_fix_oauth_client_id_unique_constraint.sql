DROP INDEX "re_oauth_clients_client_idx";--> statement-breakpoint
ALTER TABLE "real_estate_oauth_clients" ADD CONSTRAINT "re_oauth_clients_client_idx" UNIQUE("client_id");
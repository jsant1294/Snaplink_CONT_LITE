// ---------------------------------------------------------------------------
// Anonymous, no-auth-required lead-routing analytics for Snaplink Profiles —
// mirrors the pattern already used for real_estate_qr_scans (public event
// writes, no membership/tenant auth). Postgres-only: local JSON-mode demos
// skip analytics persistence rather than inventing a JSON-file event log.
// ---------------------------------------------------------------------------
import "server-only";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { agentProfileEvents } from "../db/schema";
import { databaseUrl, sslConfig, usePg } from "../db-url";

export const EVENT_TYPES = ["view", "contact_click", "phone_click", "email_click", "booking_start", "booking_complete", "lead_submitted"] as const;
export type AgentProfileEventType = typeof EVENT_TYPES[number];

let _db: NodePgDatabase | null = null;
function db(): NodePgDatabase {
  if (!_db) _db = drizzle(new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 }));
  return _db;
}

export async function recordAgentProfileEvent(
  agentProfileId: string,
  eventType: AgentProfileEventType,
  input: { anonymousSessionId?: string; referrer?: string }
): Promise<void> {
  if (!usePg) return;
  const id = `apxevt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await db().insert(agentProfileEvents).values({
    id,
    agentProfileId,
    eventType,
    anonymousSessionId: input.anonymousSessionId,
    referrer: input.referrer,
  });
}

export async function agentProfileEventCounts(agentProfileId: string): Promise<Record<string, number>> {
  if (!usePg) return {};
  const { eq } = await import("drizzle-orm");
  const rows = await db().select().from(agentProfileEvents).where(eq(agentProfileEvents.agentProfileId, agentProfileId));
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.eventType] = (counts[row.eventType] ?? 0) + 1;
  return counts;
}

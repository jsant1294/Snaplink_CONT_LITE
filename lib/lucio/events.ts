// ---------------------------------------------------------------------------
// Anonymous, no-auth-required analytics for Lucio — mirrors the exact pattern
// used for agent_profile_events (public event writes, no membership/tenant
// auth). Postgres-only: local JSON-mode demos skip analytics persistence
// rather than inventing a JSON-file event log. No chat transcripts are
// persisted anywhere — only these event types.
// ---------------------------------------------------------------------------
import "server-only";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { lucioEvents } from "../db/schema";
import { databaseUrl, sslConfig, usePg } from "../db-url";

export const LUCIO_EVENT_TYPES = [
  "widget_opened",
  "flow_selected",
  "search_performed",
  "professional_viewed",
  "listing_viewed",
  "estimate_started",
  "lead_started",
  "lead_submitted",
  "booking_started",
  "booking_completed",
  "unanswered_question",
  "escalation_requested",
] as const;
export type LucioEventType = typeof LUCIO_EVENT_TYPES[number];

let _db: NodePgDatabase | null = null;
function db(): NodePgDatabase {
  if (!_db) _db = drizzle(new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 }));
  return _db;
}

export async function recordLucioEvent(
  eventType: LucioEventType,
  input: { sessionId?: string; pageType?: string; pageRef?: string; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  if (!usePg) return;
  const id = `lucevt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await db().insert(lucioEvents).values({
    id,
    eventType,
    sessionId: input.sessionId,
    pageType: input.pageType,
    pageRef: input.pageRef,
    metadata: input.metadata ?? {},
  });
}

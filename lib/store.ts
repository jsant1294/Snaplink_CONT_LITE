// ---------------------------------------------------------------------------
// Store driver switch.
// - DATABASE_URL set  → Postgres via Drizzle (Neon-ready). PRODUCTION MODE.
// - DATABASE_URL unset → file-based JSON in .data/. Local demos only; never
//   deploy this mode to serverless (ephemeral filesystem = data loss).
// API routes import from here and never know which backend is live.
// ---------------------------------------------------------------------------

import {
  jsonLeadStore,
  jsonContractorStore,
  jsonEstimateStore,
} from "./store-json";
import { pgLeadStore, pgContractorStore, pgEstimateStore } from "./store-pg";

const usePg = Boolean(process.env.DATABASE_URL);

export const leadStore = usePg ? pgLeadStore : jsonLeadStore;
export const contractorStore = usePg ? pgContractorStore : jsonContractorStore;
export const estimateStore = usePg ? pgEstimateStore : jsonEstimateStore;

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

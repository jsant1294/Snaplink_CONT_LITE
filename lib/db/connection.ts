// ---------------------------------------------------------------------------
// Database provider seam.
//
// All Postgres-backed stores create their Drizzle handle here instead of
// hand-rolling their own Pool. The driver is always node-postgres (the
// standard PG wire-protocol driver) — which is exactly the path this app has
// always used for Neon. The only thing that varies by provider is the TLS
// option, decided in lib/db/provider.ts from the DATABASE_URL hostname.
//
//   - *.neon.tech                -> TLS enabled (unchanged production path)
//   - localhost / LAN / standard -> TLS disabled
//
// Stores and repositories import `db` from here and never know which provider
// is underneath.
// ---------------------------------------------------------------------------

import { Pool, type PoolConfig } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { databaseUrl, usePg } from "../db-url";
import { sslConfigFor } from "./provider";

let _db: NodePgDatabase | null = null;

/**
 * Build a node-postgres Pool for a connection string. TLS is decided from the
 * hostname; `overrides` lets callers tune pool options (e.g. max).
 */
export function createPool(url: string = databaseUrl, overrides: Partial<PoolConfig> = {}): Pool {
  return new Pool({
    connectionString: url,
    ssl: sslConfigFor(url),
    max: 5,
    ...overrides,
  });
}

/** Memoized Drizzle handle over a shared Pool. */
export function db(): NodePgDatabase {
  if (!_db) {
    if (!usePg) throw new Error("DATABASE_URL (or POSTGRES_URL) is required to open a Postgres connection");
    _db = drizzle(createPool());
  }
  return _db;
}

export type { NodePgDatabase };

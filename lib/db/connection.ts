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
 *
 * Pool settings are set DELIBERATELY to contain Neon compute usage. They are
 * explicit here because the values (and pg 8.22 defaults we override) matter
 * for how long a connection holds a database endpoint awake:
 *
 *   option                  pg 8.22 default  here      why
 *   ----------------------  --------------  -------   ---------------------
 *   max                     10              5         keep concurrent live
 *                                                     connections low (Neon
 *                                                     compute is billed on
 *                                                     active time)
 *   idleTimeoutMillis       10000           5000      close idle connections
 *                                                     sooner so an idle pooled
 *                                                     connection doesn't keep
 *                                                     the compute awake
 *   connectionTimeoutMillis undefined(0)    5000      fail fast instead of
 *                                                     hanging on a dead host
 *   allowExitOnIdle         false           true      let the process exit
 *                                                     when all connections are
 *                                                     idle (scripts / dev
 *                                                     teardown, serverless)
 *
 * These only tighten behavior already provided by pg; they do not change the
 * database driver (still standard PG protocol via node-postgres).
 */
export function createPool(url: string = databaseUrl, overrides: Partial<PoolConfig> = {}): Pool {
  return new Pool({
    connectionString: url,
    ssl: sslConfigFor(url),
    // Deliberate compute-containment settings (documented above).
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
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

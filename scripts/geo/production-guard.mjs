// ---------------------------------------------------------------------------
// Production import gate for the ZIP-centroid loader.
//
// TRUE GEO v1 deliberately refuses production imports unless the operator
// confirms TWICE — an environment kill-switch AND an explicit CLI flag:
//
//   ALLOW_PRODUCTION_DB=yes \
//     node scripts/geo/import-zip-centroids.mjs \
//       --file /tmp/zip-centroids.csv \
//       --confirm-production-import
//
// Shared by the import script and its tests so the truth table is asserted in
// one place. Kept pure — no I/O, no process reads — so tests run without any
// database or network.
// ---------------------------------------------------------------------------
import { isProductionDatabaseUrl } from "../../lib/local-db-guard.ts";

export const PRODUCTION_CONFIRM_FLAG = "--confirm-production-import";
export const PRODUCTION_ENV_VAR = "ALLOW_PRODUCTION_DB";

/**
 * Resolve whether a local import run may target the URL in `databaseUrl`.
 *
 * @param {string} databaseUrl      the DATABASE_URL the import would use
 * @param {object} opts
 * @param {string|undefined} opts.allowProductionDb  value of ALLOW_PRODUCTION_DB
 * @param {boolean} opts.confirmProductionImport      --confirm-production-import present
 * @returns {{ allowed: boolean, production: boolean, missing: string[] }}
 */
export function resolveProductionImportGate(databaseUrl, { allowProductionDb, confirmProductionImport }) {
  const production = isProductionDatabaseUrl(String(databaseUrl ?? ""));
  if (!production) return { allowed: true, production: false, missing: [] };
  const envOk = allowProductionDb === "yes";
  const cliOk = confirmProductionImport === true;
  if (envOk && cliOk) return { allowed: true, production: true, missing: [] };
  const missing = [];
  if (!envOk) missing.push(`${PRODUCTION_ENV_VAR}=yes`);
  if (!cliOk) missing.push(PRODUCTION_CONFIRM_FLAG);
  return { allowed: false, production: true, missing };
}

/**
 * Host-only fingerprint of a connection string. Never includes credentials.
 * Returns "(unset)" or "(unparseable)" when the URL is absent or invalid.
 */
export function safeHost(databaseUrl) {
  if (!databaseUrl) return "(unset)";
  try {
    return new URL(databaseUrl).hostname || "(no hostname)";
  } catch {
    return "(unparseable)";
  }
}
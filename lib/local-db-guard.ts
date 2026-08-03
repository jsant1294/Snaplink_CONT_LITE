// ---------------------------------------------------------------------------
// Fail-closed guard against accidentally running local dev tooling — schema
// pushes, seeds, and the real-estate staging load test — against production.
//
// Scoped to LOCAL TOOLING ONLY. Never import this from runtime app code
// (lib/db-url.ts, lib/store*.ts, API routes, etc.). The deployed app on
// Vercel must keep using its real production DATABASE_URL untouched — this
// guard only protects scripts a human runs from their own machine.
//
// Production access requires an explicit, deliberate override:
//   ALLOW_PRODUCTION_DB=yes npm run db:push
// ---------------------------------------------------------------------------

const PRODUCTION_DB_HOSTNAME_FRAGMENT = "ep-red-recipe-atgps8a1";
const PRODUCTION_URL_HOSTNAME_FRAGMENT = "southlineone.com";
const OVERRIDE_ENV_VAR = "ALLOW_PRODUCTION_DB";

function overrideGranted(): boolean {
  return process.env[OVERRIDE_ENV_VAR] === "yes";
}

/** True when a Postgres connection string points at the production Neon host. */
export function isProductionDatabaseUrl(connectionString: string): boolean {
  return connectionString.includes(PRODUCTION_DB_HOSTNAME_FRAGMENT);
}

/** True when a URL points at a production southlineone.com deployment. */
export function isProductionAppUrl(url: string): boolean {
  return url.includes(PRODUCTION_URL_HOSTNAME_FRAGMENT);
}

/**
 * Throws unless ALLOW_PRODUCTION_DB=yes is explicitly set. Call this before
 * any local migration, seed, or schema-push script opens a connection.
 */
export function assertNotProductionDatabase(connectionString: string, context: string): void {
  if (!isProductionDatabaseUrl(connectionString)) return;
  if (overrideGranted()) {
    console.warn(`[local-db-guard] ${OVERRIDE_ENV_VAR}=yes — proceeding against PRODUCTION for: ${context}`);
    return;
  }
  throw new Error(
    `[local-db-guard] Refusing to run "${context}" against the production database ` +
      `(host contains "${PRODUCTION_DB_HOSTNAME_FRAGMENT}").\n` +
      `This is local-only tooling. If you really need to target production, set ` +
      `${OVERRIDE_ENV_VAR}=yes explicitly and re-run.`
  );
}

/**
 * Throws unless ALLOW_PRODUCTION_DB=yes is explicitly set. Call this before
 * a load test (or any other local script that makes live HTTP requests)
 * targets a base URL.
 */
export function assertNotProductionAppUrl(url: string, context: string): void {
  if (!isProductionAppUrl(url)) return;
  if (overrideGranted()) {
    console.warn(`[local-db-guard] ${OVERRIDE_ENV_VAR}=yes — proceeding against PRODUCTION for: ${context}`);
    return;
  }
  throw new Error(
    `[local-db-guard] Refusing to run "${context}" against a production URL ` +
      `(host contains "${PRODUCTION_URL_HOSTNAME_FRAGMENT}").\n` +
      `If you really need to target production, set ${OVERRIDE_ENV_VAR}=yes explicitly and re-run.`
  );
}

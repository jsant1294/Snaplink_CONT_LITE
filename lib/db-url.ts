// ---------------------------------------------------------------------------
// Single source of truth for the database connection string.
//
// Accepts DATABASE_URL or POSTGRES_URL. Neon's Vercel integration provisions
// POSTGRES_URL; the rest of this codebase was written against DATABASE_URL.
// Reading both means a correct Vercel/Neon setup works without renaming vars.
//
// PRODUCTION GUARD: with no connection string, lib/store.ts falls back to
// JSON files in .data/. On serverless that filesystem is ephemeral — writes
// look fine and then vanish on the next cold start. Silent data loss is worse
// than a failed boot, so production refuses to start instead.
// ---------------------------------------------------------------------------

const raw =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  "";

/** Resolved Postgres connection string; empty string when unset. */
export const databaseUrl = raw;

/** True when a Postgres backend is configured. */
export const usePg = Boolean(raw);

/** Local Postgres doesn't speak SSL; hosted providers require it. */
export const sslConfig = /localhost|127\.0\.0\.1/.test(raw)
  ? undefined
  : { rejectUnauthorized: false };

// `next build` imports route modules for analysis with NODE_ENV=production but
// without necessarily having runtime secrets. Don't fail the build over it.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!usePg && process.env.NODE_ENV === "production" && !isBuildPhase) {
  throw new Error(
    "FATAL: no DATABASE_URL (or POSTGRES_URL) set in production.\n" +
      "Refusing to start. Without it the app silently falls back to JSON files " +
      "in .data/, which on a serverless filesystem means every record written " +
      "is lost on the next cold start.\n" +
      "Fix: set DATABASE_URL in your hosting environment and redeploy."
  );
}

if (!usePg && process.env.NODE_ENV !== "production") {
  console.warn(
    "[store] No DATABASE_URL — using JSON files in .data/. Local demos only."
  );
}

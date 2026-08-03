// ---------------------------------------------------------------------------
// Fail-closed guard for local `next dev` / `next build` startup.
//
// Runs as "predev"/"prebuild" (package.json). Refuses to start if the
// resolved DATABASE_URL points at the production Neon host.
//
// Vercel runtime is never affected: Vercel sets VERCEL=1 in every build and
// runtime environment, and this guard no-ops immediately when that's set —
// even though Vercel's own build step also invokes `npm run build` (and
// therefore this "prebuild" hook), it does so against real env vars it
// injects itself, not these local files, and must never be blocked here.
// ---------------------------------------------------------------------------
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { assertNotProductionDatabase } from "../lib/local-db-guard.ts";

if (process.env.VERCEL) {
  process.exit(0);
}

const url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (url) {
  assertNotProductionDatabase(url, "local startup (npm run dev / npm run build)");
}

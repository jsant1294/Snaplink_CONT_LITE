// Documented single source for local Drizzle commands (push/generate/migrate/
// studio): `.env`, explicitly and exclusively. This used to be a bare
// `import "dotenv/config"`, which loads `.env` by dotenv's own default
// behavior — but that default was never actually chosen on purpose, so it
// silently shadowed `.env.local` for anyone who assumed the opposite. Making
// the load explicit removes that ambiguity. `.env` intentionally holds the
// direct/unpooled connection string (see its own header comment) — drizzle-kit's
// schema introspection is unreliable over a pooled (PgBouncer-style) endpoint.
import { config } from "dotenv";
config({ path: ".env" });

import { defineConfig } from "drizzle-kit";
import { assertNotProductionDatabase } from "./lib/local-db-guard";

const url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
assertNotProductionDatabase(url, "drizzle-kit");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});

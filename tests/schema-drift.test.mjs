import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

const REQUIRED_AGENT_PROFILE_COLUMNS = [
  "id",
  "slug",
  "username",
  "status",
  "pin",
  "name",
  "first_name",
  "last_name",
  "display_name",
  "profession_type",
  "brokerage_name",
  "office_name",
  "team_name",
  "license_number",
  "license_state",
  "phone",
  "email",
  "service_area",
  "bio",
  "tagline",
  "photo_url",
  "cover_photo_url",
  "preferred_language",
  "sms_phone",
  "whatsapp",
  "website",
  "booking_link",
  "facebook",
  "instagram",
  "linkedin",
  "languages",
  "specialties",
  "service_areas",
  "categories",
  "neighborhoods",
  "service_radius",
  "years_experience",
  "featured",
  "snaplink_status",
  "southline_status",
  "onboarding_status",
  "seo_title",
  "seo_description",
  "marketplace_summary",
  "modules",
  "tier",
  "billing_tenant_id",
  "billing_organization_id",
  "billing_subscription_id",
  "created_at",
  "updated_at",
];

test("agent_profiles in lib/db/schema.ts keeps every runtime-critical column", async () => {
  const schema = await source("../lib/db/schema.ts");
  const match = schema.match(/pgTable\("agent_profiles",\{(.*?)\},t=>/);
  assert.ok(match, "agent_profiles table definition not found");
  const body = match[1];
  const missing = REQUIRED_AGENT_PROFILE_COLUMNS.filter(
    (col) => !new RegExp(`\\("${col}"`).test(body)
  );
  assert.deepEqual(
    missing,
    [],
    "agent_profiles is missing columns the runtime reads — a dropped column here silently 500s every agent-profiles store query"
  );
});

dotenvConfig({ path: fileURLToPath(new URL("../.env.local", import.meta.url)) });
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

test(
  "live DB has every schema.ts table and column (read-only drift check)",
  { skip: !url ? "DATABASE_URL is not configured" : false },
  async () => {
    const schema = await import("../lib/db/schema.ts");
    const nameSym = Symbol.for("drizzle:Name");
    const colsSym = Symbol.for("drizzle:Columns");
    const expected = {};
    for (const value of Object.values(schema)) {
      if (value && typeof value === "object" && value[nameSym]) {
        const cols = value[colsSym] ?? {};
        expected[value[nameSym]] = Object.values(cols)
          .map((c) => c?.name)
          .filter(Boolean);
      }
    }
    assert.ok(Object.keys(expected).length > 0, "no drizzle tables discovered from schema.ts");

    const { default: pg } = await import("pg");
    const pool = new pg.Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    try {
      const tables = await pool.query(
        "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'"
      );
      const haveTables = new Set(tables.rows.map((r) => r.table_name));
      const missingTables = Object.keys(expected).filter((t) => !haveTables.has(t));
      assert.deepEqual(missingTables, [], "tables in lib/db/schema.ts missing from the live DB");

      for (const tableName of Object.keys(expected)) {
        if (!haveTables.has(tableName)) continue;
        const cols = await pool.query(
          "select column_name from information_schema.columns where table_schema='public' and table_name=$1",
          [tableName]
        );
        const have = new Set(cols.rows.map((r) => r.column_name));
        const missingCols = expected[tableName].filter((c) => !have.has(c));
        assert.deepEqual(
          missingCols,
          [],
          `table "${tableName}" is missing columns in the live DB (run the additive ALTERs before deploying)`
        );
      }
    } finally {
      await pool.end();
    }
  }
);

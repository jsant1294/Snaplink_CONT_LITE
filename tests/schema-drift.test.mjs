import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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

test("0027 explicitly marks the known public demo contractor (ridgeline-demo) is_demo=true", async () => {
  const sql = await source("../drizzle/0027_0027_september_demo_safety.sql");
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL/);
  assert.match(
    sql,
    /UPDATE "contractors" SET "is_demo" = true WHERE "username" = 'ridgeline-demo'/,
    "0027 must deterministically mark ridgeline-demo is_demo=true so the lifecycle backfill can never publish it"
  );
  assert.doesNotMatch(sql, /LIKE '%demo%'/, "0027 must not rely on broad demo matching");
});

test("0028 legacy publish backfill excludes demo rows; real legacy rows become published", async () => {
  const sql = await source("../drizzle/0028_0028_september_contractor_lifecycle.sql");
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL/);
  assert.match(
    sql,
    /UPDATE "contractors" SET "status" = 'published' WHERE "status" = 'draft' AND "is_demo" = false/,
    "0028 backfill must set published only for non-demo contractors"
  );
});

test("migration safety: demo stays draft and hidden while real legacy rows go published", async () => {
  const { isPublicContractor } = await import("../lib/southline-search.ts");
  const jj = { isDemo: false, status: "published" };
  const southline = { isDemo: false, status: "published" };
  const ridgelineDemo = { isDemo: true, status: "draft" };
  assert.equal(isPublicContractor(jj), true);
  assert.equal(isPublicContractor(southline), true);
  assert.equal(isPublicContractor(ridgelineDemo), false, "demo row must never be publicly eligible");
});

test("0029 remains additive-only (zip_centroids + service_zip/radius; no destructive statements)", async () => {
  const sql = await source("../drizzle/0029_true_geo_v1.sql");
  assert.match(sql, /CREATE TABLE "zip_centroids"/);
  assert.match(sql, /ALTER TABLE "agent_profiles" ADD COLUMN "service_zip"/);
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "service_zip"/);
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "service_radius_miles"/);
  assert.doesNotMatch(sql, /\bDROP\b/i, "0029 must not drop anything");
  assert.doesNotMatch(sql, /ALTER TABLE[^;]*\bDROP COLUMN\b/i, "0029 must not drop columns");
});

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

// The live schema-drift check is intentionally isolated from the everyday dev
// Neon project. It runs ONLY against an explicitly-provided scratch/test
// database variable (SCHEMA_TEST_DATABASE_URL) so a plain `npm test` / CI run
// never unexpectedly wakes the primary dev Neon project. When the variable is
// absent the live check skips cleanly; the static source check above always
// runs, so coverage is not silently lost.
const url = process.env.SCHEMA_TEST_DATABASE_URL || "";

// Refuse to run against a DATABASE_URL/POSTGRES_URL the environment would
// otherwise use for the app's everyday work — the drift check must never
// target the primary dev/prod Neon endpoint by accident.
const everydayUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const sameAsEveryday =
  everydayUrl && everydayUrl.replace(/\/[^/]*$/, "") === url.replace(/\/[^/]*$/, "");

test(
  "live DB has every schema.ts table and column (read-only drift check)",
  {
    skip: !url
      ? "SCHEMA_TEST_DATABASE_URL is not configured — live drift check skipped (set it to a dedicated scratch DB to run)"
      : sameAsEveryday
        ? "SCHEMA_TEST_DATABASE_URL must not point at the everyday DATABASE_URL/POSTGRES_URL; set it to a dedicated scratch DB"
        : false,
  },
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

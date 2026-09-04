// ---------------------------------------------------------------------------
// One-off migration: move the two confirmed base64-in-Postgres CMS images
// (found during the 2026-09 Neon egress audit) to Vercel Blob.
//
//   - southline_settings.data.heroImage.{desktopUrl,mobileUrl}  (~2.7 MB)
//   - contractor_landing_pages.hero_image_url                   (~3.7 MB, one row)
//
// Usage (run from the repo root, with PRODUCTION credentials in the env):
//
//   DATABASE_URL=<prod> BLOB_READ_WRITE_TOKEN=<prod> ALLOW_PRODUCTION_DB=yes \
//     node scripts/migrate-cms-images-to-blob.mjs
//
//   # review the printed byte sizes / mime types, then actually write:
//   DATABASE_URL=<prod> BLOB_READ_WRITE_TOKEN=<prod> ALLOW_PRODUCTION_DB=yes \
//     CONFIRM=MIGRATE node scripts/migrate-cms-images-to-blob.mjs --execute
//
// Safety:
//   - Refuses a production DATABASE_URL unless ALLOW_PRODUCTION_DB=yes
//     (lib/local-db-guard.ts — same guard used by db:push/db:seed).
//   - Defaults to a dry run: only prints byte lengths + mime types, writes
//     nothing. --execute is required to write, and --execute additionally
//     requires CONFIRM=MIGRATE so a copied command can't run for real by
//     accident.
//   - Creates a full-row backup table (CREATE TABLE ... AS SELECT) for every
//     row it's about to touch, before any UPDATE.
//   - Idempotent: only touches fields that currently start with "data:" —
//     a second run against an already-migrated row is a no-op.
//   - Never logs the image bytes themselves, only lengths/mime types/the
//     resulting Blob URLs (URLs aren't sensitive payload).
//
// Rollback (per table, after confirming the live migration is bad):
//   UPDATE southline_settings s
//     SET data = jsonb_set(s.data, '{heroImage}', b.data->'heroImage')
//     FROM southline_settings_backup_pre_blob_migration b
//     WHERE s.id = b.id;
//   UPDATE contractor_landing_pages l
//     SET hero_image_url = b.hero_image_url
//     FROM contractor_landing_pages_backup_pre_blob_migration b
//     WHERE l.id = b.id;
// ---------------------------------------------------------------------------

import { config } from "dotenv";
config({ path: ".env" });
import pg from "pg";
import { put } from "@vercel/blob";
import { assertNotProductionDatabase, isProductionDatabaseUrl } from "../lib/local-db-guard.ts";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set.");
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("No BLOB_READ_WRITE_TOKEN set — required to upload images to Vercel Blob.");
  process.exit(1);
}
assertNotProductionDatabase(DB_URL, "scripts/migrate-cms-images-to-blob.mjs");

const EXECUTE = process.argv.includes("--execute");
if (EXECUTE && process.env.CONFIRM !== "MIGRATE") {
  console.error("Refusing to execute: set CONFIRM=MIGRATE alongside --execute to actually write.");
  process.exit(1);
}

console.log(`Target: ${isProductionDatabaseUrl(DB_URL) ? "PRODUCTION" : "non-production"} database`);
console.log(`Mode: ${EXECUTE ? "EXECUTE (will write)" : "DRY RUN (read-only, no writes)"}`);
console.log("");

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});

function describeDataUrl(value) {
  if (typeof value !== "string" || !value.startsWith("data:")) return null;
  const match = value.match(/^data:([^;]+);base64,/);
  return { mime: match?.[1] ?? "application/octet-stream", chars: value.length };
}

async function uploadDataUrl(value, pathHint) {
  const match = value.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) throw new Error("value is not a base64 data URL");
  const [, mime, b64] = match;
  const buffer = Buffer.from(b64, "base64");
  const ext = mime.split("/")[1]?.split("+")[0] || "bin";
  const blob = await put(`${pathHint}-${Date.now()}.${ext}`, buffer, {
    access: "public",
    contentType: mime,
  });
  return blob.url;
}

async function migrateSettingsHero() {
  const { rows } = await pool.query(
    `SELECT id, data->'heroImage' AS hero FROM southline_settings WHERE id = 'default'`
  );
  if (!rows[0]) {
    console.log("[settings] no row found, skipping");
    return;
  }
  const hero = rows[0].hero ?? {};
  const targets = ["desktopUrl", "mobileUrl"].filter((k) => describeDataUrl(hero[k]));
  if (targets.length === 0) {
    console.log("[settings] heroImage has no base64 fields — already migrated or never was one");
    return;
  }
  for (const key of targets) {
    const info = describeDataUrl(hero[key]);
    console.log(`[settings] heroImage.${key}: ${info.mime}, ${info.chars} base64 chars`);
  }
  if (!EXECUTE) return;

  await pool.query(
    `CREATE TABLE IF NOT EXISTS southline_settings_backup_pre_blob_migration AS
     SELECT * FROM southline_settings WHERE id = 'default'`
  );
  console.log("[settings] backup table ready: southline_settings_backup_pre_blob_migration");

  const merged = { ...hero };
  for (const key of targets) {
    merged[key] = await uploadDataUrl(hero[key], `southline/hero-${key}`);
    console.log(`[settings] heroImage.${key} -> ${merged[key]}`);
  }
  await pool.query(
    `UPDATE southline_settings SET data = jsonb_set(data, '{heroImage}', $1::jsonb), updated_at = now() WHERE id = 'default'`,
    [JSON.stringify(merged)]
  );
  console.log("[settings] heroImage updated in place.");
}

async function migrateLandingPageHeroes() {
  const { rows } = await pool.query(
    `SELECT id, contractor_id, hero_image_url FROM contractor_landing_pages`
  );
  const targets = rows.filter((r) => describeDataUrl(r.hero_image_url));
  if (targets.length === 0) {
    console.log("[landing-pages] no base64 hero_image_url rows found");
    return;
  }
  for (const row of targets) {
    const info = describeDataUrl(row.hero_image_url);
    console.log(`[landing-pages] id=${row.id} contractor=${row.contractor_id}: ${info.mime}, ${info.chars} base64 chars`);
  }
  if (!EXECUTE) return;

  await pool.query(
    `CREATE TABLE IF NOT EXISTS contractor_landing_pages_backup_pre_blob_migration AS
     SELECT * FROM contractor_landing_pages WHERE id = ANY($1)`,
    [targets.map((r) => r.id)]
  );
  console.log("[landing-pages] backup table ready: contractor_landing_pages_backup_pre_blob_migration");

  for (const row of targets) {
    const url = await uploadDataUrl(row.hero_image_url, `contractors/${row.contractor_id}/landing-hero`);
    await pool.query(
      `UPDATE contractor_landing_pages SET hero_image_url = $1, updated_at = now() WHERE id = $2`,
      [url, row.id]
    );
    console.log(`[landing-pages] id=${row.id} hero_image_url -> ${url}`);
  }
}

try {
  await migrateSettingsHero();
  console.log("");
  await migrateLandingPageHeroes();
} finally {
  await pool.end();
}

console.log("");
console.log(
  EXECUTE
    ? "Migration complete. Verify the homepage hero and the affected contractor profile page render correctly before dropping the backup tables."
    : "Dry run complete — nothing was written. Re-run with --execute (and CONFIRM=MIGRATE) to perform the migration."
);

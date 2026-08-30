// ---------------------------------------------------------------------------
// TRUE GEO v1 — import the local US ZIP/ZCTA centroid reference dataset.
//
//   node scripts/geo/import-zip-centroids.mjs --file <dataset> [--dry-run]
//
// Input is either a JSON array ([{ zip, latitude, longitude, city?, state? }])
// or a CSV with a header row exposing zip / latitude|lat / longitude|lng /
// city / state (any case). ZIP+4 inputs are collapsed to 5 digits; malformed
// and duplicate rows are rejected and counted. Target is Postgres
// (DATABASE_URL) and the import is idempotent (ON CONFLICT (zip) DO UPDATE).
//
// PRODUCTION SAFETY (double confirmation):
//   * A production target (Census/CivicSpace dataset host fingerprint) is
//     refused by default.
//   * Importing to production requires BOTH ALLOW_PRODUCTION_DB=yes AND the
//     explicit --confirm-production-import flag. Either one alone aborts.
//   * The target is reported as a host fingerprint only — never credentials.
//
// Recommended pipeline (see docs/geo/ZIP_CENTROIDS.md):
//   node scripts/geo/prepare-census-zcta.mjs --input 2025_Gaz_zcta_national.txt \
//     --output /tmp/zip-centroids.csv
//   node scripts/geo/import-zip-centroids.mjs --file /tmp/zip-centroids.csv --dry-run
//   ALLOW_PRODUCTION_DB=yes node scripts/geo/import-zip-centroids.mjs \
//     --file /tmp/zip-centroids.csv --confirm-production-import
// ---------------------------------------------------------------------------
import { config } from "dotenv";
config({ path: ".env" });
import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveProductionImportGate, safeHost } from "./production-guard.mjs";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();

function usage() {
  console.log(
    [
      "Usage: node scripts/geo/import-zip-centroids.mjs --file <dataset.json|dataset.csv> [--dry-run]",
      "",
      "  --file <path>                dataset to import (also accepted as a positional arg)",
      "  --dry-run                    parse + validate + report only; writes nothing",
      "  --confirm-production-import  REQUIRED (with ALLOW_PRODUCTION_DB=yes) to import",
      "                               against the recognized production host",
      "  --help                       this help",
      "",
      `Target: ${DB_URL ? safeHost(DB_URL) : "(unset DATABASE_URL)"}`,
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = { file: null, dryRun: false, confirmProductionImport: false, help: false, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run" || a === "-dry-run") args.dryRun = true;
    else if (a === "--confirm-production-import" || a === "-confirm-production-import") args.confirmProductionImport = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--file" || a === "-file") args.file = argv[++i] ?? null;
    else if (a.startsWith("--file=")) args.file = a.slice("--file=".length);
    else args.positional.push(a);
  }
  return args;
}

function normalizeZip(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 10 && trimmed[5] === "-") return trimmed.slice(0, 5);
  return trimmed;
}

function rowFrom(entry) {
  const zip = normalizeZip(entry.zip);
  if (!/^\d{5}$/.test(zip)) return null;
  if (String(entry.latitude).trim() === "" || String(entry.longitude).trim() === "") return null;
  const latitude = Number(entry.latitude);
  const longitude = Number(entry.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { zip, latitude, longitude, city: String(entry.city ?? "").trim() || null, state: String(entry.state ?? "").trim() || null };
}

/** Parse CSV by header names regardless of column order. */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headerLine = lines.shift() ?? "";
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const idx = (names) => {
    const i = headers.findIndex((h) => names.includes(h));
    return i === -1 ? null : i;
  };
  const z = idx(["zip", "postal_code"]);
  const la = idx(["latitude", "lat"]);
  const lo = idx(["longitude", "lng", "lon"]);
  if (z === null || la === null || lo === null) {
    throw new Error(`CSV header must include zip, latitude|lat, longitude|lng. Found: ${headerLine || "(empty)"}`);
  }
  const cityIdx = idx(["city"]);
  const stateIdx = idx(["state"]);
  const rows = [];
  for (const line of lines) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const get = (i) => (i === null ? null : cells[i] ?? "");
    rows.push({ zip: get(z), latitude: get(la), longitude: get(lo), city: get(cityIdx), state: get(stateIdx) });
  }
  return rows;
}

async function readDataset(input) {
  const raw = await readFile(input, "utf-8");
  const ext = path.extname(input).toLowerCase();
  return ext === ".csv" ? parseCsv(raw) : JSON.parse(raw);
}

async function cleanRows(rawRows) {
  const seen = new Set();
  const clean = [];
  let rejected = 0;
  let duplicated = 0;
  for (const r of rawRows) {
    const row = rowFrom(r);
    if (!row) {
      rejected++;
      continue;
    }
    if (seen.has(row.zip)) {
      duplicated++;
      continue;
    }
    seen.add(row.zip);
    clean.push(row);
  }
  return { clean, rejected, duplicated };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const input = args.file ?? args.positional[0];
  if (!input) {
    usage();
    process.exit(1);
  }

  const rawRows = await readDataset(input);
  const { clean, rejected, duplicated } = await cleanRows(rawRows);

  // Production safety: the ASCII gate runs BEFORE anything opens a connection.
  const gate = resolveProductionImportGate(DB_URL, {
    allowProductionDb: process.env.ALLOW_PRODUCTION_DB,
    confirmProductionImport: args.confirmProductionImport,
  });
  if (gate.production && !gate.allowed) {
    console.error(
      `[geo-import] Refusing to import against the recognized production host ` +
        `(${safeHost(DB_URL)}).\n` +
        `  Production requires BOTH: ${gate.missing.join("  AND  ")}\n` +
        `  Missing: ${gate.missing.join(", ")}`
    );
    process.exit(1);
  }

  if (gate.production) {
    console.warn(`[geo-import] DOUBLE CONFIRMATION PASSED — importing against production host ${safeHost(DB_URL)}.`);
  }

  const pool = new pg.Pool({
    connectionString: DB_URL,
    ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
  });

  try {
    let existing = new Set();
    try {
      const { rows } = await pool.query("SELECT zip FROM zip_centroids");
      for (const r of rows) existing.add(r.zip);
    } catch (err) {
      if (args.dryRun) {
        console.warn(`[geo-import] zip_centroids unreachable (${err.message}); dry-run will report all rows as would-insert.`);
      } else {
        throw err;
      }
    }

    const wouldInsert = clean.filter((r) => !existing.has(r.zip));
    const wouldUpdate = clean.filter((r) => existing.has(r.zip));

    if (args.dryRun) {
      console.log("");
      console.log(`DRY-RUN — no writes performed.`);
      console.log(`  target host : ${safeHost(DB_URL)}`);
      console.log(`  input rows  : ${rawRows.length}`);
      console.log(`  would-insert: ${wouldInsert.length}`);
      console.log(`  would-update: ${wouldUpdate.length}`);
      console.log(`  rejected    : ${rejected} (malformed zip / invalid coordinates)`);
      console.log(`  duplicated  : ${duplicated} (first occurrence wins)`);
      if (gate.production) console.log(`  mode        : production (double-confirmed) — STILL DRY-RUN, no writes`);
      return;
    }

    const CHUNK = 1000;
    const upserted = [];
    for (let i = 0; i < clean.length; i += CHUNK) {
      const chunk = clean.slice(i, i + CHUNK);
      const params = [];
      const values = [];
      chunk.forEach((r, k) => {
        const base = k * 5;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
        params.push(r.zip, r.latitude, r.longitude, r.city, r.state);
      });
      const { rowCount } = await pool.query(
        `INSERT INTO zip_centroids (zip, latitude, longitude, city, state)
         VALUES ${values.join(", ")}
         ON CONFLICT (zip) DO UPDATE SET
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           city = EXCLUDED.city,
           state = EXCLUDED.state`,
        params
      );
      upserted.push(rowCount ?? chunk.length);
    }
    const written = upserted.reduce((a, b) => a + b, 0);

    const { rows } = await pool.query(
      "SELECT zip, latitude, longitude, city, state FROM zip_centroids ORDER BY zip LIMIT 5"
    );
    const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS value FROM zip_centroids");
    const value = countRows[0]?.value ?? 0;

    console.log("");
    console.log("ZIP centroids import complete.");
    console.log(`  target host : ${safeHost(DB_URL)}`);
    console.log(`  input rows  : ${rawRows.length}`);
    console.log(`  inserted    : ${wouldInsert.length}`);
    console.log(`  updated     : ${wouldUpdate.length}`);
    console.log(`  written     : ${written} (rows touched by upsert)`);
    console.log(`  rejected    : ${rejected} (malformed zip / invalid coordinates)`);
    console.log(`  duplicated  : ${duplicated} (first occurrence wins)`);
    console.log(`  table total : ${value}`);
    console.log("");
    console.log("Sample rows:");
    for (const r of rows) console.log(`  ${r.zip}  ${r.city}, ${r.state}  (${r.latitude}, ${r.longitude})`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
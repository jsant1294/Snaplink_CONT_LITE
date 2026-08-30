// ---------------------------------------------------------------------------
// TRUE GEO v1 — import the local US ZIP centroid reference dataset.
//
//   node scripts/geo/import-zip-centroids.mjs <input>
//
// Input is either a JSON array ([{ zip, latitude, longitude, city?, state? }])
// or a CSV with a header row exposing zip / latitude|lat / longitude|lng /
// city / state (any case). ZIP+4 inputs are collapsed to 5 digits; malformed
// and duplicate rows are skipped and counted. Target is Postgres
// (DATABASE_URL) and the import is idempotent (ON CONFLICT (zip) DO UPDATE).
// See docs/geo/ZIP_CENTROIDS.md for the dataset source, license, and update
// cycle.
// ---------------------------------------------------------------------------
import { config } from "dotenv";
config({ path: ".env" });
import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertNotProductionDatabase } from "../../lib/local-db-guard.ts";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set. Add it to .env or pass it inline.");
  process.exit(1);
}
assertNotProductionDatabase(DB_URL, "scripts/geo/import-zip-centroids.mjs");

function normalizeZip(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 10 && trimmed[5] === "-") return trimmed.slice(0, 5);
  return trimmed;
}

function rowFrom(entry) {
  const zip = normalizeZip(entry.zip);
  if (!/^\d{5}$/.test(zip)) return null;
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

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node scripts/geo/import-zip-centroids.mjs <dataset.json|dataset.csv>");
    process.exit(1);
  }
  const raw = await readFile(input, "utf-8");
  const ext = path.extname(input).toLowerCase();
  const rawRows = ext === ".csv" ? parseCsv(raw) : JSON.parse(raw);

  const seen = new Set();
  const clean = [];
  let skipped = 0;
  for (const r of rawRows) {
    const row = rowFrom(r);
    if (!row) {
      skipped++;
      continue;
    }
    if (seen.has(row.zip)) {
      skipped++;
      continue;
    }
    seen.add(row.zip);
    clean.push(row);
  }

  const pool = new pg.Pool({
    connectionString: DB_URL,
    ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
  });

  const CHUNK = 1000;
  let upserted = 0;
  for (let i = 0; i < clean.length; i += CHUNK) {
    const chunk = clean.slice(i, i + CHUNK);
    const params = [];
    const values = [];
    chunk.forEach((r, k) => {
      const base = k * 5;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(r.zip, r.latitude, r.longitude, r.city, r.state);
    });
    await pool.query(
      `INSERT INTO zip_centroids (zip, latitude, longitude, city, state)
       VALUES ${values.join(", ")}
       ON CONFLICT (zip) DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         city = EXCLUDED.city,
         state = EXCLUDED.state`,
      params
    );
    upserted += chunk.length;
  }

  const { rows } = await pool.query(
    "SELECT zip, latitude, longitude, city, state FROM zip_centroids ORDER BY zip LIMIT 5"
  );
  const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS value FROM zip_centroids");
  const value = countRows[0]?.value ?? 0;
  await pool.end();

  console.log("");
  console.log("ZIP centroids import complete.");
  console.log(`  input rows : ${rawRows.length}`);
  console.log(`  upserted   : ${upserted}`);
  console.log(`  skipped    : ${skipped} (bad zip / bad coordinates / duplicate)`);
  console.log(`  table total: ${value}`);
  console.log("");
  console.log("Sample rows:");
  for (const r of rows) console.log(`  ${r.zip}  ${r.city}, ${r.state}  (${r.latitude}, ${r.longitude})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
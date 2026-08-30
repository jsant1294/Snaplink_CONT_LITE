// ---------------------------------------------------------------------------
// TRUE GEO v1 — prepare the US Census ZCTA5 Gazetteer for the centroid loader.
//
//   node scripts/geo/prepare-census-zcta.mjs \
//     --input  2025_Gaz_zcta_national.txt \
//     --output /tmp/zip-centroids.csv
//
// Converts the Census pipe-delimited Gazetteer (GEOID | ... | INTPTLAT |
// INTPTLONG) into a deterministic importer-compatible CSV:
//
//   zip,latitude,longitude
//
// The ZIP-card GEOID is a 5-digit ZCTA (e.g. 30004) whose internal point —
// INTPTLAT/INTPTLONG — is used as the centroid proxy. This is a single local
// data-shaping step: it NEVER needs a network connection once the source file
// is on disk.
//
// Validation rules:
//   * GEOID must be exactly 5 digits (rejects malformed ZIPs; ZIP+4 not a
//     Census gazetteer concept).
//   * Latitude/longitude must be finite numbers within [-90,90]/[-180,180].
//   * Duplicate GEOIDs are rejected (first occurrence wins) and counted.
//   * Rows in outlying territories (e.g. American Samoa, latitude < 15°N) are
//     VALID US data and are kept, but counted separately for honest reporting.
//
// Source: US Census 2025 ZCTA5 Gazetteer (public domain). ZCTAs are Census
// approximations of USPS ZIP codes — not an identical 1:1 mapping. See
// docs/geo/ZIP_CENTROIDS.md.
// ---------------------------------------------------------------------------
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REQUIRED = ["GEOID", "INTPTLAT", "INTPTLONG"];
// Basic finite-range check for well-formed coordinates.
const LAT_RANGE = [-90, 90];
const LNG_RANGE = [-180, 180];
// Continent + territories sanity window used only for the territory report:
// everything outside is flagged as kept-but-unusual (low-latitude territories).
const US_LAT_WINDOW = [15, 72];

function usage() {
  console.log(
    [
      "Usage: node scripts/geo/prepare-census-zcta.mjs --input <gazetteer.txt> --output <csv>",
      "",
      "  --input <path>   2025_Gaz_zcta_national.txt (or an extracted equivalent)",
      "  --output <path>  where the importer-compatible CSV is written",
      "  --help           this help",
      "",
      "Input is Census pipe-delimited text; required columns: GEOID, INTPTLAT, INTPTLONG.",
      "This step is offline — it only reads the file already present on disk.",
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = { input: null, output: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--input" || a === "-input") args.input = argv[++i] ?? null;
    else if (a.startsWith("--input=")) args.input = a.slice("--input=".length);
    else if (a === "--output" || a === "-output") args.output = argv[++i] ?? null;
    else if (a.startsWith("--output=")) args.output = a.slice("--output=".length);
  }
  return args;
}

/** Column-name → index for the Census header line. */
function headerIndex(headers) {
  const idx = {};
  for (const name of REQUIRED) {
    const i = headers.findIndex((h) => h.trim().toUpperCase() === name);
    if (i === -1) return null;
    idx[name] = i;
  }
  return idx;
}

function parseCensus(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headerLine = lines.shift() ?? "";
  const idx = headerIndex(headerLine.split("|"));
  if (!idx) {
    throw new Error(
      `Census header must include ${REQUIRED.join(", ")} (pipe-delimited). ` +
        `Found: ${headerLine || "(empty)"}`
    );
  }
  const rows = [];
  for (const line of lines) {
    const cells = line.split("|").map((c) => c.trim());
    rows.push({
      geoId: cells[idx.GEOID] ?? "",
      latitude: cells[idx.INTPTLAT] ?? "",
      longitude: cells[idx.INTPTLONG] ?? "",
    });
  }
  return rows;
}

function rowFrom(raw) {
  const zip = raw.geoId.trim();
  if (!/^\d{5}$/.test(zip)) return null;
  if (String(raw.latitude).trim() === "" || String(raw.longitude).trim() === "") return null;
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < LAT_RANGE[0] || latitude > LAT_RANGE[1]) return null;
  if (longitude < LNG_RANGE[0] || longitude > LNG_RANGE[1]) return null;
  return { zip, latitude, longitude };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  if (!args.input || !args.output) {
    usage();
    process.exit(1);
  }

  const text = await readFile(args.input, "utf-8");
  const rawRows = parseCensus(text);

  const seen = new Set();
  const clean = [];
  let malformed = 0;
  let duplicated = 0;
  let territory = 0;
  for (const raw of rawRows) {
    const row = rowFrom(raw);
    if (!row) {
      malformed++;
      continue;
    }
    if (seen.has(row.zip)) {
      duplicated++;
      continue;
    }
    seen.add(row.zip);
    if (row.latitude < US_LAT_WINDOW[0] || row.latitude > US_LAT_WINDOW[1]) territory++;
    clean.push(row);
  }

  clean.sort((a, b) => (a.zip < b.zip ? -1 : a.zip > b.zip ? 1 : 0));
  const packed = clean.map((r) => `${r.zip},${r.latitude.toFixed(6)},${r.longitude.toFixed(6)}`);
  const csv = ["zip,latitude,longitude", ...packed, ""].join("\n");
  await writeFile(args.output, csv, "utf-8");

  const fmt = (r) => `  ${r.zip}  (${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)})`;
  console.log("Census ZCTA5 → importer CSV complete.");
  console.log(`  input lines : ${rawRows.length}`);
  console.log(`  valid unique: ${clean.length} ${territory ? `(incl. ${territory} outside the continent/window — kept, valid US data)` : ""}`);
  console.log(`  malformed   : ${malformed} (bad zip / non-finite / out-of-range coordinates)`);
  console.log(`  duplicated  : ${duplicated} (first occurrence wins)`);
  console.log(`  output      : ${args.output} (relative: ${path.relative(process.cwd(), args.output) || "."})`);
  console.log("");
  console.log("Sample rows:");
  for (const r of clean.slice(0, 3)) console.log(fmt(r));
  console.log("   ...");
  for (const r of clean.slice(-2)) console.log(fmt(r));
  console.log("");
  console.log("Next: node scripts/geo/import-zip-centroids.mjs --file " + args.output + " --dry-run");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
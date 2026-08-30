// TRUE GEO v1 — deterministic tests for the Census ZCTA5 → ZIP-centroid
// production loader pipeline:
//   1. prepare-census-zcta.mjs (transform + validation)
//   2. import-zip-centroids.mjs (double-confirmation production gate + dry-run)
//   3. guard truth table (pure module)
//
// No test in this file connects to production. Abort-path tests use a
// production-mimicking host string and rely on the ASCII gate running BEFORE
// any connection is opened. The only DB-touching tests are optional dry-run
// checks against the local dev DATABASE_URL (skipped when absent).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const PREPARE = path.join(ROOT, "scripts/geo/prepare-census-zcta.mjs");
const IMPORT = path.join(ROOT, "scripts/geo/import-zip-centroids.mjs");
const SAMPLE = path.join(ROOT, "tests/fixtures/census-zcta-sample.txt");

const { resolveProductionImportGate, safeHost } = await import(
  path.join(ROOT, "scripts/geo/production-guard.mjs")
);

const PROD_URL = "postgres://user:secretpw@ep-red-recipe-atgps8a1.us-east-1.aws.neon.tech/neondb?sslmode=require";
const DEV_HOST = "ep-empty-sun-awc6nqfq.c-12.us-east-1.aws.neon.tech";
const DEV_URL = `${process.env.DATABASE_URL || process.env.POSTGRES_URL || ""}`.trim();

function run(script, args, env = {}) {
  const wrappedEnv = { ...process.env, ...env };
  // Never let the parent's DB vars leak into child runs without intent.
  for (const k of ["DATABASE_URL", "POSTGRES_URL"]) {
    if (!(k in env)) delete wrappedEnv[k];
  }
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env: wrappedEnv });
}

function withTemp(prefix, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Prepare the raw Census sample and return the output CSV PATH. The temp dir
 * lives for the process lifetime (cleaned up on exit), so child runs that
 * consume the path stay valid.
 */
function preparedCsVPath(extraInput) {
  const dir = mkdtempSync(path.join(tmpdir(), "geo-loader-"));
  process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  const input = path.join(dir, "sample.txt");
  const output = path.join(dir, "zip-centroids.csv");
  writeFileSync(input, extraInput);
  const res = run(PREPARE, ["--input", input, "--output", output]);
  assert.equal(res.status, 0, res.stderr || res.stdout);
  return output;
}

function haversineMiles(a, b) {
  const R = 3958.7613;
  const toRad = (n) => (n * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function preparedCsv(extraInput) {
  return withTemp("geo-loader-", (dir) => {
    const input = path.join(dir, "sample.txt");
    const output = path.join(dir, "zip-centroids.csv");
    writeFileSync(input, extraInput);
    const res = run(PREPARE, ["--input", input, "--output", output]);
    assert.equal(res.status, 0, res.stderr || res.stdout);
    return readFileSync(output, "utf8");
  });
}

test("guard truth table: non-production needs no confirmation at all", () => {
  assert.deepEqual(
    resolveProductionImportGate(DEV_URL, { allowProductionDb: undefined, confirmProductionImport: false }),
    { allowed: true, production: false, missing: [] }
  );
});

test("guard truth table: production refuses with no confirmation", () => {
  const res = resolveProductionImportGate(PROD_URL, { allowProductionDb: undefined, confirmProductionImport: false });
  assert.equal(res.allowed, false);
  assert.equal(res.production, true);
  assert.deepEqual(res.missing, ["ALLOW_PRODUCTION_DB=yes", "--confirm-production-import"]);
});

test("guard truth table: env var alone is insufficient", () => {
  const res = resolveProductionImportGate(PROD_URL, { allowProductionDb: "yes", confirmProductionImport: false });
  assert.equal(res.allowed, false);
  assert.deepEqual(res.missing, ["--confirm-production-import"]);
});

test("guard truth table: CLI confirmation alone is insufficient", () => {
  const res = resolveProductionImportGate(PROD_URL, { allowProductionDb: undefined, confirmProductionImport: true });
  assert.equal(res.allowed, false);
  assert.deepEqual(res.missing, ["ALLOW_PRODUCTION_DB=yes"]);
});

test("guard truth table: BOTH confirmations are required for production", () => {
  const yes = resolveProductionImportGate(PROD_URL, { allowProductionDb: "yes", confirmProductionImport: true });
  assert.equal(yes.allowed, true);
  assert.equal(yes.production, true);
  const noEnv = resolveProductionImportGate(PROD_URL, { allowProductionDb: "yes", confirmProductionImport: false });
  const noCli = resolveProductionImportGate(PROD_URL, { allowProductionDb: "YES", confirmProductionImport: true });
  assert.equal(noEnv.allowed, false);
  assert.equal(noCli.allowed, false); // "YES" !== "yes"
});

test("safeHost prints host only, never credentials", () => {
  assert.equal(safeHost(PROD_URL), "ep-red-recipe-atgps8a1.us-east-1.aws.neon.tech");
  assert.ok(!safeHost(PROD_URL).includes("secretpw"));
  assert.equal(safeHost(""), "(unset)");
});

test("import script aborts against production with no confirmation and prints host fingerprint", () => {
  const csv = preparedCsVPath(readFileSync(SAMPLE, "utf8"));
  const res = run(IMPORT, ["--file", csv], { DATABASE_URL: PROD_URL });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Refusing to import/);
  assert.match(res.stderr, /ep-red-recipe-atgps8a1/); // host fingerprint
  assert.ok(!res.stderr.includes("secretpw"), "must never echo credentials");
});

test("import script aborts against production with env var ALONE", () => {
  const csv = preparedCsVPath(readFileSync(SAMPLE, "utf8"));
  const res = run(IMPORT, ["--file", csv], { DATABASE_URL: PROD_URL, ALLOW_PRODUCTION_DB: "yes" });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Refusing to import/);
  assert.match(res.stderr, /--confirm-production-import/);
});

test("import script aborts against production with CLI flag ALONE", () => {
  const csv = preparedCsVPath(readFileSync(SAMPLE, "utf8"));
  const res = run(IMPORT, ["--file", csv, "--confirm-production-import"], { DATABASE_URL: PROD_URL });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Refusing to import/);
  assert.match(res.stderr, /ALLOW_PRODUCTION_DB=yes/);
});

test("census transform: pipe parsing, normalization, dedupe, malformed rejection", () => {
  const csv = readFileSync(preparedCsVPath(readFileSync(SAMPLE, "utf8")), "utf8");
  const lines = csv.trim().split("\n");
  assert.equal(lines[0], "zip,latitude,longitude");
  const rows = lines.slice(1).map((l) => l.split(","));
  const zips = rows.map((r) => r[0]);
  assert.deepEqual(zips, ["00601", "30004", "30005", "97201"]); // first-dup-wins + sorted
  const byZip = new Map(rows.map((r) => [r[0], r]));
  assert.equal(byZip.get("30005")[1], "34.089050"); // original kept, duplicate dropped
  assert.equal(byZip.get("30005")[2], "-84.217019");
  assert.equal(byZip.get("30004")[1], "34.145635");
  assert.equal(byZip.get("00601")[1], "18.180555"); // territory kept — valid US data
  // malformed rows must not appear: short zip 1234, alpha 12A45, nan lat,
  // empty lng, lat out of range
  for (const bad of ["1234", "12A45", "30099", "30098", "30097"]) assert.ok(!zips.includes(bad));
});

test("census transform: summary reports malformed and duplicate counts", () => {
  withTemp("geo-loader-", (dir) => {
    const input = path.join(dir, "sample.txt");
    const output = path.join(dir, "zip-centroids.csv");
    writeFileSync(input, readFileSync(SAMPLE, "utf8"));
    const res = run(PREPARE, ["--input", input, "--output", output]);
    assert.equal(res.status, 0);
    assert.match(res.stdout, /valid unique: 4/);
    assert.match(res.stdout, /malformed   : 5/);
    assert.match(res.stdout, /duplicated  : 1/);
  });
});

test("census transform: prepared 30005 → 30004 distance is ≈ 5.8 miles (production census centroids)", () => {
  const csv = readFileSync(preparedCsVPath(readFileSync(SAMPLE, "utf8")), "utf8");
  const rows = csv
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.split(","));
  const byZip = new Map(rows.map((r) => [r[0], { latitude: Number(r[1]), longitude: Number(r[2]) }]));
  const miles = haversineMiles(byZip.get("30005"), byZip.get("30004"));
  assert.ok(miles > 5.3 && miles < 6.3, `expected ~5.8 mi, got ${miles.toFixed(2)}`);
});

test("importer accepts the prepared CSV header shape (non-production, dry-run)", async (t) => {
  const devUrl = DEV_URL && /localhost|127\.0\.0\.1|neon\.tech/.test(DEV_URL) ? DEV_URL : "";
  if (!devUrl) {
    t.skip("no reachable local/dev DATABASE_URL configured");
    return;
  }
  const csv = preparedCsVPath(readFileSync(SAMPLE, "utf8"));
  const res = run(IMPORT, ["--file", csv, "--dry-run"], { DATABASE_URL: devUrl });
  assert.equal(res.status, 0, res.stderr || res.stdout);
  assert.match(res.stdout, /DRY-RUN — no writes performed/);
  assert.match(res.stdout, /would-insert: 1/); // 00601 not in dev dataset
  assert.match(res.stdout, /would-update: 3/); // 30004, 30005, 97201 already present
});

test("dry-run does not mutate the database", async (t) => {
  const devUrl = DEV_URL && /localhost|127\.0\.0\.1|neon\.tech/.test(DEV_URL) ? DEV_URL : "";
  if (!devUrl) {
    t.skip("no reachable local/dev DATABASE_URL configured");
    return;
  }
  const csv = preparedCsVPath(readFileSync(SAMPLE, "utf8"));
  const before = run(IMPORT, ["--file", csv, "--dry-run"], { DATABASE_URL: devUrl });
  assert.equal(before.status, 0);
  // 00601 is not part of the fixture/dev dataset; after dry-run it must still
  // be absent. Run again and confirm the report still claims would-insert,
  // proving no row was actually written.
  const after = run(IMPORT, ["--file", csv, "--dry-run"], { DATABASE_URL: devUrl });
  assert.equal(after.status, 0);
  assert.match(after.stdout, /would-insert: 1/);
});
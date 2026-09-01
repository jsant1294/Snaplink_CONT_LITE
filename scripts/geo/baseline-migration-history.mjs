// ---------------------------------------------------------------------------
// One-time production migration-history baseline for the SnapLink/Southline
// September Closure activation.
//
// Production already contains the pre-September schema (0000..0026 equivalent)
// but has NO `drizzle.__drizzle_migrations` history table and lacks the
// September changes (0027 is_demo / 0028 status / 0029 TRUE GEO). We must:
//   * NEVER replay 0000..0026 (their base tables already exist),
//   * NEVER use `drizzle-kit push` (it diffs the whole schema and can
//     reconcile unrelated drift),
//   * teach Drizzle "everything through 0026 is already applied" WITHOUT
//     executing those historical SQL files.
//
// Strategy (matches Drizzle's installed replay algorithm exactly):
//   1. This script inserts Drizzle-compatible history rows for 0000..0026
//      into drizzle.__drizzle_migrations, using the exact schema/hash the
//      installed drizzle-kit 0.31.10 / drizzle-orm 0.45.2 migrator expects.
//   2. The operator then runs `npx drizzle-kit migrate` ONCE, which replays
//      exactly 0027 -> 0028 -> 0029 (the only journaled migrations whose
//      `when` is newer than the baseline's newest created_at = 0026.when) and
//      records their history rows itself.
//
// This leaves a fully Drizzle-native history through 0029, so every future
// `npx drizzle-kit migrate` recognises 0029 as already applied.
//
// Refuses to run unless production host + BOTH production overrides are given
// (mirrors scripts/geo/production-guard.mjs). Prints host fingerprint only —
// never credentials. Fail-closed: any preflight failure aborts before writing.
// ---------------------------------------------------------------------------
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { assertNotProductionDatabase, isProductionDatabaseUrl } from "../../lib/local-db-guard.ts";
import { resolveProductionImportGate, safeHost } from "./production-guard.mjs";

config({ path: ".env" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const JOURNAL_PATH = join(REPO_ROOT, "drizzle", "meta", "_journal.json");
const DRIZZLE_DIR = join(REPO_ROOT, "drizzle");

const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";
const CONFIRM_FLAG = "--confirm-production-baseline";
const BASELINE_THROUGH_IDX = 26; // 0000..0026 already live; 0027..0029 pending

// ---------------------------------------------------------------------------
// Deterministic: recompute what the installed migrator would store for each
// migration. hash = sha256(file bytes); created_at = journal `when` (ms).
// We do NOT hardcode/invent any row — every value is derived from the repo.
// ---------------------------------------------------------------------------
function readJournal() {
  const journal = JSON.parse(readFileSync(JOURNAL_PATH, "utf8"));
  if (!Array.isArray(journal.entries)) throw new Error("_journal.json has no entries");
  return journal.entries;
}

function migrationRows(entries) {
  return entries.map((entry) => {
    const file = join(DRIZZLE_DIR, `${entry.tag}.sql`);
    const bytes = readFileSync(file);
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (typeof entry.when !== "number") throw new Error(`entry ${entry.tag} missing numeric when`);
    return { tag: entry.tag, when: entry.when, hash };
  });
}

// ---------------------------------------------------------------------------
// Read-only preflight queries.
// ---------------------------------------------------------------------------
async function columnNames(client, table) {
  const { rows } = await client.query(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = $1 order by ordinal_position`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

async function runPreflight(client, baselineTag) {
  const agentCols = await columnNames(client, "agent_profiles");
  const contractorCols = await columnNames(client, "contractors");

  const baseOk =
    agentCols.length > 0 && contractorCols.length > 0 &&
    agentCols.includes("username") && contractorCols.includes("username");
  if (!baseOk) {
    throw new Error("Baseline aborted: expected base tables contractors/agent_profiles not present (run against a provisioned production DB only).");
  }

  // Confirm September changes are genuinely absent — otherwise 0027..0029 would not be "pending".
  const missing = [];
  if (contractorCols.includes("is_demo")) missing.push("contractors.is_demo present (0027 already applied?)");
  if (contractorCols.includes("status")) missing.push("contractors.status present (0028 already applied?)");
  if (contractorCols.includes("service_zip")) missing.push("contractors.service_zip present (0029 already applied?)");
  if (agentCols.includes("is_demo")) missing.push("agent_profiles.is_demo present (0027 already applied?)");
  const { rows: centroids } = await client.query(
    `select to_regclass('zip_centroids') as t`
  );
  if (centroids[0]?.t) missing.push("zip_centroids present (0029 already applied?)");
  if (missing.length) {
    throw new Error(`Baseline aborted: September migration state already present: ${missing.join("; ")}`);
  }

  // The one hard precondition for this script: history must not exist yet.
  const { rows: existingSchema } = await client.query(
    `select 1 from information_schema.schemata where schema_name = $1`,
    [MIGRATIONS_SCHEMA]
  );
  if (existingSchema.length) {
    const { rows: existingTable } = await client.query(
      `select 1 from information_schema.tables
       where table_schema = $1 and table_name = $2`,
      [MIGRATIONS_SCHEMA, MIGRATIONS_TABLE]
    );
    if (existingTable.length) {
      const { rows: existingRows } = await client.query(
        `select count(*)::int as n from ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`
      );
      throw new Error(
        `Baseline aborted: ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} already exists with ${existingRows[0].n} row(s). Refusing to re-baseline.`
      );
    }
  }

  // Spot-check the three production rows whose post-migration state is the
  // acceptance gate. Only read; never mutate here.
  const { rows: jj } = await client.query(
    `select username from contractors where username = 'jj-remodeling'`
  );
  const { rows: south } = await client.query(
    `select username from contractors where username = 'southline-remodeling'`
  );
  const { rows: demo } = await client.query(
    `select username from contractors where username = 'ridgeline-demo'`
  );
  if (!jj.length || !south.length || !demo.length) {
    throw new Error("Baseline aborted: expected production contractors (jj-remodeling, southline-remodeling, ridgeline-demo) not all present.");
  }

  return { baseRows: contractorCols.length + agentCols.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function usageError() {
  console.error(
    `Usage:\n  ALLOW_PRODUCTION_DB=yes node scripts/geo/baseline-migration-history.mjs --confirm-production-baseline`
  );
  process.exit(2);
}

// Only run when invoked as the main module (never on import, so requiring this
// file for tests, or an accidental downstream import, cannot connect or mutate
// anything). `import.meta.url` is already a file:// URL; normalize the CLI
// argv[1] to the same representation (file:// URL) so the comparison matches on
// direct invocation and is false on import.
const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  await main();
}

async function main() {
  const hasFlag = process.argv.includes(CONFIRM_FLAG);
  const dbUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!dbUrl) {
    console.error("No DATABASE_URL (or POSTGRES_URL) set.");
    usageError();
  }

// The standard guard throws unless ALLOW_PRODUCTION_DB=yes when target is prod.
assertNotProductionDatabase(dbUrl, "scripts/geo/baseline-migration-history.mjs");

const gate = resolveProductionImportGate(dbUrl, {
  allowProductionDb: process.env.ALLOW_PRODUCTION_DB,
  confirmProductionImport: hasFlag,
});
if (gate.production && !gate.allowed) {
  console.error("Baseline aborted — production requires BOTH:");
  for (const missing of gate.missing) console.error(`  - ${missing}`);
  usageError();
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: /localhost|127\.0\.0\.1/.test(dbUrl) ? undefined : { rejectUnauthorized: false },
});

try {
  const client = await pool.connect();
  try {
    console.log(`[baseline] target host: ${safeHost(dbUrl)}`);

    const entries = readJournal();
    if (!entries.some((e) => e.idx === BASELINE_THROUGH_IDX)) {
      throw new Error(`journal has no idx ${BASELINE_THROUGH_IDX} — cannot baseline through 0026`);
    }
    const allRows = migrationRows(entries);
    const baselineRows = allRows.filter((r) => {
      const idx = entries.find((e) => e.tag === r.tag).idx;
      return idx <= BASELINE_THROUGH_IDX;
    });
    if (baselineRows.length !== BASELINE_THROUGH_IDX + 1) {
      throw new Error(`expected ${BASELINE_THROUGH_IDX + 1} baseline rows, derived ${baselineRows.length}`);
    }

    await runPreflight(client, baselineRows.at(-1).tag);

    // Single transaction: create schema/table, insert baseline through 0026.
    await client.query("BEGIN");
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${MIGRATIONS_SCHEMA}`);
      await client.query(
        `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} (
           id SERIAL PRIMARY KEY,
           hash text NOT NULL,
           created_at bigint
         )`
      );
      for (const row of baselineRows) {
        await client.query(
          `INSERT INTO ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} ("hash", "created_at") VALUES ($1, $2)`,
          [row.hash, row.when]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    console.log(`[baseline] inserted ${baselineRows.length} history rows through 0026 (${baselineRows.at(-1).tag}).`);
    console.log(`[baseline] next: run  ALLOW_PRODUCTION_DB=yes npx drizzle-kit migrate  to apply 0027 -> 0028 -> 0029.`);
    console.log(`[baseline] verifying post-state after migrate is the operator's job (see runbook).`);
  } finally {
    await client.release();
  }
  } finally {
    await pool.end();
  }
}

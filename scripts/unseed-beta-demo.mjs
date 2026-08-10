// ---------------------------------------------------------------------------
// Remove ALL Southline public-beta demo content — safely, by documented
// prefix only. Never touches real customer rows.
//
//   npm run db:unseed:beta
//
// Deletes (in dependency order):
//   - agent_profiles WHERE id LIKE 'apx_demo_%'
//   - leads            WHERE id LIKE 'lead_demo_%'
//   - contractors      WHERE id LIKE 'ctr_demo_%'
//
// Contractors carry no FK children that the seed creates (photos and
// contractor_landing_pages are NOT created by seed-beta-demo.mjs, but they are
// deleted here too if a demo row ever appears, so the beta DB always returns
// to the exact pre-seed state). Idempotent and safe to re-run.
// ---------------------------------------------------------------------------
import { config } from "dotenv";
config({ path: ".env" });
import pg from "pg";
import { assertNotProductionDatabase } from "../lib/local-db-guard.ts";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set. Add it to .env or pass it inline.");
  process.exit(1);
}
assertNotProductionDatabase(DB_URL, "scripts/unseed-beta-demo.mjs");

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});
const q = (text, params) => pool.query(text, params);

const DELETES = [
  // dependent/child tables first (photos + landing pages for demo contractors)
  ["photos", `DELETE FROM photos WHERE id LIKE 'photo_demo_%' OR lead_id LIKE 'lead_demo_%'`],
  ["contractor_landing_pages", `DELETE FROM contractor_landing_pages WHERE contractor_id LIKE 'ctr_demo_%'`],
  ["leads", `DELETE FROM leads WHERE id LIKE 'lead_demo_%'`],
  // parent tables last
  ["agent_profiles", `DELETE FROM agent_profiles WHERE id LIKE 'apx_demo_%'`],
  ["contractors", `DELETE FROM contractors WHERE id LIKE 'ctr_demo_%'`],
];

let total = 0;
for (const [label, sql] of DELETES) {
  try {
    const r = await q(sql);
    total += r.rowCount ?? 0;
    console.log(`  ${label.padEnd(22)} ${String(r.rowCount ?? 0).padStart(3)} rows removed`);
  } catch (e) {
    console.log(`  ${label.padEnd(22)} SKIPPED (${e.message})`);
  }
}

await pool.end();
console.log(`\nDone. ${total} demo rows removed in total.`);

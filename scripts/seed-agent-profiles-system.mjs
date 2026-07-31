// ---------------------------------------------------------------------------
// Seed the one sentinel real_estate_memberships row Snaplink Profile billing
// needs to exist. realEstateBillingSubscriptions.createdByMembershipId (and
// realEstateBillingPlans.createdByMembershipId) have a real foreign key to
// real_estate_memberships.id — lib/agent-profiles/billing.ts always passes
// this row's id as membershipId when it calls the unmodified Phase 11
// billing functions on behalf of a self-service agent profile (which has no
// real brokerage membership of its own).
//
//   node scripts/seed-agent-profiles-system.mjs
//
// Idempotent (ON CONFLICT DO NOTHING). Never auto-run — same convention as
// every migration in this repo.
// ---------------------------------------------------------------------------
import "dotenv/config";
import pg from "pg";

const DB_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!DB_URL) {
  console.error("No DATABASE_URL (or POSTGRES_URL) set. Add it to .env or pass it inline.");
  process.exit(1);
}

const MEMBERSHIP_ID = process.env.AGENT_PROFILES_SYSTEM_MEMBERSHIP_ID || "re_membership_agent_profiles_system";
const TENANT_ID = "apx-system";

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? undefined : { rejectUnauthorized: false },
});

await pool.query(
  `INSERT INTO real_estate_memberships (id, tenant_id, user_email, role, is_active)
   VALUES ($1, $2, 'system+agent-profiles@snaplink.internal', 'broker_owner', true)
   ON CONFLICT (tenant_id, user_email) DO NOTHING`,
  [MEMBERSHIP_ID, TENANT_ID]
);

console.log(`Seeded sentinel membership ${MEMBERSHIP_ID} (tenant ${TENANT_ID}) for agent-profile billing.`);
await pool.end();

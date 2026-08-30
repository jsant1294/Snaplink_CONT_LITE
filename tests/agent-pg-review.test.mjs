// ---------------------------------------------------------------------------
// PostgreSQL-targeted review tests for migration 0022 (agent_profiles
// profession_type) + the Southline unified search store layer.
//
// These tests hit a REAL Postgres store — they are the "does it work in PG
// mode" complement to the store-free unit tests in southline-search.test.mjs.
//
// SAFETY: this suite REFUSES to run against any database other than the
// dedicated scratch database `review_0022_scratch`. It wipes that database's
// agent_profiles table before seeding its own fixtures, so it must never be
// pointed at neondb (live) or any other environment.
//
// Run it with DATABASE_URL pointing at the scratch DB (hosted/local both work):
//
//   DATABASE_URL="<scratch-connection-url>" node --test tests/agent-pg-review.test.mjs
//
// ALL DATA HERE IS SYNTHETIC TEST DATA — never production client data.
// ---------------------------------------------------------------------------
import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";

import { pgAgentProfileStore } from "../lib/agent-profiles/store-pg.ts";
import { searchProfessionals } from "../lib/southline-search.ts";
import { agentProfessionTypeLabel, professionTypeLabel } from "../lib/profession-types.ts";

const url = process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  max: 1,
});

let dbName = "";
let setupError = "";

try {
  const r = await pool.query("select current_database() d");
  dbName = r.rows[0].d;
} catch (e) {
  setupError = e.code || String(e.message);
}

const guard = setupError
  ? `could not connect to Postgres (${setupError})`
  : dbName !== "review_0022_scratch"
    ? `refusing to run against "${dbName}" — only review_0022_scratch is allowed`
    : "";

async function resetAndSeed() {
  await pool.query("TRUNCATE agent_profile_events, agent_profiles RESTART IDENTITY CASCADE");
  // Scenario 14 rows are inserted WITHOUT profession_type on purpose so the
  // migration's DEFAULT 'realtor' must backfill them (mirrors existing live
  // records created before 0022, e.g. Elena Martinez).
  const insert = (overrides = {}) => {
    const cols = [
      "id", "slug", "status", "pin", "name", "brokerage_name", "license_number",
      "phone", "email", "service_area", "bio", "tagline", "photo_url", "languages",
      "specialties", "service_areas", "years_experience", "username", "first_name",
      "last_name", "display_name", "office_name", "team_name", "license_state",
      "preferred_language", "featured", "snaplink_status", "southline_status",
    ];
    if (overrides.professionType) cols.push("profession_type");
    const row = {
      id: "ap_x", slug: "x", status: "active", pin: null, name: "X", brokerage_name: "",
      license_number: "", phone: "", email: "x@example.com", service_area: "",
      bio: "", tagline: null, photo_url: null, languages: "[]", specialties: "[]",
      service_areas: "[]", years_experience: null, username: null, first_name: "",
      last_name: "", display_name: "", office_name: "", team_name: "", license_state: "",
      preferred_language: "en", featured: false, snaplink_status: "draft", southline_status: "published",
      ...overrides,
    };
    const names = cols.map((c) => `"${c}"`).join(", ");
    const vals = cols.map((c) => {
      const v = c === "profession_type" ? row.professionType : row[c];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "string") {
        if (v.startsWith("[") || v.startsWith("{")) return `'${v}'::jsonb`;
        return `'${v.replace(/'/g, "''")}'`;
      }
      return String(v);
    }).join(", ");
    return `INSERT INTO agent_profiles (${names}) VALUES (${vals})`;
  };

  await pool.query(insert({
    id: "apx_demo_elena_martinez", slug: "elena-martinez", name: "Elena Martinez",
    brokerage_name: "Southline Realty Group", email: "elena@example.com",
    service_area: "North Atlanta", southline_status: "published",
    specialties: '["Luxury residential","Relocation"]', service_areas: '["Alpharetta","Milton"]',
  }));
  await pool.query(insert({
    id: "ap_test_draft", slug: "drafty", name: "Drafty", email: "draft@example.com",
    southline_status: "draft",
  }));
  await pool.query(insert({
    id: "ap_test_hidden", slug: "hiddie", name: "Hiddie", email: "hidden@example.com",
    southline_status: "hidden",
  }));
  await pool.query(insert({
    id: "ap_test_suspended", slug: "susie", name: "Susie", email: "sus@example.com",
    status: "suspended", southline_status: "published",
  }));
  // Explicit professionType (post-0022 style write path) + trade profession:
  // a published general contractor and a featured realtor for sorting tests.
  await pool.query(insert({
    id: "ap_test_gc", slug: "jose-carpenter", name: "Jose Carpentry", status: "active",
    professionType: "contractor", email: "jose@example.com", service_area: "Austin, TX 78704",
    southline_status: "published", specialties: '["Interior Painting","Deck & Patio"]',
  }));
  await pool.query(insert({
    id: "ap_test_featured", slug: "zoe-realtor", name: "Zoe Realtor", status: "active",
    professionType: "realtor", email: "zoe@example.com", service_area: "Austin, TX 78704",
    southline_status: "featured", featured: true,
    categories: '["Real Estate"]', specialties: '["Buyer Representation"]',
  }));
  await pool.query(insert({
    id: "ap_test_austin", slug: "alice-agent", name: "Alice Agent", status: "active",
    professionType: "realtor", email: "alice@example.com", service_area: "Austin, TX 78704",
    southline_status: "published", specialties: '["Interior Painting"]',
  }));
  await pool.query(insert({
    id: "ap_test_houston", slug: "bob-agent", name: "Bob Agent", status: "active",
    professionType: "mortgage_broker", email: "bob@example.com", service_area: "Houston, TX",
    southline_status: "published",
  }));
}

const contractorFixture = (overrides = {}) => ({
  id: "ctr_review_1",
  username: "review-painting-co",
  professionType: "painting",
  businessName: "Review Painting Co",
  ownerName: "",
  phone: "555-0101",
  email: "review@example.com",
  serviceArea: "Austin, TX 78704",
  services: ["Interior Painting"],
  tagline: "Licensed painters",
  preferredLanguage: "en",
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

test.before(async () => {
  if (guard) return;
  await resetAndSeed();
});

test.after(async () => {
  await pool.end();
});

const skipOpts = guard ? { skip: guard } : {};

test("REFUSES to run outside the dedicated scratch database", () => {
  assert.equal(guard, "", `guard must be empty, got: ${guard}`);
});

test("01 published active profiles appear in Southline search", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([], agents, {});
  const slugs = results.map((r) => r.slug);
  assert.ok(slugs.includes("elena-martinez"));
  assert.ok(slugs.includes("alice-agent"));
});

test("02 draft profiles do not appear", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([], agents, {});
  assert.ok(!results.some((r) => r.slug === "drafty"));
});

test("03 hidden profiles do not appear", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([], agents, {});
  assert.ok(!results.some((r) => r.slug === "hiddie"));
});

test("04 suspended profiles do not appear", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([], agents, {});
  assert.ok(!results.some((r) => r.slug === "susie"));
});

test("05 agent and contractor results use the expected shape", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([contractorFixture()], agents, {});
  const elena = results.find((r) => r.slug === "elena-martinez");
  const ctr = results.find((r) => r.kind === "contractor");
  assert.ok(elena);
  assert.equal(elena.kind, "agent");
  assert.equal(elena.name, "Elena Martinez");
  assert.equal(elena.href, "/agents/elena-martinez");
  assert.equal(elena.professionType, "realtor");
  assert.equal(typeof elena.featured, "boolean");
  assert.ok(Array.isArray(elena.services));
  assert.ok(Array.isArray(elena.categories));
  assert.ok(ctr);
  assert.equal(ctr.kind, "contractor");
  assert.equal(ctr.name, "Review Painting Co");
  assert.equal(ctr.href, "/contractor/review-painting-co");
  assert.equal(ctr.professionType, "painting");
});

test("06 category filtering works across agents and contractors", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([contractorFixture()], agents, { category: "paint_drywall" });
  const slugs = results.map((r) => r.slug || r.username);
  assert.ok(slugs.includes("alice-agent"), "agent with Interior Painting specialty matches");
  assert.ok(slugs.includes("jose-carpenter"), "agent with Interior Painting specialty matches");
  assert.ok(slugs.includes("review-painting-co"), "contractor with Interior Painting service matches");
  assert.ok(!slugs.includes("bob-agent"), "mortgage broker without the category is excluded");
});

test("07 service-area / ZIP text filtering works", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const byZip = searchProfessionals([], agents, { query: "78704" });
  assert.ok(byZip.some((r) => r.slug === "alice-agent"));
  assert.ok(byZip.some((r) => r.slug === "jose-carpenter"));
  assert.ok(!byZip.some((r) => r.slug === "bob-agent"), "Houston agent does not match Austin ZIP");
  const byArea = searchProfessionals([], agents, { query: "North Atlanta" });
  assert.ok(byArea.some((r) => r.slug === "elena-martinez"));
});

test("08 featured sorting: featured first, then name ascending", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([], agents, {});
  assert.ok(results.length > 0);
  assert.equal(results[0].slug, "zoe-realtor", "featured agent is first in the results");
  const tail = results.slice(1).map((r) => r.name);
  const sortedTail = [...tail].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(tail, sortedTail, "non-featured results are name-sorted");
});

test("09 English and Spanish profession labels stay correct", skipOpts, () => {
  assert.equal(agentProfessionTypeLabel("realtor", "en"), "Realtor");
  assert.equal(agentProfessionTypeLabel("realtor", "es"), "Agente de Bienes Raíces");
  assert.equal(agentProfessionTypeLabel("contractor", "en"), "General Contractor");
  assert.equal(professionTypeLabel("painting", "en"), "Painting");
  assert.equal(professionTypeLabel("painting", "es"), "Pintura");
});

test("10 existing Elena Martinez record stays visible with the migration default", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const elena = agents.find((a) => a.slug === "elena-martinez");
  assert.ok(elena, "Elena row still exists");
  assert.equal(elena.professionType, "realtor", "profession_type default backfilled Elena");
  const inSearch = searchProfessionals([], [elena], { query: "elena" })[0];
  assert.ok(inSearch, "Elena still matches search");
  assert.equal(inSearch.professionType, "realtor");
});

test("11 existing contractor records remain functional", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([contractorFixture()], agents, { query: "painting" });
  assert.ok(results.some((r) => r.kind === "contractor" && r.slug === "review-painting-co"));
});

test("12 fallback to SnapLink Local remains available (empty agent set still returns contractors)", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const results = searchProfessionals([contractorFixture()], agents, {});
  assert.ok(results.some((r) => r.kind === "contractor"));
  const withFallback = searchProfessionals([contractorFixture()], [], {});
  assert.ok(withFallback.some((r) => r.kind === "contractor"), "empty agent list still yields contractors");
});

test("13 no duplicate profile rows: unique slug is enforced by the store", skipOpts, async () => {
  const input = {
    firstName: "Dup", lastName: "Person", displayName: "Dup Person",
    username: "dup-person", email: "dup@example.com", phone: "555-0199",
    professionType: "realtor",
  };
  await assert.rejects(
    pgAgentProfileStore.createAgent("ap_dup", input, "elena-martinez"),
    (e) => {
      const cause = e && e.cause;
      const text = [cause?.detail, cause?.message, cause?.code, e?.message]
        .filter(Boolean)
        .join(" ");
      return /duplicate|unique|23505/i.test(text);
    },
    "creating an agent with an existing slug must be rejected"
  );
  const count = await pool.query("select count(*) c from agent_profiles where slug = 'elena-martinez'");
  assert.equal(Number(count.rows[0].c), 1);
});

test("14 migration defaults do not hide existing live records", skipOpts, async () => {
  const agents = await pgAgentProfileStore.list();
  const seededWithoutType = agents.find((a) => a.slug === "drafty" || a.slug === "hiddie" || a.slug === "susie");
  assert.ok(seededWithoutType, "rows inserted without profession_type exist");
  assert.equal(seededWithoutType.professionType, "realtor", "DEFAULT 'realtor' applied to pre-0022-style rows");
  const published = agents.filter((a) => a.status === "active" && (a.southlineStatus === "published" || a.southlineStatus === "featured"));
  assert.ok(published.length >= 4, "no published row was hidden by the new column");
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isPublicContractor, searchProfessionals } from "../lib/southline-search.ts";
import { evaluateProfilePublicationEligibility } from "../lib/professional-intake-payment/eligibility.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

const contractor = (overrides = {}) => ({
  id: "ctr_1",
  username: "ace-roofing",
  professionType: "roofing",
  businessName: "Ace Roofing",
  ownerName: "",
  phone: "555-0100",
  email: "ace@example.com",
  serviceArea: "Austin, TX",
  services: ["Roofing"],
  tagline: "Local roofers",
  preferredLanguage: "en",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

test("lifecycle gate: only published non-demo contractors are publicly discoverable", () => {
  assert.equal(isPublicContractor(contractor({ isDemo: false, status: "published" })), true);
  assert.equal(isPublicContractor(contractor({ isDemo: false, status: "draft" })), false);
  assert.equal(isPublicContractor(contractor({ isDemo: false, status: "onboarding" })), false);
  assert.equal(isPublicContractor(contractor({ isDemo: false, status: "ready" })), false);
  assert.equal(isPublicContractor(contractor({ isDemo: false, status: "suspended" })), false);
  assert.equal(isPublicContractor(contractor({ isDemo: true, status: "published" })), false, "demo never public even when published");
  assert.equal(isPublicContractor(contractor({ isDemo: false })), false, "missing status defaults hidden (draft)");
});

test("searchProfessionals applies the lifecycle publish gate to contractors", () => {
  const published = contractor({ id: "ctr_pub", username: "pub", status: "published", isDemo: false });
  const draft = contractor({ id: "ctr_draft", username: "draft", status: "draft", isDemo: false });
  const suspended = contractor({ id: "ctr_sus", username: "sus", status: "suspended", isDemo: false });
  const demoPublished = contractor({ id: "ctr_demo", username: "demo", status: "published", isDemo: true });
  const out = searchProfessionals([published, draft, suspended, demoPublished], [], { query: "" }).map((r) => r.id);
  assert.deepEqual([...out].sort(), ["ctr_pub"]);
});

test("eligibility gate reused by landing-page route (single derived rule)", () => {
  const eligible = evaluateProfilePublicationEligibility({
    profileApproved: true,
    paymentStatus: "paid",
    planActive: true,
    entitlementValid: true,
  });
  assert.equal(eligible.canPublish, true);

  const unpaid = evaluateProfilePublicationEligibility({
    profileApproved: true,
    paymentStatus: "payment_required",
    planActive: true,
    entitlementValid: true,
  });
  assert.equal(unpaid.canPublish, false);
  assert.ok(unpaid.reasons.some((r) => r.includes("Payment is still required")));
});

test("schema + migration 0028: contractors.status default draft, existing rows backfilled to published", async () => {
  const schema = await source("../lib/db/schema.ts");
  assert.match(schema, /status: text\("status"\)\.notNull\(\)\.default\("draft"\)/, "contractors.status defaults to draft");
  const migration = await source("../drizzle/0028_0028_september_contractor_lifecycle.sql");
  assert.match(migration, /ALTER TABLE "contractors" ADD COLUMN "status"/);
  assert.match(migration, /UPDATE "contractors" SET "status" = 'published' WHERE "status" = 'draft'/, "backfill keeps existing rows visible");
  const journal = await source("../drizzle/meta/_journal.json");
  assert.match(journal, /0028_0028_september_contractor_lifecycle/);
});

test("Contractor type + PG/JSON stores carry status and support lifecycle updates", async () => {
  const types = await source("../lib/types.ts");
  assert.match(types, /ContractorStatus = "draft" \| "onboarding" \| "ready" \| "published" \| "suspended"/);
  const pg = await source("../lib/store-pg.ts");
  assert.match(pg, /status: row\.status as Contractor\["status"\]/, "PG mapper reads status back");
  assert.match(pg, /status: c\.status \?\? "draft"/, "PG create defaults draft");
  assert.match(pg, /if \(patch\.status !== undefined\) set\.status = patch\.status/, "PG update persists status transitions");
  const json = await source("../lib/store-json.ts");
  assert.match(json, /if \(patch\.status !== undefined\) c\.status = patch\.status/, "JSON update persists status transitions");
});

test("operator transition: profiles PATCH accepts operator-only status with validation", async () => {
  const route = await source("../app/api/contractor/profiles/route.ts");
  assert.match(route, /body\.status !== undefined/);
  assert.match(route, /\["draft", "onboarding", "ready", "published", "suspended"\]\.includes\(body\.status\)/, "validates lifecycle values");
  assert.match(route, /patch\.status = body\.status as ContractorStatus/);
  assert.match(route, /Invalid contractor status/, "rejects unknown statuses");
});

test("public surfaces route contractors through the lifecycle publish gate", async () => {
  // Every public-discovery surface either calls listPublished() — the SQL-side
  // publish gate (is_demo=false AND status=published) — or re-checks
  // isPublicContractor as the single-page lookup guard. The store's
  // listPublished() predicate is itself asserted to equal isPublicContractor.
  const sqlGated = [
    ["../app/page.tsx", /getCachedPublishedContractors\(\)/],
    ["../app/sitemap.ts", /listPublished\(\)/],
    ["../app/book/page.tsx", /listPublished\(\)/],
    ["../app/planner/page.tsx", /listPublished\(\)/],
    ["../app/for-contractors/page.tsx", /listPublished\(\)/],
    ["../app/ideas/[category]/page.tsx", /listPublished\(\)/],
    ["../app/api/contractor/profiles/public/route.ts", /listPublished\(\)/],
    ["../app/api/southline/search/route.ts", /getCachedPublishedContractors\(\)/],
    ["../app/results/page.tsx", /getCachedPublishedContractors\(\)/],
  ];
  const lookupGated = [
    ["../app/contractor/[username]/page.tsx", /isPublicContractor\(contractor\)/],
  ];
  for (const [file, re] of sqlGated) {
    const src = await source(file);
    assert.match(src, re, `${file} must use the SQL-side publish gate (listPublished)`);
  }
  for (const [file, re] of lookupGated) {
    const src = await source(file);
    assert.match(src, re, `${file} must still apply the lifecycle publish gate`);
  }
  // The homepage caches public professionals via lib/public-cache.ts, which
  // must still enforce the publish gate in SQL so a cached entry can never
  // expose unpublished/demo rows.
  const cache = await source("../lib/public-cache.ts");
  assert.match(cache, /contractorStore\.listPublished\(\)/, "public-cache.ts must call listPublished() (SQL-side gate)");
  assert.match(cache, /agentProfileStore\.listActive\(\)/, "public-cache.ts caches active agents");
});

test("landing-page paid gate: server enforces eligibility on publish, UI disables the toggle", async () => {
  const route = await source("../app/api/contractor/landing-page/route.ts");
  assert.match(route, /getProfessionalBillingSummary/, "route reads billing");
  assert.match(route, /evaluateProfilePublicationEligibility/, "route reuses the single eligibility rule");
  assert.match(route, /eligibility\.canPublish/, "route only publishes when eligible");
  assert.match(route, /status: 409/, "ineligible publish is rejected with 409");
  const editor = await source("../components/admin/LandingPageEditor.tsx");
  assert.match(editor, /eligibility/, "editor consumes eligibility from GET");
  assert.match(editor, /disabled=\{!published && Boolean\(eligibility\) && !eligibility!\.canPublish\}/, "toggle disabled when ineligible");
});

test("PG mappers carry operator manual-payment overrides so the paid gate round-trips (3c)", async () => {
  for (const file of ["../lib/store-pg.ts", "../lib/agent-profiles/store-pg.ts"]) {
    const src = await source(file);
    assert.match(src, /manualPaymentStatus: row\.manualPaymentStatus \?\? undefined/, `${file} maps manualPaymentStatus`);
    assert.match(src, /manualPaymentNote: row\.manualPaymentNote \?\? undefined/);
    assert.match(src, /manualPaymentSetAt: row\.manualPaymentSetAt \?\? undefined/);
    assert.match(src, /manualPaymentSetBy: row\.manualPaymentSetBy \?\? undefined/);
  }
});

test("intake publish route transitions contractors to published through the eligibility gate", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/publish/route.ts");
  assert.match(route, /contractorStore\.update\(session\.ownerId, \{ status: "published" \}\)/);
  assert.match(route, /publicationMode: "contractor_status_published"/);
});
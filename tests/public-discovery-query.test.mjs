import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
  status: "published",
  isDemo: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

// The predicate used by the JSON/published discovery filter — mirrors
// isPublicContractor (lib/southline-search.ts). Reused here so the SQL and
// JSON implementations are checked against ONE source of truth per status.
const published = (c) => !c.isDemo && c.status === "published";

test("PG listPublished pushes the publish gate into SQL (is_demo=false AND status=published)", async () => {
  const pg = await source("../lib/store-pg.ts");
  assert.match(pg, /listPublished\(\)/);
  assert.match(pg, /eq\(contractors\.isDemo, false\)/, "SQL must exclude demo rows");
  assert.match(pg, /eq\(contractors\.status, "published"\)/, "SQL must require status=published");
});

test("PG listPublicActive pushes the agent listing contract into SQL", async () => {
  const pg = await source("../lib/agent-profiles/store-pg.ts");
  assert.match(pg, /listPublicActive\(\)/);
  assert.match(pg, /eq\(agentProfiles\.isDemo, false\)/, "SQL must exclude demo agents");
  assert.match(pg, /eq\(agentProfiles\.status, "active"\)/, "SQL must require status=active");
  assert.match(pg, /inArray\(agentProfiles\.southlineStatus, \["published", "featured"\]\)/, "SQL must require a southline listing");
});

test("JSON listPublished filter uses the same publish gate predicate", async () => {
  const json = await source("../lib/store-json.ts");
  assert.match(json, /listPublished\(\)/);
  assert.match(json, /filter\(\(c\) => !c\.isDemo && c\.status === "published"\)/, "JSON filter must match isPublicContractor");
});

test("JSON listPublicActive filter uses the agent listing contract", async () => {
  const json = await source("../lib/agent-profiles/store-json.ts");
  assert.match(json, /listPublicActive\(\)/);
  assert.match(json, /p\.status === "active"/);
  assert.match(json, /!p\.isDemo/);
  assert.match(json, /p\.southlineStatus === "published" \|\| p\.southlineStatus === "featured"/);
});

test("publish-gate predicate: draft excluded", () => {
  assert.equal(published(contractor({ status: "draft" })), false);
});

test("publish-gate predicate: onboarding excluded", () => {
  assert.equal(published(contractor({ status: "onboarding" })), false);
});

test("publish-gate predicate: ready excluded", () => {
  assert.equal(published(contractor({ status: "ready" })), false);
});

test("publish-gate predicate: suspended excluded", () => {
  assert.equal(published(contractor({ status: "suspended" })), false);
});

test("publish-gate predicate: demo excluded even when published", () => {
  assert.equal(published(contractor({ status: "published", isDemo: true })), false);
});

test("publish-gate predicate: published non-demo included", () => {
  assert.equal(published(contractor({ status: "published", isDemo: false })), true);
});

test("listPublished leaves the internal list() (admin) untouched", async () => {
  const pg = await source("../lib/store-pg.ts");
  const json = await source("../lib/store-json.ts");
  assert.match(pg, /async list\(\): Promise<Contractor\[\]>/, "generic list() still returns all rows for admin/internal code");
  assert.match(json, /async list\(\): Promise<Contractor\[\]>/, "generic JSON list() still returns all rows");
});

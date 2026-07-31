import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("campaigns migration is additive and complete", async () => {
  const sql = await source("../drizzle/0015_contractor_modules.sql");
  assert.match(sql, /CREATE TABLE "campaigns"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("lib/store.ts exports campaignStore gated by usePg", async () => {
  const text = await source("../lib/store.ts");
  assert.match(text, /export const campaignStore = usePg \? pgCampaignStore : jsonCampaignStore;/);
});

test("every contractor campaigns API route calls authorizeContractorId", async () => {
  const routes = [
    "../app/api/contractor/campaigns/route.ts",
    "../app/api/contractor/campaigns/[id]/route.ts",
    "../app/api/contractor/campaigns/[id]/status/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /authorizeContractorId/, `${route} must call authorizeContractorId`);
  }
});

test("the public /c/[username]/[slug] route never imports operator-bypass auth and only renders live active campaigns", async () => {
  const text = await source("../app/c/[username]/[slug]/page.tsx");
  assert.doesNotMatch(text, /isOperator|pinFromRequest/);
  assert.match(text, /campaign\.status !== "active"/);
  assert.match(text, /!isLive\(campaign\)/);
});

test("the public campaign route respects startsAt/endsAt scheduling, not just status", async () => {
  const text = await source("../app/c/[username]/[slug]/page.tsx");
  assert.match(text, /campaign\.startsAt/);
  assert.match(text, /campaign\.endsAt/);
});

test("the Dashboard campaigns tab link only renders in scoped (contractor) mode", async () => {
  const text = await source("../components/admin/Dashboard.tsx");
  const idx = text.indexOf("/campaigns`");
  assert.ok(idx > -1, "Dashboard.tsx must link to the contractor campaigns tab");
  assert.match(text.slice(Math.max(0, idx - 200), idx), /mode === "scoped"/);
});

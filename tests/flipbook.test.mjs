import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("flip_campaigns/flip_pages migration is additive and complete", async () => {
  const sql = await source("../drizzle/0015_contractor_modules.sql");
  for (const table of ["flip_campaigns", "flip_pages"]) {
    assert.match(sql, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("flip_pages has a cascading FK to flip_campaigns", async () => {
  const sql = await source("../drizzle/0015_contractor_modules.sql");
  assert.match(sql, /flip_pages_campaign_id_flip_campaigns_id_fk.*ON DELETE cascade/s);
});

test("lib/store.ts exports flipCampaignStore/flipPageStore gated by usePg", async () => {
  const text = await source("../lib/store.ts");
  assert.match(text, /export const flipCampaignStore = usePg \? pgFlipCampaignStore : jsonFlipCampaignStore;/);
  assert.match(text, /export const flipPageStore = usePg \? pgFlipPageStore : jsonFlipPageStore;/);
});

test("every contractor flipbook API route calls authorizeContractorId", async () => {
  const routes = [
    "../app/api/contractor/flipbook/campaigns/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/status/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/pages/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/pages/reorder/route.ts",
    "../app/api/contractor/flipbook/pages/[pageId]/route.ts",
    "../app/api/contractor/flipbook/upload/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /authorizeContractorId/, `${route} must call authorizeContractorId`);
  }
});

test("the public /f/[token] route never imports operator-bypass auth and gates on published status", async () => {
  const text = await source("../app/f/[token]/page.tsx");
  assert.doesNotMatch(text, /isOperator|pinFromRequest/);
  assert.match(text, /status !== "published"/);
});

test("the flipbook upload route reuses the existing @vercel/blob-or-data-url fallback pattern", async () => {
  const text = await source("../app/api/contractor/flipbook/upload/route.ts");
  assert.match(text, /BLOB_READ_WRITE_TOKEN/);
  assert.match(text, /data:\$\{file\.type\}/);
});

test("the Dashboard flipbook tab link only renders in scoped (contractor) mode", async () => {
  const text = await source("../components/admin/Dashboard.tsx");
  const idx = text.indexOf("/flipbook");
  assert.ok(idx > -1, "Dashboard.tsx must link to the contractor flipbook tab");
  assert.match(text.slice(Math.max(0, idx - 200), idx), /mode === "scoped"/);
});

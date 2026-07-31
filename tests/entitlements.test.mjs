import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("professional_module_entitlements migration is additive and complete", async () => {
  const sql = await source("../drizzle/0016_module_entitlements.sql");
  assert.match(sql, /CREATE TABLE "professional_module_entitlements"/);
  assert.match(sql, /"enabled" boolean DEFAULT false NOT NULL/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("lib/store.ts exports entitlementStore gated by usePg", async () => {
  const text = await source("../lib/store.ts");
  assert.match(text, /export const entitlementStore = usePg \? pgEntitlementStore : jsonEntitlementStore;/);
});

test("only real, existing modules are gated — no dead flags", async () => {
  const text = await source("../lib/entitlement-types.ts");
  const keysLine = text.match(/export const MODULE_KEYS: ModuleKey\[\] = \[([^\]]*)\];/)[1];
  assert.match(text, /"flipbook" \| "mini_campaigns" \| "invoices" \| "money"/);
  assert.doesNotMatch(keysLine, /booking|reviews|store|analytics/i);
});

test("isModuleEnabled defaults to false when no entitlement row exists", async () => {
  const text = await source("../lib/entitlements.ts");
  assert.match(text, /row\?\.enabled \?\? false/);
});

test("the entitlements API requires operator PIN to mutate, but any authorized party can read", async () => {
  const text = await source("../app/api/contractor/entitlements/route.ts");
  const postBody = text.slice(text.indexOf("export async function POST"));
  assert.match(postBody, /isOperator\(pin\)/, "POST (mutation) must require isOperator");
  const getBody = text.slice(text.indexOf("export async function GET"), text.indexOf("export async function POST"));
  assert.match(getBody, /authorizeContractorId/, "GET (read) must still require contractor-scoped auth");
});

test("every gated Flipbook route calls requireModuleEnabled for the flipbook module", async () => {
  const routes = [
    "../app/api/contractor/flipbook/campaigns/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/status/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/pages/route.ts",
    "../app/api/contractor/flipbook/campaigns/[id]/pages/reorder/route.ts",
    "../app/api/contractor/flipbook/pages/[pageId]/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /requireModuleEnabled\([^,]+,\s*"flipbook"\)/, `${route} must gate on the flipbook module`);
  }
});

test("the shared upload route requires a valid module and checks its entitlement dynamically", async () => {
  const text = await source("../app/api/contractor/flipbook/upload/route.ts");
  assert.match(text, /MODULE_KEYS\.includes/);
  assert.match(text, /requireModuleEnabled\(contractorId, moduleKey as ModuleKey\)/);
});

test("both upload callers (Flipbook and Mini Campaigns) declare their module", async () => {
  const flipbook = await source("../components/admin/FlipbookEditor.tsx");
  assert.match(flipbook, /form\.append\("module", "flipbook"\)/);
  const campaign = await source("../components/admin/CampaignEditor.tsx");
  assert.match(campaign, /form\.append\("module", "mini_campaigns"\)/);
});

test("every gated Campaign route calls requireModuleEnabled for mini_campaigns", async () => {
  const routes = [
    "../app/api/contractor/campaigns/route.ts",
    "../app/api/contractor/campaigns/[id]/route.ts",
    "../app/api/contractor/campaigns/[id]/status/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /requireModuleEnabled\([^,]+,\s*"mini_campaigns"\)/, `${route} must gate on mini_campaigns`);
  }
});

test("every gated Invoice route calls requireModuleEnabled for invoices", async () => {
  const routes = [
    "../app/api/contractor/invoices/route.ts",
    "../app/api/contractor/invoices/[id]/route.ts",
    "../app/api/contractor/invoices/[id]/send/route.ts",
    "../app/api/contractor/invoices/status/route.ts",
    "../app/api/contractor/invoices/connect/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /requireModuleEnabled\([^,]+,\s*"invoices"\)/, `${route} must gate on invoices`);
  }
});

test("disabling Invoices never touches the public hosted-invoice redirect or the Stripe webhook", async () => {
  const publicPage = await source("../app/i/[token]/page.tsx");
  assert.doesNotMatch(publicPage, /requireModuleEnabled|isModuleEnabled/, "already-sent Stripe links must stay payable regardless of module state");
  const webhook = await source("../app/api/webhooks/stripe/route.ts");
  assert.doesNotMatch(webhook, /requireModuleEnabled|isModuleEnabled/, "webhook sync must continue even if the module is later disabled");
});

test("public Flipbook and Campaign pages return unavailable content when their module is disabled, without deleting data", async () => {
  const flipbook = await source("../app/f/[token]/page.tsx");
  assert.match(flipbook, /isModuleEnabled\(campaign\.contractorId, "flipbook"\)/);
  assert.match(flipbook, /notFound\(\)/);
  assert.doesNotMatch(flipbook, /\.delete\(|removeCampaign|deleteCampaign/i);

  const campaign = await source("../app/c/[username]/[slug]/page.tsx");
  assert.match(campaign, /isModuleEnabled\(contractor\.id, "mini_campaigns"\)/);
});

test("the contractor Dashboard hides disabled module tabs behind fetched entitlement state, not a hardcoded flag", async () => {
  const text = await source("../components/admin/Dashboard.tsx");
  assert.match(text, /api\/contractor\/entitlements/);
  assert.match(text, /modules\.flipbook &&/);
  assert.match(text, /modules\.mini_campaigns &&/);
  assert.match(text, /modules\.invoices &&/);
});

test("all three module boards show a locked state (not a misleading empty state) on a 403", async () => {
  for (const board of ["FlipbookBoard", "CampaignBoard", "InvoiceBoard"]) {
    const text = await source(`../components/admin/${board}.tsx`);
    assert.match(text, /status === 403/, `${board} must detect a 403 distinctly from an empty list`);
    assert.match(text, /ModuleLocked/, `${board} must render the shared locked-state component`);
  }
});

test("the operator roster exposes per-module toggles that POST to the entitlements endpoint", async () => {
  const text = await source("../app/contractor-admin/page.tsx");
  assert.match(text, /function ModuleToggles/);
  assert.match(text, /method: "POST"/);
  assert.match(text, /api\/contractor\/entitlements/);
  assert.match(text, /money: "Money"/, "the roster must expose a toggle for the money module too");
});

test("every money-related route (Lucio Financial Copilot) calls requireModuleEnabled for money", async () => {
  const routes = [
    "../app/api/contractor/money-summary/route.ts",
    "../app/api/contractor/expenses/route.ts",
    "../app/api/contractor/expenses/[id]/route.ts",
    "../app/api/contractor/expense-categories/route.ts",
    "../app/api/contractor/tax-profile/route.ts",
    "../app/api/contractor/quarterly/route.ts",
    "../app/api/contractor/receipt-ocr/route.ts",
    "../app/api/contractor/setasides/route.ts",
    "../app/api/contractor/setasides/[id]/route.ts",
    "../app/api/contractor/payees/route.ts",
    "../app/api/contractor/payees/[id]/route.ts",
    "../app/api/contractor/forms-1099/route.ts",
    "../app/api/contractor/forms-1099/[id]/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /requireModuleEnabled\([^,]+,\s*"money"\)/, `${route} must gate on the money module`);
  }
});

test("the Money tab is gated behind fetched entitlement state, and MoneyBoard shows a locked state on 403", async () => {
  const dashboard = await source("../components/admin/Dashboard.tsx");
  assert.match(dashboard, /modules\.money &&/);

  const board = await source("../components/admin/MoneyBoard.tsx");
  assert.match(board, /status === 403/, "MoneyBoard must detect a 403 distinctly from an empty list");
  assert.match(board, /ModuleLocked/, "MoneyBoard must render the shared locked-state component");
});

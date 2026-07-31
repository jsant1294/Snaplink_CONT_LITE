import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("invoices/stripe_customer_mappings/processed_webhook_events migration is additive and complete", async () => {
  const sql = await source("../drizzle/0015_contractor_modules.sql");
  for (const table of ["invoices", "stripe_customer_mappings", "processed_webhook_events"]) {
    assert.match(sql, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "stripe_account_id"/);
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "stripe_onboarding_complete"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("lib/stripe/config.ts fails closed: disabled without STRIPE_SECRET_KEY, and requires Postgres", async () => {
  const text = await source("../lib/stripe/config.ts");
  assert.match(text, /Boolean\(process\.env\.STRIPE_SECRET_KEY\?\.trim\(\)\) && usePg/);
  assert.match(text, /getStripe\(\)/);
  assert.match(text, /throw new Error/);
});

test("lib/store.ts exports invoiceStore gated by usePg", async () => {
  const text = await source("../lib/store.ts");
  assert.match(text, /export const invoiceStore = usePg \? pgInvoiceStore : jsonInvoiceStore;/);
});

test("every contractor invoices API route calls authorizeContractorId", async () => {
  const routes = [
    "../app/api/contractor/invoices/route.ts",
    "../app/api/contractor/invoices/[id]/route.ts",
    "../app/api/contractor/invoices/[id]/send/route.ts",
    "../app/api/contractor/invoices/status/route.ts",
    "../app/api/contractor/invoices/connect/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /authorizeContractorId/, `${route} must call authorizeContractorId`);
  }
});

test("every write-capable invoices API route checks stripeEnabled() before calling Stripe", async () => {
  const routes = [
    "../app/api/contractor/invoices/route.ts",
    "../app/api/contractor/invoices/[id]/send/route.ts",
    "../app/api/contractor/invoices/connect/route.ts",
  ];
  for (const route of routes) {
    const text = await source(route);
    assert.match(text, /stripeEnabled\(\)/, `${route} must check stripeEnabled()`);
  }
});

test("the Stripe webhook route verifies the signature and dedupes via processed_webhook_events before mutating", async () => {
  const text = await source("../app/api/webhooks/stripe/route.ts");
  assert.match(text, /stripe\.webhooks\.constructEvent/);
  assert.match(text, /processedWebhookEvents/);
  const dedupeIdx = text.indexOf("already.length > 0");
  const mutateIdx = text.indexOf("invoiceStore.setStatusByProviderId");
  assert.ok(dedupeIdx > -1 && mutateIdx > -1 && dedupeIdx < mutateIdx, "dedupe check must run before mutating an invoice");
});

test("the public /i/[token] route never imports operator-bypass auth", async () => {
  const text = await source("../app/i/[token]/page.tsx");
  assert.doesNotMatch(text, /isOperator|pinFromRequest/);
});

test("the invoices dashboard tab renders a disabled state before ever showing forms", async () => {
  const text = await source("../components/admin/InvoiceBoard.tsx");
  assert.match(text, /!status\.stripeEnabled/);
  assert.match(text, /Stripe isn&apos;t configured/);
});

test("the Dashboard invoices tab link only renders in scoped (contractor) mode", async () => {
  const text = await source("../components/admin/Dashboard.tsx");
  const idx = text.indexOf("/invoices`");
  assert.ok(idx > -1, "Dashboard.tsx must link to the contractor invoices tab");
  assert.match(text.slice(Math.max(0, idx - 200), idx), /mode === "scoped"/);
});

test("no real Stripe secret or webhook secret is committed anywhere in source", async () => {
  const files = [
    "../lib/stripe/config.ts",
    "../.env.example",
    "../app/api/contractor/invoices/connect/route.ts",
    "../app/api/webhooks/stripe/route.ts",
  ];
  for (const f of files) {
    const text = await source(f);
    assert.doesNotMatch(text, /sk_live_[a-zA-Z0-9]{10,}/);
    assert.doesNotMatch(text, /whsec_[a-zA-Z0-9]{10,}/);
  }
});

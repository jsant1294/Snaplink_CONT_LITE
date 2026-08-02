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
  assert.match(text, /return Boolean\(key\) && usePg/);
  assert.match(text, /NODE_ENV === "test" && key\.startsWith\("sk_live_"\)/);
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
  assert.match(text, /nt\("stripeNotConfigured", lang\)/);
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

test("Stripe Connect readiness migration is additive and includes every readiness field", async () => {
  const sql = await source("../drizzle/0026_stripe_connect_readiness.sql");
  for (const column of ["stripe_details_submitted", "stripe_charges_enabled", "stripe_payouts_enabled", "stripe_requirements_currently_due", "stripe_disabled_reason", "stripe_last_synced_at", "stripe_connect_status"]) assert.match(sql, new RegExp(column));
  assert.doesNotMatch(sql, /DROP|TRUNCATE|DELETE FROM/i);
});

test("account.updated uses server-side readiness and safe unknown-account diagnostics", async () => {
  const webhook = await source("../app/api/webhooks/stripe/route.ts");
  assert.match(webhook, /event\.type === "account\.updated"/);
  assert.match(webhook, /getByStripeAccountId/);
  assert.match(webhook, /readinessPatchFromAccount/);
  assert.match(webhook, /account\.updated\.unknown_account/);
  assert.ok(webhook.indexOf("already.length > 0") < webhook.indexOf('event.type === "account.updated"'));
});

test("Connect URLs use signed state and never include a PIN", async () => {
  for (const route of ["../app/api/contractor/invoices/connect/route.ts", "../app/api/contractor/invoices/connect/refresh/route.ts", "../app/api/contractor/invoices/connect/return/route.ts"]) {
    const text = await source(route);
    assert.doesNotMatch(text, /pin=/);
    assert.doesNotMatch(text, /pinFromRequest|canAccessContractor/);
    assert.match(text, /state/);
  }
});

test("dashboard login route requires authorization, entitlement, and connected account", async () => {
  const route = await source("../app/api/contractor/invoices/connect/dashboard/route.ts");
  assert.match(route, /authorizeContractorId/);
  assert.match(route, /requireModuleEnabled/);
  assert.match(route, /stripeAccountId/);
  assert.match(route, /createLoginLink/);
});

test("Invoices UI renders all readiness states and dashboard access", async () => {
  const ui = await source("../components/admin/InvoiceBoard.tsx");
  for (const value of ["not_connected", "incomplete", "restricted", "ready"]) assert.match(ui, new RegExp(value));
  assert.match(ui, /Continue Stripe setup/);
  assert.match(ui, /Open Stripe Dashboard/);
  assert.match(ui, /Charges enabled/);
  assert.match(ui, /Payouts enabled/);
});

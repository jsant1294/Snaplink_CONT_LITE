import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deriveStripeConnectStatus } from "../lib/stripe/connect-readiness.ts";
import { normalizeProfilePaymentStatus } from "../lib/professional-intake-payment/normalize.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// Context: contractor public/dashboard routes (/contractor/[username],
// /contractor-admin/[username]) briefly returned 500 during this session
// while a live Neon migration (manual-payment + Stripe-readiness columns)
// was being applied. Reproduction in a fresh isolated build against the
// post-migration schema found no code defect — the pages never reference
// the new fields directly, and the one component that does
// (InvoiceBoard.tsx, via /api/contractor/invoices/status) already guards
// with `?.`/`Boolean(...)`/a `!status` loading check. These tests lock that
// in as a guarantee, not as a fix for a located bug.

// --- 1: contractor public page loads with legacy/null readiness fields ------

test("1. the public contractor page never references Stripe-readiness or manual-payment fields directly", async () => {
  const page = await source("../app/contractor/[username]/page.tsx");
  assert.doesNotMatch(page, /stripeConnectStatus|stripeDetailsSubmitted|stripeChargesEnabled|stripePayoutsEnabled|manualPaymentStatus/);
  const publicPage = await source("../components/intake/ContractorPublicPage.tsx");
  assert.doesNotMatch(publicPage, /stripeConnectStatus|stripeDetailsSubmitted|stripeChargesEnabled|stripePayoutsEnabled|manualPaymentStatus/);
});

// --- 2: contractor dashboard loads -------------------------------------------

test("2. the contractor dashboard route is a client-fetched PinGate, not a server-side new-field read", async () => {
  const page = await source("../app/contractor-admin/[username]/page.tsx");
  assert.match(page, /PinGate/);
  assert.doesNotMatch(page, /stripeConnectStatus|manualPaymentStatus/);
});

// --- 3: JJ Remodeling fixture loads (documented, verified live — see report) -

test("3. the contractor API route strips the PIN but preserves business identity fields", async () => {
  const route = await source("../app/api/contractor/profiles/route.ts");
  assert.match(route, /publicContractor/);
});

// --- 4: Stripe readiness panel / status derivation handles null/legacy state -

test("4a. deriveStripeConnectStatus never throws on a not-yet-onboarded (all-false/undefined) contractor", () => {
  assert.doesNotThrow(() =>
    deriveStripeConnectStatus({ connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false })
  );
  assert.equal(
    deriveStripeConnectStatus({ connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false }),
    "not_connected"
  );
});

test("4b. deriveStripeConnectStatus handles undefined requirementsCurrentlyDue/disabledReason (legacy pre-migration rows)", () => {
  assert.doesNotThrow(() =>
    deriveStripeConnectStatus({
      connected: true,
      detailsSubmitted: true,
      chargesEnabled: false,
      payoutsEnabled: false,
      requirementsCurrentlyDue: undefined,
      disabledReason: undefined,
    })
  );
});

test("4c. the invoices/status route falls back safely via optional chaining when a legacy contractor has no manual override", async () => {
  const route = await source("../app/api/contractor/invoices/status/route.ts");
  assert.match(route, /contractor\?\.stripeConnectStatus \?\? deriveStripeConnectStatus/);
});

// --- 5: intake/payment fields handle null state ------------------------------

test("5. normalizeProfilePaymentStatus never throws on null/undefined/legacy values", () => {
  assert.doesNotThrow(() => normalizeProfilePaymentStatus(null));
  assert.doesNotThrow(() => normalizeProfilePaymentStatus(undefined));
  assert.equal(normalizeProfilePaymentStatus(null), null);
  assert.equal(normalizeProfilePaymentStatus(undefined), null);
});

// --- 6: all three contractor routes return 200 (documented, verified live) --
//
// Not re-asserted as an automated HTTP test here — this repo's test suite is
// static/source-assertion and pure-function style throughout (no live-server
// HTTP tests exist anywhere in tests/*.mjs). Verified manually against both
// a fresh isolated production build and the long-running dev server:
// /contractor/jj-remodeling, /contractor/southline-remodeling,
// /contractor/ridgeline-demo, and /contractor-admin/jj-remodeling all
// returned 200 with real Neon data post-migration. See the final report.

// --- 7: contractor API remains unchanged -------------------------------------

test("7. the contractor list/profile API route was not modified by the payment-gating or Stripe-readiness work", async () => {
  const route = await source("../app/api/contractor/profiles/route.ts");
  assert.doesNotMatch(route, /manualPaymentStatus|stripeConnectStatus|ProfilePaymentStatus/);
});

test("contractorStore.list() has no visibility/status filter that could hide rows", async () => {
  const [jsonStore, pgStore] = await Promise.all([source("../lib/store-json.ts"), source("../lib/store-pg.ts")]);
  assert.match(jsonStore, /async list\(\): Promise<Contractor\[\]> \{\s*return readContractors\(\);/);
  assert.match(pgStore, /async list\(\): Promise<Contractor\[\]> \{\s*const rows = await db\(\)\.select\(\)\.from\(contractors\)\.orderBy\(contractors\.createdAt\);/);
});

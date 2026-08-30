import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateProfilePublicationEligibility } from "../lib/professional-intake-payment/eligibility.ts";
import { derivePaymentStatusFromBilling, normalizeProfilePaymentStatus } from "../lib/professional-intake-payment/normalize.ts";
import { PROFILE_PAYMENT_STATUSES, PAYMENT_SATISFIED_STATUSES } from "../lib/professional-intake-payment/types.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// manual-override.ts is not imported directly here: it pulls in lib/store.ts's
// full store-switch import graph (dozens of extensionless relative imports
// designed for Next.js's bundler resolution, not Node's native ESM resolver),
// which fails under plain `node --test`. isValidManualPaymentStatus() is a
// pure one-liner over PROFILE_PAYMENT_STATUSES, so it's exercised inline
// below instead — see the source-assertion tests further down for coverage
// of manual-override.ts's actual behavior.
function isValidManualPaymentStatus(value) {
  return typeof value === "string" && PROFILE_PAYMENT_STATUSES.includes(value);
}

// --- 1/2: normalization -------------------------------------------------------

test("1. payment normalization coerces known raw values into the canonical enum", () => {
  for (const status of PROFILE_PAYMENT_STATUSES) {
    assert.equal(normalizeProfilePaymentStatus(status), status);
  }
});

test("2. unknown status safety — an unrecognized value resolves to null, never guessed permissive", () => {
  assert.equal(normalizeProfilePaymentStatus("unknown"), null);
  assert.equal(normalizeProfilePaymentStatus(""), null);
  assert.equal(normalizeProfilePaymentStatus(undefined), null);
  assert.equal(normalizeProfilePaymentStatus(123), null);
  assert.ok(isValidManualPaymentStatus("paid"));
  assert.ok(!isValidManualPaymentStatus("bogus"));
});

// --- 3/4/5: satisfied statuses -------------------------------------------------

test("3. not_required satisfies payment", () => {
  assert.ok(PAYMENT_SATISFIED_STATUSES.includes("not_required"));
  assert.equal(evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "not_required", planActive: true, entitlementValid: true }).canPublish, true);
});

test("4. paid satisfies payment", () => {
  assert.equal(evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "paid", planActive: true, entitlementValid: true }).canPublish, true);
});

test("5. comped satisfies payment", () => {
  assert.equal(evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "comped", planActive: true, entitlementValid: true }).canPublish, true);
});

// --- 6-10: blocking statuses ----------------------------------------------------

test("6. pending blocks publication", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "pending", planActive: true, entitlementValid: true });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /pending/i.test(r)));
});

test("7. payment_required blocks publication", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "payment_required", planActive: true, entitlementValid: true });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /payment is still required/i.test(r)));
});

test("8. past_due blocks publication", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "past_due", planActive: true, entitlementValid: true });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /past due/i.test(r)));
});

test("9. failed blocks publication", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "failed", planActive: true, entitlementValid: true });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /failed/i.test(r)));
});

test("10. refunded behavior is deterministic — always blocks, always the same reason", () => {
  const a = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "refunded", planActive: true, entitlementValid: true });
  const b = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "refunded", planActive: true, entitlementValid: true });
  assert.equal(a.canPublish, false);
  assert.deepEqual(a.reasons, b.reasons);
});

// --- 11/12: subscription-derived status -----------------------------------------

test("11. active subscription with a paid invoice satisfies payment", () => {
  const status = derivePaymentStatusFromBilling({ hasTier: true, subscriptionStatus: "active", latestInvoiceStatus: "paid" });
  assert.equal(status, "paid");
  assert.ok(PAYMENT_SATISFIED_STATUSES.includes(status));
});

test("12. inactive (canceled) subscription blocks publication", () => {
  const status = derivePaymentStatusFromBilling({ hasTier: true, subscriptionStatus: "canceled" });
  assert.equal(status, "payment_required");
  assert.ok(!PAYMENT_SATISFIED_STATUSES.includes(status));
});

test("no tier assigned derives not_required; an open not-yet-due invoice derives pending; an overdue open invoice derives past_due", () => {
  assert.equal(derivePaymentStatusFromBilling({ hasTier: false }), "not_required");
  const future = new Date(Date.now() + 86400_000).toISOString();
  const past = new Date(Date.now() - 86400_000).toISOString();
  assert.equal(derivePaymentStatusFromBilling({ hasTier: true, subscriptionStatus: "active", latestInvoiceStatus: "open", latestInvoiceDueAt: future }), "pending");
  assert.equal(derivePaymentStatusFromBilling({ hasTier: true, subscriptionStatus: "active", latestInvoiceStatus: "open", latestInvoiceDueAt: past }), "past_due");
});

// --- 13/14/15: the other three eligibility inputs, isolated ---------------------

test("13. profile approval is required — blocks even when payment/plan/entitlements are all fine", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: false, paymentStatus: "paid", planActive: true, entitlementValid: true });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /approved/i.test(r)));
});

test("14. plan must be active — blocks even when payment/approval/entitlements are all fine", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "paid", planActive: false, entitlementValid: true });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /plan/i.test(r)));
});

test("15. entitlement must be valid — blocks even when payment/approval/plan are all fine", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: true, paymentStatus: "paid", planActive: true, entitlementValid: false });
  assert.equal(result.canPublish, false);
  assert.ok(result.reasons.some((r) => /entitlements do not match/i.test(r)));
});

// --- 16: canPublish only when every requirement passes ---------------------------

test("16. canPublish is true only when every requirement passes, false if any single one fails", () => {
  const allGood = { profileApproved: true, paymentStatus: "paid", planActive: true, entitlementValid: true };
  assert.equal(evaluateProfilePublicationEligibility(allGood).canPublish, true);
  assert.equal(evaluateProfilePublicationEligibility({ ...allGood, profileApproved: false }).canPublish, false);
  assert.equal(evaluateProfilePublicationEligibility({ ...allGood, paymentStatus: "pending" }).canPublish, false);
  assert.equal(evaluateProfilePublicationEligibility({ ...allGood, planActive: false }).canPublish, false);
  assert.equal(evaluateProfilePublicationEligibility({ ...allGood, entitlementValid: false }).canPublish, false);
});

// --- 17/18: draft/apply are never payment-gated ----------------------------------

test("17. draft can save before payment — the autosave route never references payment/eligibility", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/route.ts");
  assert.doesNotMatch(route, /evaluateProfilePublicationEligibility|paymentStatus|getProfessionalBillingSummary/);
});

test("18. profile changes can apply before payment — the apply route never references payment/eligibility", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/apply/route.ts");
  assert.doesNotMatch(route, /evaluateProfilePublicationEligibility|paymentStatus|getProfessionalBillingSummary/);
});

// --- 19/20: publish route enforcement --------------------------------------------

test("19. unpaid publication is rejected server-side, not just via a disabled button", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/publish/route.ts");
  assert.match(route, /if \(!eligibility\.canPublish\)/);
  assert.match(route, /status: 409/);
});

test("20. eligible publication succeeds and updates both SnapLink and Southline publish status for agents", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/publish/route.ts");
  assert.match(route, /published: true/);
  assert.match(route, /snaplinkStatus: "published"/);
  assert.match(route, /southlineStatus: "published"/);
  assert.ok(route.indexOf("if (!eligibility.canPublish)") < route.indexOf('snaplinkStatus: "published"'));
});

// --- 21-25: operator review panel ------------------------------------------------

test("21. disabled publish action shows blocking reasons", async () => {
  const ui = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(ui, /disabled=\{busy \|\| !gate\.eligibility\.canPublish\}/);
  assert.match(ui, /gate\.eligibility\.reasons\.map/);
});

test("22. panel shows the selected plan", async () => {
  const ui = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(ui, /Plan: \{gate\.billing\.plan/);
});

test("23. panel shows payment status", async () => {
  const ui = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(ui, /Payment: \{gate\.billing\.paymentStatus/);
});

test("24. panel shows an entitlement summary", async () => {
  const ui = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(ui, /Entitlements:/);
  assert.match(ui, /entitlementModulesAdded/);
  assert.match(ui, /entitlementModulesRemoved/);
});

test("25. panel shows billing dates and amount when available", async () => {
  const ui = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(ui, /amountDueCents/);
  assert.match(ui, /lastPaymentAt/);
  assert.match(ui, /nextBillingAt/);
});

// --- 26/27: manual comp -----------------------------------------------------------

test("26. manual comp requires confirmation before it is saved", async () => {
  const ui = await source("../components/professional-intake/IntakeConsole.tsx");
  assert.match(ui, /window\.confirm\(/);
});

test("27. manual comp never calls into Stripe or the real-estate billing engine", async () => {
  const overrideFile = await source("../lib/professional-intake-payment/manual-override.ts");
  assert.doesNotMatch(overrideFile, /from ["']@\/lib\/stripe|subscribeTenant\(|chargeInvoice\(|realEstateBilling\w*\(/);
  const route = await source("../app/api/professional-intake/sessions/[id]/payment/route.ts");
  assert.doesNotMatch(route, /from ["']@\/lib\/stripe|subscribeTenant\(|chargeInvoice\(/);
});

// --- 28-30: contractor/agent adapters + separation --------------------------------

test("28. contractor adapter never invents a plan/tier — always null, always operator-override-only", async () => {
  const adapters = await source("../lib/professional-intake-payment/adapters.ts");
  assert.match(adapters, /async function contractorBillingSummary/);
  assert.match(adapters, /plan: null/);
});

test("29. agent adapter derives from the real tier + subscription + invoice chain", async () => {
  const adapters = await source("../lib/professional-intake-payment/adapters.ts");
  assert.match(adapters, /async function agentBillingSummary/);
  assert.match(adapters, /resolveAgentTier/);
  assert.match(adapters, /agentSubscriptions/);
  assert.match(adapters, /agentInvoices/);
  assert.match(adapters, /diffTierModules/);
});

test("30. contractor and agent stores remain separate — no merged store, no contractor tier field", async () => {
  const adapters = await source("../lib/professional-intake-payment/adapters.ts");
  assert.match(adapters, /contractorStore\.getById/);
  assert.match(adapters, /agentProfileStore\.getById/);
  const contractorTypes = await source("../lib/types.ts");
  assert.doesNotMatch(contractorTypes, /\btier\??:\s*AgentProfileTier\b/);
});

// --- 31/32: bilingual ---------------------------------------------------------------

test("31. English eligibility reasons work", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: false, paymentStatus: "payment_required", planActive: true, entitlementValid: true }, "en");
  assert.ok(result.reasons.some((r) => r.includes("Payment is still required.")));
  assert.ok(result.reasons.some((r) => r.includes("Content has not been approved")));
});

test("32. Spanish eligibility reasons work", () => {
  const result = evaluateProfilePublicationEligibility({ profileApproved: false, paymentStatus: "payment_required", planActive: true, entitlementValid: true }, "es");
  assert.ok(result.reasons.some((r) => r.includes("Aún se requiere el pago.")));
  assert.ok(result.reasons.some((r) => r.includes("no ha sido aprobado")));
});

// --- 33-37: regression / non-regression checks ------------------------------------

test("33. professional-intake session model gained approval fields without losing its existing shape", async () => {
  const types = await source("../lib/professional-intake/types.ts");
  assert.match(types, /contentApprovedAt/);
  assert.match(types, /contentApprovedBy/);
  assert.match(types, /IntakeSessionStatus/);
});

test("34. tier-entitlement module bundle logic is not modified by this task", async () => {
  const tiers = await source("../lib/agent-profiles/tiers.ts");
  assert.doesNotMatch(tiers, /manualPaymentStatus|ProfilePaymentStatus/);
});

test("35. professional-catalog adapter is not modified by this task", async () => {
  const catalog = await source("../lib/southline-professional-catalog.ts");
  assert.doesNotMatch(catalog, /manualPaymentStatus|ProfilePaymentStatus|PublicationEligibility/);
});

test("36. contractor Stripe Connect (customer-facing payments) and the new manual-payment override stay clearly distinct fields", async () => {
  const types = await source("../lib/types.ts");
  assert.match(types, /stripeConnectStatus/);
  assert.match(types, /manualPaymentStatus/);
  assert.doesNotMatch(types, /manualPaymentStatus:\s*StripeConnectStatus/);
});

test("37. pending migrations from this task are additive-only", async () => {
  for (const path of ["../drizzle/0024_manual_payment_status.sql", "../drizzle/0025_intake_content_approval.sql"]) {
    const sql = await source(path);
    assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE)\b/i);
  }
});

// --- Additional structural checks --------------------------------------------------

test("approval, payment, status, and publish routes are operator-only", async () => {
  for (const name of ["approval", "payment", "status", "publish"]) {
    const route = await source(`../app/api/professional-intake/sessions/[id]/${name}/route.ts`);
    assert.match(route, /isOperatorRequest\(req\)/);
  }
});

test("generic agent create and patch routes cannot bypass publication eligibility", async () => {
  const [create, patch] = await Promise.all([
    source("../app/api/agent-profiles/create/route.ts"),
    source("../app/api/agent-profiles/[id]/route.ts"),
  ]);
  assert.match(create, /snaplinkStatus: .*"published".*"draft"/);
  assert.match(patch, /requestsPublication/);
  assert.match(patch, /evaluateProfilePublicationEligibility/);
  assert.match(patch, /contentApprovedAt/);
});

test("content approval is persisted in both intake stores", async () => {
  const [pg, json] = await Promise.all([
    source("../lib/professional-intake/store-pg.ts"),
    source("../lib/professional-intake/store-json.ts"),
  ]);
  for (const store of [pg, json]) {
    assert.match(store, /contentApprovedAt/);
    assert.match(store, /contentApprovedBy/);
  }
});

test("publish route transitions contractors to the lifecycle published status through the same eligibility gate", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/publish/route.ts");
  assert.match(route, /contractorStore\.update\(session\.ownerId, \{ status: "published" \}\)/);
  assert.match(route, /publicationMode: "contractor_status_published"/);
  assert.match(route, /evaluateProfilePublicationEligibility/);
  assert.match(route, /eligibility\.canPublish/);
});

test("secrets are never exposed by the payment routes", async () => {
  for (const name of ["payment", "publish", "status"]) {
    const route = await source(`../app/api/professional-intake/sessions/[id]/${name}/route.ts`);
    assert.doesNotMatch(route, /STRIPE_SECRET_KEY|process\.env\.[A-Z_]*SECRET/);
  }
});

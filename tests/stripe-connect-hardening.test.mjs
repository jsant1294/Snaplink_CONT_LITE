import test from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_CONNECT_STATE_SECRET = "test-only-state-secret-with-at-least-32-bytes";
const readiness = await import("../lib/stripe/connect-readiness.ts");
const state = await import("../lib/stripe/connect-state.ts");

test("ready requires details, charges, and payouts", () => {
  const base = { connected: true, detailsSubmitted: true, chargesEnabled: true, payoutsEnabled: true };
  assert.equal(readiness.deriveStripeConnectStatus(base), "ready");
  assert.equal(readiness.deriveStripeConnectStatus({ ...base, chargesEnabled: false }), "restricted");
  assert.equal(readiness.deriveStripeConnectStatus({ ...base, payoutsEnabled: false }), "restricted");
  assert.equal(readiness.deriveStripeConnectStatus({ ...base, detailsSubmitted: false }), "incomplete");
  assert.equal(readiness.deriveStripeConnectStatus({ ...base, connected: false }), "not_connected");
});

test("account mapper persists all readiness fields", () => {
  const patch = readiness.readinessPatchFromAccount({ details_submitted: true, charges_enabled: true, payouts_enabled: true, requirements: { currently_due: [], disabled_reason: null } }, new Date("2026-01-02T03:04:05Z"));
  assert.equal(patch.stripeDetailsSubmitted, true);
  assert.equal(patch.stripeChargesEnabled, true);
  assert.equal(patch.stripePayoutsEnabled, true);
  assert.equal(patch.stripeConnectStatus, "ready");
  assert.equal(patch.stripeLastSyncedAt, "2026-01-02T03:04:05.000Z");
});

test("signed state validates, expires, rejects tampering, and contains no PIN", () => {
  const token = state.createStripeConnectState("contractor_1", "/contractor-admin/acme/invoices", 1000);
  assert.ok(state.verifyStripeConnectState(token, 1001));
  assert.equal(state.verifyStripeConnectState(token, 1601), null);
  assert.equal(state.verifyStripeConnectState(`${token}x`, 1001), null);
  assert.doesNotMatch(token, /pin|777777/i);
});

test("state destination allowlist fails closed", () => {
  assert.equal(state.isSafeConnectDestination("https://evil.example"), false);
  assert.equal(state.isSafeConnectDestination("/contractor-admin/acme/invoices"), true);
  assert.throws(() => state.createStripeConnectState("c1", "//evil.example", 1000));
});

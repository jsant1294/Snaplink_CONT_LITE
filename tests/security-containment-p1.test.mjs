import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// 2. 0000 backdoor removal
// ---------------------------------------------------------------------------

const BACKDOOR_ROUTES = [
  "../app/api/southline/diy/route.ts",
  "../app/api/southline/diy/[id]/route.ts",
  "../app/api/southline/recruitment/route.ts",
];

test("0000 backdoor is removed from every previously-vulnerable route", async () => {
  for (const r of BACKDOOR_ROUTES) {
    const text = await source(r);
    assert.doesNotMatch(text, /["']0000["']/, `${r} still contains the 0000 backdoor`);
  }
});

test("every previously-vulnerable route now routes operator auth through the centralized helper", async () => {
  for (const r of BACKDOOR_ROUTES) {
    const text = await source(r);
    assert.match(text, /isOperator\(pinFromRequest\(req\)\)/, `${r} must use centralized isOperator(pinFromRequest(req))`);
  }
});

test("no runtime code reads OPERATOR_PIN directly outside lib/auth.ts", async () => {
  const files = ["../app/api/southline/settings/route.ts", "../app/api/contractor/profiles/route.ts"];
  for (const f of files) {
    const text = await source(f);
    assert.doesNotMatch(text, /process\.env\.OPERATOR_PIN/, `${f} must not read OPERATOR_PIN directly`);
  }
});

// ---------------------------------------------------------------------------
// 3. OPERATOR_PIN fails closed (no 777777 default)
// ---------------------------------------------------------------------------

test("operatorPin() fails closed on missing/empty/default OPERATOR_PIN", async () => {
  const text = await source("../lib/auth.ts");
  // No implicit "777777" default.
  assert.doesNotMatch(text, /\|\|\s*["']777777["']/, "operatorPin must not default to 777777");
  assert.doesNotMatch(text, /\?\?\s*["']777777["']/, "operatorPin must not ?? - default to 777777");
  // The legacy default is explicitly rejected.
  assert.match(text, /LEGACY_DEFAULT_OPERATOR_PIN\s*=\s*["']777777["']/);
  // Missing/empty returns "" (fails closed) rather than a fallback.
  assert.match(text, /if \(!pin \|\| pin === LEGACY_DEFAULT_OPERATOR_PIN\) return [""][""]/);
});

test("isOperator() cannot succeed when the operator PIN is unconfigured (fails closed)", async () => {
  const text = await source("../lib/auth.ts");
  // Guard requires a non-empty candidate AND an exact match to operatorPin().
  assert.match(text, /function isOperator\(pin: string\): boolean \{/);
  assert.match(text, /pin\.length > 0 && pin === operatorPin\(\)/);
  assert.match(text, /operatorPin\(\): string \{/);
});

// ---------------------------------------------------------------------------
// 4. Contractor admin profile endpoint protection + public projection
// ---------------------------------------------------------------------------

test("GET /api/contractor/profiles is operator-only and fails closed", async () => {
  const text = await source("../app/api/contractor/profiles/route.ts");
  const getIdx = text.indexOf("export async function GET");
  const postIdx = text.indexOf("export async function POST");
  const getBlock = text.slice(getIdx, postIdx);
  assert.match(getBlock, /isOperator\(pinFromRequest\(req\)\)/, "GET must require operator authorization");
  assert.match(getBlock, /status:\s*401/, "GET must return 401 on missing/invalid authorization");
});

test("a minimal public contractor projection endpoint exists and is unauthenticated", async () => {
  const route = await source("../app/api/contractor/profiles/public/route.ts");
  assert.match(route, /publicContractorDiscovery/);
  assert.doesNotMatch(route, /isOperator\(/, "public projection must not require operator auth");

  const lib = await source("../lib/auth.ts");
  const fnStart = lib.indexOf("export function publicContractorDiscovery");
  const fnEnd = lib.indexOf("export {", fnStart);
  const fn = lib.slice(fnStart, fnEnd > -1 ? fnEnd : lib.length);
  // Public fields allowed.
  for (const f of ["businessName", "serviceArea", "services", "professionType", "phone", "email", "username"]) {
    assert.match(fn, new RegExp(`\\b${f}:`), `public projection should expose ${f}`);
  }
  // Private/internal fields must never be exposed.
  for (const f of ["pin", "payments", "stripeAccountId", "stripeOnboardingComplete", "manualPaymentStatus", "manualPaymentNote", "ownerName"]) {
    assert.doesNotMatch(fn, new RegExp(`\\b${f}:`), `public projection must NOT expose ${f}`);
  }
});

// ---------------------------------------------------------------------------
// 5. Auth rate limit
// ---------------------------------------------------------------------------

test("auth route enforces an in-memory per-IP failed-attempt rate limit", async () => {
  const text = await source("../app/api/contractor/auth/route.ts");
  assert.match(text, /isAuthRateLimited\(ip\)/, "must short-circuit when limited");
  assert.match(text, /status:\s*429/, "must return 429 when limited");
  assert.match(text, /Retry-After/, "must include Retry-After when limited");
  assert.match(text, /recordAuthFailure\(ip\)/, "must count failed attempts");
  assert.match(text, /clearAuthFailures\(ip\)/, "must reset failures on success");
});

test("rate-limit module config matches the emergency policy (~10 fails / 15 min)", async () => {
  const text = await source("../lib/auth-rate-limit.ts");
  assert.match(text, /AUTH_MAX_FAILED\s*=\s*10/);
  assert.match(text, /AUTH_WINDOW_MS\s*=\s*15 \* 60 \* 1000/);
  assert.match(text, /failures\.push/);
  assert.match(text, /failures\.length >= AUTH_MAX_FAILED/);
});

test("auth route does not reveal whether a username exists before authentication", async () => {
  const text = await source("../app/api/contractor/auth/route.ts");
  // Both "not found" and wrong-pin must collapse to a single 401 "Invalid PIN".
  assert.match(text, /if \(!contractor \|\| !canAccessContractor\(pin, contractor\)\)/);
  assert.doesNotMatch(text, /status: 404/, "must not return a 404 not-found that leaks existence");
});

test("auth route never logs the attempted PIN", async () => {
  const text = await source("../app/api/contractor/auth/route.ts");
  assert.doesNotMatch(text, /console\./, "auth route must not log (PIN or otherwise)");
  assert.doesNotMatch(text, /error:\s*pin/, "must not echo the pin in an error response");
});

// ---------------------------------------------------------------------------
// 6. PIN not leaked to logs/console
// ---------------------------------------------------------------------------

test("no PIN value is printed to console/log output in auth-related client+server paths", async () => {
  const files = [
    "../lib/auth.ts",
    "../app/api/contractor/auth/route.ts",
    "../components/admin/Dashboard.tsx",
  ];
  for (const f of files) {
    const text = await source(f);
    // No console call that interpolates a pin variable/header value.
    assert.doesNotMatch(text, /console\.(log|warn|error)\([^)]*pin/i, `${f} may log a pin`);
  }
});

// ---------------------------------------------------------------------------
// 7. Security headers
// ---------------------------------------------------------------------------

test("next.config adds the three safe security headers and no strict CSP", async () => {
  const text = await source("../next.config.ts");
  assert.match(text, /X-Content-Type-Options/);
  assert.match(text, /nosniff/);
  assert.match(text, /Referrer-Policy/);
  assert.match(text, /strict-origin-when-cross-origin/);
  assert.match(text, /X-Frame-Options/);
  assert.match(text, /SAMEORIGIN/);
  assert.doesNotMatch(text, /Content-Security-Policy/, "must not ship a strict CSP in PATCH 1");
});

// ---------------------------------------------------------------------------
// Behavioral sanity: sliding-window failed-attempt limiter semantics
// (re-implements the same algorithm as lib/auth-rate-limit.ts to lock in policy)
// ---------------------------------------------------------------------------

const MAX = 10;
const WINDOW = 15 * 60 * 1000;

function makeLimiter() {
  const buckets = new Map();
  return {
    attempt(key, ok) {
      const now = Date.now();
      const b = buckets.get(key) ?? { failures: [] };
      b.failures = b.failures.filter((t) => now - t < WINDOW);
      if (ok) {
        buckets.delete(key);
        return false;
      }
      b.failures.push(now);
      buckets.set(key, b);
      return b.failures.length >= MAX;
    },
  };
}

test("limiter allows 9 failures then rejects on the 10th, and resets on success", () => {
  const L = makeLimiter();
  for (let i = 0; i < MAX - 1; i++) {
    assert.equal(L.attempt("1.2.3.4", false), false, `failure ${i + 1} should not yet be limited`);
  }
  assert.equal(L.attempt("1.2.3.4", false), true, "10th consecutive failure should be limited");
  // A success clears the bucket; the next failure restarts from zero.
  L.attempt("1.2.3.4", true);
  assert.equal(L.attempt("1.2.3.4", false), false, "after success, failures reset");
});

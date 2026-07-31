import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("agent_profiles migration is additive and complete", async () => {
  const sql = await source("../drizzle/0012_agent_profiles.sql");
  for (const table of ["agent_profiles", "agent_profile_events"]) {
    assert.match(sql, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("lib/real-estate/marketplace/billing.ts stays untouched by the agent-profiles feature", () => {
  // ac65bbc is the last commit before agent-profile work began (post Phase 9-11 + the
  // oauth_client_id FK fix). Reusing billing.ts's exported functions unmodified is the
  // whole point of the design — a change here would mean a second billing system crept in.
  const diff = execSync("git diff --name-only ac65bbc -- lib/real-estate/marketplace/billing.ts", { encoding: "utf8" }).trim();
  assert.equal(diff, "", "lib/real-estate/marketplace/billing.ts must not change for the agent-profiles feature");
});

test("the billing wrapper invents no price and names no payment vendor", async () => {
  const text = await source("../lib/agent-profiles/billing.ts");
  assert.doesNotMatch(text, /amountCents:\s*[1-9]\d{2,}/);
  assert.doesNotMatch(text, /stripe|paypal|braintree|adyen|square\.com/i);
  assert.match(text, /from "@\/lib\/real-estate\/marketplace\/billing"/);
});

test("the billing wrapper never fabricates a membershipId; it reuses one seeded sentinel row", async () => {
  const text = await source("../lib/agent-profiles/billing.ts");
  assert.match(text, /SYSTEM_MEMBERSHIP_ID/);
  assert.match(text, /subscribeTenant\(scope, SYSTEM_MEMBERSHIP_ID/);
});

test("agent profile requests require no PIN; profile activation requires the operator PIN", async () => {
  const collection = await source("../app/api/agent-profiles/route.ts");
  assert.doesNotMatch(collection.slice(collection.indexOf("export async function POST")), /isOperator/);
  const single = await source("../app/api/agent-profiles/[id]/route.ts");
  assert.match(single, /isOperator\(pin\)/);
  assert.match(single, /Operator PIN required/);
});

test("self-edit on a profile is restricted to SELF_EDITABLE_FIELDS, mirroring the contractor onlySelfEditable pattern", async () => {
  const types = await source("../lib/agent-profiles/types.ts");
  assert.match(types, /SELF_EDITABLE_FIELDS = \["bio", "tagline", "photoUrl", "languages", "specialties", "serviceAreas"\]/);
  const route = await source("../app/api/agent-profiles/[id]/route.ts");
  assert.match(route, /onlySelfEditable/);
});

test("agent-profile events are anonymous, no-auth analytics — never gated by isOperator", async () => {
  const text = await source("../app/api/agent-profiles/[id]/events/route.ts");
  assert.doesNotMatch(text, /isOperator|pinFromRequest/);
});

test("agent profile PINs are stripped from every public response via publicAgentProfile", async () => {
  const auth = await source("../lib/agent-profiles/auth.ts");
  assert.match(auth, /const \{ pin: _pin, \.\.\.rest \} = profile/);
  for (const file of ["../app/api/agent-profiles/route.ts", "../app/api/agent-profiles/[id]/route.ts"]) {
    assert.match(await source(file), /publicAgentProfile/);
  }
});

test("agent-profiles code stays structurally independent of contractor and multi-tenant real-estate modules", async () => {
  // Contractor files are allowed to evolve over time by later, separate work (e.g. an additive
  // professionType field) — what must hold permanently is that the agent-profiles system itself
  // never imports contractor or lib/real-estate internals, and never touches LFC payment code.
  for (const file of ["../lib/agent-profiles/store.ts", "../lib/agent-profiles/store-pg.ts", "../lib/agent-profiles/store-json.ts", "../lib/agent-profiles/auth.ts", "../lib/agent-profiles/billing.ts", "../lib/agent-profiles/events.ts"]) {
    const text = await source(file);
    assert.doesNotMatch(text, /from ["']@\/lib\/(store|payments|types)["']/, `${file} must not import contractor internals`);
    if (file !== "../lib/agent-profiles/billing.ts") {
      assert.doesNotMatch(text, /from ["']@\/lib\/real-estate\//, `${file} must not import multi-tenant real-estate internals`);
    }
  }
  const billing = await source("../lib/agent-profiles/billing.ts");
  assert.match(billing, /from "@\/lib\/real-estate\/marketplace\/billing"/, "billing.ts's one deliberate exception: reusing the unmodified Phase 11 billing module");
  const diff = execSync("git diff --name-only ac65bbc -- lib/payments.ts", { encoding: "utf8" }).trim();
  assert.equal(diff, "", "LFC payment code must never change for the agent-profiles feature");
});

test("the new agent_profiles table is not prefixed real_estate_ (a deliberately separate product)", async () => {
  const schema = await source("../lib/db/schema.ts");
  assert.match(schema, /pgTable\("agent_profiles"/);
  assert.doesNotMatch(schema, /pgTable\("real_estate_agent_profiles"/);
});

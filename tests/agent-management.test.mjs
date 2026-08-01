import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("agent_management migration (0021) is additive only — no drops/truncates/deletes", async () => {
  const sql = await source("../drizzle/0021_agent_management_identity.sql");
  assert.match(sql, /ALTER TABLE "agent_profiles" ADD COLUMN/);
  assert.match(sql, /CREATE UNIQUE INDEX/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("agent profession type migration (0022) is one additive column — defaults realtor, never drops", async () => {
  const sql = await source("../drizzle/0022_agent_profession_type.sql");
  assert.match(sql, /ALTER TABLE "agent_profiles" ADD COLUMN "profession_type" text DEFAULT 'realtor' NOT NULL/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("professionType is operator-written and self-service read-only, validated against the licensed+trade taxonomy", async () => {
  const createRoute = await source("../app/api/agent-profiles/create/route.ts");
  const patchRoute = await source("../app/api/agent-profiles/[id]/route.ts");
  const types = await source("../lib/agent-profiles/types.ts");
  assert.match(createRoute, /isValidAgentProfessionType\(body\.professionType\)/);
  assert.match(patchRoute, /"professionType"/);
  assert.match(patchRoute, /isValidAgentProfessionType\(body\.professionType\)/);
  // Not self-editable: the agent's own PIN must never retitle its profession.
  assert.doesNotMatch(types, /SELF_EDITABLE_FIELDS = \[[^\]]*professionType/);
});

test("schema.ts adds a nullable, default-less username column with a unique index (never NOT NULL DEFAULT '')", async () => {
  const schema = await source("../lib/db/schema.ts");
  const table = schema.split("\n").find((line) => line.includes('pgTable("agent_profiles"'));
  assert.ok(table, "agent_profiles table definition not found");
  assert.match(table, /username:\s*text\(\"username\"\)/);
  assert.doesNotMatch(table.split("username:")[1].split(",")[0], /notNull|default/);
  assert.match(table, /uniqueIndex\("agent_profiles_username_idx"\)\.on\(t\.username\)/);
});

test("lib/agent-profiles/types.ts defines the four separate status axes and the module key set", async () => {
  const types = await source("../lib/agent-profiles/types.ts");
  assert.match(types, /export type AgentProfileStatus = "pending" \| "active" \| "suspended" \| "archived"/);
  assert.match(types, /export type SnaplinkStatus = "draft" \| "published" \| "unpublished"/);
  assert.match(types, /export type SouthlineStatus = "draft" \| "published" \| "featured" \| "hidden"/);
  assert.match(types, /export type OnboardingStatus/);
  assert.match(types, /export const AGENT_MODULE_KEYS: AgentModuleKey\[\]/);
  assert.match(types, /export const RESERVED_IDENTIFIERS/);
  // Regression guard: the original self-edit contract must stay byte-identical.
  assert.match(types, /SELF_EDITABLE_FIELDS = \["bio", "tagline", "photoUrl", "languages", "specialties", "serviceAreas"\]/);
});

test("lib/agent-profiles/identity.ts exposes username/slug generation and reserved-word checks", async () => {
  const text = await source("../lib/agent-profiles/identity.ts");
  for (const fn of ["slugify", "usernameify", "isReservedIdentifier", "suggestUsername", "firstAvailable", "isValidUsernameFormat"]) {
    assert.match(text, new RegExp(`export (async )?function ${fn}`));
  }
});

test("POST /api/agent-profiles/create is a NEW, separate, operator-only route — the public request route never gains an isOperator check", async () => {
  const createRoute = await source("../app/api/agent-profiles/create/route.ts");
  assert.match(createRoute, /isOperator\(pin\)/);
  assert.match(createRoute, /Operator PIN required/);
  assert.match(createRoute, /6-digit PIN is required/);

  const collectionRoute = await source("../app/api/agent-profiles/route.ts");
  assert.doesNotMatch(collectionRoute.slice(collectionRoute.indexOf("export async function POST")), /isOperator/);
});

test("GET /api/agent-profiles/check requires the operator PIN", async () => {
  const text = await source("../app/api/agent-profiles/check/route.ts");
  assert.match(text, /isOperator\(pinFromRequest\(req\)\)/);
  assert.match(text, /Operator PIN required/);
});

test("PATCH [id] route keeps the self-edit gate and gains archived status + modules merge for operators", async () => {
  const text = await source("../app/api/agent-profiles/[id]/route.ts");
  assert.match(text, /onlySelfEditable/);
  assert.match(text, /isOperator\(pin\)/);
  assert.match(text, /"pending", "active", "suspended", "archived"/);
  assert.match(text, /AGENT_MODULE_KEYS/);
});

test("SnapLink profile route (/p/[username]) never imports the Southline Header or Footer", async () => {
  const text = await source("../app/p/[username]/page.tsx");
  assert.doesNotMatch(text, /components\/southline\/Header|components\/southline\/Footer/);
  assert.match(text, /snaplinkStatus/);
});

test("Southline discovery route (/agents/[slug]) gates on southlineStatus, not just account status", async () => {
  const text = await source("../app/agents/[slug]/page.tsx");
  assert.match(text, /southlineStatus/);
  assert.match(text, /variant="southline"/);
});

test("agent-management code stays structurally independent of contractor and multi-tenant real-estate internals", async () => {
  for (const file of ["../lib/agent-profiles/identity.ts", "../app/api/agent-profiles/create/route.ts", "../app/api/agent-profiles/check/route.ts"]) {
    const text = await source(file);
    assert.doesNotMatch(text, /from ["']@\/lib\/(store|payments|types)["']/, `${file} must not import contractor internals`);
    assert.doesNotMatch(text, /from ["']@\/lib\/real-estate\//, `${file} must not import multi-tenant real-estate internals`);
  }
});

test("the agent modules system stays separate from the contractor ModuleKey/entitlements system", async () => {
  const types = await source("../lib/agent-profiles/types.ts");
  assert.doesNotMatch(types, /from ["']@\/lib\/entitlement-types["']|from ["']@\/lib\/entitlements["']/);
  assert.match(types, /export type AgentModuleKey =/);
});

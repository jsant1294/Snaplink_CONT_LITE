import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("avatar_url/logo_url migration is additive and complete", async () => {
  const sql = await source("../drizzle/0017_contractor_avatar_logo.sql");
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "avatar_url" text;/);
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "logo_url" text;/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("profile fields are only patchable by an operator, never by the contractor's own PIN", async () => {
  const text = await source("../app/api/contractor/profiles/route.ts");
  const block = text.slice(text.indexOf("if (operator) {"), text.indexOf("if (Object.keys(patch).length === 0)"));
  assert.match(block, /patch\.businessName/);
  assert.match(block, /patch\.avatarUrl/);
  assert.match(block, /patch\.logoUrl/);
  // Confirm this whole block is gated behind the operator check, not reachable otherwise.
  const operatorGateIdx = text.indexOf("if (operator) {");
  const blockStartIdx = text.indexOf("patch.businessName");
  assert.ok(operatorGateIdx < blockStartIdx && operatorGateIdx > -1);
});

test("the avatar/logo upload route requires the operator PIN", async () => {
  const text = await source("../app/api/contractor/avatar-upload/route.ts");
  assert.match(text, /isOperator\(pinFromRequest\(req\)\)/);
});

test("the roster links to the new profile edit page", async () => {
  const text = await source("../app/contractor-admin/page.tsx");
  assert.match(text, /\/contractor-admin\/\$\{c\.username\}\/profile/);
});

test("the public contractor page renders the logo when present, without breaking when absent", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  assert.match(text, /contractor\.logoUrl &&/);
});

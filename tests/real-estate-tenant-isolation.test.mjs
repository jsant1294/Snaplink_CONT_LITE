import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isAgentScopeValue, ownsAgentRecordValue, sameTenantValue } from "../lib/real-estate/access-policy.js";

const owner = { tenantId: "tenant-a", role: "broker_owner", agentId: null };
const agent = { tenantId: "tenant-a", role: "listing_agent", agentId: "agent-a" };

test("records from another tenant are rejected", () => {
  assert.equal(sameTenantValue(owner, "tenant-a"), true);
  assert.equal(sameTenantValue(owner, "tenant-b"), false);
});
test("listing agents only own records assigned to their persistent agent identity", () => {
  assert.equal(isAgentScopeValue(agent), true);
  assert.equal(ownsAgentRecordValue(agent, "agent-a"), true);
  assert.equal(ownsAgentRecordValue(agent, "agent-b"), false);
  assert.equal(ownsAgentRecordValue(agent, null), false);
});
test("tenant administrators are not constrained to one agent", () => {
  assert.equal(isAgentScopeValue(owner), false);
  assert.equal(ownsAgentRecordValue(owner, "agent-b"), true);
});
test("persistent Phase 4 repositories bind every relationship workflow to tenant scope", async () => {
  const source = await readFile(new URL("../lib/real-estate/phase4-repositories.ts", import.meta.url), "utf8");
  for (const workflow of ["selectors", "registerAttendee", "convertLead", "listReminders", "saveCommunication", "listCampaigns", "trackEvent"]) {
    const start = source.indexOf(`function ${workflow}`);
    assert.notEqual(start, -1, `${workflow} must exist`);
    const next = source.indexOf("\nexport async function ", start + 10);
    const body = source.slice(start, next === -1 ? undefined : next);
    assert.match(body, /tenantId|tenant_id/, `${workflow} must carry tenant scope`);
  }
});
test("all protected Real Estate API routes await persistent membership authorization", async () => {
  const files = [
    "../app/api/real-estate/properties/route.ts",
    "../app/api/real-estate/dashboard/route.ts",
    "../app/api/real-estate/crm/[resource]/route.ts",
    "../app/api/real-estate/selectors/route.ts",
    "../app/api/real-estate/memberships/route.ts",
  ];
  for (const path of files) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?<!await )authorizeRealEstate\(/, `${path} bypasses durable membership authorization`);
  }
});

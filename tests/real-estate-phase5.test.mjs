import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  canCommunicateValue, providerMode, reminderIsDue, renderTemplateValue,
  uniqueRecipients, validateTemplateValue,
} from "../lib/real-estate/communications/phase5-policy.js";

const consent = { emailOptIn: true, smsOptIn: true, marketingConsent: true, transactionalConsent: true };
test("disabled provider remains disabled and development never selects production", () => {
  assert.equal(providerMode("production", undefined), "disabled");
  assert.equal(providerMode("development", "resend"), "preview");
  assert.equal(providerMode("development", "twilio"), "preview");
  assert.equal(providerMode("development", "disabled"), "disabled");
});
test("consent blocks unsubscribe and STOP while allowing opted-in delivery", () => {
  assert.equal(canCommunicateValue(consent, "email", "marketing"), true);
  assert.equal(canCommunicateValue({ ...consent, unsubscribedAt: "now" }, "email", "marketing"), false);
  assert.equal(canCommunicateValue({ ...consent, smsStoppedAt: "now" }, "sms", "transactional"), false);
  assert.equal(canCommunicateValue(null, "email", "transactional"), false);
});
test("template engine renders approved variables and rejects unknown variables", () => {
  assert.equal(renderTemplateValue("Hello {{ first_name }}", { first_name: "Elena" }), "Hello Elena");
  assert.deepEqual(validateTemplateValue("{{password}}"), { valid: false, unknown: ["password"] });
  assert.throws(() => renderTemplateValue("{{secret}}", {}), /Unknown merge variables/);
});
test("campaign execution prevents duplicate channel recipients", () => {
  assert.deepEqual(uniqueRecipients([{ channel: "email", recipient: "a@b.com", id: 1 }, { channel: "email", recipient: "a@b.com", id: 2 }, { channel: "sms", recipient: "a@b.com", id: 3 }]).map(x => x.id), [2, 3]);
});
test("reminders run only when scheduled and due", () => {
  assert.equal(reminderIsDue("2026-01-01T12:00:00Z", "2026-01-01T12:01:00Z", "scheduled"), true);
  assert.equal(reminderIsDue("2026-01-01T12:02:00Z", "2026-01-01T12:01:00Z", "scheduled"), false);
  assert.equal(reminderIsDue("2026-01-01T12:00:00Z", "2026-01-01T12:01:00Z", "cancelled"), false);
});
test("automation, QR, analytics, and campaign persistence are tenant-scoped", async () => {
  const source = await readFile(new URL("../lib/real-estate/phase5-repositories.ts", import.meta.url), "utf8");
  for (const name of ["startWorkflow", "runAction", "trackQrScan", "analyticsSummary", "agentPerformance", "executeCampaign"]) {
    const start = source.indexOf(`function ${name}`); assert.notEqual(start, -1);
    const next = source.indexOf("\nexport async function ", start + 10);
    const body = source.slice(start, next === -1 ? undefined : next);
    assert.match(body, /tenantId/, `${name} must enforce or derive tenant scope`);
  }
});
test("agent ownership constraints remain active in Phase 5 operations", async () => {
  const source = await readFile(new URL("../lib/real-estate/phase5-repositories.ts", import.meta.url), "utf8");
  for (const name of ["listNurture", "enrollNurture", "processDueReminders", "agentPerformance", "executeCampaign"]) {
    const start = source.indexOf(`function ${name}`), next = source.indexOf("\nexport async function ", start + 10);
    assert.match(source.slice(start, next === -1 ? undefined : next), /isAgentScope/, `${name} must apply listing-agent ownership`);
  }
});

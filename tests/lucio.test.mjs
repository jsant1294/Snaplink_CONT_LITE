import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { resolveLucioConfigValues as loadLucioConfig } from "../lib/lucio/config-logic.js";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Lucio's AI is disabled by default — no env vars set means no LLM key is required to run this app", () => {
  const config = loadLucioConfig({});
  assert.equal(config.enabled, false);
  assert.equal(config.provider, "disabled");
});

test("Lucio's AI only enables when LUCIO_AI_ENABLED=true, a known provider, and a matching credential are all present", () => {
  assert.equal(loadLucioConfig({ LUCIO_AI_ENABLED: "true", LUCIO_AI_PROVIDER: "openai" }).enabled, false, "no credential -> disabled");
  assert.equal(loadLucioConfig({ LUCIO_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" }).enabled, false, "not explicitly enabled -> disabled");
  assert.equal(
    loadLucioConfig({ LUCIO_AI_ENABLED: "true", LUCIO_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" }).enabled,
    true
  );
  assert.equal(
    loadLucioConfig({ LUCIO_AI_ENABLED: "true", LUCIO_AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-ant-test" }).enabled,
    true
  );
});

test("Lucio tools only read through existing stores/repositories — no raw SQL, no direct schema table access", async () => {
  const text = await source("../lib/lucio/tools.ts");
  assert.doesNotMatch(text, /from "@\/lib\/db\/schema"/, "must not import the raw schema directly");
  assert.doesNotMatch(text, /\.query\(|drizzle\(/, "must not construct its own DB connection");
  assert.match(text, /contractorStore\.list/);
  assert.match(text, /listPublishedPropertiesWithFallback/);
  assert.match(text, /listProjects/);
  assert.match(text, /searchFaqData/);
});

test("Lucio never queries reviews or availability — neither exists as real structured data in this app", async () => {
  const text = await source("../lib/lucio/tools.ts");
  assert.doesNotMatch(text, /searchReviews|getAvailability|reviewsTool|availabilityTool/i);
});

test("proposeLeadOrBooking only prepares a confirmation payload — it never itself calls the leads API", async () => {
  const text = await source("../lib/lucio/tools.ts");
  const toolSrc = text.slice(text.indexOf("proposeLeadOrBookingTool"), text.indexOf("export const lucioTools"));
  assert.doesNotMatch(toolSrc, /fetch\(|\/api\/contractor\/leads/, "the tool itself must never submit anything");
  assert.match(toolSrc, /requiresConfirmation: true/);
});

test("the actual lead submission happens client-side, only after Confirm is clicked", async () => {
  const text = await source("../components/lucio/LeadConfirmCard.tsx");
  assert.match(text, /\/api\/contractor\/leads/);
  assert.match(text, /onClick=\{handleConfirm\}/);
  const beforeConfirm = text.slice(0, text.indexOf("function handleConfirm"));
  assert.doesNotMatch(beforeConfirm, /fetch\(/, "no submission should happen before the confirm handler");
});

test("the chat route runs prompt-injection detection and rate limiting before calling the model", async () => {
  const text = await source("../app/api/lucio/chat/route.ts");
  assert.match(text, /detectPromptInjection/);
  assert.match(text, /allowRequest/);
});

test("guided prompts render before any message is sent — never a blank chat screen", async () => {
  const text = await source("../components/lucio/LucioWidget.tsx");
  assert.match(text, /messages\.length === 0/);
  assert.match(text, /<GuidedPrompts/);
});

test("the widget mounts with page context on every placement page the spec calls for", async () => {
  for (const [file, contextType] of [
    ["../app/page.tsx", "home"],
    ["../app/homes/[slug]/page.tsx", "property"],
    ["../app/contractor/[username]/page.tsx", "contractor"],
    ["../app/diy/page.tsx", "diy"],
    ["../app/diy/[slug]/page.tsx", "diy"],
    ["../app/planner/page.tsx", "planner"],
    ["../app/book/page.tsx", "book"],
  ]) {
    const text = await source(file);
    assert.match(text, /<LucioMount/, `${file} must mount the widget`);
    assert.match(text, new RegExp(`type: "${contextType}"`), `${file} must pass pageContext type "${contextType}"`);
  }
});

test("the lucio_events migration is additive: one new table, no drop/rename", async () => {
  const sql = await source("../drizzle/0014_lucio_events.sql");
  assert.match(sql, /CREATE TABLE "lucio_events"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE.*RENAME/i);
});

test("Lucio events are anonymous, no-auth analytics — the events route never checks isOperator", async () => {
  const text = await source("../app/api/lucio/events/route.ts");
  assert.doesNotMatch(text, /isOperator|pinFromRequest/);
});

test("no dead '#' links or emoji in the new Lucio files", async () => {
  for (const file of [
    "../components/lucio/LucioWidget.tsx",
    "../components/lucio/GuidedPrompts.tsx",
    "../components/lucio/LeadConfirmCard.tsx",
    "../components/lucio/StartPlanningWithLucioButton.tsx",
  ]) {
    const text = await source(file);
    assert.doesNotMatch(text, /href="#"/, `${file} has a dead link`);
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${file} contains an emoji`);
  }
});

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", () => {
  const diff = execSync(
    "git diff --name-only 6a59d1a -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts lib/payments.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for the Lucio assistant pass");
});

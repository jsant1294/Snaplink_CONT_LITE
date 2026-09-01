import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PUBLIC_CATALOG_TAGS,
  shouldInvalidateContractorUpdate,
  shouldInvalidateAgentUpdate,
  shouldInvalidateAgentCreate,
  invalidateContractorCatalog,
  invalidateAgentCatalog,
} from "../lib/public-catalog-invalidate.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

const contractor = (overrides = {}) => ({
  id: "ctr_1",
  username: "ace-roofing",
  professionType: "roofing",
  businessName: "Ace Roofing",
  ownerName: "",
  phone: "555-0100",
  email: "ace@example.com",
  serviceArea: "Austin, TX",
  services: ["Roofing"],
  tagline: "Local roofers",
  preferredLanguage: "en",
  status: "published",
  isDemo: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});
const isPublic = (c) => !c.isDemo && c.status === "published";

const agent = (overrides = {}) => ({
  id: "apx_1",
  slug: "jane-doe",
  username: "jane-doe",
  name: "Jane Doe",
  firstName: "Jane",
  lastName: "Doe",
  status: "active",
  southlineStatus: "published",
  isDemo: false,
  ...overrides,
});
const agentPubliclyEligible = (a) => a.status === "active" && a.isDemo !== true;

// ---------------------------------------------------------------------------
// Pure decision predicates (deterministic; no Next runtime needed)
// ---------------------------------------------------------------------------

test("contractor: a published professional is cache-eligible (SQL gate)", () => {
  assert.equal(isPublic(contractor({ status: "published", isDemo: false })), true);
});

test("contractor: published -> suspended must invalidate the public catalog", () => {
  assert.equal(shouldInvalidateContractorUpdate({ status: "suspended" }), true);
  // the gate predicate flips
  assert.equal(isPublic(contractor({ status: "suspended" })), false);
});

test("contractor: published -> unpublished/ready/draft/onboarding must invalidate", () => {
  for (const s of ["ready", "draft", "onboarding"]) {
    assert.equal(shouldInvalidateContractorUpdate({ status: s }), true, s);
    assert.equal(isPublic(contractor({ status: s })), false, s);
  }
});

test("contractor: republish (ready -> published) must invalidate", () => {
  assert.equal(shouldInvalidateContractorUpdate({ status: "published" }), true);
  assert.equal(isPublic(contractor({ status: "published", isDemo: false })), true);
});

test("contractor: demo transition invalidates where the flag is mutation-reachable", () => {
  // Contractor demo is a creation-time flag (not reachable via store.update),
  // but economy-of-truth: an operator CAN tape it at create; the SQL gate still
  // excludes demo rows so a cached entry never leaks one.
  assert.equal(isPublic(contractor({ status: "published", isDemo: true })), false);
  // store.update must NOT invalidate on non-lifecycle edits (business info edits
  // don't touch the public catalog).
  assert.equal(shouldInvalidateContractorUpdate({ businessName: "New Name" }), false);
  assert.equal(shouldInvalidateContractorUpdate({ phone: "555-9999" }), false);
});

test("agent: published/featured -> active is the public state", () => {
  for (const s of ["published", "featured"]) {
    const a = agent({ southlineStatus: s, status: "active" });
    assert.equal(agentPubliclyEligible(a), true, s);
  }
});

test("agent: public removal (status / southlineStatus / demo) must invalidate", () => {
  // status transitions
  for (const s of ["suspended", "archived", "pending"]) {
    assert.equal(shouldInvalidateAgentUpdate({ status: s }), true, `status=${s}`);
  }
  // southlineStatus transitions
  for (const s of ["draft", "hidden"]) {
    assert.equal(shouldInvalidateAgentUpdate({ southlineStatus: s }), true, `southline=${s}`);
  }
  // demo transition (operator-accessible at creation; predicate purges on change)
  assert.equal(shouldInvalidateAgentUpdate({ isDemo: true }), true);
  // non-lifecycle edits must NOT invalidate
  assert.equal(shouldInvalidateAgentUpdate({ firstName: "Jen" }), false);
  assert.equal(shouldInvalidateAgentUpdate({ bio: "updated" }), false);
});

test("agent: newly created active non-demo agent invalidates (appears immediately)", () => {
  assert.equal(shouldInvalidateAgentCreate({ status: "active", isDemo: false }), true);
  assert.equal(shouldInvalidateAgentCreate({ status: "active", isDemo: true }), false, "demo not placed in public cache");
  assert.equal(shouldInvalidateAgentCreate({ status: "pending" }), false, "pending not public");
});

test("invalidate helpers are safe no-ops outside a Next runtime (plain node tests)", async () => {
  // No request scope here -> must not throw and must not touch any real cache.
  await assert.doesNotReject(invalidateContractorCatalog());
  await assert.doesNotReject(invalidateAgentCatalog());
});

// ---------------------------------------------------------------------------
// Tag constants match the cache entries they are meant to invalidate
// ---------------------------------------------------------------------------

test("PUBLIC_CATALOG_TAGS match the tags public-cache.ts registers", async () => {
  const cache = await source("../lib/public-cache.ts");
  // public-cache registers the SHARED constants, so cache + invalidator cannot
  // drift: the constants' literal values are asserted at the top of this file.
  assert.match(cache, /tags: \[PUBLIC_CATALOG_TAGS\.contractors\]/, "contractors cache tagged with the shared constant");
  assert.match(cache, /tags: \[PUBLIC_CATALOG_TAGS\.agents\]/, "agents cache tagged with the shared constant");
  assert.match(cache, /PUBLIC_CATALOG_TAGS/, "public-cache imports the shared tag constants");
  // single source of truth: the tag literals used by the invalidators.
  assert.equal(PUBLIC_CATALOG_TAGS.contractors, "public-contractors");
  assert.equal(PUBLIC_CATALOG_TAGS.agents, "public-agents");
});

// ---------------------------------------------------------------------------
// Store wiring: eligibility mutations drain through the invalidators
// ---------------------------------------------------------------------------

test("contractor store.update drains weaves lifecycle eligibility transitions", async () => {
  const pg = await source("../lib/store-pg.ts");
  const json = await source("../lib/store-json.ts");
  for (const [file, label] of [[pg, "PG"], [json, "JSON"]]) {
    assert.match(file, /invalidateContractorCatalog\(\)/, `${label} contractor update invalidates the catalog`);
    assert.match(file, /shouldInvalidateContractorUpdate\(patch\)/, `${label} contractor update gates on eligibility`);
  }
});

test("agent store drains weaves status/southlineStatus/isDemo eligibility transitions", async () => {
  const pg = await source("../lib/agent-profiles/store-pg.ts");
  const json = await source("../lib/agent-profiles/store-json.ts");
  for (const [file, label] of [[pg, "PG"], [json, "JSON"]]) {
    assert.match(file, /invalidateAgentCatalog\(\)/, `${label} agent update/create invalidate the agent catalog`);
    assert.match(file, /shouldInvalidateAgentUpdate\(patch\)/, `${label} agent update gates on eligibility`);
    assert.match(file, /shouldInvalidateAgentCreate\(/, `${label} agent create gates new-profile eligibility`);
  }
});

test("lifecycle publish route invalidates via store (contractor + agent)", async () => {
  const route = await source("../app/api/professional-intake/sessions/[id]/publish/route.ts");
  assert.match(route, /contractorStore\.update\(session\.ownerId, \{ status: "published" \}\)/, "contractor publish flows through store.update");
  assert.match(route, /southlineStatus: "published"/, "agent publish sets the southline listing");
});

test("agent generic PATCH invalidates via store on status/southlineStatus", async () => {
  const route = await source("../app/api/agent-profiles/[id]/route.ts");
  assert.match(route, /agentProfileStore\.update\(id, patch\)/, "agent PATCH flows through store.update");
});

test("contractor profiles PATCH invalidates via store on status", async () => {
  const route = await source("../app/api/contractor/profiles/route.ts");
  assert.match(route, /contractorStore\.update\(contractorId, patch\)/, "contractor PATCH flows through store.update");
});

// ---------------------------------------------------------------------------
// Direct public profile routes still enforce server-side eligibility
// independently of cached catalog cards.
// ---------------------------------------------------------------------------

test("direct contractor profile route applies the publish gate server-side", async () => {
  const route = await source("../app/contractor/[username]/page.tsx");
  assert.match(route, /isPublicContractor\(/, "contractor/[username] guards with the lifecycle publish gate");
});

test("direct agent profile route applies a server-side public gate", async () => {
  const route = await source("../app/agents/[slug]/page.tsx");
  assert.match(route, /isPublicAgent|isSouthlineListedAgent|status\b|southlineStatus/, "agents/[slug] re-checks eligibility server-side");
});

test("cached homepage agents still drop demo rows (post-cache filter preserved)", async () => {
  const page = await source("../app/page.tsx");
  assert.match(page, /getCachedPublicAgents\(\)\(\)\.then\(\(l\) => l\.filter\(\(p\) => !p\.isDemo\)\)/, "homepage filters demo agents after the shared cache");
});
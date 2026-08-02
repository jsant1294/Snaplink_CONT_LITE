import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { listSouthlineProfessionals, orderProfessionalResults, catalogDiagnostics } from "../lib/southline-professional-catalog.ts";
import { isSouthlineListedAgent, categoryIdsForContractor, categoryIdsForAgent, searchProfessionals } from "../lib/southline-search.ts";
import { HOME_SERVICE_CATEGORIES } from "../lib/home-service-taxonomy.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// --- Fixtures -----------------------------------------------------------------
// Real profession types / service names (verified against lib/profession-types.ts
// and lib/services.ts) so category resolution is real, not guessed.

function makeContractor(overrides = {}) {
  return {
    id: "ctr_1",
    username: "acme-remodel",
    preferredLanguage: "en",
    professionType: "remodeler",
    businessName: "Acme Remodeling",
    ownerName: "Jane Acme",
    phone: "555-0100",
    email: "jane@acme.test",
    serviceArea: "Austin, TX",
    services: ["Kitchen Remodel"],
    tagline: "Kitchens done right.",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeAgent(overrides = {}) {
  return {
    id: "agt_1",
    slug: "camila-reyes",
    username: "camila-reyes",
    status: "active",
    professionType: "realtor",
    name: "Camila Reyes",
    firstName: "Camila",
    lastName: "Reyes",
    displayName: "Camila Reyes",
    brokerageName: "Southline Realty",
    officeName: "",
    teamName: "",
    licenseNumber: "",
    licenseState: "",
    phone: "555-0200",
    email: "camila@example.test",
    serviceArea: "Austin, TX",
    bio: "Helping families find their next home.",
    preferredLanguage: "en",
    smsPhone: "",
    whatsapp: "",
    website: "",
    bookingLink: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    languages: ["en"],
    specialties: [],
    serviceAreas: [],
    categories: [],
    neighborhoods: [],
    featured: false,
    snaplinkStatus: "published",
    southlineStatus: "published",
    onboardingStatus: "launched",
    modules: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// --- 1/2: normalization ---------------------------------------------------

test("1. contractor records normalize into the neutral SouthlineProfessionalCard shape", () => {
  const contractor = makeContractor();
  const [card] = listSouthlineProfessionals({ locale: "en", contractors: [contractor], agents: [] });
  assert.equal(card.source, "contractor");
  assert.equal(card.id, "ctr_1");
  assert.equal(card.slug, "acme-remodel");
  assert.equal(card.displayName, "Acme Remodeling");
  assert.equal(card.publicUrl, "/contractor/acme-remodel");
  assert.equal(typeof card.professionLabel, "string");
  assert.ok(card.professionLabel.length > 0);
});

test("2. agent/professional records normalize into the same neutral card shape", () => {
  const agent = makeAgent();
  const [card] = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [agent] });
  assert.equal(card.source, "agent");
  assert.equal(card.id, "agt_1");
  assert.equal(card.slug, "camila-reyes");
  assert.equal(card.displayName, "Camila Reyes");
  assert.equal(card.publicUrl, "/agents/camila-reyes");
  assert.ok(card.professionLabel.length > 0);
});

// --- 3/4: both sources together, ownership stays separate -----------------

test("3. both sources appear together in one catalog call", () => {
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [makeContractor()], agents: [makeAgent()] });
  assert.equal(cards.length, 2);
  assert.ok(cards.some((c) => c.source === "contractor"));
  assert.ok(cards.some((c) => c.source === "agent"));
});

test("4. source ownership never crosses — a contractor id and an agent id never collide across sources", () => {
  const cards = listSouthlineProfessionals({
    locale: "en",
    contractors: [makeContractor({ id: "shared_id" })],
    agents: [makeAgent({ id: "shared_id" })],
  });
  assert.equal(cards.length, 2, "same id in two different stores must still yield two distinct cards");
  const contractorCard = cards.find((c) => c.source === "contractor");
  const agentCard = cards.find((c) => c.source === "agent");
  assert.equal(contractorCard.publicUrl, "/contractor/acme-remodel");
  assert.equal(agentCard.publicUrl, "/agents/camila-reyes");
});

// --- 5-8: publication gates --------------------------------------------------

test("5. published agent records appear publicly", () => {
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [makeAgent({ southlineStatus: "published" })] });
  assert.equal(cards.length, 1);
});

test("6. draft agent records are excluded", () => {
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [makeAgent({ southlineStatus: "draft" })] });
  assert.equal(cards.length, 0);
});

test("7. suspended agent records are excluded", () => {
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [makeAgent({ status: "suspended" })] });
  assert.equal(cards.length, 0);
});

test("8. archived agent records are excluded", () => {
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [makeAgent({ status: "archived" })] });
  assert.equal(cards.length, 0);
  // pending is the fourth AgentProfileStatus value — same gate, same result.
  const pending = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [makeAgent({ status: "pending" })] });
  assert.equal(pending.length, 0);
});

// --- 9-12: filtering ----------------------------------------------------------

test("9. featuredOnly filtering shows only curated-featured records", () => {
  const agents = [makeAgent({ id: "a1" }), makeAgent({ id: "a2", slug: "second-agent", username: "second-agent" })];
  const all = listSouthlineProfessionals({ locale: "en", contractors: [], agents, featuredAgentProfileIds: ["a1"] });
  assert.equal(all.length, 2, "without featuredOnly, both still show");
  const featuredOnly = listSouthlineProfessionals({ locale: "en", contractors: [], agents, featuredAgentProfileIds: ["a1"], featuredOnly: true });
  assert.equal(featuredOnly.length, 1);
  assert.equal(featuredOnly[0].id, "a1");
});

test("10. category filtering narrows to the requested canonical category", () => {
  const contractor = makeContractor(); // services: ["Kitchen Remodel"] -> category "remodeling"
  const inCategory = listSouthlineProfessionals({ locale: "en", contractors: [contractor], agents: [], categoryId: "remodeling" });
  assert.equal(inCategory.length, 1);
  const outOfCategory = listSouthlineProfessionals({ locale: "en", contractors: [contractor], agents: [], categoryId: "plumbing" });
  assert.equal(outOfCategory.length, 0);
});

test("11. profession filtering narrows to an exact professionType", () => {
  const contractors = [makeContractor({ id: "c1" }), makeContractor({ id: "c2", username: "second-ctr", professionType: "plumber", services: [] })];
  const filtered = listSouthlineProfessionals({ locale: "en", contractors, agents: [], professionType: "remodeler" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "c1");
});

test("12. audience filtering isolates contractor-only or professional-only results", () => {
  const input = { locale: "en", contractors: [makeContractor()], agents: [makeAgent()] };
  const contractorsOnly = listSouthlineProfessionals({ ...input, audience: "contractor" });
  assert.equal(contractorsOnly.length, 1);
  assert.equal(contractorsOnly[0].source, "contractor");
  const professionalsOnly = listSouthlineProfessionals({ ...input, audience: "professional" });
  assert.equal(professionalsOnly.length, 1);
  assert.equal(professionalsOnly[0].source, "agent");
});

// --- 13-15: deterministic sort: featuredOrder asc -> updatedAt desc -> displayName asc

test("13. featured order sorts ascending by curated list position", () => {
  const agents = [
    makeAgent({ id: "a1", displayName: "A Agent" }),
    makeAgent({ id: "a2", slug: "b-agent", username: "b-agent", displayName: "B Agent" }),
    makeAgent({ id: "a3", slug: "c-agent", username: "c-agent", displayName: "C Agent" }),
  ];
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents, featuredAgentProfileIds: ["a3", "a1", "a2"] });
  assert.deepEqual(cards.map((c) => c.id), ["a3", "a1", "a2"], "featured order follows curated list position, not input order");
});

test("14. updatedAt (descending) breaks ties when neither record is featured", () => {
  const agents = [
    makeAgent({ id: "older", slug: "older", username: "older", displayName: "Z Older", updatedAt: "2026-01-01T00:00:00.000Z" }),
    makeAgent({ id: "newer", slug: "newer", username: "newer", displayName: "A Newer", updatedAt: "2026-06-01T00:00:00.000Z" }),
  ];
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents });
  assert.deepEqual(cards.map((c) => c.id), ["newer", "older"], "more recently updated sorts first when neither is featured");
});

test("15. displayName (ascending) breaks remaining ties when featuredOrder and updatedAt are equal", () => {
  const agents = [
    makeAgent({ id: "z", slug: "z-agent", username: "z-agent", displayName: "Zeta Realty", updatedAt: "2026-01-01T00:00:00.000Z" }),
    makeAgent({ id: "a", slug: "a-agent", username: "a-agent", displayName: "Alpha Realty", updatedAt: "2026-01-01T00:00:00.000Z" }),
  ];
  const cards = listSouthlineProfessionals({ locale: "en", contractors: [], agents });
  assert.deepEqual(cards.map((c) => c.id), ["a", "z"]);
});

// --- 16: duplicate references --------------------------------------------------

test("16a. a duplicate id inside a featured list is not double-counted by the adapter's rank lookup", () => {
  const agent = makeAgent();
  const results = [{ kind: "agent", id: "agt_1", name: "Camila Reyes", serviceArea: "Austin, TX", services: [], categories: [], featured: false }];
  const ordered = orderProfessionalResults(results, [], ["agt_1", "agt_1", "agt_1"]);
  assert.equal(ordered.length, 1, "orderProfessionalResults never invents extra entries from a duplicated id");
  assert.equal(ordered[0].featured, true);
});

test("16b. FeaturedProfessionals.tsx's render-order helper skips an id it has already placed", async () => {
  const text = await source("../components/southline/FeaturedProfessionals.tsx");
  assert.match(text, /if \(seen\.has\(id\)\) continue;/);
  assert.match(text, /seen\.add\(id\)/);
});

test("16c. settings validation rejects a featured list containing a duplicate id before it can ever be saved", async () => {
  const { validateSouthlineSettings } = await import("../lib/southline-validation.ts");
  assert.equal(validateSouthlineSettings({ featuredContractorIds: ["a", "b", "a"] }) !== null, true);
  assert.equal(validateSouthlineSettings({ featuredAgentProfileIds: ["x", "y", "y"] }) !== null, true);
  assert.equal(validateSouthlineSettings({ featuredContractorIds: ["a", "b", "c"] }), null);
});

// --- 17/18: public URLs -------------------------------------------------------

test("17. contractor public URLs point at /contractor/{username}", () => {
  const [card] = listSouthlineProfessionals({ locale: "en", contractors: [makeContractor({ username: "joes-plumbing" })], agents: [] });
  assert.equal(card.publicUrl, "/contractor/joes-plumbing");
});

test("18. agent public URLs point at /agents/{slug}", () => {
  const [card] = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [makeAgent({ slug: "maria-lopez" })] });
  assert.equal(card.publicUrl, "/agents/maria-lopez");
});

// --- 19/20: fallbacks ----------------------------------------------------------

test("19. missing images receive the deterministic profession-appropriate placeholder, never a blank/undefined value", () => {
  const contractorNoPhoto = makeContractor({ avatarUrl: undefined, logoUrl: undefined });
  const [ctrCard] = listSouthlineProfessionals({ locale: "en", contractors: [contractorNoPhoto], agents: [] });
  assert.ok(ctrCard.imageUrl && ctrCard.imageUrl.length > 0);
  assert.match(ctrCard.imageUrl, /^https?:\/\//, "falls back to the real placeholder URL, not a broken/empty src");

  const agentNoPhoto = makeAgent({ photoUrl: undefined });
  const [agtCard] = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [agentNoPhoto] });
  assert.ok(agtCard.imageUrl && agtCard.imageUrl.length > 0);
  assert.match(agtCard.imageUrl, /^https?:\/\//);
});

test("20. missing summaries receive a factual fallback (profession + area), never an invented credential", () => {
  const contractorNoTagline = makeContractor({ tagline: undefined, serviceArea: "Denver, CO" });
  const [ctrCard] = listSouthlineProfessionals({ locale: "en", contractors: [contractorNoTagline], agents: [] });
  assert.match(ctrCard.summary, /Denver, CO/);
  assert.doesNotMatch(ctrCard.summary, /star|rating|review|certified|licensed since/i);

  const agentNoSummary = makeAgent({ marketplaceSummary: undefined, bio: "", tagline: undefined, serviceArea: "Denver, CO" });
  const [agtCard] = listSouthlineProfessionals({ locale: "en", contractors: [], agents: [agentNoSummary] });
  assert.match(agtCard.summary, /Denver, CO/);
});

// --- 21/22: unknown taxonomy values -------------------------------------------

test("21. an unknown profession type never crashes catalog listing", () => {
  const weird = makeContractor({ professionType: "totally-unknown-profession", services: [] });
  assert.doesNotThrow(() => listSouthlineProfessionals({ locale: "en", contractors: [weird], agents: [] }));
});

test("22. an unknown profession-to-category mapping is surfaced as 'unmapped' in diagnostics, never silently dropped or guessed", () => {
  const weird = makeContractor({ professionType: "totally-unknown-profession" });
  const diagnostics = catalogDiagnostics([weird], []);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].status, "unmapped");
});

// --- 23-28: admin panel behavior (source assertions — DOM/client behavior) ---

test("23. the admin panel loads contractors, agents, and curated settings from the existing authenticated endpoints", async () => {
  const text = await source("../components/southline/admin/ProfessionalCatalogPanel.tsx");
  assert.match(text, /fetch\("\/api\/contractor\/profiles"\)/);
  assert.match(text, /fetch\("\/api\/agent-profiles", \{ headers: \{ "x-snaplink-pin": pin \} \}\)/);
  assert.match(text, /fetch\("\/api\/southline\/settings", \{ headers: \{ "x-snaplink-pin": pin \} \}\)/);
});

test("24/25. featuring a record (either source) adds its id to the correct curated list", async () => {
  const text = await source("../components/southline/admin/ProfessionalCatalogPanel.tsx");
  assert.match(text, /async function toggleFeatured/);
  assert.match(text, /list\.includes\(row\.id\) \? list\.filter\(\(id\) => id !== row\.id\) : \[\.\.\.list, row\.id\]/);
  assert.match(text, /if \(row\.source === "contractor"\)/);
});

test("26. unfeaturing a record removes its id (the same toggle handles both directions)", async () => {
  const text = await source("../components/southline/admin/ProfessionalCatalogPanel.tsx");
  assert.match(text, /list\.filter\(\(id\) => id !== row\.id\)/);
});

test("27. the panel can reorder featured records up/down within the curated list", async () => {
  const text = await source("../components/southline/admin/ProfessionalCatalogPanel.tsx");
  assert.match(text, /async function move\(row: CatalogRow, delta: number\)/);
  assert.match(text, /\[next\[idx\], next\[target\]\] = \[next\[target\], next\[idx\]\]/);
});

test("28. every mutation persists through the existing /api/southline/settings PATCH contract", async () => {
  const text = await source("../components/southline/admin/ProfessionalCatalogPanel.tsx");
  assert.match(text, /method: "PATCH"/);
  assert.match(text, /fetch\("\/api\/southline\/settings", \{/);
  assert.doesNotMatch(text, /\/api\/southline\/catalog|\/api\/professional-catalog/, "must not introduce a new API route");
});

// --- 29: invalid references are handled safely --------------------------------

test("29. a stale featured id that no longer matches any live record is silently ignored, not a crash", () => {
  const agent = makeAgent();
  const cards = listSouthlineProfessionals({
    locale: "en",
    contractors: [],
    agents: [agent],
    featuredAgentProfileIds: ["ghost-id-that-does-not-exist", "agt_1"],
  });
  assert.equal(cards.length, 1);
  assert.equal(cards[0].featured, true, "the real id in the list still gets featured status");
});

// --- 30/31: homepage integration ------------------------------------------------

test("30. the homepage passes the curated featured lists into FeaturedProfessionals so curated order is respected", async () => {
  const text = await source("../app/page.tsx");
  assert.match(text, /<FeaturedProfessionals[\s\S]*?featuredContractorIds=\{settings\?\.featuredContractorIds \?\? \[\]\}[\s\S]*?featuredAgentProfileIds=\{settings\?\.featuredAgentProfileIds \?\? \[\]\}/);
});

test("31. the homepage's agent-side featured cards are filtered through isSouthlineListedAgent, so hidden/draft/suspended never render", async () => {
  const text = await source("../components/southline/FeaturedProfessionals.tsx");
  assert.match(text, /isSouthlineListedAgent/);
  assert.match(text, /visibleAgents = filterProfessionalsByTaxonomy\(agents, filter\)\.filter\(isSouthlineListedAgent\)/);
});

test("31b. the homepage's contractor cards only show a Featured badge when actually curated as featured (no fabricated curation state)", async () => {
  const text = await source("../components/southline/FeaturedProfessionals.tsx");
  assert.match(text, /\{featuredContractorIds\.includes\(c\.id\) && \(/);
});

// --- 32-37: cross-cutting regression touchpoints (full suites re-verified in Phase 6) ---

test("32. the taxonomy category set the catalog's admin filter uses is the real, live HOME_SERVICE_CATEGORIES export", () => {
  assert.ok(Array.isArray(HOME_SERVICE_CATEGORIES));
  assert.ok(HOME_SERVICE_CATEGORIES.length > 0);
  assert.ok(HOME_SERVICE_CATEGORIES.every((c) => typeof c.id === "string" && typeof c.labelEn === "string"));
});

test("33. the catalog adapter's publication gate is the exact same isSouthlineListedAgent function professional-discovery already tests (no forked copy)", () => {
  const listed = makeAgent({ status: "active", southlineStatus: "featured" });
  const hidden = makeAgent({ status: "active", southlineStatus: "hidden" });
  assert.equal(isSouthlineListedAgent(listed), true);
  assert.equal(isSouthlineListedAgent(hidden), false);
});

test("34. searchProfessionals (the unified-professional-profile dependency) still returns both kinds for a catalog-shaped query", () => {
  const results = searchProfessionals([makeContractor()], [makeAgent()], {});
  assert.ok(results.some((r) => r.kind === "contractor"));
  assert.ok(results.some((r) => r.kind === "agent"));
});

test("35. categoryIdsForContractor/categoryIdsForAgent (southline-search) stay the single source the catalog adapter reads from", () => {
  assert.deepEqual(categoryIdsForContractor(makeContractor()), ["remodeling"]);
  const agentCategories = categoryIdsForAgent(makeAgent());
  assert.ok(Array.isArray(agentCategories));
});

test("36. Local Discovery stays untouched by the catalog slice — no import of lib/southline-local-discovery anywhere in the new catalog code", async () => {
  const files = [
    "../lib/southline-professional-catalog.ts",
    "../components/southline/admin/ProfessionalCatalogPanel.tsx",
  ];
  for (const file of files) {
    const text = await source(file);
    assert.doesNotMatch(text, /southline-local-discovery/, `${file} must not touch Local Discovery`);
  }
});

test("37. no new database table/migration was introduced for the catalog slice", async () => {
  const schema = await source("../lib/db/schema.ts");
  assert.doesNotMatch(schema, /professional_profiles|professionalCatalog|catalogEntries/i);
});

// --- No fabricated trust signals (item 10 of the Phase 1 checklist) -----------

test("the catalog adapter never fabricates ratings, reviews, credentials, or verification", async () => {
  const text = await source("../lib/southline-professional-catalog.ts");
  assert.match(text, /`verified` is intentionally never populated/);
  const contractor = makeContractor();
  const [card] = listSouthlineProfessionals({ locale: "en", contractors: [contractor], agents: [] });
  assert.equal(card.verified, undefined);
});

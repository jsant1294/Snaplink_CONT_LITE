import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  categoryIdsForAgent,
  categoryIdsForContractor,
  isSouthlineListedAgent,
  matchesQuery,
  searchProfessionals,
} from "../lib/southline-search.ts";
import { agentProfessionTypeLabel } from "../lib/profession-types.ts";

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
  services: ["Roofing", "Gutters & Downspouts"],
  tagline: "Local roofers you can trust",
  preferredLanguage: "en",
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const agent = (overrides = {}) => ({
  id: "ap_1",
  slug: "maria-lopez",
  username: "marialopez",
  status: "active",
  name: "Maria Lopez",
  firstName: "Maria",
  lastName: "Lopez",
  displayName: "Maria Lopez",
  professionType: "realtor",
  brokerageName: "Lopez Realty",
  officeName: "",
  teamName: "",
  licenseNumber: "TX-12345",
  licenseState: "TX",
  phone: "555-0200",
  email: "maria@example.com",
  serviceArea: "Austin, TX",
  bio: "",
  tagline: "Your Austin agent",
  preferredLanguage: "en",
  smsPhone: "",
  whatsapp: "",
  website: "",
  bookingLink: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  languages: ["en"],
  specialties: ["Buyer Representation", "Interior Painting"],
  serviceAreas: ["Austin", "Round Rock"],
  categories: ["Real Estate", "paint_drywall"],
  neighborhoods: [],
  featured: false,
  snaplinkStatus: "published",
  southlineStatus: "published",
  onboardingStatus: "ready",
  modules: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

test("searchProfessionals matches contractors by business name and service area", () => {
  const results = searchProfessionals([contractor(), contractor({ id: "ctr_2", username: "bob-trees", professionType: "landscaper", businessName: "Bob's Tree Service", services: ["Tree Service"] })], [], { query: "roofing" });
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Ace Roofing");
  assert.equal(results[0].href, "/contractor/ace-roofing");
});

test("searchProfessionals matches a professional by canonical service name (taxonomy)", () => {
  const results = searchProfessionals([contractor()], [], { query: "gutters" });
  assert.equal(results.length, 1);
  assert.equal(results[0].categories.includes("roof_exterior"), true);
});

test("searchProfessionals filters contractors by service category", () => {
  const roofing = contractor();
  const plumber = contractor({ id: "ctr_2", username: "quick-plumb", businessName: "Quick Plumb", services: ["Plumbing Repair"] });
  const results = searchProfessionals([roofing, plumber], [], { category: "plumbing" });
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Quick Plumb");
});

test("searchProfessionals only lists published/featured agents on Southline", () => {
  const draft = agent({ id: "ap_draft", southlineStatus: "draft" });
  const hidden = agent({ id: "ap_hidden", southlineStatus: "hidden" });
  const published = agent({ id: "ap_pub", southlineStatus: "published" });
  const suspended = agent({ id: "ap_susp", status: "suspended", southlineStatus: "published" });
  const results = searchProfessionals([], [draft, hidden, published, suspended], {});
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "ap_pub");
});

test("searchProfessionals matches agents by name, brokerage, and specialty", () => {
  const a = agent();
  assert.equal(searchProfessionals([], [a], { query: "lopez" })[0].kind, "agent");
  assert.equal(searchProfessionals([], [a], { query: "lopez realty" })[0].id, a.id);
  assert.equal(searchProfessionals([], [a], { query: "buyer representation" })[0].id, a.id);
});

test("searchProfessionals matches agents by service category via their categories/specialties", () => {
  const a = agent();
  const results = searchProfessionals([], [a], { category: "paint_drywall" });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, a.id);
});

test("searchProfessionals sorts featured agents first, then by name", () => {
  const b = agent({ id: "ap_b", slug: "betty", name: "Betty", displayName: "Betty" });
  const f = agent({ id: "ap_f", slug: "alice", name: "Alice", displayName: "Alice", southlineStatus: "featured" });
  const results = searchProfessionals([], [b, f], {});
  assert.equal(results[0].id, "ap_f");
  assert.equal(results[1].id, "ap_b");
});

test("agent results carry their professionType so the card can render the real profession, not a generic badge", () => {
  const realtor = agent();
  const contractorAgent = agent({ id: "ap_gc", slug: "jose", name: "Jose", displayName: "Jose", professionType: "contractor" });
  const realtorResult = searchProfessionals([], [realtor], { query: "lopez" })[0];
  const contractorResult = searchProfessionals([], [contractorAgent], { query: "jose" })[0];
  assert.equal(realtorResult.professionType, "realtor");
  assert.equal(contractorResult.professionType, "contractor");
  assert.equal(agentProfessionTypeLabel(realtorResult.professionType, "en"), "Realtor");
  assert.equal(agentProfessionTypeLabel(contractorResult.professionType, "en"), "General Contractor");
});

test("categoryIdsForContractor maps services to their canonical SERVICE_CATEGORIES ids", () => {
  assert.deepEqual(categoryIdsForContractor(contractor()).sort(), ["roof_exterior"]);
});

test("categoryIdsForAgent derives category ids from categories/specialties", () => {
  const ids = categoryIdsForAgent(agent());
  assert.ok(ids.includes("paint_drywall"), "interior painting maps to paint_drywall");
});

test("isSouthlineListedAgent guards account status AND southline publish status", () => {
  assert.equal(isSouthlineListedAgent(agent()), true);
  assert.equal(isSouthlineListedAgent(agent({ southlineStatus: "draft" })), false);
  assert.equal(isSouthlineListedAgent(agent({ status: "archived", southlineStatus: "featured" })), false);
});

test("matchesQuery is case-insensitive and substring-based, empty query matches all", () => {
  assert.equal(matchesQuery(["Ace Roofing"], "ace"), true);
  assert.equal(matchesQuery(["Ace Roofing"], "ROOF"), true);
  assert.equal(matchesQuery(["Ace Roofing"], "zzz"), false);
  assert.equal(matchesQuery(["Ace Roofing"], ""), true);
});

test("/api/southline/search reuses the shared search lib and includes agents", async () => {
  const route = await source("../app/api/southline/search/route.ts");
  assert.match(route, /searchProfessionals/);
  // Reads the gated agent/contractor lists through the shared public-cache
  // wrappers (see lib/public-cache.ts) rather than the stores directly — the
  // underlying listPublicActive()/listPublished() gate is unchanged.
  assert.match(route, /agentProfileStore|getCachedPublicActiveAgents/);
  assert.match(route, /contractorStore|getCachedPublishedContractors/);
  assert.match(route, /agents:/);
  assert.match(route, /category/);
});

test("/results page uses the shared search lib and the uniform ProfessionalCard", async () => {
  const page = await source("../app/results/page.tsx");
  assert.match(page, /searchProfessionals/);
  assert.match(page, /ProfessionalCard/);
  // Category chips are sourced from the shared taxonomy (single display source),
  // not the duplicated SERVICE_CATEGORIES array.
  assert.match(page, /listSouthlineHomeServices/);
  assert.doesNotMatch(page, /SERVICE_CATEGORIES/);
  assert.match(page, /resultsAll|resultsFilterLabel/);
  // Same gate, reached via the shared public-cache wrappers — see the route
  // test above.
  assert.match(page, /agentProfileStore|contractorStore|getCachedPublicActiveAgents|getCachedPublishedContractors/);
});

test("SearchOverlay routes into /results and renders agents section", async () => {
  const overlay = await source("../components/southline/SearchOverlay.tsx");
  assert.match(overlay, /\/results\?q=/);
  assert.match(overlay, /useRouter/);
  assert.match(overlay, /results.agents/);
  assert.match(overlay, /featuredAgentsEyebrow/);
});

test("Hero search submits a GET form to /results", async () => {
  const hero = await source("../components/southline/Hero.tsx");
  assert.match(hero, /<form action="\/results"/);
  assert.match(hero, /name="q"/);
});

test("results is a reserved identifier so no slug can shadow the new route", async () => {
  const types = await source("../lib/agent-profiles/types.ts");
  assert.match(types, /"results",/);
});

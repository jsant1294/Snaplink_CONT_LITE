import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import {
  HOME_SERVICE_CATEGORIES,
  HOME_SERVICE_GROUPS,
  HOME_SERVICE_SPECIALTIES,
  LOCAL_DISCOVERY_LEGACY_MAP,
  categoryMatchTerms,
  getHomeServiceCategory,
  getHomeServiceGroup,
  getHomeServiceSpecialty,
  listSouthlineHomeServices,
  professionCategoryId,
  resolveCategoryId,
  specialtyMatchTerms,
} from "../lib/home-service-taxonomy.ts";
import { SERVICE_CATEGORIES, SERVICE_LIBRARY } from "../lib/services.ts";
import { LICENSED_PROFESSION_TYPES, PROFESSION_TYPES } from "../lib/profession-types.ts";
import {
  categoryIdsForAgent,
  categoryIdsForContractor,
  searchProfessionals,
} from "../lib/southline-search.ts";

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

const remodeler = () =>
  contractor({
    id: "ctr_2",
    username: "top-remodel",
    professionType: "remodeler",
    businessName: "Top Remodel Co",
    services: ["Kitchen Remodel"],
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

const photographer = () =>
  agent({
    id: "apx_photo",
    slug: "camila-ruiz-photography",
    username: "camila-ruiz",
    professionType: "photographer",
    name: "Camila Ruiz",
    displayName: "Camila Ruiz",
    brokerageName: "Camila Ruiz Studio",
    serviceArea: "Decatur",
    licenseState: "",
    serviceAreas: [],
    specialties: ["Architecture", "Interior"],
    categories: [],
  });

// --- 1-8: registry invariants (source preservation) -------------------------

test("01 registry preserves all 10 SERVICE_CATEGORIES ids and labels", () => {
  assert.equal(HOME_SERVICE_CATEGORIES.length, 21);
  for (const c of SERVICE_CATEGORIES) {
    const cat = getHomeServiceCategory(c.id);
    assert.ok(cat, `category ${c.id} must exist in the registry`);
    assert.equal(cat.labelEn, c.en);
    assert.equal(cat.labelEs, c.es);
  }
});

test("02 registry preserves all 59 SERVICE_LIBRARY specialties with ids and labels", () => {
  assert.equal(HOME_SERVICE_SPECIALTIES.length, SERVICE_LIBRARY.length);
  for (const s of SERVICE_LIBRARY) {
    const sp = getHomeServiceSpecialty(s.name);
    assert.ok(sp, `specialty ${s.name} must exist in the registry`);
    assert.equal(sp.labelEn, s.name);
    assert.equal(sp.labelEs, s.es);
  }
});

test("03 every category has a valid parent group", () => {
  for (const c of HOME_SERVICE_CATEGORIES) {
    const group = getHomeServiceGroup(c.parentId);
    assert.ok(group, `category ${c.id} parent ${c.parentId} must be a real group`);
  }
});

test("04 every category is bilingual with non-empty labels", () => {
  for (const c of HOME_SERVICE_CATEGORIES) {
    assert.ok(c.labelEn.trim().length > 0, `category ${c.id} needs labelEn`);
    assert.ok(c.labelEs.trim().length > 0, `category ${c.id} needs labelEs`);
  }
});

test("05 every category has a valid audience tag and a unique stable id", () => {
  const audiences = new Set(["contractor", "professional", "both"]);
  const ids = new Set();
  for (const c of HOME_SERVICE_CATEGORIES) {
    assert.ok(audiences.has(c.audience), `category ${c.id} audience ${c.audience} is invalid`);
    assert.ok(!ids.has(c.id), `duplicate category id ${c.id}`);
    ids.add(c.id);
    assert.equal(typeof c.active, "boolean");
    assert.equal(typeof c.featured, "boolean");
    assert.equal(typeof c.southlineVisible, "boolean");
  }
});

test("06 every category exposes a search-alias list", () => {
  for (const c of HOME_SERVICE_CATEGORIES) {
    assert.ok(Array.isArray(c.aliases), `category ${c.id} must expose aliases`);
  }
});

test("07 every trade profession type maps to an existing category", () => {
  assert.ok(PROFESSION_TYPES.length >= 18);
  for (const p of PROFESSION_TYPES) {
    const catId = professionCategoryId(p.id);
    assert.ok(catId, `profession ${p.id} must map to a category`);
    assert.ok(getHomeServiceCategory(catId), `profession ${p.id} mapped to unknown ${catId}`);
  }
});

test("08 every licensed profession type maps to an existing category", () => {
  for (const p of LICENSED_PROFESSION_TYPES) {
    const catId = professionCategoryId(p.id);
    assert.ok(catId, `licensed profession ${p.id} must map to a category`);
    assert.ok(getHomeServiceCategory(catId), `licensed profession ${p.id} mapped to unknown ${catId}`);
  }
});

// --- 9-13: resolveCategoryId ------------------------------------------------

test("09 resolveCategoryId resolves canonical ids to themselves", () => {
  for (const c of HOME_SERVICE_CATEGORIES) {
    assert.equal(resolveCategoryId(c.id), c.id);
  }
});

test("10 resolveCategoryId resolves bilingual labels", () => {
  assert.equal(resolveCategoryId("Painting & Drywall"), "paint_drywall");
  assert.equal(resolveCategoryId("Plomería"), "plumbing");
  assert.equal(resolveCategoryId("Bienes Raíces"), "real-estate");
  assert.equal(resolveCategoryId("Techos y Exterior"), "roof_exterior");
});

test("11 resolveCategoryId resolves aliases in both languages", () => {
  assert.equal(resolveCategoryId("techador"), "roof_exterior");
  assert.equal(resolveCategoryId("fotógrafo"), "photography");
  assert.equal(resolveCategoryId("realtor"), "real-estate");
  assert.equal(resolveCategoryId("plomero"), "plumbing");
});

test("12 resolveCategoryId resolves Local Discovery legacy slugs", () => {
  assert.equal(resolveCategoryId("builders-remodelers"), "remodeling");
  assert.equal(resolveCategoryId("interior-designers"), "remodeling");
  assert.equal(resolveCategoryId("architects"), "remodeling");
  assert.equal(resolveCategoryId("landscaping"), "outdoor");
  assert.equal(resolveCategoryId("roofing"), "roof_exterior");
  // Canonical category ids win over the legacy fallback: "pools" is now a real
  // category, while Local Discovery's own internalSlug for the "pools" card
  // stays "outdoor" (documented in docs/03-legacy-mappings.md).
  assert.equal(resolveCategoryId("pools"), "pools");
  assert.equal(resolveCategoryId("photography"), "photography");
  assert.equal(resolveCategoryId("real-estate"), "real-estate");
});

test("13 resolveCategoryId returns undefined for unknown input (never guesses)", () => {
  assert.equal(resolveCategoryId("quantum-physics"), undefined);
  assert.equal(resolveCategoryId(""), undefined);
  assert.equal(resolveCategoryId("   "), undefined);
  assert.equal(resolveCategoryId("not-a-category"), undefined);
});

// --- 14-23: unified search integration ---------------------------------------

test("14 search finds a contractor by Spanish profession alias (techador)", () => {
  const hits = searchProfessionals([contractor()], [], { query: "techador" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Ace Roofing");
});

test("15 search finds a contractor by English noun alias (roofer)", () => {
  const hits = searchProfessionals([contractor()], [], { query: "roofer" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Ace Roofing");
});

test("16 search finds a contractor by specialty alias (canaletas)", () => {
  const hits = searchProfessionals([contractor()], [], { query: "canaletas" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Ace Roofing");
});

test("17 search finds an agent by profession alias (fotógrafo)", () => {
  const hits = searchProfessionals([], [photographer()], { query: "fotógrafo" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].professionType, "photographer");
});

test("18 search matches a contractor by top-level group label", () => {
  const hits = searchProfessionals([remodeler()], [], { query: "Construction & Remodeling" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Top Remodel Co");
  const esHits = searchProfessionals([remodeler()], [], { query: "Construcción y Remodelación" });
  assert.equal(esHits.length, 1);
});

test("19 search matches an agent by its profession category label (Bienes Raíces)", () => {
  const hits = searchProfessionals([], [agent()], { query: "Bienes Raíces" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "ap_1");
});

test("20 category filter resolves aliases (techos -> roof_exterior)", () => {
  const hits = searchProfessionals([contractor(), remodeler()], [], { category: "techos" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Ace Roofing");
});

test("21 unknown category filter returns an empty result set (no silent fallback)", () => {
  const hits = searchProfessionals([contractor()], [agent()], { category: "quantum-physics" });
  assert.equal(hits.length, 0);
});

test("22 category filter matches an agent by professional category (photography)", () => {
  const hits = searchProfessionals([contractor()], [photographer()], { category: "photography" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].professionType, "photographer");
});

test("23 alias expansion never duplicates results", () => {
  assert.equal(searchProfessionals([contractor()], [], { query: "techador" }).length, 1);
  assert.equal(searchProfessionals([contractor()], [], { query: "roofer" }).length, 1);
  assert.equal(searchProfessionals([contractor()], [], { query: "canaletas" }).length, 1);
});

// --- 24-28: mapping helpers + Southline adapter ------------------------------

test("24 canonical service-name search still matches", () => {
  const hits = searchProfessionals([contractor()], [], { query: "Roofing" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Ace Roofing");
});

test("25 categoryIdsForContractor is unchanged for the shipped fixture", () => {
  assert.deepEqual(categoryIdsForContractor(contractor()).sort(), ["roof_exterior"]);
});

test("26 categoryIdsForAgent keeps existing mappings and adds the profession-derived category", () => {
  const ids = categoryIdsForAgent(agent());
  assert.ok(ids.includes("paint_drywall"), "Interior Painting must still map to paint_drywall");
  assert.ok(ids.includes("real-estate"), "a realtor must also map to real-estate");
});

test("27 categoryIdsForAgent derives the photographer category from the profession", () => {
  const ids = categoryIdsForAgent(photographer());
  assert.ok(ids.includes("photography"));
});

test("28 listSouthlineHomeServices returns contractor + professional categories with locale-resolved labels", () => {
  const all = listSouthlineHomeServices();
  const ids = all.map((c) => c.id);
  assert.ok(ids.includes("roof_exterior"), "contractor category must be present");
  assert.ok(ids.includes("real-estate"), "professional category must be present");
  assert.ok(ids.includes("photography"), "both-audience category must be present");
  const es = listSouthlineHomeServices({ locale: "es" });
  assert.equal(es.find((c) => c.id === "roof_exterior").label, "Techos y Exterior");
  const en = listSouthlineHomeServices({ locale: "en" });
  assert.equal(en.find((c) => c.id === "real-estate").label, "Real Estate");
});

// --- 29-31: adapter filters --------------------------------------------------

test("29 listSouthlineHomeServices filters by audience", () => {
  const professional = listSouthlineHomeServices({ audience: "professional" });
  assert.ok(professional.length > 0);
  assert.ok(professional.every((c) => c.audience === "professional"));
  assert.ok(!professional.some((c) => c.id === "roof_exterior"));
  const contractorOnly = listSouthlineHomeServices({ audience: "contractor" });
  assert.ok(contractorOnly.every((c) => c.audience === "contractor"));
  assert.ok(!contractorOnly.some((c) => c.id === "real-estate"));
});

test("30 listSouthlineHomeServices filters by parent group and search", () => {
  const inspections = listSouthlineHomeServices({ parentId: "inspection-testing" });
  assert.deepEqual(inspections.map((c) => c.id).sort(), ["appraisals", "home-inspections", "surveying"]);
  const searched = listSouthlineHomeServices({ search: "Techos" });
  assert.ok(searched.some((c) => c.id === "roof_exterior"));
});

test("31 listSouthlineHomeServices orders by group then category sortOrder", () => {
  const all = listSouthlineHomeServices();
  const order = all.map((c) => c.id);
  const remodelingIdx = order.indexOf("remodeling");
  const plumbingIdx = order.indexOf("plumbing");
  const realEstateIdx = order.indexOf("real-estate");
  assert.ok(remodelingIdx < plumbingIdx, "remodeling group should sort before plumbing");
  assert.ok(plumbingIdx < realEstateIdx, "contractor groups should sort before professional categories");
});

// --- 32-34: hard-boundary guards --------------------------------------------

test("32 the taxonomy is a pure data module: no DB import, no migration, no identity table", async () => {
  const src = await source("../lib/home-service-taxonomy.ts");
  assert.doesNotMatch(src, /drizzle|pgTable|createTable|create table|from "\.\/db|from "\.\.\/db/i);
  assert.doesNotMatch(src, /^import .* from "\.\/(store|db)/i);
});

test("33 no new route family was added by this slice", async () => {
  await assert.rejects(access(new URL("../app/professionals", import.meta.url)), /ENOENT/);
  await assert.rejects(access(new URL("../app/taxonomy", import.meta.url)), /ENOENT/);
});

test("34 no new DB migration file landed in drizzle for the taxonomy", async () => {
  const src = await source("../lib/home-service-taxonomy.ts");
  assert.doesNotMatch(src, /drizzle-kit|CREATE TABLE|alter table/i);
});

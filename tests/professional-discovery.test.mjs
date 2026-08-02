import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  HOME_SERVICE_CATEGORIES,
  LOCAL_DISCOVERY_LEGACY_MAP,
  filterProfessionalsByTaxonomy,
  listSouthlineHomeServices,
  professionalTaxonomyCategory,
  resolveCategoryId,
} from "../lib/home-service-taxonomy.ts";
import {
  categoryIdsForAgent,
  categoryIdsForContractor,
  searchProfessionals,
} from "../lib/southline-search.ts";
import { getCategoryDestination } from "../lib/southline-local-discovery.ts";

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

// --- Phase 2: /results chips come from the taxonomy --------------------------

test("20 'both' lists every active category of every audience, no duplicates", () => {
  const en = listSouthlineHomeServices({ locale: "en", audience: "both" });
  const active = HOME_SERVICE_CATEGORIES.filter((c) => c.active);
  assert.equal(en.length, active.length);
  assert.equal(new Set(en.map((c) => c.id)).size, en.length);
  for (const c of en) {
    assert.ok(c.active, `${c.id} must be active`);
    assert.ok(c.southlineVisible, `${c.id} must be visible on Southline`);
    assert.ok([...new Set(HOME_SERVICE_CATEGORIES.map((x) => x.audience))].includes(c.audience));
  }
  // Both audiences are represented in the combined list.
  assert.ok(en.some((c) => c.audience === "contractor"));
  assert.ok(en.some((c) => c.audience === "professional"));
});

test("21 bilingual labels: same ids, locale-resolved labels", () => {
  const en = listSouthlineHomeServices({ locale: "en", audience: "both" });
  const es = listSouthlineHomeServices({ locale: "es", audience: "both" });
  assert.deepEqual(
    en.map((c) => c.id),
    es.map((c) => c.id)
  );
  for (const c of en) {
    const esCat = es.find((x) => x.id === c.id);
    assert.equal(c.label, c.labelEn);
    assert.equal(esCat.label, c.labelEs);
    if (c.labelEn !== c.labelEs) assert.notEqual(c.label, esCat.label);
  }
});

test("22 chips preserve the /results?category= URL contract (stable canonical id)", () => {
  for (const c of listSouthlineHomeServices({ locale: "en", audience: "both" })) {
    assert.equal(resolveCategoryId(c.id), c.id, `${c.id} must resolve to itself`);
  }
});

test("23 audience narrowing: professional subset only professional/both-tagged", () => {
  const pros = listSouthlineHomeServices({ locale: "en", audience: "professional" });
  const both = listSouthlineHomeServices({ locale: "en", audience: "both" });
  assert.ok(pros.length > 0 && pros.length < both.length);
  for (const c of pros) assert.equal(c.audience, "professional");
  const ctr = listSouthlineHomeServices({ locale: "en", audience: "contractor" });
  for (const c of ctr) assert.equal(c.audience, "contractor");
});

test("24 /results source: chips now read from the taxonomy, no SERVICE_CATEGORIES", async () => {
  const src = await source("../app/results/page.tsx");
  assert.match(src, /listSouthlineHomeServices\(\{ locale: lang, audience: "both" \}\)/);
  assert.doesNotMatch(src, /SERVICE_CATEGORIES/);
  assert.match(src, /\{c\.label\}/);
  assert.match(src, /category: c\.id/);
});

test("25 list is deterministically ordered (group order, then category sortOrder)", () => {
  const a = listSouthlineHomeServices({ locale: "en", audience: "both" });
  const b = listSouthlineHomeServices({ locale: "es", audience: "both" });
  assert.deepEqual(
    a.map((c) => c.id),
    b.map((c) => c.id),
    "ordering must be stable across locales/calls"
  );
  // Within each group, categories are ordered by ascending sortOrder.
  const byParent = new Map();
  for (const c of a) {
    if (!byParent.has(c.parentId)) byParent.set(c.parentId, []);
    byParent.get(c.parentId).push(c);
  }
  for (const cats of byParent.values()) {
    const orders = cats.map((c) => c.sortOrder);
    assert.deepEqual(orders, [...orders].sort((x, y) => x - y));
  }
});

// --- Phase 3: homepage Home Services cards -----------------------------------

test("30 FeaturedServicesEntryBlock uses the taxonomy and links to /results", async () => {
  const src = await source("../components/southline/FeaturedServicesEntryBlock.tsx");
  assert.match(src, /listSouthlineHomeServices\(\{ locale: lang \}\)/);
  assert.match(src, /results\?category=/);
  assert.doesNotMatch(src, /PROFESSION_TYPES\.map/);
});

test("31 each card label is locale-resolved and unique in the strip", () => {
  const es = listSouthlineHomeServices({ locale: "es" });
  assert.equal(new Set(es.map((c) => c.label)).size, es.length);
});

// --- Phase 4: featured-professional taxonomy filtering -----------------------

test("40 professionalTaxonomyCategory maps every known profession", () => {
  assert.equal(professionalTaxonomyCategory("roofing")?.id, "roof_exterior");
  assert.equal(professionalTaxonomyCategory("realtor")?.id, "real-estate");
  assert.equal(professionalTaxonomyCategory("electrician")?.id, "electrical");
  assert.equal(professionalTaxonomyCategory("no-such-profession"), undefined);
});

test("41 filterProfessionalsByTaxonomy narrows to the category", () => {
  const out = filterProfessionalsByTaxonomy([contractor(), remodeler()], {
    category: "roof_exterior",
  });
  assert.deepEqual(out.map((c) => c.id), ["ctr_1"]);
});

test("42 unknown category resolves to a safe empty result (no guess)", () => {
  assert.deepEqual(
    filterProfessionalsByTaxonomy([contractor(), remodeler()], { category: "flying-car" }),
    []
  );
});

test("43 no filter returns the input unchanged (display normalization only)", () => {
  const input = [contractor(), remodeler()];
  assert.equal(filterProfessionalsByTaxonomy(input), input);
  assert.deepEqual(filterProfessionalsByTaxonomy(input, {}), input);
});

test("44 audience filter excludes other-audience professionals", () => {
  const realtor = agent();
  const roofers = [contractor()];
  const both = filterProfessionalsByTaxonomy([...roofers, realtor], {
    category: "real-estate",
  });
  assert.deepEqual(both.map((c) => c.id), ["ap_1"]);
});

test("45 professionType filter narrows to the profession", () => {
  const out = filterProfessionalsByTaxonomy([contractor(), remodeler()], {
    professionType: "roofing",
  });
  assert.deepEqual(out.map((c) => c.id), ["ctr_1"]);
});

test("46 FeaturedProfessionals source wires the taxonomy filter", async () => {
  const src = await source("../components/southline/FeaturedProfessionals.tsx");
  assert.match(src, /filterProfessionalsByTaxonomy/);
  assert.match(src, /ProfessionalTaxonomyFilter/);
});

// --- Phase 5: directory filter resolution + safe empty state -----------------

test("50 searchProfessionals filters by canonical id, legacy slug, and label", () => {
  const roofers = [contractor()];
  const cases = [
    ["roof_exterior", ["ctr_1"]],
    ["roofing", ["ctr_1"]], // legacy Local Discovery slug
    ["Roofing", ["ctr_1"]], // label
    ["flying-car", []], // unknown -> safe empty, never a guess
  ];
  for (const [category, expected] of cases) {
    const out = searchProfessionals(roofers, [], { category });
    assert.deepEqual(out.map((c) => c.id), expected, `category="${category}"`);
  }
});

test("51 searchProfessionals resolves agents through the taxonomy too", () => {
  const out = searchProfessionals([contractor()], [agent()], { category: "real-estate" });
  assert.deepEqual(out.map((c) => c.id), ["ap_1"]);
});

test("52 categoryIdsForContractor/Agent stay taxonomy-aligned", () => {
  assert.ok(categoryIdsForContractor(contractor()).includes("roof_exterior"));
  assert.ok(categoryIdsForAgent(agent()).includes("real-estate"));
});

// --- Phase 7: Local Discovery unchanged --------------------------------------

test("60 photography still routes to SnapLink, everything else to Southline", () => {
  const localCat = (id, overrides = {}) => ({
    id,
    labelEn: id,
    labelEs: id,
    descriptionEn: null,
    descriptionEs: null,
    icon: null,
    imageUrl: null,
    snaplinkCategory: null,
    visible: true,
    featured: false,
    order: 0,
    seasonalTag: null,
    ...overrides,
  });
  assert.equal(getCategoryDestination(localCat("photography")), "snaplink");
  assert.equal(getCategoryDestination(localCat("roofing")), "southline");
  assert.equal(getCategoryDestination(localCat("photography", { destination: "southline" })), "southline");
});

test("61 legacy Local Discovery slugs resolve canonically (direct category id wins over legacy map)", () => {
  assert.ok(Object.keys(LOCAL_DISCOVERY_LEGACY_MAP).length >= 8);
  for (const [slug, legacyId] of Object.entries(LOCAL_DISCOVERY_LEGACY_MAP)) {
    // A slug that is itself a canonical category id resolves to itself (e.g.
    // "pools" -> the Pools & Spas category), otherwise to the legacy mapping.
    const expected = resolveCategoryId(slug);
    assert.ok(expected, `${slug} must resolve`);
    assert.equal(
      resolveCategoryId(expected),
      expected,
      `${expected} must be a canonical id`
    );
    if (expected !== slug) {
      assert.equal(expected, legacyId, `${slug} must resolve to its legacy id ${legacyId}`);
    }
  }
});

test("62 LocalDiscovery component untouched by this slice", async () => {
  const src = await source("../components/southline/LocalDiscovery.tsx");
  assert.match(src, /buildDiscoveryTarget/);
  assert.match(src, /getCategoryDestination/);
  assert.match(src, /internalSlug/);
  assert.match(src, /forwardedCategory/);
  assert.doesNotMatch(src, /home-service-taxonomy/);
});

// --- Phase 6/8: CMS + integration --------------------------------------------

test("70 HomepageEditor exposes a read-only Taxonomy tab", async () => {
  const src = await source("../components/southline/admin/HomepageEditor.tsx");
  assert.match(src, /function TaxonomyTab/);
  assert.match(src, /"taxonomy"/);
  assert.match(src, /resolveCategoryId/);
});

test("71 taxonomy adapter and search stay drop-in compatible", () => {
  const catalog = listSouthlineHomeServices({ locale: "en", audience: "both" });
  for (const c of catalog.slice(0, 5)) {
    assert.ok(HOME_SERVICE_CATEGORIES.some((x) => x.id === c.id));
  }
});

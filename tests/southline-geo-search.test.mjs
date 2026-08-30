import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { searchProfessionals } from "../lib/southline-search.ts";

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
  southlineStatus: "published",
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
  serviceArea: "San Antonio, TX",
  serviceAreas: ["San Antonio, TX", "Schertz, TX"],
  bio: "",
  tagline: "Your San Antonio agent",
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
  categories: [],
  isDemo: false,
  ...overrides,
});

test("location filter matches a contractor by city and by ZIP", () => {
  assert.equal(searchProfessionals([contractor()], [], { location: "Austin" }).length, 1);
  assert.equal(searchProfessionals([contractor()], [], { location: "austin, tx" }).length, 1);
  assert.equal(searchProfessionals([contractor({ serviceArea: "Austin, TX 78702" })], [], { location: "78702" }).length, 1);
});

test("location filter matches an agent by primary and secondary service areas", () => {
  assert.equal(searchProfessionals([], [agent()], { location: "San Antonio" }).length, 1);
  assert.equal(searchProfessionals([], [agent()], { location: "Schertz" }).length, 1);
  assert.equal(searchProfessionals([], [agent()], { location: "Dallas" }).length, 0);
});

test("a location filter that matches nothing returns empty — never a silent fallback", () => {
  const contracts = searchProfessionals(
    [contractor({ serviceArea: "Austin, TX" }), contractor({ id: "ctr_2", username: "top-remodel", serviceArea: "Houston, TX" })],
    [],
    { location: "El Paso" }
  );
  assert.equal(contracts.length, 0);
});

test("location combines with query and category filters without leaking across sources", () => {
  const pros = searchProfessionals(
    [contractor(), contractor({ id: "ctr_2", username: "sf-roofer", serviceArea: "San Francisco, CA" })],
    [agent({ serviceArea: "Austin, TX" })],
    { query: "roofer", location: "Austin" }
  );
  const ids = pros.map((p) => p.id);
  assert.deepEqual(ids, ["ctr_1"]);
});

test("location never bypasses the publish gate: draft or demo contractors stay hidden", () => {
  const matches = searchProfessionals(
    [contractor(), contractor({ id: "ctr_2", username: "draft-roofer", status: "draft" }), contractor({ id: "ctr_3", username: "demo-roofer", isDemo: true })],
    [],
    { location: "Austin" }
  );
  assert.deepEqual(matches.map((m) => m.id), ["ctr_1"]);
});

test("the search API forwards a location param and never short-circuits a location-only search", async () => {
  const route = await source("../app/api/southline/search/route.ts");
  assert.match(route, /get\("location"\)/);
  assert.match(route, /searchProfessionals\(contractors, agentProfiles, \{ query: q, category, location, geo, geoUnknownZip \}\)/);
  assert.match(route, /!category && !location/);
  assert.match(route, /zipCentroidStore\.find\(normalizeZip\(location\)\)/);
  assert.match(route, /geoUnknownZip = true/);
});

test("the /results page wires location into search, the search form, and the category chips", async () => {
  const page = await source("../app/results/page.tsx");
  assert.match(page, /location\?: string/);
  assert.match(page, /searchProfessionals\(contractors, agentProfiles, \{ query: q, category, location, geo, geoUnknownZip \}\)/);
  assert.match(page, /name="location"/);
  assert.match(page, /"searchLocation", lang/);
  assert.match(page, /\.\.\.\(location \? \{ location \} : \{\}\)/);
  assert.match(page, /"resultsGeoActiveLabel", lang/);
  assert.match(page, /"resultsGeoUnknownZip", lang/);
});

test("matchesLocation is exported for reuse and treats empty location as no filter", async () => {
  const mod = await import("../lib/southline-search.ts");
  assert.equal(typeof mod.matchesLocation, "function");
  assert.equal(mod.matchesLocation(["Austin, TX"], ""), true);
  assert.equal(mod.matchesLocation(["Austin, TX"], undefined), true);
  assert.equal(mod.matchesLocation(["Austin, TX"], "  78702 "), false);
});
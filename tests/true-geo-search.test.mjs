import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { searchProfessionals } from "../lib/southline-search.ts";
import { haversineMiles } from "../lib/geo/zip.ts";

const fixture = await readFile(new URL("./fixtures/zip-centroids.json", import.meta.url), "utf-8").then((s) => JSON.parse(s));
const byZip = new Map(fixture.map((c) => [c.zip, c]));

const centroids = (zips) => new Map(zips.map((z) => [z, byZip.get(z)]).filter(([, c]) => c));

function geoFrom(zip) {
  const c = byZip.get(zip);
  if (!c) throw new Error(`fixture missing ${zip}`);
  return { matchedZip: c.zip, centroid: { latitude: c.latitude, longitude: c.longitude } };
}

const contractor = (overrides = {}, serviceZip = "30005", serviceRadiusMiles = 15) => ({
  id: "ctr_1",
  username: "ace-roofing",
  professionType: "roofing",
  businessName: "Ace Roofing",
  ownerName: "",
  phone: "555-0100",
  email: "ace@example.com",
  serviceArea: "Alpharetta, GA",
  serviceZip,
  serviceRadiusMiles,
  services: ["Roofing", "Gutters & Downspouts"],
  tagline: "Local roofers you can trust",
  preferredLanguage: "en",
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const agent = (overrides = {}, serviceZip = "30004", serviceRadius = 20) => ({
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
  licenseState: "GA",
  phone: "555-0200",
  email: "maria@example.com",
  serviceArea: "Alpharetta, GA",
  serviceAreas: ["Alpharetta, GA"],
  bio: "",
  tagline: "Your Alpharetta agent",
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
  serviceZip,
  serviceRadius,
  isDemo: false,
  ...overrides,
});

function geoOptions(visitorZip, proZips) {
  return { ...geoFrom(visitorZip), centroids: centroids(proZips) };
}

test("exact ZIP: pro based at 30005 is found from 30005 with distanceMiles ≈ 0", () => {
  const g = geoOptions("30005", ["30005"]);
  const r = searchProfessionals([contractor()], [], { location: "30005", geo: g })[0];
  assert.ok(r, "expected a match at the exact ZIP");
  assert.equal(r.matchedZip, "30005");
  assert.equal(r.serviceRadiusMiles, 15);
  assert.equal(r.locationMatched, true);
  assert.ok(r.distanceMiles !== undefined && r.distanceMiles < 0.01, "distance ≈ 0");
});

test("nearby ZIP: pro at 30005 (radius 15) is found from 30004 — real Haversine distance", () => {
  const g = geoOptions("30004", ["30005"]);
  const pro = contractor();
  const r = searchProfessionals([pro], [], { location: "30004", geo: g })[0];
  assert.ok(r, "expected nearby match");
  const expect = haversineMiles(byZip.get("30004").latitude, byZip.get("30004").longitude, byZip.get("30005").latitude, byZip.get("30005").longitude);
  assert.ok(Math.abs(r.distanceMiles - expect) < 1e-9, "distanceMiles equals the pure Haversine distance");
  assert.ok(r.distanceMiles > 0 && r.distanceMiles < 15);
});

test("too far: pro at 30005 (radius 15) excluded from Portland 97201", () => {
  const g = geoOptions("97201", ["30005"]);
  assert.equal(searchProfessionals([contractor()], [], { location: "97201", geo: g }).length, 0);
});

test("radius boundary is deterministic on the exact fixture distance", () => {
  const exact = haversineMiles(byZip.get("30004").latitude, byZip.get("30004").longitude, byZip.get("30005").latitude, byZip.get("30005").longitude);
  const g = geoOptions("30004", ["30005"]);
  const atBoundary = searchProfessionals([contractor({}, "30005", exact)], [], { location: "30004", geo: g });
  assert.equal(atBoundary.length, 1, "distance === radius must include");
  const outside = searchProfessionals([contractor({}, "30005", exact - 0.01)], [], { location: "30004", geo: g });
  assert.equal(outside.length, 0, "distance > radius must exclude");
});

test("geo composes with category: wrong service category filters to nothing", () => {
  const g = geoOptions("30004", ["30005"]);
  const pro = contractor();
  pro.services = ["Interior Painting"]; // a service in a different canonical category
  assert.equal(searchProfessionals([pro], [], { location: "30004", category: "roofing", geo: g }).length, 0);
});

test("demo and draft and suspended professionals are never radius-matched", () => {
  const g = geoOptions("30004", ["30005"]);
  const demo = contractor({ id: "ctr_demo", isDemo: true });
  const draft = contractor({ id: "ctr_draft", status: "draft" });
  const suspended = contractor({ id: "ctr_susp", status: "suspended" });
  const published = contractor({ id: "ctr_pub" });
  const ids = searchProfessionals([demo, draft, suspended, published], [], { location: "30004", geo: g }).map((r) => r.id);
  assert.deepEqual(ids, ["ctr_pub"]);
});

test("agents radius-match via serviceZip + serviceRadius; unpublished/demo agents hidden", () => {
  const g = geoOptions("30005", ["30004"]);
  const listed = agent({ id: "ap_listed" }, "30004", 25);
  const notListed = agent({ id: "ap_draft", southlineStatus: "draft" }, "30004", 25);
  const demoAgent = agent({ id: "ap_demo", isDemo: true }, "30004", 25);
  const tooFar = agent({ id: "ap_far" }, "10001", 25);
  const res = searchProfessionals([], [listed, notListed, demoAgent, tooFar], { location: "30005", geo: g });
  assert.deepEqual(res.map((r) => r.id), ["ap_listed"]);
  assert.equal(res[0].serviceRadiusMiles, 25);
});

test("missing geo fields are never fabricated into radius matches", () => {
  const g = geoOptions("30004", ["30005"]);
  const noRadius = contractor({ id: "ctr_nor", serviceRadiusMiles: undefined });
  const noZip = contractor({ id: "ctr_noz", serviceZip: undefined });
  const unknownZip = contractor({ id: "ctr_unk", serviceZip: "99999" });
  const ok = contractor({ id: "ctr_ok" });
  assert.deepEqual(searchProfessionals([noRadius, noZip, unknownZip, ok], [], { location: "30004", geo: g }).map((r) => r.id), ["ctr_ok"]);
});

test("unknown visitor ZIP is an explicit empty result — never a silent broadening", () => {
  const g = geoOptions("30004", ["30005"]);
  const pro = contractor({ serviceArea: "Alpharetta, GA" });
  const res = searchProfessionals([pro], [], { location: "99999", geoUnknownZip: true, geo: null });
  assert.equal(res.length, 0);
});

test("ZIP+4 collapse: pro serviceZip '30005-1234' matches a 30005 origin at distance ≈ 0", () => {
  const z05 = byZip.get("30005");
  const r = searchProfessionals([contractor({}, "30005-1234")], [], {
    location: "30005-9999",
    geo: {
      matchedZip: "30005",
      centroid: { latitude: z05.latitude, longitude: z05.longitude },
      centroids: new Map([["30005", z05]]),
    },
  })[0];
  assert.ok(r, "ZIP+4 collapsed to 30005 should match");
  assert.equal(r.matchedZip, "30005");
  assert.ok(r.distanceMiles !== undefined && r.distanceMiles < 0.01);
});

test("no ZIP keeps the existing text/city/market substring behavior", () => {
  const pro = contractor({ serviceArea: "Alpharetta, GA" });
  assert.equal(searchProfessionals([pro], [], { location: "Alpharetta" }).length, 1);
  assert.equal(searchProfessionals([pro], [], { location: "Austin" }).length, 0);
});

test("geo ranking orders by distance ascending, ignoring featured for distance", () => {
  const g = geoOptions("30004", ["30005", "30022", "78702"]);
  const near = contractor({ id: "ctr_30005", username: "near" }, "30005", 200);
  const mid = contractor({ id: "ctr_30022", username: "mid" }, "30022", 200);
  const far = contractor({ id: "ctr_78702", username: "far" }, "78702", 1000);
  far.featured = true;
  const res = searchProfessionals([far, near, mid], [], { location: "30004", geo: g });
  assert.deepEqual(res.map((r) => r.id), ["ctr_30005", "ctr_30022", "ctr_78702"]);
  const [d0, d1, d2] = res.map((r) => r.distanceMiles);
  assert.ok(d0 !== undefined && d1 !== undefined && d2 !== undefined && d0 < d1 && d1 < d2);
});

test("geo-sensitive source wiring: route + results page resolve a ZIP centroid and set geoUnknownZip", async () => {
  const route = await readFile(new URL("../app/api/southline/search/route.ts", import.meta.url), "utf-8");
  assert.match(route, /zipCentroidStore\.find\(normalizeZip\(location\)\)/);
  assert.match(route, /geoUnknownZip = true/);
  const page = await readFile(new URL("../app/results/page.tsx", import.meta.url), "utf-8");
  assert.match(page, /zipCentroidStore\.find\(normalizeZip\(location\)\)/);
  assert.match(page, /geoUnknownZip = true/);
});
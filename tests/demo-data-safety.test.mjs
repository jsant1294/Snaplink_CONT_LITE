import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isPublicAgent,
  isPublicContractor,
  isSouthlineListedAgent,
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
  services: ["Roofing"],
  tagline: "Local roofers",
  preferredLanguage: "en",
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
  specialties: ["Buyer Representation"],
  serviceAreas: ["Austin"],
  categories: ["real-estate"],
  neighborhoods: [],
  featured: false,
  snaplinkStatus: "published",
  southlineStatus: "published",
  onboardingStatus: "not_started",
  modules: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

test("A C F: demo + draft contractors are excluded from public search; published contractors remain discoverable", () => {
  const demo = contractor({ id: "ctr_demo", username: "demo-brightbuild", isDemo: true, status: "published" });
  const draft = contractor({ id: "ctr_draft", username: "draft-remodel", isDemo: false, status: "draft" });
  const real = contractor({ id: "ctr_real", username: "real-remodel", isDemo: false, status: "published" });

  const out = searchProfessionals([demo, draft, real], [], { query: "" });
  const ids = out.map((r) => r.id);
  assert.ok(!ids.includes("ctr_demo"), "demo contractor leaked into search");
  assert.ok(!ids.includes("ctr_draft"), "draft contractor leaked into search (lifecycle publish gate)");
  assert.ok(ids.includes("ctr_real"), "published contractor disappeared from search");
});

test("A D: demo agent is excluded from public search even when otherwise eligible", () => {
  const demo = agent({ id: "apx_demo", slug: "camila-ruiz-photography", isDemo: true });
  assert.equal(isSouthlineListedAgent(demo), true, "precondition: agent would be listed without the demo flag");
  assert.equal(isPublicAgent(demo), false, "isPublicAgent must gate demo agents");

  const out = searchProfessionals([], [demo], { query: "" });
  assert.deepEqual(out, [], "demo agent leaked into /api/southline-search path");
});

test("A E: public agent discovery surface (\"/agents\") filter excludes demo agents", async () => {
  const src = await source("../app/agents/page.tsx");
  assert.match(src, /listPublicActive\(\)/, "app/agents/page.tsx must use the SQL-side public-active query (demo excluded in DB)");
});

test("C: /results path must route through searchProfessionals (which excludes demo)", async () => {
  const src = await source("../app/results/page.tsx");
  assert.match(src, /searchProfessionals\(/, "/results must use searchProfessionals");
});

test("F: isPublicContractor / isPublicAgent predicates are strict about undefined (safe default)", () => {
  assert.equal(isPublicContractor({ isDemo: false }), false, "a contractor without a lifecycle status is not public (draft default)");
  assert.equal(isPublicContractor({}), false, "absent isDemo and absent status defaults to hidden (never a silent leak)");
  assert.equal(isPublicContractor({ isDemo: true }), false);
  assert.equal(isPublicContractor({ status: "published", isDemo: false }), true, "published + non-demo is publicly discoverable");
  assert.equal(isPublicContractor({ status: "suspended", isDemo: false }), false, "suspended is never publicly discoverable");
  assert.equal(isPublicAgent({ isDemo: true }), false);
});

test("B: admin/operator retrieval path is NOT filtered by the public contract (raw store.list)", async () => {
  const adminProfiles = await source("../app/api/agent-profiles/route.ts");
  assert.match(adminProfiles, /isOperator\(pinFromRequest\(req\)\) \? await agentProfileStore\.list\(\)/, "operator branch must still see demo for cleanup");
});

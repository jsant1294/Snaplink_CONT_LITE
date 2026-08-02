// Unified Professional Profile slice: the existing agent_profiles model is the
// single identity system for every profession (realtors, licensed pros, AND
// trades/services). This test locks in the generalization — taxonomy coverage,
// profession-agnostic public/directory/form copy, search-by-profession — so the
// model is never forked into a parallel profile system.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  agentProfessionTypeLabel,
  isValidAgentProfessionType,
  professionPlaceholderPhotos,
} from "../lib/profession-types.ts";
import { searchProfessionals } from "../lib/southline-search.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

const ALL_HOME_SERVICE_PROFESSIONS = [
  "contractor",
  "home_inspector",
  "architect",
  "interior_designer",
  "landscaper",
  "plumber",
  "electrician",
  "painting",
  "remodeler",
  "property_manager",
  "photographer",
  "realtor",
];

test("the taxonomy covers every profession on the unified profile roadmap, including photographer", async () => {
  const types = await source("../lib/profession-types.ts");
  for (const id of ALL_HOME_SERVICE_PROFESSIONS) {
    assert.match(types, new RegExp(`id: "${id}"`), `profession ${id} must exist in the taxonomy`);
    assert.ok(isValidAgentProfessionType(id), `isValidAgentProfessionType("${id}") must accept the id`);
  }
  assert.match(types, /id: "photographer", en: "Photographer", es: "Fotógrafo"/);
});

test("photographer has its own placeholder photo pool (three verified images, never a blank box)", async () => {
  const photos = professionPlaceholderPhotos("photographer");
  assert.ok(photos.length >= 2, "photographer needs a photo pool");
  for (const photo of photos) assert.match(photo, /^https:\/\/images\.unsplash\.com\//);
  assert.equal(professionPlaceholderPhotos("photographer")[0], photos[0], "deterministic, stable pool");
});

test("profession label helper resolves photographer in both languages", () => {
  assert.equal(agentProfessionTypeLabel("photographer", "en"), "Photographer");
  assert.equal(agentProfessionTypeLabel("photographer", "es"), "Fotógrafo");
  assert.equal(agentProfessionTypeLabel("realtor", "en"), "Realtor");
  assert.equal(agentProfessionTypeLabel("contractor", "es"), "Contratista General");
});

test("profession-neutral i18n keys exist without touching the real-estate keys", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  for (const key of ["professionalDirectoryEyebrow", "professionalDirectoryTitle", "aboutProfessional"]) {
    assert.match(i18n, new RegExp(`${key}: \\{`), `i18n key ${key} must exist`);
  }
  // The pre-existing real-estate keys stay intact for the agent-recruitment surfaces.
  for (const key of ["featuredAgentsEyebrow", "agentsDirectoryTitle", "aboutAgent", "emailAgent"]) {
    assert.match(i18n, new RegExp(`${key}: \\{`), `existing key ${key} must remain`);
  }
});

test("the public profile page renders a profession badge and profession-agnostic About label", async () => {
  const page = await source("../components/agent-profiles/AgentProfilePublicPage.tsx");
  assert.match(page, /agentProfessionTypeLabel\(profile\.professionType, lang\)/);
  assert.match(page, /t\("aboutProfessional", lang\)/);
});

test("the /agents directory is a profession-neutral professional directory", async () => {
  const page = await source("../app/agents/page.tsx");
  assert.match(page, /t\("professionalDirectoryEyebrow", lang\)/);
  assert.match(page, /t\("professionalDirectoryTitle", lang\)/);
  assert.match(page, /agentProfessionTypeLabel\(agent\.professionType, lang\)/);
});

test("the create/edit form is profession-agnostic: Professional Details section + conditional company label", async () => {
  const form = await source("../components/agent-profiles/AgentForm.tsx");
  assert.match(form, />Professional Details<\/h3>/);
  assert.doesNotMatch(form, />Real Estate Details<\/h3>/);
  assert.match(form, /isBrokerageProfession \? "Brokerage" : "Company name"/);
  assert.match(form, /BROKERAGE_PROFESSIONS/);
});

test("the admin table shows the profession and a Company / Brokerage column", async () => {
  const panel = await source("../components/southline/admin/AgentProfilesPanel.tsx");
  assert.match(panel, />Profession<\/th>/);
  assert.match(panel, />Company \/ Brokerage<\/th>/);
  assert.match(panel, /agentProfessionTypeLabel\(p\.professionType, "en"\)/);
});

test("search matches a professional by its profession label, in both languages", () => {
  const photographer = {
    id: "apx_photo",
    status: "active",
    southlineStatus: "published",
    professionType: "photographer",
    name: "Camila Ruiz",
    displayName: "Camila Ruiz",
    brokerageName: "Camila Ruiz Studio",
    officeName: "",
    tagline: "",
    serviceArea: "Decatur",
    licenseState: "",
    serviceAreas: [],
    specialties: ["Architecture", "Interior"],
    categories: [],
    preferredLanguage: "en",
    slug: "camila-ruiz-photography",
    username: "camila-ruiz",
    photoUrl: "",
    pin: undefined,
  };
  for (const q of ["photographer", "Photographer", "fotógrafo"]) {
    const hits = searchProfessionals([], [photographer], { query: q });
    assert.equal(hits.length, 1, `query "${q}" must find the photographer`);
    assert.equal(hits[0].professionType, "photographer");
    assert.equal(hits[0].href, "/agents/camila-ruiz-photography");
  }
  assert.equal(searchProfessionals([], [photographer], { query: "plumber" }).length, 0, "unrelated profession must not match");
});

test("the demo seed includes a photographer on the same unified model (no license, studio as brokerage)", async () => {
  const seed = await source("../scripts/seed-agent-profiles-demo.mjs");
  assert.match(seed, /profession_type/);
  assert.match(seed, /'photographer'/);
  assert.match(seed, /ON CONFLICT \(slug\) DO NOTHING/);
  assert.doesNotMatch(seed, /CREATE TABLE/);
});

test("no parallel profile system was introduced — agent_profiles remains the one profile table", async () => {
  const schema = await source("../lib/db/schema.ts");
  assert.match(schema, /pgTable\("agent_profiles"/);
  assert.doesNotMatch(schema, /pgTable\("professional_profiles"|pgTable\("contractor_profiles"/);
});

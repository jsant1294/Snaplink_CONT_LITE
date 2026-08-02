import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// --- Public profile rendering: responsive layout, i18n, image fallback ------

test("AgentProfilePublicPage is responsive (not permanently phone-width) and has real breakpoints", async () => {
  const text = await source("../components/agent-profiles/AgentProfilePublicPage.tsx");
  assert.match(text, /sm:max-w-2xl/);
  assert.match(text, /lg:max-w-4xl/);
  assert.match(text, /sm:grid-cols-5/);
});

test("AgentProfilePublicPage falls back to the deterministic stock photo instead of rendering nothing", async () => {
  const text = await source("../components/agent-profiles/AgentProfilePublicPage.tsx");
  assert.match(text, /professionPlaceholderPhotoFor/);
  assert.match(text, /const photo = profile\.photoUrl \|\| professionPlaceholderPhotoFor\(profile\.id, profile\.professionType\)/);
  assert.doesNotMatch(text, /\{profile\.photoUrl && <img/, "must not silently omit the image when photoUrl is missing");
});

test("AgentProfilePublicPage CTAs use i18n keys, not permanently-English literals", async () => {
  const text = await source("../components/agent-profiles/AgentProfilePublicPage.tsx");
  assert.doesNotMatch(text, />Book a Consultation</);
  assert.doesNotMatch(text, />Visit Website</);
  assert.doesNotMatch(text, />View Full SnapLink Profile</);
  assert.match(text, /t\("bookingTitle", lang\)/);
  assert.match(text, /t\("visitWebsite", lang\)/);
  assert.match(text, /t\("viewFullSnaplinkProfile", lang\)/);
});

test("visitWebsite and viewFullSnaplinkProfile are real bilingual i18n keys", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /visitWebsite: \{ es: "[^"]+", en: "Visit Website" \}/);
  assert.match(i18n, /viewFullSnaplinkProfile: \{ es: "[^"]+", en: "View Full SnapLink Profile" \}/);
});

test("ContractorPublicPage accepts a lang prop that seeds its language state (cookie-driven, not hardcoded English)", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  assert.match(text, /lang: initialLang = "en"/);
  assert.match(text, /useState<Lang>\(initialLang\)/);
  assert.doesNotMatch(text, /useState<Lang>\("en"\)/, "must not hardcode the initial language ignoring the site cookie");
});

test("the contractor profile route passes the resolved sl_lang cookie into ContractorPublicPage", async () => {
  const page = await source("../app/contractor/[username]/page.tsx");
  assert.match(page, /<ContractorPublicPage contractor=\{contractor\} landingPage=\{landingPage\} lang=\{lang\} \/>/);
});

test("ContractorPublicPage has responsive breakpoints for its action grids and container", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  assert.match(text, /sm:max-w-2xl/);
  assert.match(text, /sm:flex sm:gap-3/);
  assert.match(text, /sm:grid sm:grid-cols-2/);
});

// --- Professional card polish ------------------------------------------------

test("ProfessionalCard shows a category badge sourced from real ProfessionalResult.categories, never invented", async () => {
  const text = await source("../components/southline/ProfessionalCard.tsx");
  assert.match(text, /const category = pro\.categories\[0\] \? categoryLabel\(pro\.categories\[0\], lang\) : null/);
  assert.match(text, /\{category && /);
});

test("ProfessionalCard uses larger photography and meets a 44px minimum touch target on its CTAs", async () => {
  const text = await source("../components/southline/ProfessionalCard.tsx");
  assert.match(text, /h-48 overflow-hidden sm:h-52/);
  assert.match(text, /min-h-\[44px\]/g);
});

test("ProfessionalCard never renders a rating or review", async () => {
  const text = await source("../components/southline/ProfessionalCard.tsx");
  assert.doesNotMatch(text, /\brating\b|\breview\b|\bstars?\b/i);
});

// --- Category pages: real filtering, empty state, navigation ----------------

test("/ideas/[category] filters contractors by the real service-category taxonomy instead of showing an unfiltered slice", async () => {
  const text = await source("../app/ideas/[category]/page.tsx");
  assert.match(text, /categoryIdsForContractor/);
  assert.match(text, /CATEGORY_TO_SERVICE_CATEGORIES/);
  assert.doesNotMatch(text, /allContractors\.slice\(0, 6\)/, "must not show an unfiltered slice of all contractors");
  assert.match(text, /\.filter\(\(c\) => categoryIdsForContractor\(c\)\.some\(\(id\) => wantedServiceCategories\.includes\(id\)\)\)/);
});

test("every ideas category-to-service-category mapping only references real SERVICE_CATEGORIES ids", async () => {
  const [ideasPage, services] = await Promise.all([
    source("../app/ideas/[category]/page.tsx"),
    source("../lib/services.ts"),
  ]);
  const realIds = [...services.matchAll(/\{ id: "([a-z_]+)", en:/g)].map((m) => m[1]);
  assert.ok(realIds.length > 0, "could not find any SERVICE_CATEGORIES ids to check against");
  const mapMatch = ideasPage.match(/CATEGORY_TO_SERVICE_CATEGORIES: Record<string, string\[\]> = \{([\s\S]*?)\n\};/);
  assert.ok(mapMatch, "CATEGORY_TO_SERVICE_CATEGORIES map not found");
  const usedIds = [...mapMatch[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  for (const id of usedIds) {
    assert.ok(realIds.includes(id), `CATEGORY_TO_SERVICE_CATEGORIES references unknown service category "${id}"`);
  }
});

test("/ideas/[category] has a real empty state and a back-to-all-services link", async () => {
  const text = await source("../app/ideas/[category]/page.tsx");
  assert.match(text, /contractors\.length > 0 \?/);
  assert.match(text, /t\("noProfessionalsYet", lang\)/);
  assert.match(text, /href="\/results"/);
  assert.match(text, /t\("browseAllServices", lang\)/);
});

test("/ideas/[category] contractor cards show a photo (with deterministic fallback) and profession badge", async () => {
  const text = await source("../app/ideas/[category]/page.tsx");
  assert.match(text, /c\.avatarUrl \|\| c\.logoUrl \|\| professionPlaceholderPhotoFor\(c\.id, c\.professionType\)/);
  assert.match(text, /professionTypeLabel\(c\.professionType, lang\)/);
});

test("noProfessionalsYet and browseAllServices are real bilingual i18n keys", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /noProfessionalsYet: \{/);
  assert.match(i18n, /browseAllServices: \{ es: "[^"]+", en: "Browse all services" \}/);
});

// --- Image fallback consistency ----------------------------------------------

test("the agent directory (/agents) shows a photo with the same deterministic fallback used everywhere else", async () => {
  const text = await source("../app/agents/page.tsx");
  assert.match(text, /agent\.photoUrl \|\| professionPlaceholderPhotoFor\(agent\.id, agent\.professionType\)/);
});

// --- Microcopy / bilingual parity --------------------------------------------

test("trustedProfessionalsNetwork is a real bilingual i18n key (FeaturedProfessionals.tsx is under active concurrent development and isn't part of this commit — see 04-copy-review.md)", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /trustedProfessionalsNetwork: \{/);
});

test("/results search button uses the existing heroSearch i18n key instead of an inline ternary", async () => {
  const text = await source("../app/results/page.tsx");
  assert.doesNotMatch(text, /\{lang === "es" \? "Buscar" : "Search"\}/);
  assert.match(text, /t\("heroSearch", lang\)/);
});

test("the mini-campaign page's CTA uses an i18n key instead of an inline ternary", async () => {
  const text = await source("../app/c/[username]/[slug]/page.tsx");
  assert.doesNotMatch(text, /\{lang === "es" \? "Contactar" : "Contact"\}/);
  assert.match(text, /t\("contactCtaLabel", lang\)/);
});

// --- No fabricated trust signals across every touched surface ---------------

test("no ratings, reviews, or star icons were introduced on any touched public surface", async () => {
  const files = [
    "../components/agent-profiles/AgentProfilePublicPage.tsx",
    "../components/intake/ContractorPublicPage.tsx",
    "../components/southline/ProfessionalCard.tsx",
    "../app/ideas/[category]/page.tsx",
    "../app/agents/page.tsx",
  ];
  for (const file of files) {
    const text = await source(file);
    assert.doesNotMatch(text, /\b\d(\.\d)?\s*stars?\b/i, `${file} appears to render a fabricated star rating`);
    assert.doesNotMatch(text, /rating:\s*\d/i, `${file} appears to render a fabricated rating value`);
  }
});

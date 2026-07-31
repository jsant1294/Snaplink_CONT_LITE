import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("RealEstateEntryBlock's featured listing always renders a real image, in both the live-property branch and the defensive fallback branch", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.match(text, /\{property && \(/);
  assert.match(text, /\{!property && \(/);
  assert.doesNotMatch(text, /bg-sand \/>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*\)\s*:\s*\(\s*\n\s*<div className="flex h-64/, "must not fall back to a text-only empty box");
});

test("real-estate homes-fallback layer is read-only: it never writes to the database, only substitutes fixtures for display when live inventory is empty", async () => {
  const text = await source("../lib/real-estate/homes-fallback.ts");
  assert.doesNotMatch(text, /\.insert\(|\.update\(|\.delete\(|createProperty|publishProperty/);
  assert.match(text, /demoProperties/);
});

test("homepage, /homes, and /homes/[slug] all use the same fallback layer so a home surfaced on one page never dead-links on another", async () => {
  for (const file of ["../app/page.tsx", "../app/homes/page.tsx", "../app/homes/[slug]/page.tsx"]) {
    const text = await source(file);
    assert.match(text, /homes-fallback/, `${file} must use the real-estate fallback layer`);
  }
});

test("footer says Professionals (not Contractors) and links to Agent profiles", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /footerProfessionals: \{ es: "Profesionales", en: "Professionals" \}/);
  assert.doesNotMatch(i18n, /footerContractors:/);
  const footer = await source("../components/southline/Footer.tsx");
  assert.match(footer, /footerProfessionals/);
  assert.match(footer, /footerAgentProfiles/);
});

test("the four flagged category images (kitchens, bathrooms, patios, garage & workshop) were replaced, not reused as-is", async () => {
  const text = await source("../components/southline/CategoriesGrid.tsx");
  assert.doesNotMatch(text, /slug: "cocinas",\s*\n\s*image: "https:\/\/images\.unsplash\.com\/photo-1600566753086/);
  assert.doesNotMatch(text, /slug: "banos",\s*\n\s*image: "https:\/\/images\.unsplash\.com\/photo-1600566753190/);
  assert.doesNotMatch(text, /slug: "patios",\s*\n\s*image: "https:\/\/images\.unsplash\.com\/photo-1600210492486/);
  assert.doesNotMatch(text, /slug: "garajes",\s*\n\s*image: "https:\/\/images\.unsplash\.com\/photo-1530124566582/);
});

test("Trending section renders image cards (editorial photo, title, description, View Projects CTA) instead of plain text-link buttons", async () => {
  const text = await source("../components/southline/TrendingSection.tsx");
  assert.match(text, /<img/);
  assert.match(text, /viewProjects/);
  assert.doesNotMatch(text, /<button/, "trending items should be image cards, not bare text buttons");
});

test("hero copy communicates a home marketplace, not a project-inspiration blog", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /en: "Everything Home\. One Trusted Place\."/);
  assert.match(i18n, /Search homes, professionals, neighborhoods, projects, or ideas/);
});

test("new and changed homepage sections contain no dead '#' links and no emoji", async () => {
  for (const file of [
    "../components/southline/RealEstateEntryBlock.tsx",
    "../components/southline/FeaturedHomes.tsx",
    "../components/southline/TrendingSection.tsx",
    "../components/southline/EstimatorBookingSection.tsx",
    "../components/southline/CategoriesGrid.tsx",
    "../lib/real-estate/homes-fallback.ts",
  ]) {
    const text = await source(file);
    assert.doesNotMatch(text, /href="#"/, `${file} has a dead link`);
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${file} contains an emoji`);
  }
});

// Footer.tsx's "Company" column (About/Contact/Privacy/Terms/Accessibility) links to "#"
// pre-existing this pass — no such pages exist yet in the app. Building five new legal/
// static pages wasn't requested here, so only the sections this pass actually touched
// (Explore, Professionals) are checked for dead links.
test("the footer sections touched by this pass (Explore, Professionals) contain no dead '#' links", async () => {
  const footer = await source("../components/southline/Footer.tsx");
  const explore = footer.slice(footer.indexOf("{/* Explore */}"), footer.indexOf("{/* Company */}"));
  assert.doesNotMatch(explore, /href="#"/);
  assert.doesNotMatch(explore, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", () => {
  const diff = execSync(
    "git diff --name-only 0e31d87 -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts lib/payments.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for a homepage/UI pass");
});

// A prior version of this test asserted no migration existed past this commit at
// all — true only for the V3 homepage pass itself. Later, separate, approved work
// (e.g. Lucio's lucio_events table) legitimately adds its own migrations, so that
// blanket check doesn't generalize. The empty-listing fix specifically (this
// pass's own contribution) is still verified read-only by the fallback-layer test
// above.

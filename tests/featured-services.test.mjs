import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Featured Services Marketplace sits directly below the Homes section on the homepage", async () => {
  const page = await source("../app/page.tsx");
  const featuredHomesIdx = page.indexOf("<FeaturedHomes");
  const servicesIdx = page.indexOf("<FeaturedServicesEntryBlock");
  const professionalsIdx = page.indexOf("<FeaturedProfessionals");
  assert.ok(featuredHomesIdx > -1 && servicesIdx > -1 && professionalsIdx > -1, "all three sections must render");
  assert.ok(featuredHomesIdx < servicesIdx, "Featured Services must come after Featured Homes");
  assert.ok(servicesIdx < professionalsIdx, "Featured Services must come before the professionals grid");
});

test("the featured professional card is never a simple contractor grid: it mirrors the Homes layout (image-dominant hero, summary card, recruitment card, navigation)", async () => {
  const text = await source("../components/southline/FeaturedServicesEntryBlock.tsx");
  assert.match(text, /grid gap-6 lg:grid-cols-\[1\.4fr_1fr\]/, "must reuse the same asymmetric image-dominant grid as RealEstateEntryBlock");
  assert.match(text, /featuredProject/);
  assert.match(text, /snaplinkVerified/);
  assert.match(text, /servicesRecruitmentHeadline/);
  assert.match(text, /exploreProfessionals/);
  assert.match(text, /findByTrade/);
  assert.match(text, /browseCategories/);
});

test("no star rating is fabricated anywhere in the featured services section — this app has no reviews/ratings system for any professional yet", async () => {
  // The word "rating" legitimately appears in code comments explaining this
  // deliberate omission — check for actual fabricated-rating patterns instead
  // (a rating field/value, a star glyph, or an "X stars" claim), not the word itself.
  const component = await source("../components/southline/FeaturedServicesEntryBlock.tsx");
  const fixture = await source("../lib/featured-services-fixtures.ts");
  for (const text of [component, fixture]) {
    assert.doesNotMatch(text, /★|⭐/);
    assert.doesNotMatch(text, /\d(\.\d)?\s*stars?\b/i);
    assert.doesNotMatch(text, /\brating\s*[:=]/i);
    assert.doesNotMatch(text, /pro\.rating/);
  }
});

test("demo featured-professional content is clearly fictional and never reuses a real seeded contractor's name", async () => {
  const fixture = await source("../lib/featured-services-fixtures.ts");
  assert.match(fixture, /\(Demo\)/, "the demo company name must be visibly marked as demo content");
  for (const realName of ["JJ Remodeling", "Ridgeline Remodeling & Design", "SouthLine Remodeling"]) {
    assert.doesNotMatch(fixture, new RegExp(realName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `must not fabricate details under the real contractor name "${realName}"`);
  }
});

test("the category strip is sourced from the shared taxonomy and every chip links to a real page, never a dead '#'", async () => {
  const text = await source("../components/southline/FeaturedServicesEntryBlock.tsx");
  assert.match(text, /listSouthlineHomeServices/);
  assert.match(text, /results\?category=/);
  assert.doesNotMatch(text, /href="#"/);
  assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", () => {
  const diff = execSync(
    "git diff --name-only e407245 -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts lib/payments.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for a homepage marketing section");
});

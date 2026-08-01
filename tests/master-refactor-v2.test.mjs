import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("profession types cover the trade/design/build taxonomy but exclude realtor and mortgage_broker (served by the separate agent-profiles system)", async () => {
  const text = await source("../lib/profession-types.ts");
  const tradesBlock = text.slice(
    text.indexOf("export const PROFESSION_TYPES"),
    text.indexOf("\n];", text.indexOf("export const PROFESSION_TYPES"))
  );
  for (const id of ["contractor", "remodeler", "home_builder", "interior_designer", "architect", "landscaper", "electrician", "plumber", "hvac", "roofing", "painting", "flooring", "cabinet_maker", "home_inspector", "window_company", "solar", "pool_builder"]) {
    assert.match(tradesBlock, new RegExp(`id: "${id}"`), `missing profession type: ${id}`);
  }
  // realtor/mortgage_broker may legitimately appear elsewhere in this file
  // (LICENSED_PROFESSION_TYPES, for agent_profiles) — only PROFESSION_TYPES
  // itself (the trades taxonomy) must exclude them.
  assert.doesNotMatch(tradesBlock, /id: "realtor"|id: "mortgage_broker"/);
});

test("every profession type has at least two placeholder photo variants, and no card can render blank or with an emoji", async () => {
  const text = await source("../lib/profession-types.ts");
  const tradesBlock = text.slice(
    text.indexOf("export const PROFESSION_TYPES"),
    text.indexOf("\n];", text.indexOf("export const PROFESSION_TYPES"))
  );
  const idMatches = [...tradesBlock.matchAll(/id: "([a-z_]+)", en:/g)].map((m) => m[1]);
  assert.ok(idMatches.length >= 17);
  for (const id of idMatches) {
    const block = text.slice(text.indexOf(`  ${id}: [`), text.indexOf("],", text.indexOf(`  ${id}: [`)));
    assert.match(block, /https:\/\/images\.unsplash\.com\/photo-/, `missing placeholder photo for ${id}`);
    const urlCount = [...block.matchAll(/https:\/\/images\.unsplash\.com\/photo-/g)].length;
    assert.ok(urlCount >= 2, `${id} should have at least two photo variants so repeated companies don't share one image`);
  }
  assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("professionType is validated server-side against the fixed taxonomy, never trusted as free text", async () => {
  const text = await source("../app/api/contractor/profiles/route.ts");
  assert.match(text, /isValidProfessionType\(body\.professionType\)/);
  assert.match(text, /DEFAULT_PROFESSION_TYPE/);
});

test("the contractors migration is additive: one new column, no rename or drop", async () => {
  const sql = await source("../drizzle/0013_contractor_profession_type.sql");
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "profession_type"/);
  assert.doesNotMatch(sql, /DROP|RENAME|TRUNCATE|DELETE FROM/i);
});

test("the operator dashboard says 'New Professional' and offers a profession type picker", async () => {
  const text = await source("../app/contractor-admin/new-contractor/page.tsx");
  assert.match(text, />New Professional</);
  assert.doesNotMatch(text, />New Contractor</);
  assert.match(text, /PROFESSION_TYPES\.map/);
});

test("FeaturedProfessionals cards are never text-only, and no two cards in the same render share a placeholder photo when variants exist", async () => {
  const text = await source("../components/southline/FeaturedProfessionals.tsx");
  assert.match(text, /professionPlaceholderPhotoFor\(c\.id, c\.professionType\)/);
  assert.match(text, /function assignCardPhotos/);
  assert.match(text, /used\.has\(photo\)/, "must dedup photo assignments within a single render");
});

test("homepage section order matches the V3 target flow: Hero, Find a Home, Featured Services, Professionals, Categories, DIY, Trending, Seasonal, Estimator+Booking, Become-a-Professional", async () => {
  const page = await source("../app/page.tsx");
  const order = ["<Hero", "<RealEstateEntryBlock", "<FeaturedHomes", "<FeaturedServicesEntryBlock", "<FeaturedProfessionals", "<CategoriesGrid", "<DIYLearningTeaser", "<TrendingSection", "<SeasonalIdeasBanner", "<EstimatorBookingSection", "<BecomeAProfessionalSection"];
  let cursor = -1;
  for (const tag of order) {
    const idx = page.indexOf(tag);
    assert.ok(idx > -1, `${tag} must render on the homepage`);
    assert.ok(idx > cursor, `${tag} is out of order`);
    cursor = idx;
  }
});

test("new homepage sections never link to a dead \"#\" and contain no emoji", async () => {
  for (const file of [
    "../components/southline/FeaturedHomes.tsx",
    "../components/southline/DIYLearningTeaser.tsx",
    "../components/southline/SeasonalIdeasBanner.tsx",
    "../components/southline/EstimatorBookingSection.tsx",
    "../components/southline/BecomeAProfessionalSection.tsx",
  ]) {
    const text = await source(file);
    assert.doesNotMatch(text, /href="#"/, `${file} has a dead link`);
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${file} contains an emoji`);
  }
});

test("Lucio Financial Copilot (tax/payment) code is untouched by this pass", () => {
  const diff = execSync(
    "git diff --name-only ea74278 -- app/api/contractor/expenses app/api/contractor/forms-1099 app/api/contractor/quarterly app/api/contractor/setasides app/api/contractor/tax-profile app/api/contractor/payees app/api/contractor/year-end-csv app/api/contractor/year-end-pdf lib/store-money-pg.ts lib/store-money-json.ts",
    { encoding: "utf8" }
  ).trim();
  assert.equal(diff, "", "LFC tax/payment routes and stores must not change for an additive professionType field");
});

test("the contractors table itself is not renamed or restructured — professionType is the only new column", () => {
  const diff = execSync("git diff ea74278 -- lib/db/schema.ts", { encoding: "utf8" });
  assert.match(diff, /\+\s+professionType: text\("profession_type"\)\.notNull\(\)\.default\("contractor"\)/);
  assert.doesNotMatch(diff, /^-.*(username|businessName|pin:|preferredLanguage):/m, "no existing contractors column should be removed or altered");
  assert.doesNotMatch(diff, /pgTable\(\s*\n?\s*"professionals"/, "the table must not be renamed");
});

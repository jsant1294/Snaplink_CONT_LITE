import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage render order is the authoritative homeowner narrative", async () => {
  const page = await source("../app/page.tsx");
  const ordered = [
    "<Hero", "<SeasonalIdeasBanner", "<TrendingSection", "<RealEstateEntryBlock", "<FeaturedHomes", "<FeaturedRentals",
    "<FeaturedServicesEntryBlock", "<LocalDiscovery", "<FeaturedProfessionals", "<CategoriesGrid",
    "<DIYLearningTeaser", "<EstimatorBookingSection", "<CommunitySpotlight",
    "<TestimonialsSection", "<BecomeAProfessionalSection", "<PoweredBySnapLink", "<SnapLinkLocalPromo",
  ];
  const positions = ordered.map((component) => page.indexOf(component));
  assert.ok(positions.every((position) => position >= 0), "every authoritative block must render");
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.ok(page.indexOf("<Header") < positions[0], "Hero is first after Header");
  assert.ok(positions.at(-1) < page.indexOf("</main>"), "SnapLink Local Promo is the final content block");
  assert.ok(page.indexOf("<Footer") > page.indexOf("</main>"), "Footer follows all homepage content");
});

test("Local Discovery no longer follows Hero directly", async () => {
  const page = await source("../app/page.tsx");
  assert.ok(page.indexOf("<FeaturedServicesEntryBlock") < page.indexOf("<LocalDiscovery"));
  assert.ok(page.indexOf("<LocalDiscovery") < page.indexOf("<FeaturedProfessionals"));
});

test("FeaturedRentals uses the existing fallback and canonical property routes", async () => {
  const [page, component] = await Promise.all([
    source("../app/page.tsx"),
    source("../components/southline/FeaturedRentals.tsx"),
  ]);
  assert.match(page, /getCachedPublishedRentals\(\)/, "homepage renders rentals via the cached public-catalog layer");
  assert.match(page, /public-cache/, "homepage imports the public catalog cache wrapper");
  assert.match(component, /href=\{`\/homes\/\$\{property\.slug\}`\}/);
  assert.match(component, /href="\/rentals"/);
  assert.doesNotMatch(component, /Airbnb|availability|available|per night|nightly|formatPropertyPrice/i);
});

test("FeaturedRentals includes approved English and Spanish copy", async () => {
  const types = await source("../lib/southline-types.ts");
  assert.match(types, /RENTALS & GETAWAYS/);
  assert.match(types, /Find a place to stay, settle in, or get away/);
  assert.match(types, /Explore local rentals, furnished stays, cabins, cottages, and memorable getaways\./);
  assert.match(types, /ALQUILERES Y ESCAPADAS/);
  assert.match(types, /Encuentra un lugar para quedarte, instalarte o escapar/);
  assert.match(types, /Explora alquileres locales, estancias amuebladas, cabañas, casas de campo y escapadas memorables\./);
});

test("FeaturedRentals has a bilingual graceful empty state", async () => {
  const component = await source("../components/southline/FeaturedRentals.tsx");
  assert.match(component, /properties\.length > 0/);
  assert.match(component, /New stays coming soon/);
  assert.match(component, /Nuevas estancias próximamente/);
});

test("rentals and testimonials respect section visibility and default visible", async () => {
  const [page, types, editor] = await Promise.all([
    source("../app/page.tsx"),
    source("../lib/southline-types.ts"),
    source("../components/southline/admin/HomepageEditor.tsx"),
  ]);
  assert.match(page, /sections\.featuredRentals !== false/);
  assert.match(page, /sections\.testimonials !== false/);
  assert.match(types, /featuredRentals: true/);
  assert.match(types, /testimonials: true/);
  assert.match(editor, /Rentals & Getaways/);
  assert.match(editor, /Maximum cards/);
  assert.match(editor, /Selected rental IDs/);
});

test("settings stores deep-merge additive rental controls", async () => {
  const [json, pg] = await Promise.all([
    source("../lib/southline-store-json.ts"),
    source("../lib/southline-store-pg.ts"),
  ]);
  for (const store of [json, pg]) {
    assert.match(store, /featuredRentals: \{/);
    assert.match(store, /selectedRentalIds: stored\.featuredRentals\?\.selectedRentalIds/);
  }
});

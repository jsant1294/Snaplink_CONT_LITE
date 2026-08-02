// Rentals & Getaways slice (Big Pickle): /rentals landing page, nav restructure
// (navRealEstate → navRentals), rental fixtures, and the read-only fallback layer.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("a /rentals landing page exists, is server-rendered, and uses the rental-scoped fallback layer", async () => {
  const page = await source("../app/rentals/page.tsx");
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /listPublishedRentalsWithFallback/);
  assert.match(page, /homes-fallback/);
  assert.match(page, /href=\{`\/homes\/\$\{property\.slug\}`\}/, "rental cards link to the existing detail page");
});

test("the /rentals landing renders bilingual copy with no dead links, no emoji, and an empty-state path back to /homes", async () => {
  const page = await source("../app/rentals/page.tsx");
  assert.match(page, /"Alquileres y Escapadas"/);
  assert.match(page, /"Encuentra tu estancia, de temporada o a largo plazo\."/);
  assert.match(page, /name="q"/, "search form submits to the same page");
  assert.match(page, /href="\/homes"/, "empty state links back to /homes");
  assert.doesNotMatch(page, /href="#"/);
  assert.doesNotMatch(page, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "no emoji glyphs");
});

test("demoRentals fixtures: three published rental listings, each with real imagery and rental-safe copy", async () => {
  const fixtures = await source("../lib/real-estate/fixtures.ts");
  const rentals = fixtures.slice(fixtures.indexOf("export const demoRentals"), fixtures.indexOf("export const demoLeads"));
  assert.match(rentals, /status: "rental"/);
  assert.match(rentals, /published: true/);
  assert.equal((rentals.match(/id: "re-rental-/g) || []).length, 3, "three rental fixtures");
  assert.equal((rentals.match(/imageUrls: \["https:\/\/images\.unsplash\.com/g) || []).length, 3, "each rental has an image");
  assert.doesNotMatch(rentals, /nightly|per night|deposit|pet|check-in|check-in-out/gi, "no fabricated rental semantics in copy");
});

test("the rentals fallback helper is read-only and filters to status 'rental' before falling back to demoRentals", async () => {
  const text = await source("../lib/real-estate/homes-fallback.ts");
  assert.doesNotMatch(text, /\.insert\(|\.update\(|\.delete\(/);
  assert.match(text, /status: "rental"/);
  assert.match(text, /demoRentals/);
  assert.match(text, /listPublishedRentalsWithFallback/);
});

test("nav restructure: navHomes + navRentals exist in i18n, navDIY label updated, navRealEstate removed", async () => {
  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /navHomes: \{ es: "Casas", en: "Homes" \}/);
  assert.match(i18n, /navRentals: \{ es: "Alquileres y Escapadas", en: "Rentals & Getaways" \}/);
  assert.match(i18n, /navDIY: \{ es: "Hazlo Tú Mismo", en: "DIY" \}/);
  assert.doesNotMatch(i18n, /navRealEstate:/);
});

test("nav restructure: Header defaults, CMS defaults, and Footer all use the new keys and /rentals href", async () => {
  const header = await source("../components/southline/Header.tsx");
  assert.match(header, /href: "\/rentals"/);
  assert.doesNotMatch(header, /navRealEstate/);

  const types = await source("../lib/southline-types.ts");
  assert.match(types, /navRentals/);
  assert.doesNotMatch(types, /navRealEstate/);

  const footer = await source("../components/southline/Footer.tsx");
  assert.match(footer, /t\("navHomes"/);
  assert.match(footer, /t\("navRentals"/);
  assert.match(footer, /href="\/rentals"/);
  assert.doesNotMatch(footer, /navRealEstate/);
});

test("store merges retire the old navRealEstate key so stored settings never resurrect a stale nav item", async () => {
  for (const store of ["../lib/southline-store-json.ts", "../lib/southline-store-pg.ts"]) {
    const text = await source(store);
    assert.match(text, /RETIRED_NAV_KEYS = \["navRealEstate"\]/);
  }
});

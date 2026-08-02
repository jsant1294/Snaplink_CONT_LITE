import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the real estate entry block leads the homes and rentals marketplace sequence", async () => {
  const page = await source("../app/page.tsx");
  const heroIdx = page.indexOf("<Hero");
  const blockIdx = page.indexOf("<RealEstateEntryBlock");
  const homesIdx = page.indexOf("<FeaturedHomes");
  const rentalsIdx = page.indexOf("<FeaturedRentals");
  assert.ok(heroIdx > -1 && blockIdx > -1 && homesIdx > -1 && rentalsIdx > -1, "all sections must render");
  assert.ok(heroIdx < blockIdx && blockIdx < homesIdx && homesIdx < rentalsIdx, "real estate entry leads homes and rentals after the Hero");
});

test("primary CTAs route to real pages, never a dead \"#\"", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.doesNotMatch(text, /href="#"/);
  assert.match(text, /href="\/homes/);
  assert.match(text, /href="\/agents/);
  assert.match(text, /href=\{`\/homes\/\$\{property\.slug\}`\}/);
  assert.match(text, /href=\{agent\.demo \? "\/agents" : `\/agents\/\$\{agent\.slug\}`\}/);
});

test("the entry block renders only real, already-fetched data — no fabricated reviews, production numbers, or emojis", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.doesNotMatch(text, /reviews|rating|★|⭐/i);
  assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "no emoji glyphs");
  // headshot/specialties/languages are only ever rendered behind a truthiness check on real fetched fields
  assert.match(text, /agent\.photoUrl &&/);
  assert.match(text, /agent\.specialties\.length > 0 &&/);
  assert.match(text, /agent\.languages\.length > 0 &&/);
});

test("no desktop-only carousel; layout is a static asymmetric grid (image-dominant) that stacks on mobile", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.doesNotMatch(text, /carousel|swiper|overflow-x-scroll|overflow-x-auto/i);
  assert.match(text, /grid gap-6 lg:grid-cols-\[1\.4fr_1fr\]/);
});

test("Rentals & Getaways is a primary nav item placed after Homes and before Ideas, in both Header's default and the CMS default", async () => {
  const header = await source("../components/southline/Header.tsx");
  const headerHomes = header.indexOf('key: "navHomes"');
  const headerRentals = header.indexOf('key: "navRentals"');
  const headerIdeas = header.indexOf('key: "navIdeas"');
  assert.ok(headerHomes < headerRentals && headerRentals < headerIdeas, "Header.tsx DEFAULT_NAV order");
  assert.equal(header.includes('key: "navRealEstate"'), false, "retired navRealEstate key must be gone from Header");

  const types = await source("../lib/southline-types.ts");
  const typesHomes = types.indexOf('key: "navHomes"');
  const typesRentals = types.indexOf('key: "navRentals"');
  const typesIdeas = types.indexOf('key: "navIdeas"');
  assert.ok(typesHomes < typesRentals && typesRentals < typesIdeas, "defaultSouthlineSettings() nav order");
  assert.equal(types.includes('key: "navRealEstate"'), false, "retired navRealEstate key must be gone from CMS defaults");

  const i18n = await source("../lib/southline-i18n.ts");
  assert.match(i18n, /navRentals: \{ es: "Alquileres y Escapadas", en: "Rentals & Getaways" \}/);
});

test("the real estate section has a stable anchor id and Rentals & Getaways links to the /rentals landing", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.match(text, /id="real-estate"/);
  const header = await source("../components/southline/Header.tsx");
  assert.match(header, /href: "\/rentals"/);
});

test("the recruitment callout inside the block stays visually smaller than the consumer content and links to a real request page", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  const calloutStart = text.indexOf("Business-facing recruitment callout");
  assert.ok(calloutStart > -1);
  const callout = text.slice(calloutStart, text.indexOf("</div>", text.indexOf("</div>", calloutStart) + 1));
  assert.match(callout, /text-base/, "headline should not use a large display size");
  assert.doesNotMatch(callout, /text-3xl|text-4xl|text-5xl/);
  assert.match(text, /href="\/agents\/get-started"/);
});

test("CMS-managed: heading, body, featured property, and featured agents are settings-driven, not hardcoded in the component", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.match(text, /content\.eyebrowEs|content\.eyebrowEn/);
  assert.match(text, /content\.headlineEs|content\.headlineEn/);
  assert.match(text, /content\.bodyEs|content\.bodyEn/);
  assert.doesNotMatch(text, /const eyebrow = "|const headline = "|const body = "/);
});

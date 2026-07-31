import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the real estate block ('Find a Home') sits directly after the Hero, ahead of Categories and Featured Professionals", async () => {
  // V3 refactor: homes must never rank below contractors on the homepage — the block
  // moved from after Featured Professionals to immediately after the Hero.
  const page = await source("../app/page.tsx");
  const heroIdx = page.indexOf("<Hero");
  const blockIdx = page.indexOf("<RealEstateEntryBlock");
  const categoriesIdx = page.indexOf("<CategoriesGrid");
  const featuredIdx = page.indexOf("<FeaturedProfessionals");
  assert.ok(heroIdx > -1 && blockIdx > -1 && categoriesIdx > -1 && featuredIdx > -1, "all sections must render");
  assert.ok(heroIdx < blockIdx, "real estate block must come after the Hero");
  assert.ok(blockIdx < categoriesIdx, "real estate block must come before Browse Categories");
  assert.ok(blockIdx < featuredIdx, "real estate block must come before Featured Professionals");
});

test("primary CTAs route to real pages, never a dead \"#\"", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.doesNotMatch(text, /href="#"/);
  assert.match(text, /href="\/homes/);
  assert.match(text, /href="\/agents/);
  assert.match(text, /href=\{`\/homes\/\$\{property\.slug\}`\}/);
  assert.match(text, /href=\{`\/agents\/\$\{agent\.slug\}`\}/);
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

test("Real Estate is a primary nav item placed between Ideas and Projects, in both Header's default and the CMS default", async () => {
  const header = await source("../components/southline/Header.tsx");
  const headerIdeas = header.indexOf('key: "navIdeas"');
  const headerRE = header.indexOf('key: "navRealEstate"');
  const headerProjects = header.indexOf('key: "navProjects"');
  assert.ok(headerIdeas < headerRE && headerRE < headerProjects, "Header.tsx DEFAULT_NAV order");

  const types = await source("../lib/southline-types.ts");
  const typesIdeas = types.indexOf('key: "navIdeas"');
  const typesRE = types.indexOf('key: "navRealEstate"');
  const typesProjects = types.indexOf('key: "navProjects"');
  assert.ok(typesIdeas < typesRE && typesRE < typesProjects, "defaultSouthlineSettings() nav order");
});

test("the real estate section has a stable anchor id for direct nav links", async () => {
  const text = await source("../components/southline/RealEstateEntryBlock.tsx");
  assert.match(text, /id="real-estate"/);
  const header = await source("../components/southline/Header.tsx");
  assert.match(header, /href: "\/#real-estate"/);
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

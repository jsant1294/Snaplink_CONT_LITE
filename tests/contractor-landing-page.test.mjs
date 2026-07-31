import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("contractor_landing_pages migration is additive, with a unique index per contractor", async () => {
  const sql = await source("../drizzle/0019_contractor_landing_pages.sql");
  assert.match(sql, /CREATE TABLE "contractor_landing_pages"/);
  assert.match(sql, /"published" boolean DEFAULT false NOT NULL/);
  assert.match(sql, /CREATE UNIQUE INDEX "contractor_landing_pages_contractor_idx"/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("lib/store.ts exports landingPageStore gated by usePg", async () => {
  const text = await source("../lib/store.ts");
  assert.match(text, /export const landingPageStore = usePg \? pgLandingPageStore : jsonLandingPageStore;/);
});

test("every profession type has a landing template, and the fallback is contractor", async () => {
  const professionText = await source("../lib/profession-types.ts");
  const ids = [...professionText.matchAll(/\{ id: "([a-z_]+)",/g)].map((m) => m[1]);
  assert.ok(ids.length > 10, "sanity check that the profession list parsed");

  const templatesText = await source("../lib/landing-templates.ts");
  for (const id of ids) {
    assert.match(templatesText, new RegExp(`\\b${id}:\\s*\\{`), `missing landing template for profession "${id}"`);
  }
  assert.match(templatesText, /LANDING_TEMPLATES\[professionTypeId\] \?\? LANDING_TEMPLATES\.contractor/);
});

test("GET /api/contractor/landing-page requires contractor-scoped auth; PATCH requires the operator PIN", async () => {
  const text = await source("../app/api/contractor/landing-page/route.ts");
  const getBody = text.slice(text.indexOf("export async function GET"), text.indexOf("export async function PATCH"));
  assert.match(getBody, /authorizeContractorId/);
  const patchBody = text.slice(text.indexOf("export async function PATCH"));
  assert.match(patchBody, /isOperator\(pinFromRequest\(req\)\)/);
});

test("the avatar-upload route accepts a hero kind for the landing page banner/OG image", async () => {
  const text = await source("../app/api/contractor/avatar-upload/route.ts");
  assert.match(text, /const KINDS = \["avatar", "logo", "gallery", "hero"\]/);
});

test("the landing page editor offers fill-from-profile, a template picker, a published toggle, and hero upload", async () => {
  const text = await source("../components/admin/LandingPageEditor.tsx");
  assert.match(text, /function fillFromProfile/);
  assert.match(text, /function applyTemplate/);
  assert.match(text, /setPublished/);
  assert.match(text, /kind", "hero"/);
});

test("fill-from-profile never overwrites a field that's already been written", async () => {
  const text = await source("../components/admin/LandingPageEditor.tsx");
  const body = text.slice(text.indexOf("function fillFromProfile"), text.indexOf("function applyTemplate"));
  assert.match(body, /f\.headlineEn \|\| contractor\.businessName/);
});

test("the public page only renders landing-page content when published, and falls back to today's plain layout otherwise", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  assert.match(text, /landingPage\?\.published \? landingPage : null/);
  assert.match(text, /lp\?\.heroImageUrl/);
});

test("/contractor/[username] generates metadata with the hero image as the Open Graph image only when published", async () => {
  const text = await source("../app/contractor/[username]/page.tsx");
  assert.match(text, /export async function generateMetadata/);
  assert.match(text, /page\?\.published && page\.heroImageUrl/);
});

test("the operator roster links to the new landing page editor", async () => {
  const text = await source("../app/contractor-admin/page.tsx");
  assert.match(text, /\/contractor-admin\/\$\{c\.username\}\/landing-page/);
});

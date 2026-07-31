import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("website/gallery_urls migration is additive and complete", async () => {
  const sql = await source("../drizzle/0018_contractor_website_gallery.sql");
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "gallery_urls" jsonb/);
  assert.match(sql, /ALTER TABLE "contractors" ADD COLUMN "website" text;/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("website and galleryUrls are operator-only patchable fields, capped at 6 photos", async () => {
  const text = await source("../app/api/contractor/profiles/route.ts");
  const block = text.slice(text.indexOf("if (operator) {"), text.indexOf("if (Object.keys(patch).length === 0)"));
  assert.match(block, /patch\.website/);
  assert.match(block, /patch\.galleryUrls/);
  assert.match(block, /\.slice\(0,\s*6\)/);
});

test("the avatar-upload route accepts a gallery kind alongside avatar/logo", async () => {
  const text = await source("../app/api/contractor/avatar-upload/route.ts");
  assert.match(text, /"avatar", "logo", "gallery"/);
});

test("the profile editor supports uploading and removing up to 6 gallery photos", async () => {
  const text = await source("../app/contractor-admin/[username]/profile/page.tsx");
  assert.match(text, /galleryUrls/);
  assert.match(text, /removeGalleryPhoto/);
  assert.match(text, /\.slice\(0,\s*6\)/);
});

test("the public page renders a website pill and a gallery grid, both conditionally", async () => {
  const text = await source("../components/intake/ContractorPublicPage.tsx");
  assert.match(text, /contractor\.website &&/);
  assert.match(text, /contractor\.galleryUrls && contractor\.galleryUrls\.length > 0 &&/);
  assert.match(text, /slice\(0, 6\)/);
});

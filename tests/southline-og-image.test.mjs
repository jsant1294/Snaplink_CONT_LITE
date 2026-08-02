import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, stat, readFile as readTextFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildOgImageTree, OG_IMAGE_COPY, OG_IMAGE_OUTPUT_PATH } from "../scripts/gen-og-image.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const source = (path) => readTextFile(new URL(path, import.meta.url), "utf8");

// Flattens the ImageResponse element tree into every string leaf, so a test
// can assert on the literal text that will actually be baked into the PNG —
// not just on the copy dictionary in isolation.
function collectText(node, out = []) {
  if (typeof node === "string") {
    out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, out);
    return out;
  }
  if (node && typeof node === "object") {
    if (node.props?.children !== undefined) collectText(node.props.children, out);
  }
  return out;
}

// --- Regression: the Spanish tree must never contain English copy -----------

test("Spanish OG image tree headline is 'Ideas para cada hogar.' — not the English headline", () => {
  const text = collectText(buildOgImageTree("data:image/png;base64,x", OG_IMAGE_COPY.es));
  assert.ok(text.includes("Ideas para cada hogar."), "Spanish tree must include the Spanish headline");
  assert.ok(!text.includes("Ideas for every home."), "Spanish tree must NOT include the English headline");
});

test("Spanish OG image tree uses Spanish copy for every translatable field", () => {
  const text = collectText(buildOgImageTree("data:image/png;base64,x", OG_IMAGE_COPY.es));
  assert.ok(text.includes("Explora, planifica y conecta con profesionales de confianza para tu hogar."));
  assert.ok(text.includes("Impulsado por SnapLink"));
  assert.ok(!text.includes("Explore, plan, and connect with trusted home professionals."));
  assert.ok(!text.includes("Powered by SnapLink"));
});

test("English OG image tree stays fully English (no regression in the other direction)", () => {
  const text = collectText(buildOgImageTree("data:image/png;base64,x", OG_IMAGE_COPY.en));
  assert.ok(text.includes("Ideas for every home."));
  assert.ok(text.includes("Explore, plan, and connect with trusted home professionals."));
  assert.ok(text.includes("Powered by SnapLink"));
  assert.ok(!text.includes("Ideas para cada hogar."));
  assert.ok(!text.includes("Impulsado por SnapLink"));
});

test("the bilingual location line is identical in both cards by design (not a locale-mixing bug)", () => {
  assert.equal(OG_IMAGE_COPY.en.location, "Alpharetta, GA · Hablamos español");
  assert.equal(OG_IMAGE_COPY.es.location, "Alpharetta, GA · Hablamos español");
});

test("the domain/URL text on the card is identical in both locales (no distinct Spanish path exists)", () => {
  assert.equal(OG_IMAGE_COPY.en.urlText, OG_IMAGE_COPY.es.urlText);
  assert.equal(OG_IMAGE_COPY.es.urlText, "southlineliving.southlineone.com");
});

test("every OG_IMAGE_COPY field is explicitly authored per locale, not shared by reference", () => {
  assert.notEqual(OG_IMAGE_COPY.en, OG_IMAGE_COPY.es);
  for (const key of Object.keys(OG_IMAGE_COPY.en)) {
    assert.ok(typeof OG_IMAGE_COPY.es[key] === "string" && OG_IMAGE_COPY.es[key].length > 0, `es.${key} must be explicitly set`);
  }
});

// --- Source-level guard: no stray hardcoded headline outside the copy object -

test("gen-og-image.mjs never hardcodes the headline text outside the per-locale COPY object", async () => {
  const script = await source("../scripts/gen-og-image.mjs");
  assert.match(script, /headline: "Ideas for every home\."/);
  assert.match(script, /headline: "Ideas para cada hogar\."/);
  // children must always read from `copy.*`, never a literal string, inside buildOgImageTree.
  const treeFnStart = script.indexOf("export function buildOgImageTree");
  const treeFnBody = script.slice(treeFnStart);
  assert.doesNotMatch(treeFnBody, /children: "Ideas for every home\."/, "buildOgImageTree must not hardcode English text");
  assert.doesNotMatch(treeFnBody, /children: "Ideas para cada hogar\."/, "buildOgImageTree must not hardcode Spanish text");
});

// --- lib/southline-seo.ts: metadata locale must control which image is used -

test("buildSeoMetadata resolves a distinct OG image URL and alt per locale (home page)", async () => {
  const { buildSeoMetadata } = await import("../lib/southline-seo.ts");
  const en = buildSeoMetadata({ lang: "en", seo: null, pageKey: "home" });
  const es = buildSeoMetadata({ lang: "es", seo: null, pageKey: "home" });

  assert.equal(en.openGraph.images[0].url, "/og-image.png");
  assert.equal(es.openGraph.images[0].url, "/og-image-es.png");
  assert.notEqual(en.openGraph.images[0].url, es.openGraph.images[0].url, "en and es must never point at the same shared asset");

  assert.equal(en.openGraph.images[0].alt, "Ideas for every home");
  assert.equal(es.openGraph.images[0].alt, "Ideas para cada hogar");

  // Twitter image inherits the same per-locale resolution (no independent fallback).
  assert.equal(es.twitter.images[0], "/og-image-es.png");
});

test("an explicit CMS-configured OG image override is respected and keeps a locale-neutral alt", async () => {
  const { buildSeoMetadata } = await import("../lib/southline-seo.ts");
  const seo = { pages: { home: { openGraphImageUrl: "/custom-hero.png" } } };
  const es = buildSeoMetadata({ lang: "es", seo, pageKey: "home" });
  assert.equal(es.openGraph.images[0].url, "/custom-hero.png");
  assert.equal(es.openGraph.images[0].alt, "Southline Living", "an unknown override image can't claim a tagline-derived alt");
});

// --- End-to-end: actually run the generator and verify real, distinct PNGs --

test(
  "running the generator produces two distinct, non-trivial PNGs (not one shared asset)",
  { timeout: 30000 },
  async () => {
    await execFileAsync(process.execPath, ["scripts/gen-og-image.mjs"], { cwd: repoRoot });

    const enPath = new URL(`../${OG_IMAGE_OUTPUT_PATH.en}`, import.meta.url);
    const esPath = new URL(`../${OG_IMAGE_OUTPUT_PATH.es}`, import.meta.url);

    const [enStat, esStat] = await Promise.all([stat(enPath), stat(esPath)]);
    assert.ok(enStat.size > 10_000, "English OG image must be a real rendered PNG, not a stub");
    assert.ok(esStat.size > 10_000, "Spanish OG image must be a real rendered PNG, not a stub");

    const [enBuf, esBuf] = await Promise.all([readFile(enPath), readFile(esPath)]);
    assert.ok(!enBuf.equals(esBuf), "en and es OG images must not be byte-identical — they are not the same shared asset");
  }
);

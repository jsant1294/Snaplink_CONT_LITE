import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_LOCAL_PROMO_CATEGORIES,
  buildCrossPromoUrl,
  CROSS_PROMO_EVENT,
  CROSS_PROMO_PLACEMENT,
  readApprovedUtmParams,
} from "../lib/southline-local-discovery.ts";
import {
  DEFAULT_SECTIONS,
  DEFAULT_SNAPLINK_PROMO,
  defaultSouthlineSettings,
  mergeSnapLinkPromoContent,
} from "../lib/southline-types.ts";
import { UI_DEFS, t } from "../lib/southline-i18n.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// --- Cross-promo contract ----------------------------------------------------

test("CROSS_PROMO_EVENT and CROSS_PROMO_PLACEMENT match the documented contract", () => {
  assert.equal(CROSS_PROMO_EVENT, "snaplink_cross_promo_click");
  assert.equal(CROSS_PROMO_PLACEMENT, "homepage-cross-promo");
});

test("DEFAULT_LOCAL_PROMO_CATEGORIES ships the spec chips, text-only (no emoji), and no guessed slugs", () => {
  const ids = DEFAULT_LOCAL_PROMO_CATEGORIES.map((c) => c.id);
  assert.deepEqual(ids, [
    "restaurants",
    "retail",
    "photography",
    "automotive",
    "beauty",
    "events",
    "medical",
    "business-services",
    "entertainment",
    "shopping",
  ]);
  assert.equal(new Set(ids).size, ids.length, "chip ids must be unique");
  assert.ok(DEFAULT_LOCAL_PROMO_CATEGORIES.every((c) => !("emoji" in c)), "premium site: chips are text-only, no emoji field");
  assert.ok(DEFAULT_LOCAL_PROMO_CATEGORIES.every((c) => typeof c.labelEn === "string" && c.labelEn.length > 0));
  assert.ok(DEFAULT_LOCAL_PROMO_CATEGORIES.every((c) => typeof c.labelEs === "string" && c.labelEs.length > 0));
  assert.ok(
    DEFAULT_LOCAL_PROMO_CATEGORIES.every((c) => c.snaplinkCategory === null),
    "no chip may forward a guessed category slug until a real directory mapping is configured"
  );
});

test("i18n dictionary exposes bilingual cross-promo copy", () => {
  assert.equal(t("localPromoTitle", "en"), "Looking for more than home services?");
  assert.equal(t("localPromoTitle", "es"), "¿Buscas más que servicios para el hogar?");
  assert.match(t("localPromoCta", "en"), /Explore SnapLink Local/);
  assert.match(t("localPromoPoweredBy", "en"), /Powered by the SnapLink Network/);
  assert.ok(typeof UI_DEFS.localPromoBody.es === "string" && UI_DEFS.localPromoBody.es.length > 0);
  assert.ok(typeof UI_DEFS.localPromoBody.en === "string" && UI_DEFS.localPromoBody.en.length > 0);
  assert.equal(UI_DEFS.localPromoEyebrow.en, "SnapLink Local");
  assert.equal(UI_DEFS.localPromoEyebrow.es, "SnapLink Local");
});

// --- URL building ------------------------------------------------------------

test("buildCrossPromoUrl resolves EN and ES routes with the cross-promo attribution", () => {
  assert.equal(
    buildCrossPromoUrl("en"),
    "https://snaplink.southlineone.com/en/local?source=southline-living&placement=homepage-cross-promo&utm_source=southline&utm_medium=referral&utm_campaign=local-discovery"
  );
  assert.equal(
    buildCrossPromoUrl("es"),
    "https://snaplink.southlineone.com/es/local?source=southline-living&placement=homepage-cross-promo&utm_source=southline&utm_medium=referral&utm_campaign=local-discovery"
  );
});

test("buildCrossPromoUrl preserves allowlisted inbound UTM and drops unapproved params", () => {
  const inbound = readApprovedUtmParams("?utm_source=nextdoor&utm_medium=paid-social&utm_campaign=local-discovery&ref=x&zip=75204");
  const url = buildCrossPromoUrl("en", inbound);
  assert.ok(url.includes("utm_source=nextdoor"));
  assert.ok(url.includes("utm_medium=paid-social"));
  assert.ok(url.includes("utm_campaign=local-discovery"));
  assert.ok(!url.includes("ref="));
  assert.ok(!url.includes("zip="));
});

test("buildCrossPromoUrl forwards a category slug only when one is configured (never guessed)", () => {
  assert.ok(!buildCrossPromoUrl("en").includes("category="));
  assert.ok(!buildCrossPromoUrl("en", {}, null).includes("category="));
  assert.ok(buildCrossPromoUrl("en", {}, "restaurants").includes("category=restaurants"));
  assert.ok(buildCrossPromoUrl("en", {}, "pool & spa").includes("category=pool+%26+spa"));
});

test("buildCrossPromoUrl always targets the allowlisted SnapLink host", () => {
  assert.equal(new URL(buildCrossPromoUrl("en")).hostname, "snaplink.southlineone.com");
});

// --- Component + wiring ------------------------------------------------------

test("SnapLinkLocalPromo reuses the safe URL builder, fires non-blocking analytics, and opens in a new tab", async () => {
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  assert.match(section, /"use client"/);
  assert.match(section, /buildCrossPromoUrl/);
  assert.match(section, /CROSS_PROMO_EVENT/);
  assert.match(section, /CROSS_PROMO_PLACEMENT/);
  assert.match(section, /getOrCreateLocalDiscoverySessionId/);
  assert.match(section, /readApprovedUtmParams/);
  assert.match(section, /window\.dispatchEvent\(new CustomEvent/);
  assert.match(section, /target: "_blank"/);
  assert.match(section, /rel: "noopener noreferrer"/);
  assert.match(section, /never block navigation/);
  assert.match(section, /localPromoPoweredBy/);
  assert.match(section, /aria-hidden="true"/);
  assert.doesNotMatch(section, /window\.location\.assign/);
  assert.doesNotMatch(section, /\bzip\b/);
  assert.doesNotMatch(section, /localSearch|LOCAL_SEARCH_EVENT/);
});

test("the homepage wires SnapLinkLocalPromo as the final content block, gated on sections.localPromo", async () => {
  const page = await source("../app/page.tsx");
  const localDiscovery = page.indexOf("<LocalDiscovery");
  const promo = page.indexOf("<SnapLinkLocalPromo");
  assert.ok(promo > -1 && localDiscovery > -1);
  assert.ok(promo > localDiscovery, "promo must render after the Local Discovery block");
  assert.ok(promo > page.indexOf("<PoweredBySnapLink"), "promo must follow platform attribution");
  assert.ok(promo < page.indexOf("</main>"), "promo must be the final block inside main");
  assert.match(page, /import SnapLinkLocalPromo from "@\/components\/southline\/SnapLinkLocalPromo";/);
  assert.match(page, /sections\.localPromo !== false/);
  assert.match(page, /<SnapLinkLocalPromo lang=\{lang\} content=\{settings\?\.snapLinkPromo\} \/>/);
});

test("SectionVisibility defaults localPromo to true and backfills it into default settings", () => {
  assert.equal(DEFAULT_SECTIONS.localPromo, true);
  assert.equal(defaultSouthlineSettings().sections.localPromo, true);
});

test("the admin Sections tab exposes a localPromo toggle", async () => {
  const editor = await source("../components/southline/admin/HomepageEditor.tsx");
  assert.match(editor, /\{ key: "localPromo", label: "SnapLink Local cross-promo" \}/);
});

test("both settings stores merge sections against defaults so legacy rows show the new toggle", async () => {
  const jsonStore = await source("../lib/southline-store-json.ts");
  const pgStore = await source("../lib/southline-store-pg.ts");
  assert.match(jsonStore, /sections: \{ \.\.\.defaults\.sections, \.\.\.stored\.sections \}/);
  assert.match(pgStore, /sections: \{ \.\.\.defaults\.sections, \.\.\.stored\.sections \}/);
});

// --- Image-driven redesign: settings shape ------------------------------------

test("DEFAULT_SNAPLINK_PROMO ships a verified image, safe defaults, and no guessed content", () => {
  assert.equal(DEFAULT_SNAPLINK_PROMO.layout, "full-background");
  assert.equal(DEFAULT_SNAPLINK_PROMO.contentAlignment, "left");
  assert.equal(DEFAULT_SNAPLINK_PROMO.overlayStrength, "strong");
  assert.ok(DEFAULT_SNAPLINK_PROMO.desktopImageUrl.startsWith("https://images.unsplash.com/"));
  assert.ok(DEFAULT_SNAPLINK_PROMO.mobileImageUrl.startsWith("https://images.unsplash.com/"));
  assert.ok(DEFAULT_SNAPLINK_PROMO.imageAltEn.length > 0);
  assert.ok(DEFAULT_SNAPLINK_PROMO.imageAltEs.length > 0);
  assert.equal(DEFAULT_SNAPLINK_PROMO.showBadge, true);
  assert.equal(DEFAULT_SNAPLINK_PROMO.showChips, true);
  assert.equal(DEFAULT_SNAPLINK_PROMO.showSecondaryLine, true);
});

test("mergeSnapLinkPromoContent backfills missing fields and preserves operator edits", () => {
  assert.deepEqual(mergeSnapLinkPromoContent(undefined), DEFAULT_SNAPLINK_PROMO);
  assert.deepEqual(mergeSnapLinkPromoContent(null), DEFAULT_SNAPLINK_PROMO);
  const merged = mergeSnapLinkPromoContent({ layout: "full-background", showChips: false });
  assert.equal(merged.layout, "full-background");
  assert.equal(merged.showChips, false);
  assert.equal(merged.desktopImageUrl, DEFAULT_SNAPLINK_PROMO.desktopImageUrl, "unset fields fall back to defaults");
});

test("defaultSouthlineSettings backfills snapLinkPromo for legacy settings rows", () => {
  assert.deepEqual(defaultSouthlineSettings().snapLinkPromo, DEFAULT_SNAPLINK_PROMO);
});

test("both settings stores merge snapLinkPromo against defaults so legacy rows get the new field", async () => {
  const jsonStore = await source("../lib/southline-store-json.ts");
  const pgStore = await source("../lib/southline-store-pg.ts");
  assert.match(jsonStore, /snapLinkPromo: mergeSnapLinkPromoContent\(stored\.snapLinkPromo\)/);
  assert.match(pgStore, /snapLinkPromo: mergeSnapLinkPromoContent\(stored\.snapLinkPromo\)/);
});

test("settings validation rejects invalid snapLinkPromo enum values but allows a valid patch", async () => {
  const { validateSouthlineSettings } = await import("../lib/southline-validation.ts");
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { layout: "sideways" } }) !== null, true);
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { overlayStrength: "extreme" } }) !== null, true);
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { focalPoint: "diagonal" } }) !== null, true);
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { showChips: "yes" } }) !== null, true);
  assert.equal(
    validateSouthlineSettings({ snapLinkPromo: { layout: "full-background", contentAlignment: "left", overlayStrength: "medium" } }),
    null
  );
});

// --- Image-driven redesign: component markup ----------------------------------

test("SnapLinkLocalPromo renders all three layouts, focal points, and an overlay driven by CMS content", async () => {
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  assert.match(section, /content = DEFAULT_SNAPLINK_PROMO/, "content prop defaults to the shipped promo defaults");
  assert.match(section, /promo\.layout === "full-background"/);
  assert.match(section, /promo\.layout === "image-right"/);
  assert.match(section, /FOCAL_CLASS\[promo\.focalPoint\]/);
  assert.match(section, /MOBILE_FOCAL_CLASS\[promo\.mobileFocalPoint\]/);
  assert.match(section, /OVERLAY_CLASS\[promo\.overlayStrength\]\[promo\.contentAlignment\]/);
  assert.match(section, /promo\.showBadge/);
  assert.match(section, /promo\.showChips/);
  assert.match(section, /promo\.showSecondaryLine/);
});

test("SnapLinkLocalPromo has a graceful image fallback that never shows a broken-image icon", async () => {
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  assert.match(section, /onError=\{\(\) => setDesktopImageFailed\(true\)\}/);
  assert.match(section, /onError=\{\(\) => setMobileImageFailed\(true\)\}/);
  assert.match(section, /function ImageFallback/);
  assert.doesNotMatch(section, /<img[^>]*src=\{\}/);
});

test("SnapLinkLocalPromo mobile image renders above the content in DOM order regardless of desktop layout", async () => {
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  const imageBlockIndex = section.indexOf("relative h-64 sm:h-80");
  const contentBlockIndex = section.indexOf("flex flex-col justify-center gap-1");
  assert.ok(imageBlockIndex > -1 && contentBlockIndex > -1);
  assert.ok(imageBlockIndex < contentBlockIndex, "the image block must precede the content block in source order");
});

test("SnapLinkLocalPromo category chips stay secondary: capped, non-blocking, safe-host CTA unaffected", async () => {
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  assert.match(section, /categories\.slice\(0, 6\)/);
  assert.match(section, /if \(categories\.length === 0\) return null/);
});

// --- Image-driven redesign: CMS controls --------------------------------------

test("the Homepage admin editor exposes a SnapLink Local Promo tab with image, layout, and visibility controls", async () => {
  const editor = await source("../components/southline/admin/HomepageEditor.tsx");
  assert.match(editor, /\{ key: "snapLinkPromo", label: "SnapLink Local Promo" \}/);
  assert.match(editor, /function SnapLinkPromoTab/);
  assert.match(editor, /kind="snaplink-promo"/);
  assert.match(editor, /onSave\(\{ snapLinkPromo: local \}\)/);
  assert.match(editor, /Show SnapLink badge/);
  assert.match(editor, /Show category chips/);
  assert.match(editor, /Show secondary line/);
});

test("the upload route allowlists the snaplink-promo image kind", async () => {
  const route = await source("../app/api/southline/upload/route.ts");
  assert.match(route, /"snaplink-promo"/);
});

// --- No emoji (premium site) ---------------------------------------------------

test("category chips are text-only: no emoji field, no emoji rendered", async () => {
  const lib = await source("../lib/southline-local-discovery.ts");
  assert.doesNotMatch(lib, /emoji/i);
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  assert.doesNotMatch(section, /chip\.emoji/);
  assert.doesNotMatch(section, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "no emoji literal in the component source");
});

// --- CMS-editable copy (eyebrow/headline/body/CTA/secondary line) --------------

test("DEFAULT_SNAPLINK_PROMO copy fields default to null (use i18n text) and are preserved by merge", () => {
  for (const field of [
    "eyebrowEn", "eyebrowEs", "titleEn", "titleEs",
    "bodyEn", "bodyEs", "ctaLabelEn", "ctaLabelEs",
    "secondaryLineEn", "secondaryLineEs",
  ]) {
    assert.equal(DEFAULT_SNAPLINK_PROMO[field], null, `${field} must default to null`);
  }
  const merged = mergeSnapLinkPromoContent({ titleEn: "Custom headline", ctaLabelEs: "Personalizado" });
  assert.equal(merged.titleEn, "Custom headline");
  assert.equal(merged.ctaLabelEs, "Personalizado");
  assert.equal(merged.titleEs, null, "unset copy fields stay null, not silently defaulted to text");
});

test("settings validation accepts string-or-null snapLinkPromo copy fields and rejects other types", async () => {
  const { validateSouthlineSettings } = await import("../lib/southline-validation.ts");
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { titleEn: "A headline", bodyEs: null } }), null);
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { titleEn: 42 } }) !== null, true);
  assert.equal(validateSouthlineSettings({ snapLinkPromo: { ctaLabelEs: [] } }) !== null, true);
});

test("SnapLinkLocalPromo resolves eyebrow/headline/body/CTA/secondary-line copy from CMS content with i18n fallback", async () => {
  const section = await source("../components/southline/SnapLinkLocalPromo.tsx");
  assert.match(section, /promo\.eyebrowEs : promo\.eyebrowEn\) \|\| t\("localPromoEyebrow", lang\)/);
  assert.match(section, /promo\.titleEs : promo\.titleEn\) \|\| t\("localPromoTitle", lang\)/);
  assert.match(section, /promo\.bodyEs : promo\.bodyEn\) \|\| t\("localPromoBody", lang\)/);
  assert.match(section, /promo\.ctaLabelEs : promo\.ctaLabelEn\) \|\| t\("localPromoCta", lang\)/);
  assert.match(section, /promo\.secondaryLineEs : promo\.secondaryLineEn\) \|\| t\("localPromoPoweredBy", lang\)/);
});

test("the Homepage admin editor exposes copy fields for the SnapLink Local Promo section", async () => {
  const editor = await source("../components/southline/admin/HomepageEditor.tsx");
  for (const label of [
    "Eyebrow (EN)", "Eyebrow (ES)", "Headline (EN)", "Headline (ES)",
    "Body (EN)", "Body (ES)", "CTA label (EN)", "CTA label (ES)",
    "Secondary line (EN)", "Secondary line (ES)",
  ]) {
    assert.ok(editor.includes(label), `missing CMS field: ${label}`);
  }
});

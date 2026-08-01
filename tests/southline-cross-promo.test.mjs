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
import { DEFAULT_SECTIONS, defaultSouthlineSettings } from "../lib/southline-types.ts";
import { UI_DEFS, t } from "../lib/southline-i18n.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// --- Cross-promo contract ----------------------------------------------------

test("CROSS_PROMO_EVENT and CROSS_PROMO_PLACEMENT match the documented contract", () => {
  assert.equal(CROSS_PROMO_EVENT, "snaplink_cross_promo_click");
  assert.equal(CROSS_PROMO_PLACEMENT, "homepage-cross-promo");
});

test("DEFAULT_LOCAL_PROMO_CATEGORIES ships the spec chips, all bilingual with emojis and no guessed slugs", () => {
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
  assert.ok(DEFAULT_LOCAL_PROMO_CATEGORIES.every((c) => c.emoji.length > 0));
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

test("the homepage wires SnapLinkLocalPromo directly after Local Discovery, gated on sections.localPromo", async () => {
  const page = await source("../app/page.tsx");
  const localDiscovery = page.indexOf("LocalDiscovery");
  const promo = page.indexOf("SnapLinkLocalPromo");
  assert.ok(promo > -1 && localDiscovery > -1);
  assert.ok(promo > localDiscovery, "promo must render after the Local Discovery block");
  assert.match(page, /import SnapLinkLocalPromo from "@\/components\/southline\/SnapLinkLocalPromo";/);
  assert.match(page, /sections\.localPromo !== false/);
  assert.match(page, /<SnapLinkLocalPromo lang=\{lang\} \/>/);
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

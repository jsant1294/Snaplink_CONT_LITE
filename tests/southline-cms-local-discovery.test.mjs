import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_LOCAL_DISCOVERY,
  DEFAULT_LOCAL_DISCOVERY_CATEGORIES,
  defaultSouthlineSettings,
  mergeLocalDiscoveryContent,
} from "../lib/southline-types.ts";
import {
  APPROVED_UTM_KEYS,
  buildSnaplinkLocalUrl,
  DEFAULT_ATTRIBUTION,
  isValidUsZip,
  LOCAL_SEARCH_EVENT,
  normalizeUsZip,
  readApprovedUtmParams,
} from "../lib/southline-local-discovery.ts";
import { validateSouthlineSettings } from "../lib/southline-validation.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

const validCategory = (overrides = {}) => ({
  id: "interior-designers",
  labelEn: "Interior Designers",
  labelEs: "Diseñadores de interiores",
  descriptionEn: "Browse local interior designers",
  descriptionEs: null,
  icon: null,
  imageUrl: null,
  snaplinkCategory: null,
  visible: true,
  featured: true,
  order: 0,
  ...overrides,
});

test("DEFAULT_LOCAL_DISCOVERY is safe: enabled, homepage + cards on, default directory URL, no fabricated category mappings", () => {
  assert.equal(DEFAULT_LOCAL_DISCOVERY.enabled, true);
  assert.equal(DEFAULT_LOCAL_DISCOVERY.showOnHomepage, true);
  assert.equal(DEFAULT_LOCAL_DISCOVERY.showCategoryCards, true);
  assert.equal(DEFAULT_LOCAL_DISCOVERY.directoryBaseUrl, "https://snaplink.southlineone.com/en/local");
  assert.equal(DEFAULT_LOCAL_DISCOVERY.defaultCategory, null);
  assert.equal(DEFAULT_LOCAL_DISCOVERY.categories.length, 8);
  assert.ok(DEFAULT_LOCAL_DISCOVERY.categories.every((c) => c.snaplinkCategory === null));
  assert.ok(DEFAULT_LOCAL_DISCOVERY.categories.every((c) => c.visible === true));
  assert.ok(DEFAULT_LOCAL_DISCOVERY.categories.every((c) => typeof c.order === "number"));
});

test("defaultSouthlineSettings includes a localDiscovery object that deep-equals the default", () => {
  const settings = defaultSouthlineSettings();
  assert.deepEqual(settings.localDiscovery, DEFAULT_LOCAL_DISCOVERY);
});

test("mergeLocalDiscoveryContent applies defaults when the section is absent", () => {
  assert.deepEqual(mergeLocalDiscoveryContent(undefined), DEFAULT_LOCAL_DISCOVERY);
  assert.deepEqual(mergeLocalDiscoveryContent(null), DEFAULT_LOCAL_DISCOVERY);
});

test("mergeLocalDiscoveryContent merges partial stored settings and preserves unknown fields", () => {
  const merged = mergeLocalDiscoveryContent({
    titleEn: "Custom title",
    titleEs: "Título personalizado",
    showOnHomepage: false,
    futureField: "kept",
  });
  assert.equal(merged.titleEn, "Custom title");
  assert.equal(merged.titleEs, "Título personalizado");
  assert.equal(merged.showOnHomepage, false);
  assert.equal(merged.futureField, "kept");
  assert.equal(merged.directoryBaseUrl, DEFAULT_LOCAL_DISCOVERY.directoryBaseUrl);
  assert.deepEqual(merged.categories, DEFAULT_LOCAL_DISCOVERY.categories);
});

test("mergeLocalDiscoveryContent keeps stored categories verbatim (deterministic order) and reverts empty strings to defaults", () => {
  const merged = mergeLocalDiscoveryContent({
    categories: [validCategory({ id: "a", order: 9 }), validCategory({ id: "b", order: 1 })],
  });
  assert.deepEqual(
    merged.categories.map((c) => c.id),
    ["a", "b"]
  );
  const mergedEmpty = mergeLocalDiscoveryContent({ categories: [], titleEn: "   " });
  assert.deepEqual(mergedEmpty.categories, []);
  assert.equal(mergedEmpty.titleEn, DEFAULT_LOCAL_DISCOVERY.titleEn);
});

test("validateSouthlineSettings accepts a well-formed localDiscovery patch", () => {
  const patch = {
    localDiscovery: {
      enabled: true,
      showOnHomepage: true,
      showCategoryCards: true,
      titleEn: "Find trusted professionals near you",
      titleEs: "Encuentra profesionales de confianza cerca de ti",
      descriptionEs: null,
      zipPlaceholderEn: "e.g. 75204",
      directoryBaseUrl: "https://snaplink.southlineone.com/en/local",
      defaultCategory: "interior-designers",
      categories: [
        validCategory({ id: "architects", labelEn: "Architects", labelEs: "Arquitectos", order: 0 }),
        validCategory({ id: "pools", labelEn: "Pools", labelEs: "Piscinas", descriptionEs: "Explora piscinas", order: 1 }),
      ],
    },
  };
  assert.equal(validateSouthlineSettings(patch), null);
});

test("validateSouthlineSettings rejects malformed localDiscovery patches", () => {
  const base = { localDiscovery: { categories: [validCategory()] } };
  assert.match(validateSouthlineSettings({ localDiscovery: "nope" }), /localDiscovery must be an object/);
  assert.match(validateSouthlineSettings({ localDiscovery: { enabled: "yes" } }), /localDiscovery\.enabled must be a boolean/);
  assert.match(validateSouthlineSettings({ localDiscovery: { showOnHomepage: 1 } }), /localDiscovery\.showOnHomepage must be a boolean/);
  assert.match(validateSouthlineSettings({ localDiscovery: { showCategoryCards: "on" } }), /localDiscovery\.showCategoryCards must be a boolean/);
  assert.match(validateSouthlineSettings({ localDiscovery: { titleEn: 5 } }), /localDiscovery\.titleEn must be a string or null/);
  assert.match(validateSouthlineSettings({ localDiscovery: { zipPlaceholderEs: 5 } }), /localDiscovery\.zipPlaceholderEs must be a string or null/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: "nope" } }), /localDiscovery\.categories must be an array/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [5] } }), /localDiscovery\.categories\[0\] must be an object/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ id: "" })] } }), /categories\[0\]\.id must be a non-empty string/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory(), validCategory()] } }), /categories\[1\]\.id duplicate: interior-designers/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ labelEn: 5 })] } }), /categories\[0\]\.labelEn and labelEs must be strings/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ descriptionEn: 5 })] } }), /categories\[0\]\.descriptionEn must be a string or null/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ visible: "yes" })] } }), /categories\[0\]\.visible must be a boolean/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ featured: 1 })] } }), /categories\[0\]\.featured must be a boolean/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ order: "0" })] } }), /categories\[0\]\.order must be a number/);
  assert.match(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ order: undefined })] } }), /categories\[0\]\.order must be a number/);
});

test("validateSouthlineSettings rejects unsafe or malformed destination URLs", () => {
  assert.match(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: "javascript:alert(1)" } }), /directoryBaseUrl must use http or https/);
  assert.match(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: "data:text/html;base64,PHNjcmlwdD4=" } }), /directoryBaseUrl must use http or https/);
  assert.match(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: "not a url" } }), /directoryBaseUrl must be a valid URL/);
  assert.match(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: "" } }), /directoryBaseUrl must be a non-empty URL string/);
  assert.match(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: 5 } }), /directoryBaseUrl must be a non-empty URL string/);
  assert.equal(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: "http://localhost:3000/en/local" } }), null);
  assert.equal(validateSouthlineSettings({ localDiscovery: { directoryBaseUrl: "https://snaplink.southlineone.com/en/local" } }), null);
});

test("bilingual optional fields behave correctly (null optional descriptions allowed)", () => {
  assert.equal(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ descriptionEn: "Only EN", descriptionEs: null })] } }), null);
  assert.equal(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ descriptionEn: null, descriptionEs: "Solo ES" })] } }), null);
  assert.equal(validateSouthlineSettings({ localDiscovery: { categories: [validCategory({ descriptionEn: null, descriptionEs: null })] } }), null);
});

test("US ZIP validation accepts 5-digit, ZIP+4, and normalizes whitespace", () => {
  assert.equal(isValidUsZip("75204"), true);
  assert.equal(isValidUsZip("75204-1234"), true);
  assert.equal(isValidUsZip("  75204  "), true);
  assert.equal(isValidUsZip("75204-12345"), false);
  assert.equal(isValidUsZip("7520"), false);
  assert.equal(isValidUsZip("752041"), false);
  assert.equal(isValidUsZip("abcde"), false);
  assert.equal(isValidUsZip(""), false);
  assert.equal(isValidUsZip("   "), false);
  assert.equal(normalizeUsZip("  75204  "), "75204");
  assert.equal(normalizeUsZip(" 75204-1234 "), "75204-1234");
});

test("buildSnaplinkLocalUrl resolves the English and Spanish routes", () => {
  const en = buildSnaplinkLocalUrl({ locale: "en" });
  assert.ok(en.startsWith("https://snaplink.southlineone.com/en/local?"));
  const es = buildSnaplinkLocalUrl({ locale: "es" });
  assert.ok(es.startsWith("https://snaplink.southlineone.com/es/local?"));
  assert.ok(es.includes("utm_source=southline"));
});

test("buildSnaplinkLocalUrl forwards ZIP, category, and default attribution", () => {
  const url = buildSnaplinkLocalUrl({ locale: "en", zip: "75204", category: "landscaping" });
  assert.equal(
    url,
    "https://snaplink.southlineone.com/en/local?zip=75204&category=landscaping&utm_source=southline&utm_medium=referral&utm_campaign=local-discovery"
  );
});

test("buildSnaplinkLocalUrl matches the Nextdoor attribution example", () => {
  const url = buildSnaplinkLocalUrl({
    locale: "en",
    zip: "75204",
    category: "landscaping",
    source: "nextdoor",
    medium: "paid-social",
    campaign: "local-discovery",
  });
  assert.equal(
    url,
    "https://snaplink.southlineone.com/en/local?zip=75204&category=landscaping&utm_source=nextdoor&utm_medium=paid-social&utm_campaign=local-discovery"
  );
});

test("buildSnaplinkLocalUrl URL-encodes every forwarded value", () => {
  const url = buildSnaplinkLocalUrl({ locale: "en", zip: " 75204 ", category: "pool & spa" });
  assert.ok(url.includes("zip=75204"));
  assert.ok(url.includes("category=pool+%26+spa"));
  assert.ok(!url.includes(" "));
});

test("buildSnaplinkLocalUrl drops unapproved parameters and avoids duplicates", () => {
  const url = buildSnaplinkLocalUrl({
    baseUrl: "https://snaplink.southlineone.com/en/local?ref=x&utm_campaign=evil&zip=00000",
    locale: "en",
    source: "southline",
  });
  assert.ok(!url.includes("ref="));
  assert.ok(!url.includes("evil"));
  assert.ok(!url.includes("zip=00000"));
  assert.equal((url.match(/utm_campaign=/g) ?? []).length, 1);
  assert.equal((url.match(/utm_source=/g) ?? []).length, 1);
  assert.ok(url.includes("utm_campaign=local-discovery"));
});

test("buildSnaplinkLocalUrl never lets input override the destination origin", () => {
  const url = buildSnaplinkLocalUrl({ locale: "en", zip: "https://evil.com", category: "x@evil.com" });
  assert.ok(url.startsWith("https://snaplink.southlineone.com/en/local"));
  assert.equal(new URL(url).hostname, "snaplink.southlineone.com");
  assert.ok(!url.includes("https://evil.com"));
  assert.ok(!url.includes("zip="));
  assert.ok(url.includes("category=x%40evil.com"));
});

test("buildSnaplinkLocalUrl swaps the locale segment and falls back safely on bad base URLs", () => {
  const swapped = buildSnaplinkLocalUrl({ baseUrl: "https://snaplink.southlineone.com/es/local", locale: "en" });
  assert.ok(swapped.startsWith("https://snaplink.southlineone.com/en/local?"));
  const bare = buildSnaplinkLocalUrl({ baseUrl: "https://snaplink.southlineone.com", locale: "es" });
  assert.ok(bare.startsWith("https://snaplink.southlineone.com/es/local?"));
  const malformed = buildSnaplinkLocalUrl({ baseUrl: "not a url", locale: "en" });
  assert.ok(malformed.startsWith("https://snaplink.southlineone.com/en/local?"));
  const unsafe = buildSnaplinkLocalUrl({ baseUrl: "javascript:alert(1)", locale: "en" });
  assert.ok(unsafe.startsWith("https://snaplink.southlineone.com/en/local?"));
});

test("readApprovedUtmParams returns only allowlisted keys", () => {
  assert.deepEqual(readApprovedUtmParams("?utm_source=nextdoor&utm_medium=paid-social&utm_campaign=local-discovery&ref=x&zip=75204"), {
    utm_source: "nextdoor",
    utm_medium: "paid-social",
    utm_campaign: "local-discovery",
  });
  assert.deepEqual(readApprovedUtmParams(""), {});
  assert.ok(APPROVED_UTM_KEYS.every((k) => k.startsWith("utm_")));
  assert.equal(DEFAULT_ATTRIBUTION.utm_source, "southline");
  assert.equal(LOCAL_SEARCH_EVENT, "local_search_submitted");
});

test("the store merges local discovery through mergeLocalDiscoveryContent on read", async () => {
  const store = await source("../lib/southline-store-json.ts");
  assert.match(store, /localDiscovery: mergeLocalDiscoveryContent\(stored\.localDiscovery\)/);
});

test("the homepage wires LocalDiscovery after the hero, gated on showOnHomepage", async () => {
  const page = await source("../app/page.tsx");
  assert.match(page, /<LocalDiscovery lang=\{lang\} content=\{settings\?\.localDiscovery\} \/>/);
  assert.match(page, /settings\?\.localDiscovery\?\.showOnHomepage !== false/);
});

test("LocalDiscovery hides when disabled, renders localized copy, respects visibility + deterministic order, and never leaks the ZIP", async () => {
  const section = await source("../components/southline/LocalDiscovery.tsx");
  assert.match(section, /if \(!content\?\.enabled\) return null;/);
  assert.match(section, /lang === "es" \? c\.labelEs : c\.labelEn/);
  assert.match(section, /c\.visible !== false/);
  assert.match(section, /a\.order - b\.order \|\| a\.id\.localeCompare\(b\.id\)/);
  assert.match(section, /localDiscoveryExternalNote/);
  assert.match(section, /localDiscoveryPoweredBy/);
  assert.match(section, /poweredBy/);
  assert.match(section, /window\.location\.assign/);
  assert.match(section, /zipProvided: true/);
  assert.match(section, /destination: "snaplink"/);
  assert.match(section, /source: "southline"/);
  assert.match(section, /LOCAL_SEARCH_EVENT/);
  assert.match(section, /aria-describedby=\{error \? errorId : undefined\}/);
  assert.match(section, /aria-live="assertive"/);
  assert.match(section, /aria-hidden="true"/);
  assert.doesNotMatch(section, /detail: \{\s*[^}]*\bzip:/);
});

test("the admin shell exposes a Local Discovery tab wired to LocalDiscoveryEditor", async () => {
  const admin = await source("../app/southline/admin/page.tsx");
  assert.match(admin, /LocalDiscoveryEditor/);
  assert.match(admin, /\{ key: "localDiscovery", label: "Local Discovery" \}/);
  assert.match(admin, /tab === "localDiscovery" && <LocalDiscoveryEditor pin=\{pin\} \/>/);
});

test("LocalDiscoveryEditor supports copy, destination, and category CRUD with reorder", async () => {
  const editor = await source("../components/southline/admin/LocalDiscoveryEditor.tsx");
  assert.match(editor, /SnapLink directory URL/);
  assert.match(editor, /Default category/);
  assert.match(editor, /Add Category/);
  assert.match(editor, /addCategory/);
  assert.match(editor, /removeCategory/);
  assert.match(editor, /moveCategory/);
  assert.match(editor, /order: i \}\)\),/);
  assert.match(editor, /showOnHomepage/);
  assert.match(editor, /showCategoryCards/);
});

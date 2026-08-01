import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDiscoveryTarget,
  buildSnapLinkDiscoveryUrl,
  buildSouthlineDiscoveryUrl,
  copyAllowedUtmParams,
  getCategoryCta,
  getCategoryDestination,
  getDiscoveryHelperText,
  getInternalCategorySlug,
  normalizeInternalRoute,
  normalizeSnapLinkBaseUrl,
} from "../lib/southline-local-discovery.ts";

const settings = {
  internalDirectoryRoute: "/results",
  directoryBaseUrl: "https://snaplink.southlineone.com/en/local",
  directoryRoute: "local",
  zipParam: "zip",
  categoryParam: "category",
  localeParam: null,
  sourceValue: "southline-living",
  placementValue: "homepage-local-discovery",
  preserveUtm: true,
  attributionEnabled: true,
  fallbackUrl: "/results",
};

const southlineCategory = (overrides = {}) => ({
  id: "landscaping",
  labelEn: "Landscaping",
  labelEs: "Jardinería y paisajismo",
  descriptionEn: null,
  descriptionEs: null,
  icon: null,
  imageUrl: null,
  snaplinkCategory: null,
  destination: "southline",
  internalSlug: "outdoor",
  visible: true,
  featured: true,
  order: 0,
  seasonalTag: null,
  ...overrides,
});

const photography = southlineCategory({
  id: "photography",
  snaplinkCategory: "photography",
  destination: "snaplink",
});

// --- Ownership: only `destination` decides routing ---------------------------

test("getCategoryDestination: a missing destination never opens SnapLink (except the shipped photography entry point)", () => {
  assert.equal(getCategoryDestination(null), "southline");
  assert.equal(getCategoryDestination(undefined), "southline");
  assert.equal(getCategoryDestination({ id: "roofing", snaplinkCategory: null }), "southline");
  assert.equal(getCategoryDestination({ id: "photography" }), "snaplink");
  assert.equal(getCategoryDestination(southlineCategory()), "southline");
  assert.equal(getCategoryDestination(photography), "snaplink");
  // A category with a slug but no destination is still Southline-owned: the
  // presence of a slug is never a routing decision.
  assert.equal(getCategoryDestination({ id: "pools", snaplinkCategory: "pools" }), "southline");
});

// --- Internal routing (Southline-owned categories) ---------------------------

test("buildDiscoveryTarget routes Southline-owned categories to the internal directory with zip, canonical slug, locale, and attribution", () => {
  const target = buildDiscoveryTarget({ settings, locale: "en", zip: "75204", category: southlineCategory() });
  assert.equal(target.destination, "southline");
  assert.equal(target.external, false);
  assert.equal(
    target.url,
    "/results?zip=75204&category=outdoor&locale=en&source=southline-living&placement=homepage-local-discovery"
  );
});

test("buildDiscoveryTarget routes the all-categories search internally without a category filter", () => {
  const target = buildDiscoveryTarget({ settings, locale: "en", zip: "75204" });
  assert.equal(target.destination, "southline");
  assert.equal(target.external, false);
  assert.ok(target.url.startsWith("/results?"));
  assert.ok(!target.url.includes("category="));
  assert.ok(target.url.includes("zip=75204"));
});

test("buildDiscoveryTarget forwards the shipped builders-remodelers entry point to its real /results service category", () => {
  const builders = southlineCategory({ id: "builders-remodelers", internalSlug: "remodeling" });
  const target = buildDiscoveryTarget({ settings, locale: "en", zip: "75204", category: builders });
  assert.ok(target.url.startsWith("/results?"));
  assert.ok(target.url.includes("category=remodeling"));
  assert.ok(!target.url.includes("category=builders-remodelers"));
});

test("buildDiscoveryTarget routes real-estate to the existing /homes directory (no category filter)", () => {
  const realEstate = southlineCategory({ id: "real-estate", internalSlug: "real-estate" });
  const target = buildDiscoveryTarget({ settings, locale: "en", category: realEstate });
  assert.equal(target.destination, "southline");
  assert.equal(target.external, false);
  assert.ok(target.url.startsWith("/homes?"));
  assert.ok(!target.url.includes("category="));
});

test("buildSouthlineDiscoveryUrl rejects an invalid ZIP and never forwards it", () => {
  assert.throws(
    () => buildSouthlineDiscoveryUrl({ settings, locale: "en", zip: "not-a-zip", category: southlineCategory() }),
    /Invalid US ZIP/
  );
});

test("buildSouthlineDiscoveryUrl refuses reserved internal slugs instead of routing to them", () => {
  assert.throws(
    () => buildSouthlineDiscoveryUrl({ settings, locale: "en", category: southlineCategory({ internalSlug: "admin" }) }),
    /reserved/
  );
});

test("buildSouthlineDiscoveryUrl forwards only allowlisted inbound UTM keys", () => {
  const inbound = new URLSearchParams(
    "utm_source=nextdoor&utm_medium=paid-social&utm_campaign=campaign&ref=evil&zip=00000&utm_content=hero"
  );
  const url = buildSouthlineDiscoveryUrl({ settings, locale: "en", category: southlineCategory(), currentSearchParams: inbound });
  assert.ok(url.includes("utm_source=nextdoor"));
  assert.ok(url.includes("utm_medium=paid-social"));
  assert.ok(url.includes("utm_campaign=campaign"));
  assert.ok(url.includes("utm_content=hero"));
  assert.ok(!url.includes("ref="));
  assert.ok(!url.includes("zip=00000"));
});

test("buildSouthlineDiscoveryUrl honors attribution toggles", () => {
  const url = buildSouthlineDiscoveryUrl({
    settings: { ...settings, attributionEnabled: false, preserveUtm: false },
    locale: "en",
    category: southlineCategory(),
  });
  assert.equal(url, "/results?category=outdoor&locale=en");
});

// --- SnapLink routing (SnapLink-owned categories) ----------------------------

test("buildDiscoveryTarget hands SnapLink-owned categories off to the external directory", () => {
  const target = buildDiscoveryTarget({ settings, locale: "en", zip: "75204", category: photography });
  assert.equal(target.destination, "snaplink");
  assert.equal(target.external, true);
  assert.ok(target.url.startsWith("https://snaplink.southlineone.com/en/local?"));
  assert.ok(target.url.includes("category=photography"));
  assert.ok(target.url.includes("zip=75204"));
});

test("a SnapLink-owned category without a canonical slug is a hard error, never a guessed slug", () => {
  const broken = southlineCategory({ id: "photography", destination: "snaplink", snaplinkCategory: null });
  assert.throws(() => buildDiscoveryTarget({ settings, locale: "en", category: broken }), /requires a canonical SnapLink slug/);
  assert.throws(() => buildSnapLinkDiscoveryUrl({ settings, locale: "en", category: broken }), /requires a canonical SnapLink slug/);
});

test("buildSnapLinkDiscoveryUrl throws for a category Southline does not own", () => {
  assert.throws(() => buildSnapLinkDiscoveryUrl({ settings, locale: "en", category: southlineCategory() }), /not configured for SnapLink/);
});

test("buildSnapLinkDiscoveryUrl requires a category", () => {
  assert.throws(() => buildSnapLinkDiscoveryUrl({ settings, locale: "en" }), /A SnapLink category is required/);
});

test("the SnapLink base URL is normalized to a bare origin so the locale route is never duplicated", () => {
  const url = buildSnapLinkDiscoveryUrl({ settings, locale: "en", category: photography });
  assert.ok(url.startsWith("https://snaplink.southlineone.com/en/local?"));
  assert.ok(!url.includes("/en/local/local"));
});

test("buildSnapLinkDiscoveryUrl appends an optional locale query parameter without dropping the path-based locale", () => {
  const url = buildSnapLinkDiscoveryUrl({ settings: { ...settings, localeParam: "locale" }, locale: "es", category: photography });
  assert.ok(url.startsWith("https://snaplink.southlineone.com/es/local?"));
  assert.ok(url.includes("locale=es"));
});

// --- Helpers -----------------------------------------------------------------

test("normalizeSnapLinkBaseUrl keeps only an allowlisted http(s) origin", () => {
  const base = normalizeSnapLinkBaseUrl("https://snaplink.southlineone.com/en/local");
  assert.equal(base.origin, "https://snaplink.southlineone.com");
  assert.equal(base.pathname, "/");
  assert.throws(() => normalizeSnapLinkBaseUrl("https://evil.example.com/local"), /not allowlisted/);
  assert.throws(() => normalizeSnapLinkBaseUrl("javascript:alert(1)"), /http or https/);
});

test("normalizeInternalRoute defaults to /results and guarantees a leading slash", () => {
  assert.equal(normalizeInternalRoute(null), "/results");
  assert.equal(normalizeInternalRoute("  "), "/results");
  assert.equal(normalizeInternalRoute("directory"), "/directory");
  assert.equal(normalizeInternalRoute("/homes"), "/homes");
});

test("getInternalCategorySlug falls back to the id and refuses reserved or SnapLink-owned categories", () => {
  assert.equal(getInternalCategorySlug(southlineCategory()), "outdoor");
  assert.equal(getInternalCategorySlug(southlineCategory({ internalSlug: "  " })), "landscaping");
  assert.throws(() => getInternalCategorySlug(southlineCategory({ destination: "snaplink" })), /not owned by Southline/);
  assert.throws(() => getInternalCategorySlug(southlineCategory({ internalSlug: "api" })), /reserved/);
});

test("copyAllowedUtmParams forwards only the five allowlisted keys", () => {
  const target = new URLSearchParams();
  copyAllowedUtmParams(
    new URLSearchParams("utm_source=a&utm_medium=b&utm_campaign=c&utm_content=d&utm_term=e&evil=f"),
    target
  );
  assert.equal(target.toString(), "utm_source=a&utm_medium=b&utm_campaign=c&utm_content=d&utm_term=e");
  copyAllowedUtmParams(undefined, target);
});

test("category CTA and helper copy mirror ownership", () => {
  assert.equal(getCategoryCta("en", southlineCategory()), "View local professionals");
  assert.equal(getCategoryCta("es", southlineCategory()), "Ver profesionales locales");
  assert.equal(getCategoryCta("en", southlineCategory({ id: "real-estate" })), "Explore real estate");
  assert.equal(getCategoryCta("es", southlineCategory({ id: "real-estate" })), "Explorar bienes raíces");
  assert.equal(getCategoryCta("en", photography), "View photographers on SnapLink");
  assert.equal(getCategoryCta("es", photography), "Ver fotógrafos en SnapLink");
  assert.match(getDiscoveryHelperText("en", photography), /SnapLink directory/);
  assert.match(getDiscoveryHelperText("en", southlineCategory()), /Southline results/);
});

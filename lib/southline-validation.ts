import { isAllowedSnaplinkHost, isSafeFallbackPath } from "./southline-local-discovery.ts";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validateFeaturedRentals(patch: Record<string, unknown>): string | null {
  for (const field of ["eyebrowEn", "eyebrowEs", "headlineEn", "headlineEs", "descriptionEn", "descriptionEs", "ctaEn", "ctaEs"]) {
    if (patch[field] !== undefined && !isString(patch[field])) {
      return `featuredRentals.${field} must be a string`;
    }
  }
  if (patch.maxCards !== undefined && (!isFiniteNumber(patch.maxCards) || patch.maxCards < 1 || patch.maxCards > 4)) {
    return "featuredRentals.maxCards must be a number from 1 to 4";
  }
  if (patch.selectedRentalIds !== undefined && (!Array.isArray(patch.selectedRentalIds) || !patch.selectedRentalIds.every(isString))) {
    return "featuredRentals.selectedRentalIds must be an array of strings";
  }
  return null;
}

function validateFaq(patch: Record<string, unknown>): string | null {
  if (patch.enabled !== undefined && !isBoolean(patch.enabled)) {
    return "faq.enabled must be a boolean";
  }
  for (const field of ["eyebrowEn", "eyebrowEs", "titleEn", "titleEs", "subtitleEn", "subtitleEs"]) {
    if (patch[field] !== undefined && !isString(patch[field])) {
      return `faq.${field} must be a string`;
    }
  }
  if (patch.items === undefined) return null;
  if (!Array.isArray(patch.items)) return "faq.items must be an array";
  for (let i = 0; i < patch.items.length; i++) {
    const item = patch.items[i];
    if (!isRecord(item)) return `faq.items[${i}] must be an object`;
    if (!isNonEmptyString(item.id)) return `faq.items[${i}].id must be a non-empty string`;
    for (const field of ["questionEn", "questionEs", "answerEn", "answerEs"]) {
      if (!isString(item[field])) return `faq.items[${i}].${field} must be a string`;
    }
    if (!isBoolean(item.visible)) return `faq.items[${i}].visible must be a boolean`;
    if (!isFiniteNumber(item.sortOrder)) return `faq.items[${i}].sortOrder must be a number`;
  }
  return null;
}

function validateFooterColumn(col: Record<string, unknown>, i: number): string | null {
  if (!isNonEmptyString(col.id)) return `footer.columns[${i}].id must be a non-empty string`;
  if (!isString(col.titleEn) || !isString(col.titleEs)) {
    return `footer.columns[${i}].titleEn and titleEs must be strings`;
  }
  if (!isBoolean(col.visible)) return `footer.columns[${i}].visible must be a boolean`;
  if (!isFiniteNumber(col.sortOrder)) return `footer.columns[${i}].sortOrder must be a number`;
  if (col.links === undefined) return null;
  if (!Array.isArray(col.links)) return `footer.columns[${i}].links must be an array`;
  for (let j = 0; j < col.links.length; j++) {
    const link = col.links[j];
    if (!isRecord(link)) return `footer.columns[${i}].links[${j}] must be an object`;
    if (!isNonEmptyString(link.id)) return `footer.columns[${i}].links[${j}].id must be a non-empty string`;
    if (!isString(link.labelEn) || !isString(link.labelEs)) {
      return `footer.columns[${i}].links[${j}].labelEn and labelEs must be strings`;
    }
    if (!isNonEmptyString(link.href)) return `footer.columns[${i}].links[${j}].href must be a non-empty string`;
    if (!isBoolean(link.visible)) return `footer.columns[${i}].links[${j}].visible must be a boolean`;
    if (!isFiniteNumber(link.sortOrder)) return `footer.columns[${i}].links[${j}].sortOrder must be a number`;
  }
  return null;
}

function validateFooter(patch: Record<string, unknown>): string | null {
  if (patch.visible !== undefined && !isBoolean(patch.visible)) {
    return "footer.visible must be a boolean";
  }
  if (patch.newsletterVisible !== undefined && !isBoolean(patch.newsletterVisible)) {
    return "footer.newsletterVisible must be a boolean";
  }
  for (const field of [
    "taglineEn",
    "taglineEs",
    "newsletterTitleEn",
    "newsletterTitleEs",
    "newsletterDescEn",
    "newsletterDescEs",
    "copyrightEn",
    "copyrightEs",
    "poweredByEn",
    "poweredByEs",
  ]) {
    if (patch[field] !== undefined && !isString(patch[field])) {
      return `footer.${field} must be a string`;
    }
  }
  if (patch.columns === undefined) return null;
  if (!Array.isArray(patch.columns)) return "footer.columns must be an array";
  for (let i = 0; i < patch.columns.length; i++) {
    const col = patch.columns[i];
    if (!isRecord(col)) return `footer.columns[${i}] must be an object`;
    const err = validateFooterColumn(col, i);
    if (err) return err;
  }
  return null;
}

const CONTACT_CTA_TYPES = [
  "call",
  "text",
  "email",
  "whatsapp",
  "directions",
  "external_link",
];

function validateStringOrNull(patch: Record<string, unknown>, key: string, prefix: string): string | null {
  const value = patch[key];
  if (value !== undefined && !isString(value) && value !== null) {
    return `${prefix}.${key} must be a string or null`;
  }
  return null;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function validateContact(patch: Record<string, unknown>): string | null {
  if (patch.enabled !== undefined && !isBoolean(patch.enabled)) {
    return "contact.enabled must be a boolean";
  }
  for (const field of [
    "heading",
    "body",
    "businessName",
    "businessDescription",
    "phone",
    "email",
    "whatsapp",
    "addressLine1",
    "addressLine2",
    "city",
    "region",
    "postalCode",
    "directionsUrl",
    "primaryCtaLabel",
    "primaryCtaValue",
  ]) {
    const err = validateStringOrNull(patch, field, "contact");
    if (err) return err;
  }
  if (patch.primaryCtaType !== undefined && patch.primaryCtaType !== null && !CONTACT_CTA_TYPES.includes(patch.primaryCtaType as string)) {
    return `contact.primaryCtaType must be one of ${CONTACT_CTA_TYPES.join(", ")} or null`;
  }
  if (patch.hours === undefined) return null;
  if (!Array.isArray(patch.hours)) return "contact.hours must be an array";
  for (let i = 0; i < patch.hours.length; i++) {
    const entry = patch.hours[i];
    if (!isRecord(entry)) return `contact.hours[${i}] must be an object`;
    if (!isNonEmptyString(entry.id)) return `contact.hours[${i}].id must be a non-empty string`;
    if (!isString(entry.dayLabel)) return `contact.hours[${i}].dayLabel must be a string`;
    if (!isString(entry.hoursLabel)) return `contact.hours[${i}].hoursLabel must be a string`;
    if (!isBoolean(entry.enabled)) return `contact.hours[${i}].enabled must be a boolean`;
    if (!isFiniteNumber(entry.sortOrder)) return `contact.hours[${i}].sortOrder must be a number`;
  }
  return null;
}

function validateTestimonials(patch: Record<string, unknown>): string | null {
  if (patch.enabled !== undefined && !isBoolean(patch.enabled)) {
    return "testimonials.enabled must be a boolean";
  }
  for (const field of ["heading", "headingEs", "body", "bodyEs", "reviewCtaLabel", "reviewCtaLabelEs", "reviewCtaUrl"]) {
    const err = validateStringOrNull(patch, field, "testimonials");
    if (err) return err;
  }
  if (patch.items === undefined) return null;
  if (!Array.isArray(patch.items)) return "testimonials.items must be an array";
  for (let i = 0; i < patch.items.length; i++) {
    const item = patch.items[i];
    if (!isRecord(item)) return `testimonials.items[${i}] must be an object`;
    if (!isNonEmptyString(item.id)) return `testimonials.items[${i}].id must be a non-empty string`;
    if (!isString(item.quote)) return `testimonials.items[${i}].quote must be a string`;
    if (!isString(item.authorName)) return `testimonials.items[${i}].authorName must be a string`;
    for (const field of [
      "quoteEs",
      "authorNameEs",
      "authorTitle",
      "authorTitleEs",
      "companyName",
      "companyNameEs",
      "imageUrl",
      "sourceLabel",
      "sourceUrl",
    ]) {
      const err = validateStringOrNull(item, field, `testimonials.items[${i}]`);
      if (err) return err;
    }
    if (item.rating !== undefined && item.rating !== null && !isFiniteNumber(item.rating)) {
      return `testimonials.items[${i}].rating must be a number or null`;
    }
    if (!isBoolean(item.enabled)) return `testimonials.items[${i}].enabled must be a boolean`;
    if (!isBoolean(item.featured)) return `testimonials.items[${i}].featured must be a boolean`;
    if (!isFiniteNumber(item.sortOrder)) return `testimonials.items[${i}].sortOrder must be a number`;
  }
  return null;
}

const SEO_STRING_OR_NULL_FIELDS = [
  "siteName",
  "defaultTitle",
  "defaultTitleEs",
  "titleTemplate",
  "titleTemplateEs",
  "defaultDescription",
  "defaultDescriptionEs",
  "canonicalSiteUrl",
  "defaultOpenGraphTitle",
  "defaultOpenGraphTitleEs",
  "defaultOpenGraphDescription",
  "defaultOpenGraphDescriptionEs",
  "defaultOpenGraphImageUrl",
  "defaultTwitterTitle",
  "defaultTwitterTitleEs",
  "defaultTwitterDescription",
  "defaultTwitterDescriptionEs",
  "defaultTwitterImageUrl",
  "organizationName",
  "organizationLogoUrl",
  "googleSiteVerification",
  "bingSiteVerification",
];

const SEO_ROBOTS_FIELDS = ["index", "follow", "noarchive", "nosnippet", "noimageindex"];

const SEO_PAGE_STRING_OR_NULL_FIELDS = [
  "title",
  "titleEs",
  "description",
  "descriptionEs",
  "canonicalPath",
  "openGraphTitle",
  "openGraphTitleEs",
  "openGraphDescription",
  "openGraphDescriptionEs",
  "openGraphImageUrl",
  "twitterTitle",
  "twitterTitleEs",
  "twitterDescription",
  "twitterDescriptionEs",
  "twitterImageUrl",
];

function validateRobotsRecord(robots: unknown, prefix: string): string | null {
  if (!isRecord(robots)) return `${prefix} must be an object`;
  for (const field of SEO_ROBOTS_FIELDS) {
    if (!isBoolean(robots[field])) return `${prefix}.${field} must be a boolean`;
  }
  return null;
}

function validatePageSeoOverride(page: unknown, key: string): string | null {
  if (!isRecord(page)) return `seo.pages.${key} must be an object`;
  for (const field of SEO_PAGE_STRING_OR_NULL_FIELDS) {
    const err = validateStringOrNull(page, field, `seo.pages.${key}`);
    if (err) return err;
  }
  if (page.robots !== undefined && page.robots !== null) {
    const err = validateRobotsRecord(page.robots, `seo.pages.${key}.robots`);
    if (err) return err;
  }
  return null;
}

function validateSeo(patch: Record<string, unknown>): string | null {
  for (const field of SEO_STRING_OR_NULL_FIELDS) {
    const err = validateStringOrNull(patch, field, "seo");
    if (err) return err;
  }
  if (
    patch.twitterCardType !== undefined &&
    patch.twitterCardType !== "summary" &&
    patch.twitterCardType !== "summary_large_image"
  ) {
    return "seo.twitterCardType must be one of summary, summary_large_image";
  }
  if (patch.defaultRobots !== undefined) {
    const err = validateRobotsRecord(patch.defaultRobots, "seo.defaultRobots");
    if (err) return err;
  }
  if (patch.pages !== undefined) {
    if (!isRecord(patch.pages)) return "seo.pages must be an object";
    for (const key of ["home", "faq", "contact"]) {
      if (patch.pages[key] !== undefined) {
        const err = validatePageSeoOverride(patch.pages[key], key);
        if (err) return err;
      }
    }
  }
  return null;
}

const LOCAL_DISCOVERY_LABEL_FIELDS = [
  "eyebrowEn",
  "eyebrowEs",
  "titleEn",
  "titleEs",
  "descriptionEn",
  "descriptionEs",
  "zipPlaceholderEn",
  "zipPlaceholderEs",
  "submitLabelEn",
  "submitLabelEs",
  "poweredByLabelEn",
  "poweredByLabelEs",
];

const LOCAL_CATEGORY_STRING_FIELDS = [
  "descriptionEn",
  "descriptionEs",
  "icon",
  "imageUrl",
  "snaplinkCategory",
  "internalSlug",
  "seasonalTag",
];

// The redirect host must come from trusted CMS configuration, so the destination
// is validated before persistence: a real http(s) URL with a host, and HTTPS in
// production. javascript:, data:, and other unsafe protocols are rejected.
function validateDestinationUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "must be a non-empty URL string";
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return "must be a valid URL";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "must use http or https";
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    return "must use https in production";
  }
  if (!url.hostname) return "must include a host";
  return null;
}

function validateLocalDiscovery(patch: Record<string, unknown>): string | null {
  for (const flag of ["enabled", "showOnHomepage", "showCategoryCards", "preserveUtm", "attributionEnabled"]) {
    if (patch[flag] !== undefined && !isBoolean(patch[flag])) {
      return `localDiscovery.${flag} must be a boolean`;
    }
  }
  for (const field of LOCAL_DISCOVERY_LABEL_FIELDS) {
    if (patch[field] !== undefined && !isString(patch[field]) && patch[field] !== null) {
      return `localDiscovery.${field} must be a string or null`;
    }
  }
  if (patch.directoryBaseUrl !== undefined) {
    const err = validateDestinationUrl(patch.directoryBaseUrl);
    if (err) return `localDiscovery.directoryBaseUrl ${err}`;
    const hostname = new URL(String(patch.directoryBaseUrl).trim()).hostname;
    if (!isAllowedSnaplinkHost(hostname)) {
      return `localDiscovery.directoryBaseUrl host "${hostname}" is not on the SnapLink allowlist`;
    }
  }
  if (patch.defaultCategory !== undefined && patch.defaultCategory !== null && !isString(patch.defaultCategory)) {
    return "localDiscovery.defaultCategory must be a string or null";
  }
  if (patch.internalDirectoryRoute !== undefined && patch.internalDirectoryRoute !== null) {
    if (!isString(patch.internalDirectoryRoute) || !isSafeFallbackPath(patch.internalDirectoryRoute)) {
      return 'localDiscovery.internalDirectoryRoute must be an internal path starting with "/" (no external redirects)';
    }
  }
  for (const field of ["directoryRoute", "zipParam", "categoryParam", "localeParam", "sourceValue", "placementValue"] as const) {
    if (patch[field] !== undefined && !isString(patch[field]) && patch[field] !== null) {
      return `localDiscovery.${field} must be a string or null`;
    }
  }
  if (patch.openBehavior !== undefined && patch.openBehavior !== "same-tab" && patch.openBehavior !== "new-tab") {
    return 'localDiscovery.openBehavior must be "same-tab" or "new-tab"';
  }
  if (patch.fallbackUrl !== undefined && patch.fallbackUrl !== null) {
    if (!isString(patch.fallbackUrl) || !isSafeFallbackPath(patch.fallbackUrl)) {
      return "localDiscovery.fallbackUrl must be an internal path starting with \"/\" (no external redirects)";
    }
  }
  if (patch.categories === undefined) return null;
  if (!Array.isArray(patch.categories)) return "localDiscovery.categories must be an array";
  const seenIds = new Set<string>();
  for (let i = 0; i < patch.categories.length; i++) {
    const category = patch.categories[i];
    if (!isRecord(category)) return `localDiscovery.categories[${i}] must be an object`;
    if (!isNonEmptyString(category.id)) {
      return `localDiscovery.categories[${i}].id must be a non-empty string`;
    }
    if (seenIds.has(category.id)) {
      return `localDiscovery.categories[${i}].id duplicate: ${category.id}`;
    }
    seenIds.add(category.id);
    if (!isString(category.labelEn) || !isString(category.labelEs)) {
      return `localDiscovery.categories[${i}].labelEn and labelEs must be strings`;
    }
    for (const field of LOCAL_CATEGORY_STRING_FIELDS) {
      const value = category[field];
      if (value !== undefined && !isString(value) && value !== null) {
        return `localDiscovery.categories[${i}].${field} must be a string or null`;
      }
    }
    if (category.destination !== undefined && category.destination !== "southline" && category.destination !== "snaplink") {
      return `localDiscovery.categories[${i}].destination must be "southline" or "snaplink"`;
    }
    if (!isBoolean(category.visible)) return `localDiscovery.categories[${i}].visible must be a boolean`;
    if (!isBoolean(category.featured)) return `localDiscovery.categories[${i}].featured must be a boolean`;
    if (!isFiniteNumber(category.order)) return `localDiscovery.categories[${i}].order must be a number`;
  }
  return null;
}

const SNAPLINK_PROMO_LAYOUTS = ["image-left", "image-right", "full-background"];
const SNAPLINK_PROMO_OVERLAYS = ["none", "light", "medium", "strong"];
const SNAPLINK_PROMO_FOCAL_POINTS = ["left", "center", "right", "bottom"];
const SNAPLINK_PROMO_MOBILE_FOCAL_POINTS = ["top", "center", "bottom"];
const SNAPLINK_PROMO_ALIGNMENTS = ["left", "right"];

function validateSnapLinkPromo(patch: Record<string, unknown>): string | null {
  if (patch.layout !== undefined && !SNAPLINK_PROMO_LAYOUTS.includes(patch.layout as string)) {
    return `snapLinkPromo.layout must be one of ${SNAPLINK_PROMO_LAYOUTS.join(", ")}`;
  }
  if (patch.contentAlignment !== undefined && !SNAPLINK_PROMO_ALIGNMENTS.includes(patch.contentAlignment as string)) {
    return `snapLinkPromo.contentAlignment must be one of ${SNAPLINK_PROMO_ALIGNMENTS.join(", ")}`;
  }
  if (patch.overlayStrength !== undefined && !SNAPLINK_PROMO_OVERLAYS.includes(patch.overlayStrength as string)) {
    return `snapLinkPromo.overlayStrength must be one of ${SNAPLINK_PROMO_OVERLAYS.join(", ")}`;
  }
  if (patch.focalPoint !== undefined && !SNAPLINK_PROMO_FOCAL_POINTS.includes(patch.focalPoint as string)) {
    return `snapLinkPromo.focalPoint must be one of ${SNAPLINK_PROMO_FOCAL_POINTS.join(", ")}`;
  }
  if (
    patch.mobileFocalPoint !== undefined &&
    !SNAPLINK_PROMO_MOBILE_FOCAL_POINTS.includes(patch.mobileFocalPoint as string)
  ) {
    return `snapLinkPromo.mobileFocalPoint must be one of ${SNAPLINK_PROMO_MOBILE_FOCAL_POINTS.join(", ")}`;
  }
  if (patch.desktopImageUrl !== undefined && !isNonEmptyString(patch.desktopImageUrl)) {
    return "snapLinkPromo.desktopImageUrl must be a non-empty string";
  }
  for (const field of ["mobileImageUrl", "imageAltEn", "imageAltEs"]) {
    if (patch[field] !== undefined && !isString(patch[field]) && patch[field] !== null) {
      return `snapLinkPromo.${field} must be a string or null`;
    }
  }
  for (const field of ["showBadge", "showChips", "showSecondaryLine"]) {
    if (patch[field] !== undefined && !isBoolean(patch[field])) {
      return `snapLinkPromo.${field} must be a boolean`;
    }
  }
  for (const field of [
    "eyebrowEn",
    "eyebrowEs",
    "titleEn",
    "titleEs",
    "bodyEn",
    "bodyEs",
    "ctaLabelEn",
    "ctaLabelEs",
    "secondaryLineEn",
    "secondaryLineEs",
  ]) {
    if (patch[field] !== undefined && !isString(patch[field]) && patch[field] !== null) {
      return `snapLinkPromo.${field} must be a string or null`;
    }
  }
  return null;
}

export function validateSouthlineSettings(patch: unknown): string | null {
  if (!isRecord(patch)) return "Patch must be an object";
  if (patch.featuredRentals !== undefined) {
    if (!isRecord(patch.featuredRentals)) return "featuredRentals must be an object";
    const err = validateFeaturedRentals(patch.featuredRentals);
    if (err) return err;
  }
  if (patch.faq !== undefined) {
    if (!isRecord(patch.faq)) return "faq must be an object";
    const err = validateFaq(patch.faq);
    if (err) return err;
  }
  if (patch.footer !== undefined) {
    if (!isRecord(patch.footer)) return "footer must be an object";
    const err = validateFooter(patch.footer);
    if (err) return err;
  }
  if (patch.contact !== undefined) {
    if (!isRecord(patch.contact)) return "contact must be an object";
    const err = validateContact(patch.contact);
    if (err) return err;
  }
  if (patch.testimonials !== undefined) {
    if (!isRecord(patch.testimonials)) return "testimonials must be an object";
    const err = validateTestimonials(patch.testimonials);
    if (err) return err;
  }
  if (patch.localDiscovery !== undefined) {
    if (!isRecord(patch.localDiscovery)) return "localDiscovery must be an object";
    const err = validateLocalDiscovery(patch.localDiscovery);
    if (err) return err;
  }
  if (patch.seo !== undefined) {
    if (!isRecord(patch.seo)) return "seo must be an object";
    const err = validateSeo(patch.seo);
    if (err) return err;
  }
  if (patch.snapLinkPromo !== undefined) {
    if (!isRecord(patch.snapLinkPromo)) return "snapLinkPromo must be an object";
    const err = validateSnapLinkPromo(patch.snapLinkPromo);
    if (err) return err;
  }
  // Operator-curated featured directory controls (ordered lists — position is
  // the featured order). Values are profile ids, so they must be strings,
  // and each id may appear at most once — a duplicate would otherwise be a
  // valid-looking array that renders the same professional's card twice.
  for (const key of ["featuredContractorIds", "featuredAgentProfileIds"]) {
    if (patch[key] === undefined) continue;
    if (!isStringArray(patch[key])) {
      return `${key} must be an array of strings`;
    }
    const ids = patch[key] as string[];
    if (new Set(ids).size !== ids.length) {
      return `${key} must not contain duplicate ids`;
    }
  }
  return null;
}

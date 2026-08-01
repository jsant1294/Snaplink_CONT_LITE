import type { Lang } from "./southline-i18n";
import type { LocalDiscoveryDestination, SouthlineLocalCategory } from "./southline-types";

export const DEFAULT_DIRECTORY_BASE_URL = "https://snaplink.southlineone.com/en/local";

// The only hosts a SnapLink Local hand-off is ever allowed to target. Enforced
// both at CMS save-time (southline-validation.ts) and again here at URL-build
// time, so a bad/legacy value can never turn this bridge into an open redirect.
// "localhost"/"127.0.0.1" are permitted only to support local development.
export const ALLOWED_SNAPLINK_HOSTS = ["snaplink.southlineone.com", "localhost", "127.0.0.1"] as const;

export function isAllowedSnaplinkHost(hostname: string): boolean {
  return (ALLOWED_SNAPLINK_HOSTS as readonly string[]).includes(hostname);
}

// Deterministic outbound attribution for every SnapLink hand-off. Nextdoor (or
// any other approved channel) may supply these as inbound query parameters —
// only allowlisted keys are ever forwarded, never arbitrary query strings.
export const DEFAULT_ATTRIBUTION = {
  utm_source: "southline",
  utm_medium: "referral",
  utm_campaign: "local-discovery",
} as const;

export const APPROVED_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type ApprovedUtmParams = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

// Analytics event name for the outbound local-search hand-off. The exact ZIP is
// never part of analytics payloads; components forward `zipProvided` instead.
export const LOCAL_SEARCH_EVENT = "local_search_submitted";

// Cross-promo (homepage → SnapLink Local directory) analytics. Kept separate
// from LOCAL_SEARCH_EVENT so a promotional click is never counted as a
// directory search. Same discipline as LOCAL_SEARCH_EVENT: only aggregated
// fields — never the visitor's identity, IP, or exact ZIP.
export const CROSS_PROMO_EVENT = "snaplink_cross_promo_click";

// Attribution placement for every SnapLink Local hand-off initiated from the
// homepage cross-promo section. Mirrors the documented URL contract
// (?source=...&placement=...).
export const CROSS_PROMO_PLACEMENT = "homepage-cross-promo";

const US_ZIP_PATTERN = /^\d{5}(?:-\d{4})?$/;

export function normalizeUsZip(value: string): string {
  return value.trim();
}

export function isValidUsZip(value: string): boolean {
  return US_ZIP_PATTERN.test(value.trim());
}

// A "safe fallback" destination must be an internal Southline path, never a
// second external redirect. Rejects protocol-relative ("//host"), scheme
// ("https://", "javascript:") and empty values.
export function isSafeFallbackPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("://")) return false;
  return true;
}

// Reads only the allowlisted UTM keys out of a raw query string (e.g.
// window.location.search), dropping everything else.
export function readApprovedUtmParams(search: string): ApprovedUtmParams {
  const result: ApprovedUtmParams = {};
  if (!search) return result;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const key of APPROVED_UTM_KEYS) {
    const value = params.get(key);
    if (value) result[key] = value;
  }
  return result;
}

// Builds the directory path for a locale, always resolving to `/<locale>/<route>`
// (default route "local"). A configured base like
// `https://snaplink.southlineone.com/en/local` swaps its locale segment; a bare
// origin gets `/en/local` (or `/es/local`) appended.
function resolveLocalPath(baseUrl: string, locale: "en" | "es", route: string): string {
  const url = new URL(baseUrl);
  const path = url.pathname.replace(/\/+$/, "");
  const routeSuffix = `/${route}`;
  const localePath = `/${locale}${routeSuffix}`;
  if (path.endsWith(routeSuffix)) {
    const prefix = path.slice(0, -routeSuffix.length);
    const lastSegment = prefix.slice(prefix.lastIndexOf("/") + 1);
    if (lastSegment === "en" || lastSegment === "es") {
      return `${prefix.slice(0, prefix.lastIndexOf("/"))}/${locale}${routeSuffix}`;
    }
    return `${prefix}${localePath}`;
  }
  return path === "" ? localePath : `${path}${localePath}`;
}

export type BuildSnaplinkLocalUrlArgs = {
  baseUrl?: string | null;
  locale: Lang;
  zip?: string | null;
  category?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  // --- SnapLink Local Bridge configuration (Phase 3) ---
  route?: string | null;
  zipParam?: string | null;
  categoryParam?: string | null;
  localeParam?: string | null;
  sourceValue?: string | null;
  placementValue?: string | null;
  preserveUtm?: boolean;
  attributionEnabled?: boolean;
};

// Single helper responsible for building SnapLink local-directory URLs. The
// destination host always comes from the trusted CMS configuration (or the
// shipped default) — never from visitor input or query parameters — is always
// checked against the SnapLink host allowlist, and only allowlisted attribution
// keys are added, each at most once.
export function buildSnaplinkLocalUrl({
  baseUrl,
  locale,
  zip,
  category,
  source,
  medium,
  campaign,
  route,
  zipParam,
  categoryParam,
  localeParam,
  sourceValue,
  placementValue,
  preserveUtm = true,
  attributionEnabled = true,
}: BuildSnaplinkLocalUrlArgs): string {
  let target: URL;
  try {
    const candidate = new URL(baseUrl ?? DEFAULT_DIRECTORY_BASE_URL);
    if (candidate.protocol !== "http:" && candidate.protocol !== "https:") {
      target = new URL(DEFAULT_DIRECTORY_BASE_URL);
    } else if (!isAllowedSnaplinkHost(candidate.hostname)) {
      // Defense in depth: even if an unapproved host somehow got persisted,
      // never build a redirect to it. Fall back to the shipped default.
      target = new URL(DEFAULT_DIRECTORY_BASE_URL);
    } else {
      target = candidate;
    }
  } catch {
    target = new URL(DEFAULT_DIRECTORY_BASE_URL);
  }

  const url = new URL(target.toString());
  url.pathname = resolveLocalPath(url.toString(), locale, route || "local");
  url.search = "";

  const zipKey = zipParam || "zip";
  const categoryKey = categoryParam || "category";

  if (zip && isValidUsZip(zip)) {
    url.searchParams.set(zipKey, normalizeUsZip(zip));
  }
  if (category) {
    url.searchParams.set(categoryKey, category);
  }
  if (localeParam) {
    url.searchParams.set(localeParam, locale);
  }

  if (attributionEnabled) {
    url.searchParams.set("source", sourceValue || "southline-living");
    url.searchParams.set("placement", placementValue || "homepage-local-discovery");
  }

  if (preserveUtm) {
    const attribution = {
      utm_source: source ?? DEFAULT_ATTRIBUTION.utm_source,
      utm_medium: medium ?? DEFAULT_ATTRIBUTION.utm_medium,
      utm_campaign: campaign ?? DEFAULT_ATTRIBUTION.utm_campaign,
    };
    for (const [key, value] of Object.entries(attribution)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

// --- Cross-promo (homepage → SnapLink Local directory) ----------------------

export type CrossPromoClickEventPayload = {
  locale: Lang;
  // The chip a visitor clicked, or null for the primary CTA.
  chipId: string | null;
  // The SnapLink category slug forwarded to the directory (if the chip has a
  // configured mapping), or null when omitted — never a guessed slug.
  category: string | null;
  destination: "snaplink";
  source: "southline";
  placement: string;
  timestamp: string;
  sessionId: string;
  utm: ApprovedUtmParams;
};

export type CrossPromoCategory = {
  id: string;
  emoji: string;
  labelEn: string;
  labelEs: string;
  // SnapLink directory category slug. Left null until an operator confirms the
  // real directory mapping — an unmapped chip opens the directory root and is
  // tagged in analytics, never forwarded as a guessed slug.
  snaplinkCategory: string | null;
};

// Entry points into the SnapLink Local directory — never fabricated merchants,
// ratings, or availability. Slugs stay null (see CrossPromoCategory) until real
// directory categories are confirmed, matching the Local Discovery convention.
export const DEFAULT_LOCAL_PROMO_CATEGORIES: CrossPromoCategory[] = [
  { id: "restaurants", emoji: "🍴", labelEn: "Restaurants", labelEs: "Restaurantes", snaplinkCategory: null },
  { id: "retail", emoji: "🛍", labelEn: "Retail", labelEs: "Comercios", snaplinkCategory: null },
  { id: "photography", emoji: "📸", labelEn: "Photography", labelEs: "Fotografía", snaplinkCategory: null },
  { id: "automotive", emoji: "🚗", labelEn: "Automotive", labelEs: "Automotriz", snaplinkCategory: null },
  { id: "beauty", emoji: "💄", labelEn: "Beauty", labelEs: "Belleza", snaplinkCategory: null },
  { id: "events", emoji: "🎉", labelEn: "Events", labelEs: "Eventos", snaplinkCategory: null },
  { id: "medical", emoji: "🩺", labelEn: "Medical", labelEs: "Salud", snaplinkCategory: null },
  { id: "business-services", emoji: "💼", labelEn: "Business Services", labelEs: "Servicios profesionales", snaplinkCategory: null },
  { id: "entertainment", emoji: "🎵", labelEn: "Entertainment", labelEs: "Entretenimiento", snaplinkCategory: null },
  { id: "shopping", emoji: "🛒", labelEn: "Shopping", labelEs: "Compras", snaplinkCategory: null },
];

// Builds the cross-promo destination: the SnapLink Local directory for the
// current locale, tagged source=southline-living / placement=homepage-cross-promo,
// with allowlisted inbound UTM preserved. Delegates to buildSnaplinkLocalUrl so
// host allowlisting, locale routing, and UTM filtering all stay in one place.
export function buildCrossPromoUrl(
  locale: Lang,
  inbound: ApprovedUtmParams = {},
  category: string | null = null
): string {
  return buildSnaplinkLocalUrl({
    locale,
    category,
    source: inbound.utm_source ?? null,
    medium: inbound.utm_medium ?? null,
    campaign: inbound.utm_campaign ?? null,
    sourceValue: "southline-living",
    placementValue: CROSS_PROMO_PLACEMENT,
    preserveUtm: true,
    attributionEnabled: true,
  });
}

// --- Category ownership & routing (Local Discovery) --------------------------
//
// The critical rule for this whole section: only `destination` decides where a
// category routes. A missing/empty SnapLink slug is never a routing decision —
// it must not push a Southline-owned category out to SnapLink. Southline-owned
// categories (destination "southline") stay on Southline's internal directory;
// SnapLink-owned categories (destination "snaplink") hand off to the SnapLink
// Local directory. Legacy categories without `destination` default to
// "southline".

export type LocalDiscoveryRoutingInput = {
  settings: {
    internalDirectoryRoute?: string | null;
    directoryBaseUrl?: string | null;
    directoryRoute?: string | null;
    zipParam?: string | null;
    categoryParam?: string | null;
    localeParam?: string | null;
    sourceValue?: string | null;
    placementValue?: string | null;
    preserveUtm?: boolean;
    attributionEnabled?: boolean;
    fallbackUrl?: string | null;
  };
  locale: Lang;
  zip?: string | null;
  category?: SouthlineLocalCategory | null;
  currentSearchParams?: URLSearchParams;
};

export type DiscoveryTarget = {
  destination: LocalDiscoveryDestination;
  url: string;
  external: boolean;
};

// Path segments that must never be treated as an internal Southline category
// slug. Defensive only — with query-param routing a slug like "admin" is inert,
// but we refuse it anyway so ownership misconfiguration is loud, not silent.
export const RESERVED_INTERNAL_SLUGS = ["api", "admin", "login", "logout", "settings"] as const;

// Canonical, authoritative destination. Omitting `destination` (legacy rows)
// defaults to "southline" — this is where the "missing slug is not a routing
// decision" rule is enforced. Photography is the shipped SnapLink-owned entry
// point, so only it inherits "snaplink" by default.
export function getCategoryDestination(category?: SouthlineLocalCategory | null): LocalDiscoveryDestination {
  return category?.destination ?? (category?.id === "photography" ? "snaplink" : "southline");
}

// Canonical internal slug for a Southline-owned category. Throws for reserved
// path segments and for categories that are not owned by Southline.
export function getInternalCategorySlug(category: SouthlineLocalCategory): string {
  if (getCategoryDestination(category) !== "southline") {
    throw new Error(`Category "${category.id}" is not owned by Southline and has no internal slug.`);
  }
  const slug = category.internalSlug?.trim() || category.id.trim();
  if (RESERVED_INTERNAL_SLUGS.includes(slug as (typeof RESERVED_INTERNAL_SLUGS)[number])) {
    throw new Error(`Category slug "${slug}" is reserved and cannot be used as an internal route.`);
  }
  return slug;
}

// SnapLink hand-off bases must be a bare, allowlisted origin — never a deep
// path like `https://snaplink.southlineone.com/en/local`. Stripping the path
// guarantees a locale route like `/en/local` is appended exactly once, so a
// stored base can never produce a duplicated `/en/local/local`.
export function normalizeSnapLinkBaseUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SnapLink base URL must use http or https.");
  }
  if (!isAllowedSnaplinkHost(url.hostname)) {
    throw new Error(`SnapLink host "${url.hostname}" is not allowlisted.`);
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

// Internal Southline directory route for Southline-owned categories. Anything
// without a leading "/" is normalized; missing/blank falls back to /results
// (the professional directory, which is where Southline-owned categories live).
export function normalizeInternalRoute(raw: string | null | undefined): string {
  const value = raw?.trim() || "/results";
  return value.startsWith("/") ? value : `/${value}`;
}

// SnapLink directory route segment (the part after the locale, default "local").
// Leading/trailing slashes are stripped so `{locale}/{route}` is always clean.
export function normalizeDirectoryRoute(raw: string | null | undefined): string {
  const value = (raw ?? "local").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return value || "local";
}

// Only allowlisted UTM keys are ever forwarded from the inbound query string —
// never arbitrary parameters.
export function copyAllowedUtmParams(source: URLSearchParams | undefined, target: URLSearchParams): void {
  if (!source) return;
  for (const key of APPROVED_UTM_KEYS) {
    const value = source.get(key);
    if (value) target.set(key, value);
  }
}

// Southline-owned categories route to Southline's internal directory. All
// values go through the allowed filters: a valid ZIP, the canonical category
// slug (or nothing for "All categories"), always an explicit locale, and
// allowlisted UTM keys only. Attribution is added only when enabled.
// Real-estate is the one shipped exception: the spec routes it to the existing
// `/homes` directory instead of `/results`.
export function buildSouthlineDiscoveryUrl({
  settings,
  locale,
  zip,
  category,
  currentSearchParams,
}: LocalDiscoveryRoutingInput): string {
  const isRealEstate = category?.id === "real-estate";
  const route = isRealEstate ? "/homes" : normalizeInternalRoute(settings.internalDirectoryRoute);
  const params = new URLSearchParams();
  const cleanZip = zip?.trim();
  if (cleanZip) {
    if (!isValidUsZip(cleanZip)) throw new Error("Invalid US ZIP code.");
    params.set(settings.zipParam || "zip", cleanZip);
  }
  if (category && !isRealEstate) {
    params.set(settings.categoryParam || "category", getInternalCategorySlug(category));
  }
  params.set("locale", locale);
  if (settings.attributionEnabled) {
    params.set("source", settings.sourceValue || "southline-living");
    params.set("placement", settings.placementValue || "homepage-local-discovery");
  }
  if (settings.preserveUtm) copyAllowedUtmParams(currentSearchParams, params);
  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

// SnapLink-owned categories hand off to the SnapLink Local directory. Unlike
// the legacy builder, a missing canonical slug is a hard error — forwarding an
// invented slug would create a dead end. The base URL must be an allowlisted
// bare origin; the locale route is always appended exactly once.
export function buildSnapLinkDiscoveryUrl({
  settings,
  locale,
  zip,
  category,
  currentSearchParams,
}: LocalDiscoveryRoutingInput): string {
  if (!category) throw new Error("A SnapLink category is required.");
  if (getCategoryDestination(category) !== "snaplink") {
    throw new Error(`Category "${category.id}" is not configured for SnapLink.`);
  }
  const slug = category.snaplinkCategory?.trim();
  if (!slug) {
    throw new Error(`Category "${category.id}" requires a canonical SnapLink slug.`);
  }
  const base = normalizeSnapLinkBaseUrl(settings.directoryBaseUrl || DEFAULT_DIRECTORY_BASE_URL);
  base.pathname = `/${locale}/${normalizeDirectoryRoute(settings.directoryRoute)}`;
  const params = new URLSearchParams();
  const cleanZip = zip?.trim();
  if (cleanZip) {
    if (!isValidUsZip(cleanZip)) throw new Error("Invalid US ZIP code.");
    params.set(settings.zipParam || "zip", cleanZip);
  }
  params.set(settings.categoryParam || "category", slug);
  if (settings.localeParam?.trim()) {
    params.set(settings.localeParam.trim(), locale);
  }
  if (settings.attributionEnabled) {
    params.set("source", settings.sourceValue || "southline-living");
    params.set("placement", settings.placementValue || "homepage-local-discovery");
  }
  if (settings.preserveUtm) copyAllowedUtmParams(currentSearchParams, params);
  base.search = params.toString();
  return base.toString();
}

// Single routing entry point. `destination` is read from the category config
// (never inferred from the presence of a slug) and selects the builder; the
// result declares whether the target is an external host so callers can pick
// the right navigation/open behavior.
export function buildDiscoveryTarget(input: LocalDiscoveryRoutingInput): DiscoveryTarget {
  const destination = getCategoryDestination(input.category);
  if (destination === "snaplink") {
    return { destination, url: buildSnapLinkDiscoveryUrl(input), external: true };
  }
  return { destination, url: buildSouthlineDiscoveryUrl(input), external: false };
}

// Category card CTA copy — mirrors ownership so the UI never promises an
// external directory to a category that stays on Southline.
export function getCategoryCta(locale: Lang, category?: SouthlineLocalCategory | null): string {
  if (getCategoryDestination(category) === "snaplink") {
    return locale === "es" ? "Ver fotógrafos en SnapLink" : "View photographers on SnapLink";
  }
  if (category?.id === "real-estate") {
    return locale === "es" ? "Explorar bienes raíces" : "Explore real estate";
  }
  return locale === "es" ? "Ver profesionales locales" : "View local professionals";
}

export function getDiscoveryHelperText(locale: Lang, category?: SouthlineLocalCategory | null): string {
  if (getCategoryDestination(category) === "snaplink") {
    return locale === "es"
      ? "Serás dirigido al directorio de SnapLink."
      : "You'll be taken to the SnapLink directory.";
  }
  return locale === "es"
    ? "Serás dirigido a los resultados de Southline."
    : "You'll be taken to Southline results.";
}

// --- Diagnostics (Phase 2 / Phase 10) ---------------------------------------

export type LocalDiscoveryStatus = "ready" | "hidden" | "warning" | "misconfigured";

export type LocalDiscoveryStatusInput = {
  enabled: boolean;
  showOnHomepage: boolean;
  showCategoryCards: boolean;
  directoryBaseUrl?: string | null;
  fallbackUrl?: string | null;
  categories?: {
    id?: string;
    visible: boolean;
    destination?: LocalDiscoveryDestination;
    internalSlug?: string | null;
    snaplinkCategory: string | null;
  }[];
};

// Single source of truth for the CMS status badge and the diagnostics panel.
// `enabled` is the master switch: everything else is irrelevant when it is off.
// Ownership is the tiebreaker: a visible SnapLink-owned category without a slug
// is a warning, and a visible Southline-owned category without an internal slug
// is a warning — neither is ever silently routed by guessing.
export function computeLocalDiscoveryStatus(content: LocalDiscoveryStatusInput): LocalDiscoveryStatus {
  if (!content.enabled) return "hidden";

  let baseHost: string;
  try {
    baseHost = new URL(content.directoryBaseUrl || DEFAULT_DIRECTORY_BASE_URL).hostname;
  } catch {
    return "misconfigured";
  }
  if (!isAllowedSnaplinkHost(baseHost)) return "misconfigured";
  if (content.fallbackUrl && !isSafeFallbackPath(content.fallbackUrl)) return "misconfigured";

  if (!content.showOnHomepage) return "warning"; // enabled, but has no current surface to render on
  if (content.showCategoryCards) {
    const categories = content.categories ?? [];
    const visible = categories.filter((c) => c.visible);
    // Mirrors getCategoryDestination's rule so the badge and the builders can
    // never disagree about ownership.
    const destinationOf = (c: { id?: string; destination?: LocalDiscoveryDestination }): LocalDiscoveryDestination =>
      c.destination ?? (c.id === "photography" ? "snaplink" : "southline");
    const unmappedSnaplink = visible.filter(
      (c) => destinationOf(c) === "snaplink" && !c.snaplinkCategory?.trim()
    );
    const unsluggedSouthline = visible.filter(
      (c) => destinationOf(c) === "southline" && !c.internalSlug?.trim()
    );
    if (visible.length > 0 && (unmappedSnaplink.length > 0 || unsluggedSouthline.length > 0)) {
      return "warning";
    }
  }
  return "ready";
}

// --- Attribution (Phase 7) ---------------------------------------------------

export type LocalDiscoveryAttributionRecord = {
  source: string;
  placement: string;
  locale: Lang;
  zipProvided: boolean;
  category: string | null;
  timestamp: string;
  sessionId: string;
  utm: ApprovedUtmParams;
};

// Generates a short, non-identifying per-tab session id (sessionStorage-backed)
// used only to correlate the local-search event with the eventual SnapLink
// hand-off — never the visitor's identity, IP, or exact ZIP.
export function getOrCreateLocalDiscoverySessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "sl_local_discovery_sid";
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(key, generated);
    return generated;
  } catch {
    // Storage may be unavailable (privacy mode, etc.) — attribution must never
    // block navigation, so fall back to a non-persistent id.
    return `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

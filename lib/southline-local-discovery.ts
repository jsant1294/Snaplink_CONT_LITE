import type { Lang } from "./southline-i18n";

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

// --- Diagnostics (Phase 2 / Phase 10) ---------------------------------------

export type LocalDiscoveryStatus = "ready" | "hidden" | "warning" | "misconfigured";

export type LocalDiscoveryStatusInput = {
  enabled: boolean;
  showOnHomepage: boolean;
  showCategoryCards: boolean;
  directoryBaseUrl?: string | null;
  fallbackUrl?: string | null;
  categories?: { visible: boolean; snaplinkCategory: string | null }[];
};

// Single source of truth for the CMS status badge and the diagnostics panel.
// `enabled` is the master switch: everything else is irrelevant when it is off.
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
    if (visible.length > 0 && visible.every((c) => !c.snaplinkCategory)) return "warning"; // no category mappings configured
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

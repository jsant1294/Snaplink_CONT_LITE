import type { Lang } from "./southline-i18n";

export const DEFAULT_DIRECTORY_BASE_URL = "https://snaplink.southlineone.com/en/local";

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

// Builds the directory path for a locale, always resolving to `/<locale>/local`.
// A configured base like `https://snaplink.southlineone.com/en/local` swaps its
// locale segment; a bare origin gets `/en/local` (or `/es/local`) appended.
function resolveLocalPath(baseUrl: string, locale: "en" | "es"): string {
  const url = new URL(baseUrl);
  const path = url.pathname.replace(/\/+$/, "");
  const localePath = `/${locale}/local`;
  if (path.endsWith("/local")) {
    const prefix = path.slice(0, -"/local".length);
    const lastSegment = prefix.slice(prefix.lastIndexOf("/") + 1);
    if (lastSegment === "en" || lastSegment === "es") {
      return `${prefix.slice(0, prefix.lastIndexOf("/"))}/${locale}/local`;
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
};

// Single helper responsible for building SnapLink local-directory URLs. The
// destination host always comes from the trusted CMS configuration (or the
// shipped default) — never from visitor input or query parameters — and only
// allowlisted attribution keys are added, each at most once.
export function buildSnaplinkLocalUrl({
  baseUrl,
  locale,
  zip,
  category,
  source,
  medium,
  campaign,
}: BuildSnaplinkLocalUrlArgs): string {
  let target: URL;
  try {
    const candidate = new URL(baseUrl ?? DEFAULT_DIRECTORY_BASE_URL);
    if (candidate.protocol !== "http:" && candidate.protocol !== "https:") {
      target = new URL(DEFAULT_DIRECTORY_BASE_URL);
    } else {
      target = candidate;
    }
  } catch {
    target = new URL(DEFAULT_DIRECTORY_BASE_URL);
  }

  const url = new URL(target.toString());
  url.pathname = resolveLocalPath(url.toString(), locale);
  url.search = "";

  if (zip && isValidUsZip(zip)) {
    url.searchParams.set("zip", normalizeUsZip(zip));
  }
  if (category) {
    url.searchParams.set("category", category);
  }

  const attribution = {
    utm_source: source ?? DEFAULT_ATTRIBUTION.utm_source,
    utm_medium: medium ?? DEFAULT_ATTRIBUTION.utm_medium,
    utm_campaign: campaign ?? DEFAULT_ATTRIBUTION.utm_campaign,
  };
  for (const [key, value] of Object.entries(attribution)) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}

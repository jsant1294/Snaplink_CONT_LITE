// ---------------------------------------------------------------------------
// Southline Living — unified home-services professional search.
// Pure / store-free so it is unit-testable and shared by BOTH the public
// /results page and the /api/southline/search route. Accepts pre-fetched
// Contractor[] and AgentProfile[] arrays (callers own the store reads).
//
// Matching scope:
//  - Contractors (trades, /contractor/{username}): name/tagline/area plus the
//    canonical SERVICE_LIBRARY names they offer and their profession type
//    (both languages).
//  - Agent profiles (realtors + licensed pros, /agents/{slug}): only profiles
//    whose southlineStatus is published/featured; matched by name, brokerage,
//    tagline, area(s), specialties, categories, license state, and the
//    profession-type label in both languages (so "photographer" / "fotógrafo"
//    finds a photographer on the unified professional model).
//  - A category filter matches against the shared taxonomy (lib/home-service-
//    taxonomy.ts). Contractors map via their services' canonical category;
//    agents map via profession, category/specialty labels, ids, or aliases.
//    The filter value is resolved through the same taxonomy (bilingual labels,
//    aliases, Local Discovery legacy slugs); unknown values filter to nothing
//    (never a silent fallback to an unrelated or guessed category).
// ---------------------------------------------------------------------------

import { SERVICE_LIBRARY, getService } from "./services.ts";
import { agentProfessionTypeLabel, professionTypeLabel } from "./profession-types.ts";
import {
  HOME_SERVICE_CATEGORIES,
  HOME_SERVICE_SPECIALTIES,
  categoryMatchTerms,
  getHomeServiceSpecialty,
  professionCategoryId,
  resolveCategoryId,
  specialtyMatchTerms,
} from "./home-service-taxonomy.ts";
import type { Contractor } from "./types.ts";
import type { AgentProfile } from "./agent-profiles/types.ts";
import type { ZipCentroid } from "./geo/zip-centroids.ts";
import { haversineMiles, isUsZip, normalizeZip } from "./geo/zip.ts";

export interface ProfessionalResult {
  kind: "agent" | "contractor";
  id: string;
  /** Display name: businessName (contractor) or displayName/name (agent). */
  name: string;
  tagline?: string;
  serviceArea: string;
  /** Canonical service names (contractors) or specialties (agents). */
  services: string[];
  /** SERVICE_CATEGORIES ids this professional can serve. */
  categories: string[];
  professionType?: string;
  preferredLanguage: "en" | "es";
  /** SnapLink username (contractors) or Southline slug (agents). */
  slug: string;
  username?: string;
  href: string;
  photoUrl?: string;
  featured: boolean;
  /** TRUE GEO v1: straight-line distance (mi) from the visitor ZIP centroid. Present only when a radius match actually satisfied the location filter. */
  distanceMiles?: number;
  /** TRUE GEO v1: normalized visitor ZIP that drove the radius search. */
  matchedZip?: string;
  /** TRUE GEO v1: the professional's declared service radius (contractor serviceRadiusMiles / agent serviceRadius). */
  serviceRadiusMiles?: number;
  /** True when a visitor location filter (radius match or text match) was applied and satisfied. */
  locationMatched?: boolean;
}

/**
 * TRUE GEO v1 — resolved visitor context passed by the caller (API route /
 * /results page). The caller owns the async ZIP→centroid resolution (single
 * indexed zip_centroids lookup) and one batch fetch of every candidate
 * professional service ZIP's centroid. searchProfessionals stays pure and
 * computes radius eligibility + distance deterministically.
 */
export interface ProfessionalSearchGeoContext {
  /** Normalized visitor 5-digit ZIP that resolved to a centroid. */
  matchedZip: string;
  /** Visitor centroid. */
  centroid: { latitude: number; longitude: number };
  /** Professional service ZIP → centroid map (batch fetch; missing = not geo-locatable). */
  centroids: ReadonlyMap<string, ZipCentroid>;
}

export interface ProfessionalSearchOptions {
  query?: string;
  category?: string;
  /** Zip, city, or market name — filtered against the pros' own coverage fields. A valid 5-digit ZIP activates TRUE GEO radius search (via `geo`); anything else keeps the text/city/market substring filter. */
  location?: string;
  /**
   * TRUE GEO v1 context. When set, ZIP-radius eligibility REPLACES the
   * substring location filter. Professionals without a complete geo record
   * (serviceZip + centroid + declared radius) are excluded — never a
   * fabricated match.
   */
  geo?: ProfessionalSearchGeoContext | null;
  /**
   * True when the caller could NOT resolve a valid-looking ZIP to a centroid.
   * Results are empty and no location filter is silently broadened — the UI
   * shows an explicit "we couldn't find that ZIP" message.
   */
  geoUnknownZip?: boolean;
}

export function isSouthlineListedAgent(profile: AgentProfile): boolean {
  return (
    profile.status === "active" &&
    (profile.southlineStatus === "published" || profile.southlineStatus === "featured")
  );
}

/** Runtime safety contract: demo/test contractors are never publicly discoverable. */
export function isPublicContractor(c: Contractor): boolean {
  return !c.isDemo && c.status === "published";
}

/** Runtime safety contract: demo/test agents are never publicly discoverable. */
export function isPublicAgent(a: AgentProfile): boolean {
  return !a.isDemo;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function matchesQuery(values: (string | undefined)[], q: string): boolean {
  if (!q) return true;
  const needle = normalize(q);
  return values.some((v) => typeof v === "string" && normalize(v).includes(needle));
}

/**
 * Location (zip / market / city) filter against the coverage fields the pros
 * already carry. A filter that matches nothing returns nothing — it never
 * silently widens to unrelated markets. No geocoder: normalized substring
 * match, so a ZIP ("78702"), city ("austin"), or market ("central texas")
 * all resolve without PostGIS or an external service.
 */
export function matchesLocation(values: (string | undefined)[], location?: string): boolean {
  if (!location) return true;
  const needle = normalize(location);
  return values.some((v) => typeof v === "string" && normalize(v).includes(needle));
}

export function categoryIdsForContractor(contractor: Contractor): string[] {
  const set = new Set<string>();
  for (const s of contractor.services) {
    const def = getService(s);
    if (def) set.add(def.category);
  }
  return [...set];
}

export function categoryIdsForAgent(profile: AgentProfile): string[] {
  const set = new Set<string>();
  const profCat = professionCategoryId(profile.professionType);
  if (profCat) set.add(profCat);
  const haystack = [...profile.categories, ...profile.specialties].map(normalize);
  for (const cat of HOME_SERVICE_CATEGORIES) {
    const terms = [cat.labelEn, cat.labelEs, cat.id, ...cat.aliases].map(normalize);
    const specialtyNames = HOME_SERVICE_SPECIALTIES.filter((s) => s.parentId === cat.id)
      .flatMap((s) => [s.labelEn, s.labelEs, ...s.aliases])
      .map(normalize);
    if (haystack.some((h) => terms.includes(h) || specialtyNames.includes(h))) set.add(cat.id);
  }
  return [...set];
}

/**
 * Unified search over trades and agents. Returns professionals matching the
 * (optional) query and/or service category, featured first, then by name.
 */
export function searchProfessionals(
  contractors: Contractor[],
  agents: AgentProfile[],
  options: ProfessionalSearchOptions = {}
): ProfessionalResult[] {
  const q = normalize(options.query ?? "");
  // Resolve the filter through the shared taxonomy (id, legacy slug, label, or
  // alias). An UNRESOLVED value is preserved as-is so it still filters to an
  // empty result set — never a silent fallback to an unrelated category.
  const category = resolveCategoryId(options.category ?? "") ?? options.category ?? "";
  const geo = options.geo ?? null;
  const geoActive = Boolean(geo && geo.matchedZip && isUsZip(geo.matchedZip));
  const origin = geoActive && geo ? geo.centroid : null;
  // A valid-looking ZIP that failed centroid resolution is a hard stop: empty
  // results, never a silent broadening to text searches. The UI states it.
  if (options.geoUnknownZip === true && !geoActive) return [];

  /**
   * TRUE GEO eligibility for one professional. Returns the distance metadata
   * only when the ZIP resolved, a positive radius was declared, and the
   * great-circle distance is within it. Any missing piece → no match (never a
   * fabricated radius result).
   */
  const radiusMatch = (
    serviceZip: string | null | undefined,
    radiusMiles: number | null | undefined
  ): { distanceMiles: number; serviceRadiusMiles: number } | undefined => {
    if (!geoActive || !origin || !geo) return undefined;
    if (!radiusMiles || radiusMiles <= 0) return undefined;
    const zip = normalizeZip(serviceZip);
    if (!zip || !isUsZip(zip)) return undefined;
    const centroid = geo.centroids.get(zip);
    if (!centroid) return undefined;
    const distanceMiles = haversineMiles(origin.latitude, origin.longitude, centroid.latitude, centroid.longitude);
    if (distanceMiles > radiusMiles) return undefined;
    return { distanceMiles, serviceRadiusMiles: radiusMiles };
  };

  const locationIntro: string | undefined = geoActive || options.location ? options.location || geo?.matchedZip : undefined;

  const results: ProfessionalResult[] = [];

  for (const c of contractors) {
    if (!isPublicContractor(c)) continue;
    const catIds = categoryIdsForContractor(c);
    if (category && !catIds.includes(category)) continue;
    const geoMatch = radiusMatch(c.serviceZip, c.serviceRadiusMiles);
    if (geoActive) {
      if (!geoMatch) continue;
    } else if (!matchesLocation([c.serviceArea], options.location)) {
      continue;
    }
    const profCat = professionCategoryId(c.professionType);
    const profTerms = profCat ? categoryMatchTerms(profCat) : [];
    const serviceTerms = c.services.flatMap((s) => specialtyMatchTerms(s));
    const matches = matchesQuery(
      [c.businessName, c.tagline, c.serviceArea, professionTypeLabel(c.professionType, "en"), professionTypeLabel(c.professionType, "es"), ...c.services,
        ...serviceTerms, ...profTerms],
      q
    );
    if (!matches) continue;
    results.push({
      kind: "contractor",
      id: c.id,
      name: c.businessName,
      tagline: c.tagline,
      serviceArea: c.serviceArea,
      services: c.services,
      categories: catIds,
      professionType: c.professionType,
      preferredLanguage: c.preferredLanguage,
      slug: c.username,
      username: c.username,
      href: `/contractor/${c.username}`,
      photoUrl: c.avatarUrl || c.logoUrl,
      featured: false,
      distanceMiles: geoMatch?.distanceMiles,
      serviceRadiusMiles: geoMatch?.serviceRadiusMiles,
      matchedZip: geoActive ? geo!.matchedZip : undefined,
      locationMatched: locationIntro ? true : undefined,
    });
  }

  for (const a of agents) {
    if (a.isDemo) continue;
    if (!isSouthlineListedAgent(a)) continue;
    const catIds = categoryIdsForAgent(a);
    if (category && !catIds.includes(category)) continue;
    const geoMatch = radiusMatch(a.serviceZip, a.serviceRadius ?? undefined);
    if (geoActive) {
      if (!geoMatch) continue;
    } else if (!matchesLocation([a.serviceArea, ...a.serviceAreas], options.location)) {
      continue;
    }
    const profCat = professionCategoryId(a.professionType);
    const profTerms = profCat ? categoryMatchTerms(profCat) : [];
    const categoryTerms = a.categories.flatMap((c) => {
      const id = resolveCategoryId(c);
      return id ? categoryMatchTerms(id) : [c];
    });
    const specialtyTerms = a.specialties.flatMap((s) => {
      const sp = getHomeServiceSpecialty(s);
      return sp ? specialtyMatchTerms(s) : [s];
    });
    const matches = matchesQuery(
      [a.name, a.displayName, a.brokerageName, a.officeName, a.tagline, a.serviceArea, a.licenseState, ...a.serviceAreas, ...a.specialties, ...a.categories,
        agentProfessionTypeLabel(a.professionType, "en"), agentProfessionTypeLabel(a.professionType, "es"),
        ...categoryTerms, ...specialtyTerms, ...profTerms],
      q
    );
    if (!matches) continue;
    results.push({
      kind: "agent",
      id: a.id,
      name: a.displayName || a.name,
      tagline: a.tagline,
      serviceArea: a.serviceArea || a.serviceAreas.join(", "),
      services: a.specialties,
      categories: catIds,
      professionType: a.professionType,
      preferredLanguage: a.preferredLanguage === "es" ? "es" : "en",
      slug: a.slug,
      username: a.username,
      href: `/agents/${a.slug}`,
      photoUrl: a.photoUrl,
      featured: a.southlineStatus === "featured",
      distanceMiles: geoMatch?.distanceMiles,
      serviceRadiusMiles: geoMatch?.serviceRadiusMiles,
      matchedZip: geoActive ? geo!.matchedZip : undefined,
      locationMatched: locationIntro ? true : undefined,
    });
  }

  // TRUE GEO: rank distance ascending, then featured, then name. Non-GEO keeps
  // the existing featured-then-name order.
  results.sort((x, y) => {
    if (geoActive) {
      const dx = x.distanceMiles ?? Number.POSITIVE_INFINITY;
      const dy = y.distanceMiles ?? Number.POSITIVE_INFINITY;
      if (dx !== dy) return dx - dy;
    }
    return Number(y.featured) - Number(x.featured) || x.name.localeCompare(y.name);
  });
  return results;
}

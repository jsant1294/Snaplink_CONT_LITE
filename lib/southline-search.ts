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
}

export interface ProfessionalSearchOptions {
  query?: string;
  category?: string;
}

export function isSouthlineListedAgent(profile: AgentProfile): boolean {
  return (
    profile.status === "active" &&
    (profile.southlineStatus === "published" || profile.southlineStatus === "featured")
  );
}

/** Runtime safety contract: demo/test contractors are never publicly discoverable. */
export function isPublicContractor(c: Contractor): boolean {
  return !c.isDemo;
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
  const results: ProfessionalResult[] = [];

  for (const c of contractors) {
    if (c.isDemo) continue;
    const catIds = categoryIdsForContractor(c);
    if (category && !catIds.includes(category)) continue;
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
    });
  }

  for (const a of agents) {
    if (a.isDemo) continue;
    if (!isSouthlineListedAgent(a)) continue;
    const catIds = categoryIdsForAgent(a);
    if (category && !catIds.includes(category)) continue;
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
    });
  }

  results.sort((x, y) => Number(y.featured) - Number(x.featured) || x.name.localeCompare(y.name));
  return results;
}

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
//  - A category filter matches against SERVICE_CATEGORIES ids. Contractors map
//    via their services' canonical category; agents map via any category/
//    specialty equal to the category label, its id, or one of its services.
// ---------------------------------------------------------------------------

import { SERVICE_CATEGORIES, SERVICE_LIBRARY, getService } from "./services.ts";
import { agentProfessionTypeLabel, professionTypeLabel } from "./profession-types.ts";
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
  const haystack = [...profile.categories, ...profile.specialties].map(normalize);
  const ids: string[] = [];
  for (const cat of SERVICE_CATEGORIES) {
    const label = normalize(cat.en);
    const labelEs = normalize(cat.es);
    const serviceNames = SERVICE_LIBRARY.filter((s) => s.category === cat.id).map((s) => normalize(s.name));
    const hit = haystack.some(
      (h) => h === label || h === labelEs || h === normalize(cat.id) || serviceNames.includes(h)
    );
    if (hit) ids.push(cat.id);
  }
  return ids;
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
  const category = options.category ?? "";
  const results: ProfessionalResult[] = [];

  for (const c of contractors) {
    const catIds = categoryIdsForContractor(c);
    if (category && !catIds.includes(category)) continue;
    const matches = matchesQuery(
      [c.businessName, c.tagline, c.serviceArea, professionTypeLabel(c.professionType, "en"), professionTypeLabel(c.professionType, "es"), ...c.services],
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
    if (!isSouthlineListedAgent(a)) continue;
    const catIds = categoryIdsForAgent(a);
    if (category && !catIds.includes(category)) continue;
    const matches = matchesQuery(
      [a.name, a.displayName, a.brokerageName, a.officeName, a.tagline, a.serviceArea, a.licenseState, ...a.serviceAreas, ...a.specialties, ...a.categories,
        agentProfessionTypeLabel(a.professionType, "en"), agentProfessionTypeLabel(a.professionType, "es")],
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

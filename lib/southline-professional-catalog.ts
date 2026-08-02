// ---------------------------------------------------------------------------
// Southline Living — professional catalog display adapter.
//
// Pure / store-free: callers pass pre-fetched Contractor[] and AgentProfile[]
// plus the operator-curated featured lists (SouthlineSettings
// featuredContractorIds / featuredAgentProfileIds). It normalizes the two
// identity systems into one neutral `SouthlineProfessionalCard` and applies
// the deterministic featured ordering:
//
//   featuredOrder asc → updatedAt desc → displayName asc
//
// Featured order comes from the position of an id inside its curated list
// (array index = featuredOrder). No schema change, no new identity system.
//
// Search + category filtering + publication gates are delegated to
// lib/southline-search.ts so this adapter can never disagree with /results:
//   - contractors are public whenever present in the store;
//   - agents must satisfy isSouthlineListedAgent (status active + southline
//     status published/featured) — suspended/archived/draft stay hidden;
//   - unknown category values filter to nothing (never a guessed fallback).
//
// NOTE on truthfulness: `verified` is intentionally never populated — this app
// does not verify credentials, so the card shape carries the field as an
// explicit `undefined` and UI must never fabricate a badge. Same rule applies
// to reviews, ratings, availability, and licensing claims.
// ---------------------------------------------------------------------------

import type { Lang } from "./southline-i18n.ts";
import type { Contractor } from "./types.ts";
import type { AgentProfile } from "./agent-profiles/types.ts";
import { professionPlaceholderPhotoFor, professionTypeLabel, agentProfessionTypeLabel } from "./profession-types.ts";
import { professionCategoryId } from "./home-service-taxonomy.ts";
import { searchProfessionals, type ProfessionalResult } from "./southline-search.ts";

export type ProfessionalSource = "contractor" | "agent";

export interface SouthlineProfessionalCard {
  source: ProfessionalSource;
  id: string;
  /** SnapLink username (contractor) or Southline slug (agent). */
  slug: string;
  publicUrl: string;
  displayName: string;
  companyName?: string;
  professionType: string;
  /** Localized label (badge) for the profession. */
  professionLabel: string;
  categoryIds: string[];
  primaryCategoryId?: string;
  /** Resolved image — raw photo/logo with a verified placeholder fallback. */
  imageUrl?: string;
  logoUrl?: string;
  summary?: string;
  city?: string;
  state?: string;
  serviceArea: string;
  featured: boolean;
  featuredOrder?: number;
  /** Never fabricated — see module doc note. */
  verified?: boolean;
  languages: string[];
  bookingUrl?: string;
  inquiryUrl?: string;
  updatedAt?: string;
}

export interface SouthlineProfessionalCatalogInput {
  locale: Lang;
  contractors: Contractor[];
  agents: AgentProfile[];
  featuredContractorIds?: string[];
  featuredAgentProfileIds?: string[];
  categoryId?: string;
  /** "contractor" | "professional" | "both" — source-side filter. */
  audience?: "contractor" | "professional" | "both";
  professionType?: string;
  featuredOnly?: boolean;
  limit?: number;
  search?: string;
}

export type ProfessionalDiagnosticStatus = "ready" | "warning" | "hidden" | "unmapped";

export interface ProfessionalCatalogDiagnostic {
  source: ProfessionalSource;
  id: string;
  displayName: string;
  professionType: string;
  status: ProfessionalDiagnosticStatus;
  reason?: string;
}

function featuredRank(list: string[], id: string): number {
  const idx = list.indexOf(id);
  return idx === -1 ? -1 : idx;
}

/** Last-resort display label when a profile has no usable name. Never fabricates identity. */
const FALLBACK_NAME = "Professional";

/** Category-aware fallback summary — factual (profession + area), never invented credentials. */
function fallbackSummary(professionLabel: string, serviceArea: string): string {
  const area = serviceArea.trim();
  if (area) return `${professionLabel} serving the ${area} area.`;
  return `${professionLabel} available through Southline.`;
}

function contractorToCard(
  r: ProfessionalResult,
  c: Contractor,
  featuredContractorIds: string[],
  locale: Lang
): SouthlineProfessionalCard {
  const order = featuredRank(featuredContractorIds, c.id);
  return {
    source: "contractor",
    id: c.id,
    slug: c.username,
    publicUrl: r.href,
    displayName: r.name || FALLBACK_NAME,
    companyName: c.businessName,
    professionType: c.professionType,
    professionLabel: professionTypeLabel(c.professionType, locale),
    categoryIds: r.categories,
    primaryCategoryId: professionCategoryId(c.professionType),
    imageUrl: c.avatarUrl || c.logoUrl || professionPlaceholderPhotoFor(c.id, c.professionType),
    logoUrl: c.logoUrl,
    summary: c.tagline || fallbackSummary(professionTypeLabel(c.professionType, locale), c.serviceArea),
    serviceArea: c.serviceArea,
    featured: order !== -1,
    featuredOrder: order === -1 ? undefined : order,
    languages: c.preferredLanguage ? [c.preferredLanguage] : [],
    bookingUrl: r.href,
    inquiryUrl: r.href,
    updatedAt: c.createdAt,
  };
}

function agentToCard(
  r: ProfessionalResult,
  a: AgentProfile,
  featuredAgentProfileIds: string[],
  locale: Lang
): SouthlineProfessionalCard {
  const order = featuredRank(featuredAgentProfileIds, a.id);
  const summary = a.marketplaceSummary || a.bio || a.tagline;
  return {
    source: "agent",
    id: a.id,
    slug: a.slug,
    publicUrl: r.href,
    displayName: r.name || FALLBACK_NAME,
    companyName: a.brokerageName || undefined,
    professionType: a.professionType,
    professionLabel: agentProfessionTypeLabel(a.professionType, locale),
    categoryIds: r.categories,
    primaryCategoryId: professionCategoryId(a.professionType),
    imageUrl: a.photoUrl || professionPlaceholderPhotoFor(a.id, a.professionType),
    summary: summary || fallbackSummary(agentProfessionTypeLabel(a.professionType, locale), r.serviceArea),
    serviceArea: r.serviceArea,
    featured: order !== -1 || r.featured,
    featuredOrder: order === -1 ? undefined : order,
    languages: a.languages.length > 0 ? a.languages : a.preferredLanguage ? [a.preferredLanguage] : [],
    bookingUrl: r.href,
    inquiryUrl: r.href,
    updatedAt: a.updatedAt,
  };
}

function cardComparator(a: SouthlineProfessionalCard, b: SouthlineProfessionalCard): number {
  const af = a.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  const bf = b.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (af !== bf) return af - bf;
  const au = a.updatedAt ?? "";
  const bu = b.updatedAt ?? "";
  if (au !== bu) return bu.localeCompare(au);
  return a.displayName.localeCompare(b.displayName);
}

/**
 * Normalized catalog of Southline professionals. Filters + search delegate to
 * lib/southline-search.ts (publication gates, bilingual matching, canonical
 * taxonomy category resolution), then the neutral cards are sorted by the
 * curated featured order.
 */
export function listSouthlineProfessionals(input: SouthlineProfessionalCatalogInput): SouthlineProfessionalCard[] {
  const {
    locale,
    contractors,
    agents,
    featuredContractorIds = [],
    featuredAgentProfileIds = [],
    categoryId,
    audience,
    professionType,
    featuredOnly,
    limit,
    search,
  } = input;

  const contractorsById = new Map(contractors.map((c) => [c.id, c]));
  const agentsById = new Map(agents.map((a) => [a.id, a]));
  const matched = searchProfessionals(contractors, agents, { query: search, category: categoryId });

  const cards: SouthlineProfessionalCard[] = [];
  for (const r of matched) {
    if (audience === "contractor" && r.kind !== "contractor") continue;
    if (audience === "professional" && r.kind !== "agent") continue;
    if (professionType && r.professionType !== professionType) continue;
    const card =
      r.kind === "contractor"
        ? contractorToCard(r, contractorsById.get(r.id)!, featuredContractorIds, locale)
        : agentToCard(r, agentsById.get(r.id)!, featuredAgentProfileIds, locale);
    if (featuredOnly && !card.featured) continue;
    cards.push(card);
  }

  cards.sort(cardComparator);
  return limit && limit > 0 ? cards.slice(0, limit) : cards;
}

/**
 * Deterministic featured ordering for raw /results search results (used by the
 * /results page). Featured items surface first in curated order; the `featured`
 * badge flag is derived from the CMS lists (agent southlineStatus "featured" is
 * preserved as a legacy override). Non-featured items keep search order.
 */
export function orderProfessionalResults(
  results: ProfessionalResult[],
  featuredContractorIds: string[],
  featuredAgentProfileIds: string[]
): ProfessionalResult[] {
  const rankOf = (r: ProfessionalResult): number => {
    const list = r.kind === "contractor" ? featuredContractorIds : featuredAgentProfileIds;
    return featuredRank(list, r.id);
  };
  const sorted = [...results];
  sorted.forEach((r) => {
    const order = rankOf(r);
    if (order !== -1) r.featured = true;
  });
  sorted.sort((a, b) => {
    const ra = rankOf(a);
    const rb = rankOf(b);
    const fa = ra === -1 ? Number.MAX_SAFE_INTEGER : ra;
    const fb = rb === -1 ? Number.MAX_SAFE_INTEGER : rb;
    if (fa !== fb) return fa - fb;
    return a.name.localeCompare(b.name);
  });
  return sorted;
}

/**
 * Catalog diagnostics for the operator control panel. Reports every profile's
 * curation status: ready / warning (visible but incomplete card) / hidden
 * (not publicly discoverable) / unmapped (no canonical category).
 */
export function catalogDiagnostics(
  contractors: Contractor[],
  agents: AgentProfile[]
): ProfessionalCatalogDiagnostic[] {
  const out: ProfessionalCatalogDiagnostic[] = [];

  for (const c of contractors) {
    const primary = professionCategoryId(c.professionType);
    const warning = !c.avatarUrl && !c.logoUrl && !c.tagline ? "missing image and tagline" : !c.avatarUrl && !c.logoUrl ? "missing image" : !c.tagline ? "missing tagline" : undefined;
    out.push({
      source: "contractor",
      id: c.id,
      displayName: c.businessName,
      professionType: c.professionType,
      status: primary ? "ready" : "unmapped",
      reason: primary ? warning : "profession type maps to no canonical category",
    });
  }

  for (const a of agents) {
    const listed = a.status === "active" && (a.southlineStatus === "published" || a.southlineStatus === "featured");
    if (!listed) {
      const reason =
        a.status !== "active"
          ? `status is "${a.status}"`
          : `southline status is "${a.southlineStatus}"`;
      out.push({
        source: "agent",
        id: a.id,
        displayName: a.displayName || a.name,
        professionType: a.professionType,
        status: "hidden",
        reason,
      });
      continue;
    }
    const primary = professionCategoryId(a.professionType);
    const warning = !a.photoUrl && !a.bio && !a.tagline ? "missing photo and summary" : !a.photoUrl ? "missing photo" : !a.marketplaceSummary && !a.bio ? "missing summary" : undefined;
    out.push({
      source: "agent",
      id: a.id,
      displayName: a.displayName || a.name,
      professionType: a.professionType,
      status: primary ? "ready" : "unmapped",
      reason: primary ? warning : "profession type maps to no canonical category",
    });
  }

  return out;
}

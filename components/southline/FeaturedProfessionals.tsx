import { t, type Lang } from "@/lib/southline-i18n";
import { serviceLabel } from "@/lib/services";
import {
  professionPlaceholderPhotoFor,
  professionPlaceholderPhotos,
  professionTypeLabel,
  agentProfessionTypeLabel,
} from "@/lib/profession-types";
import { filterProfessionalsByTaxonomy, type ProfessionalTaxonomyFilter } from "@/lib/home-service-taxonomy";
import { isSouthlineListedAgent } from "@/lib/southline-search";
import type { Contractor } from "@/lib/types";
import type { AgentProfile } from "@/lib/agent-profiles/types";

// Assigns each contractor a photo from its profession's variant pool, preferring a
// stable per-contractor pick but bumping to the next unused variant within this
// render whenever two contractors of the same profession would otherwise collide —
// distinct companies should never look duplicated by sharing a placeholder photo.
function assignCardPhotos(contractors: Contractor[]): Map<string, string> {
  const used = new Set<string>();
  const assignments = new Map<string, string>();
  for (const c of contractors) {
    const variants = professionPlaceholderPhotos(c.professionType);
    const preferred = professionPlaceholderPhotoFor(c.id, c.professionType);
    let photo = preferred;
    if (used.has(photo)) {
      const alternate = variants.find((v) => !used.has(v));
      if (alternate) photo = alternate;
    }
    used.add(photo);
    assignments.set(c.id, photo);
  }
  return assignments;
}

// Curated featured order: array position in the CMS featured list is the
// featured order. Falls back to the input order when no list is configured.
// Duplicate ids in the featured list (should never happen post-validation,
// but the render layer stays defensive) are skipped after their first match
// so the same professional can never render twice.
function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  if (!ids || ids.length === 0) return items;
  const byId = new Map(items.map((i) => [i.id, i]));
  const seen = new Set<string>();
  const ordered: T[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      seen.add(id);
    }
  }
  for (const item of items) if (!ordered.includes(item)) ordered.push(item);
  return ordered;
}

export default function FeaturedProfessionals({
  contractors,
  lang,
  filter,
  agents = [],
  featuredContractorIds = [],
  featuredAgentProfileIds = [],
}: {
  contractors: Contractor[];
  lang: Lang;
  filter?: ProfessionalTaxonomyFilter;
  agents?: AgentProfile[];
  featuredContractorIds?: string[];
  featuredAgentProfileIds?: string[];
}) {
  // Taxonomy display filter (featured / category / audience / profession).
  // No filter → default behavior (show all professionals passed in).
  const visibleContractors = filterProfessionalsByTaxonomy(contractors, filter);
  const visibleAgents = filterProfessionalsByTaxonomy(agents, filter).filter(isSouthlineListedAgent);
  const orderedContractors = orderByIds(visibleContractors, featuredContractorIds);
  const orderedAgents = orderByIds(visibleAgents, featuredAgentProfileIds);
  if (!orderedContractors.length && !orderedAgents.length) return null;
  const cardPhotos = assignCardPhotos(orderedContractors);

  return (
    <section id="professionals" className="bg-sage/15 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            {t("featuredTitle", lang)}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight mb-3">
            {t("featuredSubtitle", lang)}
          </h2>
          <p className="text-sm text-walnut/75">{t("trustedProfessionalsNetwork", lang)}</p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {orderedContractors.map((c) => (
            <div
              key={`ctr-${c.id}`}
              className="bg-cream rounded-2xl border border-walnut/15 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Visual branding: professional-category photography (no logo/headshot/
                  storefront/portfolio fields exist yet — this is the sanctioned fallback,
                  never a blank box). */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={cardPhotos.get(c.id)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-cream">
                  {professionTypeLabel(c.professionType, lang)}
                </span>
              </div>
              {/* Card header */}
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl text-obsidian truncate">
                      {c.businessName}
                    </h3>
                    {c.tagline && (
                      <p className="text-sm text-clay mt-1 line-clamp-2">{c.tagline}</p>
                    )}
                  </div>
                  {featuredContractorIds.includes(c.id) && (
                    <span className="text-xs bg-gold/10 text-gold font-medium px-2.5 py-1 rounded-full shrink-0 ml-2">
                      {t("featured", lang)}
                    </span>
                  )}
                </div>

                {/* Service area */}
                <div className="flex items-center gap-1.5 text-xs text-clay mb-3">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{c.serviceArea}</span>
                </div>

                {/* Services */}
                {c.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.services.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-sand/30 text-clay px-2 py-1 rounded-md"
                      >
                        {serviceLabel(s, lang)}
                      </span>
                    ))}
                    {c.services.length > 4 && (
                      <span className="text-xs text-clay/60 px-1 py-1">
                        +{c.services.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Language indicator */}
                {c.preferredLanguage === "es" && (
                  <p className="text-xs text-sage font-medium mb-3">
                    {t("hablamosEspanol", lang)}
                  </p>
                )}
              </div>

              {/* Card actions */}
              <div className="border-t border-sand/30 p-4 sm:p-5 flex gap-2">
                <a
                  href={`/contractor/${c.username}`}
                  className="flex-1 text-sm font-medium text-center text-clay border border-sand/60 rounded-xl py-2 hover:bg-sand/20 transition-colors"
                >
                  {t("viewProfile", lang)}
                </a>
                <a
                  href={`/contractor/${c.username}`}
                  className="flex-1 text-sm font-medium text-center text-cream bg-obsidian rounded-xl py-2 hover:bg-obsidian/90 transition-colors"
                >
                  {t("requestQuote", lang)}
                </a>
              </div>
            </div>
          ))}

          {orderedAgents.map((a) => (
            <div
              key={`agt-${a.id}`}
              className="bg-cream rounded-2xl border border-walnut/15 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={a.photoUrl || professionPlaceholderPhotoFor(a.id, a.professionType)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-cream">
                  {agentProfessionTypeLabel(a.professionType, lang)}
                </span>
                {(featuredAgentProfileIds.includes(a.id) || a.southlineStatus === "featured") && (
                  <span className="absolute right-3 top-3 text-xs bg-gold/10 text-gold font-medium px-2.5 py-1 rounded-full bg-cream/90">
                    {t("featured", lang)}
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex-1 min-w-0 mb-3">
                  <h3 className="font-display text-xl text-obsidian truncate">
                    {a.displayName || a.name}
                  </h3>
                  {(a.marketplaceSummary || a.bio || a.tagline) && (
                    <p className="text-sm text-clay mt-1 line-clamp-2">
                      {a.marketplaceSummary || a.bio || a.tagline}
                    </p>
                  )}
                </div>

                {(a.serviceArea || a.serviceAreas.length > 0) && (
                  <div className="flex items-center gap-1.5 text-xs text-clay mb-3">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{a.serviceArea || a.serviceAreas.join(", ")}</span>
                  </div>
                )}

                {a.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {a.specialties.slice(0, 4).map((s) => (
                      <span key={s} className="text-xs bg-sand/30 text-clay px-2 py-1 rounded-md">
                        {serviceLabel(s, lang)}
                      </span>
                    ))}
                    {a.specialties.length > 4 && (
                      <span className="text-xs text-clay/60 px-1 py-1">+{a.specialties.length - 4}</span>
                    )}
                  </div>
                )}

                {a.preferredLanguage === "es" && (
                  <p className="text-xs text-sage font-medium mb-3">{t("hablamosEspanol", lang)}</p>
                )}
              </div>

              <div className="border-t border-sand/30 p-4 sm:p-5 flex gap-2">
                <a
                  href={`/agents/${a.slug}`}
                  className="flex-1 text-sm font-medium text-center text-clay border border-sand/60 rounded-xl py-2 hover:bg-sand/20 transition-colors"
                >
                  {t("viewProfile", lang)}
                </a>
                <a
                  href={`/agents/${a.slug}`}
                  className="flex-1 text-sm font-medium text-center text-cream bg-obsidian rounded-xl py-2 hover:bg-obsidian/90 transition-colors"
                >
                  {t("bookingTitle", lang)}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

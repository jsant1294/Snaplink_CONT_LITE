import { t, type Lang } from "@/lib/southline-i18n";
import { serviceLabel, categoryLabel } from "@/lib/services";
import { professionPlaceholderPhotoFor, professionTypeLabel, agentProfessionTypeLabel } from "@/lib/profession-types";
import type { ProfessionalResult } from "@/lib/southline-search";

/**
 * Uniform card for a home-services professional — used on the /results page
 * for BOTH trades (Contractor) and licensed pros (AgentProfile). Normalizes
 * the two identity systems into one card: photo, name, tagline, area,
 * service chips, language badge, and CTA to the canonical public profile.
 */
export default function ProfessionalCard({ pro, lang }: { pro: ProfessionalResult; lang: Lang }) {
  const photo =
    pro.photoUrl ||
    (pro.professionType ? professionPlaceholderPhotoFor(pro.id, pro.professionType) : professionPlaceholderPhotoFor(pro.id, "interior_designer"));
  const badgeLabel =
    pro.kind === "contractor" && pro.professionType
      ? professionTypeLabel(pro.professionType, lang)
      : pro.kind === "agent" && pro.professionType
        ? agentProfessionTypeLabel(pro.professionType, lang)
        : t("licensedProfessional", lang);

  const category = pro.categories[0] ? categoryLabel(pro.categories[0], lang) : null;

  return (
    <article className="bg-cream rounded-2xl border border-walnut/15 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="relative h-48 overflow-hidden sm:h-52">
        <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-cream">
          {badgeLabel}
        </span>
        {pro.featured && (
          <span className="absolute right-3 top-3 text-xs bg-gold/10 text-gold font-medium px-2.5 py-1 rounded-full bg-cream/90">
            {t("featured", lang)}
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-semibold text-obsidian truncate">{pro.name}</h3>
            {category && <p className="text-xs font-medium uppercase tracking-wide text-gold mt-1">{category}</p>}
            {pro.tagline && <p className="text-sm text-clay mt-1 line-clamp-2">{pro.tagline}</p>}
          </div>
        </div>

        {pro.serviceArea && (
          <div className="flex items-center gap-1.5 text-xs text-clay mb-3">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{pro.serviceArea}</span>
          </div>
        )}

        {pro.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {pro.services.slice(0, 4).map((s) => (
              <span key={s} className="text-xs bg-sand/30 text-clay px-2 py-1 rounded-md">
                {serviceLabel(s, lang)}
              </span>
            ))}
            {pro.services.length > 4 && (
              <span className="text-xs text-clay/60 px-1 py-1">+{pro.services.length - 4}</span>
            )}
          </div>
        )}

        {pro.preferredLanguage === "es" && (
          <p className="text-xs text-sage font-medium mb-3">{t("hablamosEspanol", lang)}</p>
        )}
      </div>

      <div className="border-t border-sand/30 p-4 sm:p-5 flex gap-2">
        <a
          href={pro.href}
          className="flex-1 text-sm font-medium text-center text-clay border border-sand/60 rounded-xl py-2.5 min-h-[44px] flex items-center justify-center hover:bg-sand/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {t("viewProfile", lang)}
        </a>
        <a
          href={pro.href}
          className="flex-1 text-sm font-medium text-center text-cream bg-obsidian rounded-xl py-2.5 min-h-[44px] flex items-center justify-center hover:bg-obsidian/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {pro.kind === "contractor" ? t("requestQuote", lang) : t("bookingTitle", lang)}
        </a>
      </div>
    </article>
  );
}

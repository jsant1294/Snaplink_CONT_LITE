import { t, formatDistanceMiles, type Lang } from "@/lib/southline-i18n";
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
    <article className="marketplace-card flex flex-col transition-shadow hover:shadow-md">
      <div className="marketplace-card-media">
        <img src={photo} alt={pro.name} loading="lazy" className={pro.kind === "agent" ? "marketplace-image-portrait" : "marketplace-image-project"} />
        <span className="absolute left-3 top-3 rounded-full bg-accent-dark/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-on-dark">
          {badgeLabel}
        </span>
        {pro.featured && (
          <span className="absolute right-3 top-3 text-xs bg-accent-gold/10 text-accent-gold font-medium px-2.5 py-1 rounded-full bg-page/90">
            {t("featured", lang)}
          </span>
        )}
      </div>

      <div className="marketplace-card-body flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-semibold text-primary truncate">{pro.name}</h3>
            {category && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-eyebrow">{category}</p>}
            {pro.tagline && <p className="text-sm text-text-muted mt-1 line-clamp-2">{pro.tagline}</p>}
          </div>
        </div>

        {pro.serviceArea && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-3">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{pro.serviceArea}</span>
          </div>
        )}

        {pro.distanceMiles != null && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-gold/10 px-2.5 py-1 text-xs font-semibold text-accent-gold">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {t("servesYourArea", lang)} · {formatDistanceMiles(pro.distanceMiles, lang)}
            </span>
          </div>
        )}

        {pro.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {pro.services.slice(0, 4).map((s) => (
              <span key={s} className="marketplace-chip">
                {serviceLabel(s, lang)}
              </span>
            ))}
            {pro.services.length > 4 && (
              <span className="text-xs text-text-muted px-1 py-1">+{pro.services.length - 4}</span>
            )}
          </div>
        )}

        {pro.preferredLanguage === "es" && (
          <p className="text-xs text-secondary font-medium mb-3">{t("hablamosEspanol", lang)}</p>
        )}
      </div>

      <div className="border-t border-border-default p-4 sm:p-5">
        <a
          href={pro.href}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-accent-dark py-2.5 text-center text-sm font-semibold text-on-dark transition-colors hover:bg-accent-dark/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
        >
          {t("viewProfessional", lang)}
        </a>
      </div>
    </article>
  );
}

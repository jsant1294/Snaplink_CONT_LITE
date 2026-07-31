import { t, type Lang } from "@/lib/southline-i18n";
import { serviceLabel } from "@/lib/services";
import { professionPlaceholderPhoto, professionTypeLabel } from "@/lib/profession-types";
import type { Contractor } from "@/lib/types";

export default function FeaturedProfessionals({
  contractors,
  lang,
}: {
  contractors: Contractor[];
  lang: Lang;
}) {
  if (!contractors.length) return null;

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
          <p className="text-sm text-walnut/75">
            {lang === "es"
              ? "Profesionales verificados a través de la red Snaplink"
              : "Professionals verified through the Snaplink network"}
          </p>
        </div>

        {/* Contractor cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {contractors.map((c) => (
            <div
              key={c.id}
              className="bg-cream rounded-2xl border border-walnut/15 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Visual branding: professional-category photography (no logo/headshot/
                  storefront/portfolio fields exist yet — this is the sanctioned fallback,
                  never a blank box). */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={professionPlaceholderPhoto(c.professionType)}
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
                  <span className="text-xs bg-gold/10 text-gold font-medium px-2.5 py-1 rounded-full shrink-0 ml-2">
                    {t("featured", lang)}
                  </span>
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
        </div>
      </div>
    </section>
  );
}

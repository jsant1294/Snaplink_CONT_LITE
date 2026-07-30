import { t, type Lang } from "@/lib/southline-i18n";

const TRENDING_ITEMS = [
  {
    titleKey: "seasonalTitle" as const,
    items: [
      { es: "Prepara tu hogar para el verano", en: "Prepare your home for summer" },
      { es: "Proyectos de jardín para primavera", en: "Spring garden projects" },
      { es: "Mantenimiento de temporada", en: "Seasonal maintenance guide" },
    ],
  },
  {
    titleKey: "budgetTitle" as const,
    items: [
      { es: "Cocina renovada por menos de $5,000", en: "Kitchen refresh under $5,000" },
      { es: "Pintura interior: el cambio más económico", en: "Interior paint: the most affordable change" },
      { es: "5 mejoras que aumentan el valor de tu hogar", en: "5 upgrades that boost home value" },
    ],
  },
  {
    titleKey: "beforeAfterTitle" as const,
    items: [
      { es: "Transformación de patio trasero", en: "Backyard transformation" },
      { es: "De baño antiguo a spa moderno", en: "From outdated bath to modern spa" },
      { es: "Sótano terminado: antes y después", en: "Finished basement: before & after" },
    ],
  },
];

export default function TrendingSection({ lang }: { lang: Lang }) {
  return (
    <section className="bg-paper py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            {t("trendingTitle", lang)}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight">
            {t("trendingSubtitle", lang)}
          </h2>
        </div>

        {/* Trending columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {TRENDING_ITEMS.map((column) => (
            <div key={column.titleKey}>
              <h3 className="font-display text-lg text-obsidian mb-4 border-l-2 border-gold pl-3">
                {t(column.titleKey, lang)}
              </h3>
              <ul className="space-y-3">
                {column.items.map((item, i) => (
                  <li key={i}>
                    <button className="w-full text-left p-3 rounded-xl bg-ivory border border-walnut/15 hover:border-olive/40 hover:shadow-sm transition-all text-sm text-walnut hover:text-obsidian">
                      {lang === "es" ? item.es : item.en}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

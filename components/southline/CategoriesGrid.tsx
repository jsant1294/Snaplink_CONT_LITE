import { t, type Lang } from "@/lib/southline-i18n";
import Link from "next/link";
import type { SouthlineCategory } from "@/lib/southline-types";
import { DEFAULT_CATEGORIES } from "@/lib/southline-types";

export default function CategoriesGrid({
  lang,
  categories,
}: {
  lang: Lang;
  categories?: SouthlineCategory[];
}) {
  const visible = (categories ?? DEFAULT_CATEGORIES)
    .filter((category) => category.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section id="categories" className="bg-ivory py-14 sm:py-20">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            {t("inspirationTitle", lang)}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight">
            {t("inspirationSubtitle", lang)}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
          {visible.map((category) => {
            const title = lang === "es" ? category.titleEs : category.titleEn;
            const subtitle = lang === "es" ? category.descriptionEs : category.descriptionEn;
            const cta = lang === "es" ? category.ctaEs : category.ctaEn;

            return (
              <Link
                key={category.id}
                href={category.linkUrl}
                aria-label={`${cta ?? title}: ${title}`}
                className="group relative isolate h-[230px] sm:h-[250px] overflow-hidden rounded-[18px] border border-cream/10 bg-snaplink-charcoal shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-[transform,box-shadow] duration-[225ms] ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(37,35,31,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-snaplink-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
              >
                <img
                  src={category.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[225ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/70 transition-opacity duration-[225ms] ease-out group-hover:opacity-90" />

                {category.featured === true && (
                  <span className="absolute right-3 top-3 h-1.5 w-8 rounded-full bg-snaplink-gold/80" />
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 transition-transform duration-[225ms] ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                  <h3 className="font-display text-xl sm:text-2xl font-semibold leading-none text-snaplink-cream">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[11px] sm:text-xs leading-snug text-snaplink-cream/75">
                    {subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

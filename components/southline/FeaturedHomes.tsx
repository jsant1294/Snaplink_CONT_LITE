import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { formatPropertyPrice } from "@/lib/real-estate/fixtures";
import type { Property } from "@/lib/real-estate/types";

export default function FeaturedHomes({ lang, properties }: { lang: Lang; properties: Property[] }) {
  if (!properties.length) return null;
  const featured = properties[0];
  const supporting = properties.slice(1, 3);

  return (
    <section className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="southline-section-header flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="southline-section-eyebrow">{t("featuredHomesEyebrow", lang)}</p>
            <h2 className="southline-section-title">{t("featuredHomesTitle", lang)}</h2>
            <p className="southline-section-description max-w-lg">{t("featuredHomesSubtitle", lang)}</p>
          </div>
          <Link href="/homes" className="southline-btn-outline whitespace-nowrap">{t("viewAllHomes", lang)}</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
          <Link href={`/homes/${featured.slug}`} className="marketplace-card group relative min-h-[430px] overflow-hidden sm:min-h-[520px]">
            {featured.imageUrls[0] ? <img src={featured.imageUrls[0]} alt={featured.title} loading="lazy" className="marketplace-image-project absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : <div className="absolute inset-0 bg-surface-soft" />}
            <div className="absolute inset-0 bg-gradient-to-t from-image-overlay/95 via-image-overlay/30 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-accent-dark/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-dark">{lang === "es" ? "Casa destacada" : "Featured home"}</span>
            <div className="absolute inset-x-0 bottom-0 p-6 text-on-dark sm:p-8">
              <p className="text-xl font-semibold sm:text-2xl">{formatPropertyPrice(featured.price)}</p>
              <h3 className="mt-1 font-display text-2xl leading-tight sm:text-3xl">{featured.title}</h3>
              <p className="mt-2 text-sm text-on-dark/85">{featured.city}, {featured.state} · {featured.bedrooms} bd · {featured.bathrooms} ba · {featured.squareFeet.toLocaleString()} sq ft</p>
              <span className="mt-5 inline-flex rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-semibold text-primary">{t("viewHome", lang)}</span>
            </div>
          </Link>

          <div className="flex flex-col gap-4">
            {supporting.map((property) => (
              <Link key={property.id} href={`/homes/${property.slug}`} className="marketplace-card group grid min-h-[190px] flex-1 grid-cols-[140px_1fr] overflow-hidden sm:grid-cols-[180px_1fr]">
                <div className="relative overflow-hidden bg-surface-soft">{property.imageUrls[0] && <img src={property.imageUrls[0]} alt={property.title} loading="lazy" className="marketplace-image-project transition-transform duration-300 group-hover:scale-[1.03]" />}</div>
                <div className="flex flex-col justify-center p-5"><p className="font-semibold text-primary">{formatPropertyPrice(property.price)}</p><h3 className="mt-1 font-display text-lg leading-tight text-primary">{property.title}</h3><p className="mt-2 text-xs text-secondary">{property.city}, {property.state}</p><span className="mt-3 text-sm font-semibold text-secondary">{t("viewHome", lang)} →</span></div>
              </Link>
            ))}
            {supporting.length < 2 && (
              <article className="marketplace-card grid min-h-[190px] flex-1 grid-cols-[140px_1fr] overflow-hidden sm:grid-cols-[180px_1fr]">
                <div className="relative flex items-center justify-center border-r border-default bg-surface-soft" aria-hidden="true">
                  <div className="flex h-16 w-20 items-end justify-center border border-accent-gold/45 bg-surface">
                    <div className="mb-0 h-9 w-7 border-x border-t border-accent-gold/55 bg-page" />
                  </div>
                </div>
                <div className="flex flex-col justify-center p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-eyebrow">
                    {lang === "es" ? "Próximamente" : "Coming soon"}
                  </p>
                  <h3 className="mt-2 font-display text-lg leading-tight text-primary">
                    {lang === "es" ? "Más casas destacadas" : "More featured homes"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    {lang === "es" ? "Nuevas propiedades locales se publicarán aquí." : "New local properties will be published here."}
                  </p>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

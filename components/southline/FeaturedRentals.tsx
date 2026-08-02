import Link from "next/link";
import type { Property } from "@/lib/real-estate/types";
import type { FeaturedRentalsContent } from "@/lib/southline-types";
import type { Lang } from "@/lib/southline-i18n";

export default function FeaturedRentals({
  lang,
  properties,
  content,
}: {
  lang: Lang;
  properties: Property[];
  content: FeaturedRentalsContent;
}) {
  const eyebrow = lang === "es" ? content.eyebrowEs : content.eyebrowEn;
  const headline = lang === "es" ? content.headlineEs : content.headlineEn;
  const description = lang === "es" ? content.descriptionEs : content.descriptionEn;
  const cta = lang === "es" ? content.ctaEs : content.ctaEn;

  return (
    <section aria-labelledby="featured-rentals-title" className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="southline-section-header flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="southline-section-eyebrow">{eyebrow}</p>
            <h2 id="featured-rentals-title" className="southline-section-title">{headline}</h2>
            <p className="southline-section-description">{description}</p>
          </div>
          <Link href="/rentals" className="southline-btn-outline whitespace-nowrap">{cta}</Link>
        </div>

        {properties.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {properties.map((property) => (
              <Link key={property.id} href={`/homes/${property.slug}`} className="marketplace-card group flex flex-col transition-shadow hover:shadow-md">
                <div className="marketplace-card-media">
                  {property.imageUrls[0] ? (
                    <img
                      src={property.imageUrls[0]}
                      alt={`${property.title}, ${property.city}`}
                      loading="lazy"
                      className="marketplace-image-project transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface" />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-accent-dark/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-dark">
                    {lang === "es" ? "Alquiler o escapada" : "Rental or getaway"}
                  </span>
                </div>
                <div className="marketplace-card-body flex flex-1 flex-col">
                  <h3 className="marketplace-card-title">{property.title}</h3>
                  <p className="mt-1 text-sm font-medium text-secondary">{property.city}, {property.state}</p>
                  <p className="marketplace-card-copy line-clamp-2">{property.shortDescription}</p>
                  <span className="mt-5 inline-flex text-sm font-semibold text-secondary group-hover:text-primary">
                    {lang === "es" ? "Ver propiedad" : "View property"} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-default bg-surface-raised p-8 text-center shadow-sm">
            <h3 className="font-display text-2xl text-primary">
              {lang === "es" ? "Nuevas estancias próximamente" : "New stays coming soon"}
            </h3>
            <p className="mt-2 text-sm text-secondary">
              {lang === "es" ? "Vuelve pronto para explorar alquileres y escapadas locales." : "Check back soon to explore local rentals and getaways."}
            </p>
            <Link href="/rentals" className="southline-btn-outline mt-5">{cta}</Link>
          </div>
        )}
      </div>
    </section>
  );
}

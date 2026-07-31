import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { formatPropertyPrice } from "@/lib/real-estate/fixtures";
import type { Property } from "@/lib/real-estate/types";

export default function FeaturedHomes({ lang, properties }: { lang: Lang; properties: Property[] }) {
  if (!properties.length) return null;

  return (
    <section className="bg-sand/20 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{t("featuredHomesEyebrow", lang)}</p>
            <h2 className="font-display text-3xl leading-tight text-obsidian sm:text-4xl">{t("featuredHomesTitle", lang)}</h2>
            <p className="mt-2 max-w-lg text-sm text-clay">{t("featuredHomesSubtitle", lang)}</p>
          </div>
          <Link href="/homes" className="whitespace-nowrap rounded-xl border border-walnut/25 px-5 py-2.5 text-sm font-medium text-walnut transition-colors hover:bg-walnut/5">
            {t("viewAllHomes", lang)}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/homes/${property.slug}`}
              className="group overflow-hidden rounded-2xl border border-walnut/15 bg-cream shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-52 overflow-hidden">
                {property.imageUrls[0] ? (
                  <img
                    src={property.imageUrls[0]}
                    alt={property.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full w-full bg-sand" />
                )}
              </div>
              <div className="p-5">
                <p className="text-lg font-semibold text-obsidian">{formatPropertyPrice(property.price)}</p>
                <h3 className="mt-1 font-display text-xl text-obsidian">{property.title}</h3>
                <p className="mt-1 text-sm text-clay">
                  {property.city}, {property.state} · {property.bedrooms} bd · {property.bathrooms} ba · {property.squareFeet.toLocaleString()} sq ft
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

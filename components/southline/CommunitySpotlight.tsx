import { t, type Lang } from "@/lib/southline-i18n";
import type { SpotlightItem } from "@/lib/southline-types";
import Link from "next/link";

export default function CommunitySpotlight({
  lang,
  items,
}: {
  lang: Lang;
  items: SpotlightItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="bg-page py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="southline-section-header text-center">
          <p className="southline-section-eyebrow">
            {lang === "es" ? "Comunidad" : "Community"}
          </p>
          <h2 className="southline-section-title">
            {lang === "es" ? "Proyectos destacados" : "Featured Projects"}
          </h2>
          <p className="southline-section-description mx-auto max-w-lg">
            {lang === "es"
              ? "Inspírate con proyectos reales de la comunidad Southline."
              : "Get inspired by real projects from the Southline community."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const title = lang === "es" ? item.titleEs : item.titleEn;
            const desc = lang === "es" ? item.descEs : item.descEn;
            const category = lang === "es" ? item.categoryEs : item.categoryEn;

            return (
              <Link
                key={item.id}
                href={item.linkUrl}
                className="marketplace-card group hover:shadow-lg hover:-translate-y-0.5 transition-all motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="marketplace-card-media flex items-center justify-center text-3xl">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={title} className="marketplace-image-project" />
                  ) : (
                    <span className="opacity-30">🏠</span>
                  )}
                </div>
                <div className="marketplace-card-body">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-accent-gold">
                    {category}
                  </span>
                  <h3 className="marketplace-card-title mt-1 group-hover:text-accent-gold transition-colors">
                    {title}
                  </h3>
                  {desc && <p className="marketplace-card-copy mt-1 line-clamp-2">{desc}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

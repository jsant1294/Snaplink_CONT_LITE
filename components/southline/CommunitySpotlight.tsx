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
    <section className="bg-sand/20 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            {lang === "es" ? "Comunidad" : "Community"}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight">
            {lang === "es" ? "Proyectos destacados" : "Featured Projects"}
          </h2>
          <p className="text-clay mt-2 max-w-lg mx-auto">
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
                className="group bg-paper rounded-2xl border border-sand/40 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[16/9] bg-sand/30 flex items-center justify-center text-3xl">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-30">🏠</span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gold">
                    {category}
                  </span>
                  <h3 className="font-display text-base text-obsidian mt-1 group-hover:text-gold transition-colors">
                    {title}
                  </h3>
                  {desc && <p className="text-xs text-clay mt-1 line-clamp-2">{desc}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

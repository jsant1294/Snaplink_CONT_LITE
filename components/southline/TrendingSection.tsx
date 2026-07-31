import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import type { TrendingProjectItem } from "@/lib/southline-types";

const TRENDING_CARDS = [
  {
    titleKey: "seasonalTitle" as const,
    descKey: "seasonalCardDesc" as const,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
    href: "/diy",
  },
  {
    titleKey: "budgetTitle" as const,
    descKey: "budgetCardDesc" as const,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85",
    href: "/diy",
  },
  {
    titleKey: "beforeAfterTitle" as const,
    descKey: "beforeAfterCardDesc" as const,
    image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900&q=85",
    href: "/diy",
  },
];

export default function TrendingSection({
  lang,
  items,
}: {
  lang: Lang;
  items?: TrendingProjectItem[];
}) {
  const cmsCards = items
    ? [...items].filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder)
    : null;
  const cards = cmsCards ?? TRENDING_CARDS;

  return (
    <section className="bg-paper py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">
            {t("trendingTitle", lang)}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-obsidian leading-tight">
            {t("trendingSubtitle", lang)}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {cards.map((card) => {
            const title = "titleKey" in card
              ? t(card.titleKey, lang)
              : lang === "es" ? card.titleEs : card.titleEn;
            const desc = "titleKey" in card
              ? t(card.descKey, lang)
              : (lang === "es" ? card.descriptionEs : card.descriptionEn) ?? "";

            return (
              <Link
                key={"titleKey" in card ? card.titleKey : card.id}
                href={"titleKey" in card ? card.href : card.linkUrl}
                className="group overflow-hidden rounded-2xl border border-walnut/15 bg-cream shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={"titleKey" in card ? card.image : card.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg text-obsidian">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-clay">{desc}</p>
                  <span className="mt-4 inline-flex text-sm font-medium text-olive group-hover:text-obsidian transition-colors">
                    {t("viewProjects", lang)} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

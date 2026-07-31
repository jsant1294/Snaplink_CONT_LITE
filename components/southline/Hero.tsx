import { t, type Lang } from "@/lib/southline-i18n";
import type { CmsImage, HeroContent } from "@/lib/southline-types";
import Link from "next/link";
import StartPlanningWithLucioButton from "@/components/lucio/StartPlanningWithLucioButton";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80";

export default function Hero({
  lang,
  hero,
  heroImage,
}: {
  lang: Lang;
  hero: HeroContent | null;
  heroImage?: CmsImage | null;
}) {
  const title = hero
    ? lang === "es" ? hero.titleEs : hero.titleEn
    : t("heroTitle", lang);
  const subtitle = hero
    ? lang === "es" ? hero.subtitleEs : hero.subtitleEn
    : t("heroSubtitle", lang);
  const searchPrompt = hero
    ? lang === "es" ? hero.searchPromptEs : hero.searchPromptEn
    : t("heroSearchPrompt", lang);
  const exploreLabel = hero
    ? lang === "es" ? hero.ctaExploreEs : hero.ctaExploreEn
    : t("heroExplore", lang);
  const planLabel = hero
    ? lang === "es" ? hero.ctaPlanEs : hero.ctaPlanEn
    : t("heroPlan", lang);
  const findProLabel = hero
    ? lang === "es" ? hero.ctaFindProEs : hero.ctaFindProEn
    : t("heroFindPro", lang);
  const tagline = hero?.tagline ?? "Southline Living";
  const heroMobile = heroImage?.mobileUrl ?? heroImage?.desktopUrl ?? HERO_IMAGE;
  const heroDesktop = heroImage?.desktopUrl ?? heroImage?.mobileUrl ?? HERO_IMAGE;
  const heroAlt = lang === "es" ? heroImage?.altEs : heroImage?.altEn;

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroDesktop}
          alt={heroAlt ?? ""}
          className="hidden w-full h-full object-cover md:block"
          fetchPriority="high"
        />
        <img
          src={heroMobile}
          alt={heroAlt ?? ""}
          className="w-full h-full object-cover md:hidden"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a241e]/90 via-[#3c3229]/60 to-[#4a3d30]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.35em] uppercase text-gold mb-4 font-medium">
              {tagline}
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl text-cream leading-tight tracking-tight mb-6">
              {title}
            </h1>

            <p className="text-lg sm:text-xl text-bone/80 max-w-xl mb-8 leading-relaxed">
              {subtitle}
            </p>

            <div className="max-w-lg mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchPrompt}
                  className="w-full bg-[#3c3229]/30 backdrop-blur-sm border border-cream/20 rounded-2xl px-5 py-4 pl-12 text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 text-base shadow-lg"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bone/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <Link
                href="#categories"
                className="w-full sm:w-auto bg-gold text-obsidian font-semibold px-8 py-3.5 rounded-xl text-center hover:bg-goldlight transition-colors shadow-lg"
              >
                {exploreLabel}
              </Link>
              <Link
                href="/planner"
                className="w-full sm:w-auto bg-cream/10 backdrop-blur-sm border border-cream/20 text-cream font-medium px-8 py-3.5 rounded-xl text-center hover:bg-cream/20 transition-colors"
              >
                {planLabel}
              </Link>
              <Link
                href="/book"
                className="w-full sm:w-auto border-2 border-gold/50 text-gold font-medium px-8 py-3.5 rounded-xl text-center hover:bg-gold hover:text-[#2a241e] transition-colors"
              >
                {findProLabel}
              </Link>
              <StartPlanningWithLucioButton lang={lang} />
            </div>

            <Link
              href="/homes"
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-cream/70 underline decoration-cream/30 underline-offset-4 hover:text-gold hover:decoration-gold transition-colors"
            >
              {t("heroRealEstateLink", lang)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

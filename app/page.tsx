import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import { southlineStore } from "@/lib/southline-store";
import type { Lang } from "@/lib/southline-i18n";

import Header from "@/components/southline/Header";
import Hero from "@/components/southline/Hero";
import CategoriesGrid from "@/components/southline/CategoriesGrid";
import TrendingSection from "@/components/southline/TrendingSection";
import Footer from "@/components/southline/Footer";
import FeaturedProfessionals from "@/components/southline/FeaturedProfessionals";
import CommunitySpotlight from "@/components/southline/CommunitySpotlight";
import RealEstateDiscovery from "@/components/southline/RealEstateDiscovery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const [settings, allContractors] = await Promise.all([
    southlineStore.getSettings().catch(() => null),
    contractorStore.list().catch(() => [] as import("@/lib/types").Contractor[]),
  ]);

  const sections = settings?.sections ?? null;
  const hero = settings?.hero ?? null;
  const featuredIds = new Set(settings?.featuredContractorIds ?? []);
  const navItems = settings?.navigation?.items ?? null;
  const featuredContractors = featuredIds.size > 0
    ? allContractors.filter((c) => featuredIds.has(c.id))
    : allContractors;

  return (
    <>
      <Header lang={lang} navItems={navItems} />
      <main>
        {(!sections || sections.hero) && <Hero lang={lang} hero={hero} />}
        {(!sections || sections.categories) && <CategoriesGrid lang={lang} />}
        {(!sections || sections.featuredPros) && (
          <FeaturedProfessionals contractors={featuredContractors} lang={lang} />
        )}
        {(!sections || sections.trending) && <TrendingSection lang={lang} />}
        <RealEstateDiscovery lang={lang} />

        {settings?.spotlight && settings.spotlight.length > 0 && (
          <CommunitySpotlight lang={lang} items={settings.spotlight} />
        )}

        {(!sections || sections.recruitment) && (
          <section className="bg-snaplink-black py-14 sm:py-20 border-y border-snaplink-gold/35">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <p className="text-xs tracking-[0.35em] uppercase text-snaplink-gold font-medium mb-3">
                Snaplink · Connect. Tap. Grow.
              </p>
              <h2 className="font-display text-3xl sm:text-5xl text-snaplink-cream leading-tight mb-4">
                {lang === "es" ? "Crece con Snaplink" : "Grow with Snaplink"}
              </h2>
              <p className="text-base sm:text-lg text-snaplink-cream/75 max-w-2xl mx-auto mb-8 leading-relaxed">
                {lang === "es"
                  ? "Muestra tu trabajo, genera confianza, recibe oportunidades locales y permite que los propietarios soliciten presupuestos o reserven directamente."
                  : "Showcase your work, build trust, receive local opportunities, and let homeowners request quotes or book directly."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/for-contractors"
                  className="w-full sm:w-auto bg-snaplink-gold text-snaplink-black font-semibold px-7 py-3 rounded-xl hover:bg-snaplink-gold-light transition-colors"
                >
                  {lang === "es" ? "Únete a Snaplink" : "Join Snaplink"}
                </a>
                <a
                  href="/for-contractors"
                  className="w-full sm:w-auto border border-snaplink-gold/60 text-snaplink-gold-light font-medium px-7 py-3 rounded-xl hover:bg-snaplink-charcoal transition-colors"
                >
                  {lang === "es" ? "Reclama tu negocio" : "Claim your business"}
                </a>
                <a
                  href="/contractor-admin"
                  className="w-full sm:w-auto border border-snaplink-cream/20 text-snaplink-cream font-medium px-7 py-3 rounded-xl hover:border-snaplink-gold/60 transition-colors"
                >
                  {lang === "es" ? "Acceso contratistas" : "Contractor login"}
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}

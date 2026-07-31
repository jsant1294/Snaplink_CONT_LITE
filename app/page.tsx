import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { southlineStore } from "@/lib/southline-store";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { propertyRepository } from "@/lib/real-estate/repositories";
import type { Property } from "@/lib/real-estate/types";
import type { Lang } from "@/lib/southline-i18n";
import { DEFAULT_REAL_ESTATE_BLOCK } from "@/lib/southline-types";

import Header from "@/components/southline/Header";
import Hero from "@/components/southline/Hero";
import CategoriesGrid from "@/components/southline/CategoriesGrid";
import TrendingSection from "@/components/southline/TrendingSection";
import Footer from "@/components/southline/Footer";
import FeaturedProfessionals from "@/components/southline/FeaturedProfessionals";
import CommunitySpotlight from "@/components/southline/CommunitySpotlight";
import RealEstateEntryBlock from "@/components/southline/RealEstateEntryBlock";

export const dynamic = "force-dynamic";

async function resolveFeaturedProperty(featuredPropertyId: string | null): Promise<Property | null> {
  if (featuredPropertyId) {
    const byId = await propertyRepository.findPropertyById(featuredPropertyId, demoTenant.id).catch(() => null);
    if (byId) return byId;
  }
  const result = await propertyRepository.listPublishedProperties(demoTenant.id, { pageSize: 1 }).catch(() => null);
  return result?.properties[0] ?? null;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const [settings, allContractors, activeAgentProfiles] = await Promise.all([
    southlineStore.getSettings().catch(() => null),
    contractorStore.list().catch(() => [] as import("@/lib/types").Contractor[]),
    agentProfileStore.listActive().catch(() => [] as import("@/lib/agent-profiles/types").AgentProfile[]),
  ]);

  const sections = settings?.sections ?? null;
  const hero = settings?.hero ?? null;
  const featuredIds = new Set(settings?.featuredContractorIds ?? []);
  const navItems = settings?.navigation?.items ?? null;
  const featuredContractors = featuredIds.size > 0
    ? allContractors.filter((c) => featuredIds.has(c.id))
    : allContractors;
  const featuredAgentIds = new Set(settings?.featuredAgentProfileIds ?? []);
  const featuredAgents = (featuredAgentIds.size > 0
    ? activeAgentProfiles.filter((a) => featuredAgentIds.has(a.id))
    : activeAgentProfiles
  ).map(publicAgentProfile);
  const realEstateContent = settings?.realEstateBlock ?? DEFAULT_REAL_ESTATE_BLOCK;
  // featuredAgents predates this block (it gated the old grid-style section) and
  // now gates this combined entry block instead — same "show real estate on the
  // homepage" toggle, still defaults visible so existing settings aren't silently hidden.
  const showRealEstateBlock = !sections || sections.featuredAgents !== false;
  const featuredProperty = showRealEstateBlock
    ? await resolveFeaturedProperty(realEstateContent.featuredPropertyId)
    : null;

  return (
    <>
      <Header lang={lang} navItems={navItems} />
      <main>
        {(!sections || sections.hero) && <Hero lang={lang} hero={hero} />}
        {(!sections || sections.categories) && <CategoriesGrid lang={lang} />}
        {(!sections || sections.featuredPros) && (
          <FeaturedProfessionals contractors={featuredContractors} lang={lang} />
        )}
        {showRealEstateBlock && (
          <RealEstateEntryBlock lang={lang} property={featuredProperty} agents={featuredAgents} content={realEstateContent} />
        )}
        {(!sections || sections.trending) && <TrendingSection lang={lang} />}

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

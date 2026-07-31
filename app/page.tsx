import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { southlineStore } from "@/lib/southline-store";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { propertyRepository } from "@/lib/real-estate/repositories";
import { listProjects } from "@/lib/southline-diy";
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
import FeaturedHomes from "@/components/southline/FeaturedHomes";
import DIYLearningTeaser from "@/components/southline/DIYLearningTeaser";
import SeasonalIdeasBanner from "@/components/southline/SeasonalIdeasBanner";
import CostEstimatorTeaser from "@/components/southline/CostEstimatorTeaser";
import BookConsultationTeaser from "@/components/southline/BookConsultationTeaser";
import BecomeAProfessionalSection from "@/components/southline/BecomeAProfessionalSection";

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

  const [settings, allContractors, activeAgentProfiles, diyProjects] = await Promise.all([
    southlineStore.getSettings().catch(() => null),
    contractorStore.list().catch(() => [] as import("@/lib/types").Contractor[]),
    agentProfileStore.listActive().catch(() => [] as import("@/lib/agent-profiles/types").AgentProfile[]),
    listProjects().catch(() => [] as import("@/lib/southline-diy").DIYProject[]),
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

  const showFeaturedHomes = !sections || sections.featuredHomes !== false;
  const featuredHomesResult = showFeaturedHomes
    ? await propertyRepository.listPublishedProperties(demoTenant.id, { pageSize: 4 }).catch(() => null)
    : null;
  const featuredHomes = (featuredHomesResult?.properties ?? [])
    .filter((p) => p.id !== featuredProperty?.id)
    .slice(0, 3);

  const diyTeaserProjects = diyProjects.slice(0, 3);

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
        {showFeaturedHomes && <FeaturedHomes lang={lang} properties={featuredHomes} />}
        {(!sections || sections.diyLearning) && <DIYLearningTeaser lang={lang} projects={diyTeaserProjects} />}
        {(!sections || sections.trending) && <TrendingSection lang={lang} />}

        {settings?.spotlight && settings.spotlight.length > 0 && (
          <CommunitySpotlight lang={lang} items={settings.spotlight} />
        )}

        {(!sections || sections.seasonalIdeas) && <SeasonalIdeasBanner lang={lang} />}
        {(!sections || sections.costEstimator) && <CostEstimatorTeaser lang={lang} />}
        {(!sections || sections.bookConsultation) && <BookConsultationTeaser lang={lang} />}
        {(!sections || sections.recruitment) && <BecomeAProfessionalSection lang={lang} />}
      </main>
      <Footer lang={lang} />
    </>
  );
}

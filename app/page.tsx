import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { southlineStore } from "@/lib/southline-store";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { listPublishedPropertiesWithFallback, resolveFeaturedPropertyWithFallback } from "@/lib/real-estate/homes-fallback";
import { listProjects } from "@/lib/southline-diy";
import type { Lang } from "@/lib/southline-i18n";
import { DEFAULT_REAL_ESTATE_BLOCK } from "@/lib/southline-types";

import Header from "@/components/southline/Header";
import Hero from "@/components/southline/Hero";
import LocalDiscovery from "@/components/southline/LocalDiscovery";
import SnapLinkLocalPromo from "@/components/southline/SnapLinkLocalPromo";
import CategoriesGrid from "@/components/southline/CategoriesGrid";
import TrendingSection from "@/components/southline/TrendingSection";
import Footer from "@/components/southline/Footer";
import FeaturedProfessionals from "@/components/southline/FeaturedProfessionals";
import CommunitySpotlight from "@/components/southline/CommunitySpotlight";
import RealEstateEntryBlock from "@/components/southline/RealEstateEntryBlock";
import FeaturedHomes from "@/components/southline/FeaturedHomes";
import FeaturedServicesEntryBlock from "@/components/southline/FeaturedServicesEntryBlock";
import PoweredBySnapLink from "@/components/southline/PoweredBySnapLink";
import DIYLearningTeaser from "@/components/southline/DIYLearningTeaser";
import SeasonalIdeasBanner from "@/components/southline/SeasonalIdeasBanner";
import TestimonialsSection from "@/components/southline/TestimonialsSection";
import EstimatorBookingSection from "@/components/southline/EstimatorBookingSection";
import BecomeAProfessionalSection from "@/components/southline/BecomeAProfessionalSection";
import LucioMount from "@/components/lucio/LucioMount";

export const dynamic = "force-dynamic";

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
    ? await resolveFeaturedPropertyWithFallback(demoTenant.id, realEstateContent.featuredPropertyId)
    : null;
  const featuredContractorId = settings?.homeServices?.featuredContractorId;
  const featuredContractor = featuredContractorId
    ? allContractors.find((c) => c.id === featuredContractorId) ?? null
    : null;

  const showFeaturedHomes = !sections || sections.featuredHomes !== false;
  const featuredHomesResult = showFeaturedHomes
    ? await listPublishedPropertiesWithFallback(demoTenant.id, { pageSize: 4 })
    : null;
  const featuredHomes = (featuredHomesResult?.properties ?? [])
    .filter((p) => p.id !== featuredProperty?.id)
    .slice(0, 3);

  const diyTeaserProjects = diyProjects.slice(0, 3);

  const showEstimator = !sections || sections.costEstimator;
  const showBooking = !sections || sections.bookConsultation;

  return (
    <>
      <Header lang={lang} navItems={navItems} />
      <main>
        {(!sections || sections.hero) && <Hero lang={lang} hero={hero} heroImage={settings?.heroImage} />}

        {settings?.localDiscovery?.showOnHomepage !== false && (
          <LocalDiscovery lang={lang} content={settings?.localDiscovery} />
        )}

        {(!sections || sections.localPromo !== false) && (
          <SnapLinkLocalPromo lang={lang} content={settings?.snapLinkPromo} />
        )}

        {showRealEstateBlock && (
          <RealEstateEntryBlock lang={lang} property={featuredProperty} agents={featuredAgents} content={realEstateContent} />
        )}
        {showFeaturedHomes && <FeaturedHomes lang={lang} properties={featuredHomes} />}

        {(!sections || sections.featuredServices) && (
          <FeaturedServicesEntryBlock lang={lang} content={settings?.homeServices} featuredContractor={featuredContractor} />
        )}
        {(!sections || sections.featuredPros) && (
          <FeaturedProfessionals contractors={featuredContractors} lang={lang} />
        )}
        {(!sections || sections.poweredBySnaplink) && <PoweredBySnapLink lang={lang} />}
        {(!sections || sections.categories) && <CategoriesGrid lang={lang} categories={settings?.categories} />}

        {(!sections || sections.diyLearning) && <DIYLearningTeaser lang={lang} projects={diyTeaserProjects} />}
        {(!sections || sections.trending) && <TrendingSection lang={lang} items={settings?.trendingProjects} />}

        <TestimonialsSection lang={lang} content={settings?.testimonials} />

        {settings?.spotlight && settings.spotlight.length > 0 && (
          <CommunitySpotlight lang={lang} items={settings.spotlight} />
        )}

        {(!sections || sections.seasonalIdeas) && <SeasonalIdeasBanner lang={lang} content={settings?.seasonal} />}
        <EstimatorBookingSection lang={lang} showEstimator={Boolean(showEstimator)} showBooking={Boolean(showBooking)} />
        {(!sections || sections.recruitment) && <BecomeAProfessionalSection lang={lang} />}
      </main>
      <Footer lang={lang} footer={settings?.footer} contact={settings?.contact} />
      <LucioMount lang={lang} pageContext={{ type: "home" }} />
    </>
  );
}

import { cookies } from "next/headers";
import { contractorStore } from "@/lib/store";
import { isPublicContractor } from "@/lib/southline-search";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { southlineStore } from "@/lib/southline-store";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { listPublishedPropertiesWithFallback, listPublishedRentalsWithFallback, resolveFeaturedPropertyWithFallback } from "@/lib/real-estate/homes-fallback";
import { listProjects } from "@/lib/southline-diy";
import type { Lang } from "@/lib/southline-i18n";
import { DEFAULT_FEATURED_RENTALS, DEFAULT_REAL_ESTATE_BLOCK } from "@/lib/southline-types";

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
import FeaturedRentals from "@/components/southline/FeaturedRentals";
import FeaturedServicesEntryBlock from "@/components/southline/FeaturedServicesEntryBlock";
import PoweredBySnapLink from "@/components/southline/PoweredBySnapLink";
import DIYLearningTeaser from "@/components/southline/DIYLearningTeaser";
import SeasonalIdeasBanner from "@/components/southline/SeasonalIdeasBanner";
import TestimonialsSection from "@/components/southline/TestimonialsSection";
import EstimatorBookingSection from "@/components/southline/EstimatorBookingSection";
import BecomeAProfessionalSection from "@/components/southline/BecomeAProfessionalSection";
import SectionDivider from "@/components/southline/SectionDivider";
import LucioMount from "@/components/lucio/LucioMount";
import { isSeasonalActive } from "@/lib/seasonal-schedule";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const [settings, allContractors, activeAgentProfiles, diyProjects] = await Promise.all([
    southlineStore.getSettings().catch(() => null),
    contractorStore.list().then((l) => l.filter((c) => isPublicContractor(c))).catch(() => [] as import("@/lib/types").Contractor[]),
    agentProfileStore.listActive().then((l) => l.filter((p) => !p.isDemo)).catch(() => [] as import("@/lib/agent-profiles/types").AgentProfile[]),
    listProjects().catch(() => [] as import("@/lib/southline-diy").DIYProject[]),
  ]);

  const sections = settings?.sections ?? null;
  const hero = settings?.hero ?? null;
  const navItems = settings?.navigation?.items ?? null;
  const featuredAgentIds = new Set(settings?.featuredAgentProfileIds ?? []);
  const featuredAgents = (featuredAgentIds.size > 0
    ? activeAgentProfiles.filter((a) => featuredAgentIds.has(a.id))
    : activeAgentProfiles
  ).map(publicAgentProfile);
  // The professionals section consumes the raw store lists and the curated
  // featured ids; it orders featured pros first (curated order) itself.
  const featuredSectionAgents = activeAgentProfiles.map(publicAgentProfile);
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
  const homepageHomes = featuredHomesResult?.properties ?? [];
  const featuredHomes = [
    ...homepageHomes.filter((property) => property.id !== featuredProperty?.id),
    ...(featuredProperty && homepageHomes.some((property) => property.id === featuredProperty.id)
      ? [featuredProperty]
      : []),
  ].slice(0, 3);

  const rentalsContent = settings?.featuredRentals ?? DEFAULT_FEATURED_RENTALS;
  const showFeaturedRentals = !sections || sections.featuredRentals !== false;
  const featuredRentalsResult = showFeaturedRentals
    ? await listPublishedRentalsWithFallback(demoTenant.id, { pageSize: 4 })
    : null;
  const availableRentals = featuredRentalsResult?.properties ?? [];
  const selectedRentalIds = rentalsContent.selectedRentalIds;
  const orderedRentals = selectedRentalIds.length > 0
    ? [
        ...selectedRentalIds.map((id) => availableRentals.find((property) => property.id === id)).filter((property): property is NonNullable<typeof property> => Boolean(property)),
        ...availableRentals.filter((property) => !selectedRentalIds.includes(property.id)),
      ]
    : availableRentals;
  const featuredRentals = orderedRentals.slice(0, Math.min(4, Math.max(1, rentalsContent.maxCards)));

  const diyTeaserProjects = diyProjects.slice(0, 3);

  const showEstimator = !sections || sections.costEstimator;
  const showBooking = !sections || sections.bookConsultation;

  return (
    <>
      <Header lang={lang} navItems={navItems} />
      <main>
        {(!sections || sections.hero) && <Hero lang={lang} hero={hero} heroImage={settings?.heroImage} />}
        {(!sections || sections.seasonalIdeas) && isSeasonalActive(settings?.seasonal) && <SeasonalIdeasBanner lang={lang} content={settings?.seasonal} />}
        {(!sections || sections.trending) && <><SectionDivider /><TrendingSection lang={lang} items={settings?.trendingProjects} /></>}
        {showRealEstateBlock && (
          <><SectionDivider /><RealEstateEntryBlock lang={lang} property={featuredProperty} agents={featuredAgents} content={realEstateContent} /></>
        )}
        {showFeaturedHomes && featuredHomes.length > 0 && <><SectionDivider /><FeaturedHomes lang={lang} properties={featuredHomes} /></>}
        {showFeaturedRentals && <><SectionDivider /><FeaturedRentals lang={lang} properties={featuredRentals} content={rentalsContent} /></>}
        {(!sections || sections.featuredServices) && (
          <><SectionDivider /><FeaturedServicesEntryBlock lang={lang} content={settings?.homeServices} featuredContractor={featuredContractor} /></>
        )}
        {settings?.localDiscovery?.showOnHomepage !== false && (
          <><SectionDivider /><LocalDiscovery lang={lang} content={settings?.localDiscovery} /></>
        )}
        {(!sections || sections.featuredPros) && (
          <><SectionDivider /><FeaturedProfessionals
            contractors={allContractors}
            agents={featuredSectionAgents}
            featuredContractorIds={settings?.featuredContractorIds ?? []}
            featuredAgentProfileIds={settings?.featuredAgentProfileIds ?? []}
            lang={lang}
          /></>
        )}
        {(!sections || sections.categories) && <><SectionDivider /><CategoriesGrid lang={lang} categories={settings?.categories} /></>}
        {(!sections || sections.diyLearning) && <><SectionDivider /><DIYLearningTeaser lang={lang} projects={diyTeaserProjects} /></>}
        {/* Hidden by default (feature-gated, not deleted) — see SectionVisibility.estimatorBooking. Explicit opt-in via `=== true` so older stored settings without this key also resolve to hidden. */}
        {sections?.estimatorBooking === true && (
          <>
            <SectionDivider />
            <EstimatorBookingSection lang={lang} showEstimator={Boolean(showEstimator)} showBooking={Boolean(showBooking)} />
          </>
        )}
        {settings?.spotlight && settings.spotlight.length > 0 && (
          <><SectionDivider /><CommunitySpotlight lang={lang} items={settings.spotlight} /></>
        )}
        {(!sections || sections.testimonials !== false) && (
          <TestimonialsSection lang={lang} content={settings?.testimonials} />
        )}
        {(!sections || sections.recruitment) && <><SectionDivider /><BecomeAProfessionalSection lang={lang} /></>}
        {(!sections || sections.poweredBySnaplink) && <PoweredBySnapLink lang={lang} />}
        {(!sections || sections.localPromo !== false) && <SectionDivider monogram />}
        {(!sections || sections.localPromo !== false) && (
          <SnapLinkLocalPromo lang={lang} content={settings?.snapLinkPromo} />
        )}
      </main>
      <Footer lang={lang} footer={settings?.footer} contact={settings?.contact} />
      <LucioMount lang={lang} pageContext={{ type: "home" }} />
    </>
  );
}

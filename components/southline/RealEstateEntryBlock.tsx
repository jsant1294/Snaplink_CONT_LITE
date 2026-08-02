import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { demoAgents, formatPropertyPrice } from "@/lib/real-estate/fixtures";
import type { Property } from "@/lib/real-estate/types";
import type { AgentProfile } from "@/lib/agent-profiles/types";
import type { RealEstateBlockSettings } from "@/lib/southline-types";

const DEMO_LOCAL_EXPERTS = [
  {
    id: "demo-agent-camila",
    slug: "camila-reyes",
    name: "Camila Reyes",
    brokerageName: "Southline Realty Group",
    serviceArea: "Alpharetta",
    photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=85",
    specialties: ["Luxury residential", "Relocation", "New construction"],
    languages: ["English", "Spanish"],
    demo: true,
  },
  ...demoAgents.slice(0, 1).map((agent) => ({
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    brokerageName: agent.brokerageName,
    serviceArea: agent.serviceAreas[0] ?? "",
    photoUrl: agent.photoUrl,
    specialties: agent.specialties,
    languages: agent.languages,
    demo: true,
  })),
];

export default function RealEstateEntryBlock({
  lang,
  property,
  agents,
  content,
}: {
  lang: Lang;
  property: Property | null;
  agents: Omit<AgentProfile, "pin">[];
  content: RealEstateBlockSettings;
}) {
  const eyebrow = lang === "es" ? content.eyebrowEs : content.eyebrowEn;
  const headline = lang === "es" ? content.headlineEs : content.headlineEn;
  const body = lang === "es" ? content.bodyEs : content.bodyEn;
  const featured = agents.length > 0
    ? agents.slice(0, 2).map((agent) => ({ ...agent, demo: false }))
    : DEMO_LOCAL_EXPERTS;
  const listingAgent = property ? demoAgents.find((a) => a.id === property.agentId) : undefined;

  return (
    <section id="real-estate" className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-accent-gold">{eyebrow}</p>
          <h2 className="font-display text-3xl leading-tight text-primary sm:text-4xl">{headline}</h2>
          <p className="mt-3 text-sm leading-relaxed text-primary/80 sm:text-base">{body}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
          {/* Left: featured property — dominant, image-driven */}
          <div className="marketplace-card">
            {property && (
              <div className="relative h-80 sm:h-[26rem] lg:h-full lg:min-h-[460px]">
                {property.imageUrls[0] ? (
                  <img src={property.imageUrls[0]} alt={property.title} className="marketplace-image-project" />
                ) : (
                  <div className="h-full w-full bg-surface" />
                )}
                <span className="absolute left-5 top-5 rounded-full bg-accent-dark/85 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-accent-gold">
                  {property.status.replace("_", " ")}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-image-overlay/90 via-image-overlay/55 to-transparent p-6 sm:p-8">
                  <p className="text-2xl font-semibold text-on-dark sm:text-3xl">{formatPropertyPrice(property.price)}</p>
                  <h3 className="mt-1 font-display text-xl text-on-dark sm:text-2xl">{property.title}</h3>
                  <p className="mt-1 text-sm text-on-dark/80">
                    {property.address}, {property.city}, {property.state}
                  </p>
                  <p className="mt-1 text-sm text-on-dark/80">
                    {property.bedrooms} bd · {property.bathrooms} ba · {property.squareFeet.toLocaleString()} sq ft
                  </p>
                  {listingAgent && (
                    <p className="mt-2 text-xs text-on-dark/70">{t("listedBy", lang)} {listingAgent.name}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/homes/${property.slug}`}
                      className="inline-flex rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent-gold/90"
                    >
                      {t("viewHome", lang)}
                    </Link>
                    <Link
                      href="/book"
                      className="inline-flex rounded-xl border border-on-dark/40 px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-page/10"
                    >
                      {t("scheduleShowing", lang)}
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {/* Defensive last resort: the fixtures fallback (see lib/real-estate/homes-fallback.ts)
                should always supply a property before this ever renders, but a premium
                placeholder still beats a blank card if that layer is ever bypassed. */}
            {!property && (
              <div className="relative h-80 sm:h-[26rem] lg:h-full lg:min-h-[460px]">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=86"
                  alt=""
                  className="marketplace-image-project"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-image-overlay/90 via-image-overlay/55 to-transparent p-6 sm:p-8">
                  <h3 className="font-display text-xl text-on-dark sm:text-2xl">{t("realEstateNoProperty", lang)}</h3>
                  <Link
                    href="/homes"
                    className="mt-4 inline-flex rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent-gold/90"
                  >
                    {t("exploreHomes", lang)}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: featured agent profiles + recruitment callout */}
          <div className="flex flex-col gap-4">
            {featured.map((agent) => (
              <div key={agent.id} className="marketplace-card marketplace-card-body">
                <div className="flex items-start gap-3">
                  {agent.photoUrl && (
                    <img src={agent.photoUrl} alt={agent.name} className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_20%]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg text-primary">{agent.name}</h3>
                      <span className="marketplace-chip shrink-0 rounded-full text-[10px] uppercase tracking-wide">
                        {t("verifiedAgent", lang)}
                      </span>
                    </div>
                    {agent.brokerageName && <p className="truncate text-sm text-text-muted">{agent.brokerageName}</p>}
                    {agent.serviceArea && <p className="mt-0.5 text-xs text-primary/70">{agent.serviceArea}</p>}
                  </div>
                </div>
                {agent.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {agent.specialties.slice(0, 3).map((s) => (
                      <span key={s} className="marketplace-chip">{s}</span>
                    ))}
                  </div>
                )}
                {agent.languages.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-secondary">{agent.languages.join(", ")}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={agent.demo ? "/agents" : `/agents/${agent.slug}`}
                    className="flex-1 rounded-xl border border-border-default py-2 text-center text-sm font-medium text-secondary transition-colors hover:bg-accent-green/10"
                  >
                    {t("viewProfile", lang)}
                  </Link>
                  <Link
                    href={agent.demo ? "/book" : `/agents/${agent.slug}`}
                    className="flex-1 rounded-xl bg-accent-dark py-2 text-center text-sm font-medium text-on-dark transition-colors hover:bg-accent-dark/90"
                  >
                    {t("contactAgent", lang)}
                  </Link>
                </div>
              </div>
            ))}

            {/* Business-facing recruitment callout — deliberately small, sits below consumer content */}
            <div className="mt-auto rounded-2xl border border-accent-gold/25 bg-accent-dark/95 p-5">
              <p className="font-display text-base text-on-dark">{t("realEstateRecruitmentHeadline", lang)}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-on-dark/70">{t("realEstateRecruitmentBody", lang)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/agents/get-started" className="rounded-lg bg-accent-gold px-3.5 py-1.5 text-xs font-semibold text-primary">
                  {t("createAgentProfile", lang)}
                </Link>
                <Link href="/agents/get-started" className="rounded-lg border border-accent-gold/40 px-3.5 py-1.5 text-xs font-medium text-accent-gold">
                  {t("claimAgentProfile", lang)}
                </Link>
                <Link href="/agents/get-started#plans" className="rounded-lg border border-on-dark/25 px-3.5 py-1.5 text-xs font-medium text-on-dark">
                  {t("viewAgentPlans", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Primary consumer CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/homes" className="w-full rounded-xl bg-accent-dark px-6 py-3 text-center text-sm font-semibold text-on-dark transition-colors hover:bg-accent-dark/90 sm:w-auto">
            {t("exploreHomes", lang)}
          </Link>
          <Link href="/agents" className="w-full rounded-xl border border-border-default px-6 py-3 text-center text-sm font-medium text-secondary transition-colors hover:bg-accent-green/10 sm:w-auto">
            {t("findAnAgent", lang)}
          </Link>
          <Link href="/homes" className="w-full rounded-xl border border-border-default px-6 py-3 text-center text-sm font-medium text-secondary transition-colors hover:bg-accent-green/10 sm:w-auto">
            {t("exploreCommunities", lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}

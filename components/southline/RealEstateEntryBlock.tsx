import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { formatPropertyPrice } from "@/lib/real-estate/fixtures";
import type { Property } from "@/lib/real-estate/types";
import type { AgentProfile } from "@/lib/agent-profiles/types";
import type { RealEstateBlockSettings } from "@/lib/southline-types";

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
  const featured = agents.slice(0, 2);

  return (
    <section id="real-estate" className="bg-mushroom/25 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
          <h2 className="font-display text-3xl leading-tight text-walnut sm:text-4xl">{headline}</h2>
          <p className="mt-3 text-sm leading-relaxed text-walnut/80 sm:text-base">{body}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Left: featured property */}
          <div className="overflow-hidden rounded-2xl border border-olive/20 bg-paper shadow-[0_18px_40px_rgba(93,70,53,0.14)]">
            {property ? (
              <div className="relative h-64 sm:h-80 lg:h-full lg:min-h-[380px]">
                {property.imageUrls[0] ? (
                  <img src={property.imageUrls[0]} alt={property.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-sand" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/85 via-obsidian/45 to-transparent p-6">
                  <p className="text-lg font-semibold text-cream">{formatPropertyPrice(property.price)}</p>
                  <h3 className="mt-1 font-display text-xl text-cream">{property.title}</h3>
                  <p className="mt-1 text-sm text-cream/80">
                    {property.city}, {property.state} · {property.bedrooms} bd · {property.bathrooms} ba · {property.squareFeet.toLocaleString()} sq ft
                  </p>
                  <Link
                    href={`/homes/${property.slug}`}
                    className="mt-4 inline-flex rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-obsidian transition-colors hover:bg-goldlight"
                  >
                    {t("viewProperty", lang)}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center p-8 text-center text-sm text-walnut/60 lg:h-full">
                {t("realEstateNoProperty", lang)}
              </div>
            )}
          </div>

          {/* Right: featured agent profiles + recruitment callout */}
          <div className="flex flex-col gap-4">
            {featured.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-olive/20 bg-cream p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  {agent.photoUrl && (
                    <img src={agent.photoUrl} alt={agent.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg text-obsidian">{agent.name}</h3>
                      <span className="shrink-0 rounded-full bg-olive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-olive">
                        {t("verifiedAgent", lang)}
                      </span>
                    </div>
                    {agent.brokerageName && <p className="truncate text-sm text-clay">{agent.brokerageName}</p>}
                    {agent.serviceArea && <p className="mt-0.5 text-xs text-walnut/70">{agent.serviceArea}</p>}
                  </div>
                </div>
                {agent.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {agent.specialties.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-md bg-sand/40 px-2 py-1 text-xs text-clay">{s}</span>
                    ))}
                  </div>
                )}
                {agent.languages.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-sage">{agent.languages.join(", ")}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="flex-1 rounded-xl border border-olive/30 py-2 text-center text-sm font-medium text-olive transition-colors hover:bg-olive/5"
                  >
                    {t("viewProfile", lang)}
                  </Link>
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="flex-1 rounded-xl bg-obsidian py-2 text-center text-sm font-medium text-cream transition-colors hover:bg-obsidian/90"
                  >
                    {t("contactAgent", lang)}
                  </Link>
                </div>
              </div>
            ))}

            {featured.length === 0 && (
              <div className="rounded-2xl border border-olive/20 bg-cream p-5 text-sm text-walnut/60">
                {t("agentsDirectoryEmpty", lang)}
              </div>
            )}

            {/* Business-facing recruitment callout — deliberately small, sits below consumer content */}
            <div className="mt-auto rounded-2xl border border-gold/25 bg-obsidian/95 p-5">
              <p className="font-display text-base text-cream">{t("realEstateRecruitmentHeadline", lang)}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-cream/70">{t("realEstateRecruitmentBody", lang)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/agents/get-started" className="rounded-lg bg-gold px-3.5 py-1.5 text-xs font-semibold text-obsidian">
                  {t("createAgentProfile", lang)}
                </Link>
                <Link href="/agents/get-started" className="rounded-lg border border-gold/40 px-3.5 py-1.5 text-xs font-medium text-gold">
                  {t("claimAgentProfile", lang)}
                </Link>
                <Link href="/agents/get-started#plans" className="rounded-lg border border-cream/25 px-3.5 py-1.5 text-xs font-medium text-cream">
                  {t("viewAgentPlans", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Primary consumer CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/homes" className="w-full rounded-xl bg-obsidian px-6 py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-obsidian/90 sm:w-auto">
            {t("exploreHomes", lang)}
          </Link>
          <Link href="/agents" className="w-full rounded-xl border border-olive/30 px-6 py-3 text-center text-sm font-medium text-olive transition-colors hover:bg-olive/5 sm:w-auto">
            {t("findAnAgent", lang)}
          </Link>
          <Link href="/homes" className="w-full rounded-xl border border-olive/30 px-6 py-3 text-center text-sm font-medium text-olive transition-colors hover:bg-olive/5 sm:w-auto">
            {t("exploreCommunities", lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}

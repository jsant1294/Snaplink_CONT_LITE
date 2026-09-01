import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import ProfessionalCard from "@/components/southline/ProfessionalCard";
import LucioMount from "@/components/lucio/LucioMount";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import { listSouthlineHomeServices } from "@/lib/home-service-taxonomy";
import { contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { southlineStore } from "@/lib/southline-store";
import { searchProfessionals } from "@/lib/southline-search";
import { orderProfessionalResults } from "@/lib/southline-professional-catalog";
import { zipCentroidStore } from "@/lib/geo/store";
import { isUsZip, normalizeZip } from "@/lib/geo/zip";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Home Services & Professionals | Southline Living",
  description: "Find trusted local home-services professionals — contractors, trades, and licensed pros.",
  alternates: { canonical: `${appUrl}/results` },
};

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
}) {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const { q, category, location } = await searchParams;

  // Public-discovery queries: publish gates (lifecycle + southline listing +
  // demo) are enforced in SQL, so searchProfessionals (which re-checks as
  // defense-in-depth) only sees discoverable professionals.
  const [contractors, agentProfiles, settings] = await Promise.all([
    contractorStore.listPublished().catch(() => []),
    agentProfileStore.listPublicActive().catch(() => []),
    southlineStore.getSettings().catch(() => null),
  ]);

  // TRUE GEO v1: a valid 5-digit ZIP is a real radius search (visitor centroid
  // → professional centroid → Haversine ≤ service radius). Unresolvable ZIPs
  // show an explicit message — never a silent broadening to text search.
  let geo;
  let geoUnknownZip = false;
  if (isUsZip(location)) {
    const centroid = await zipCentroidStore.find(normalizeZip(location));
    if (centroid) {
      const serviceZips = [
        ...contractors.map((c) => c.serviceZip),
        ...agentProfiles.map((a) => a.serviceZip),
        centroid.zip,
      ];
      const centroids = await zipCentroidStore.listByZips(serviceZips);
      geo = {
        matchedZip: centroid.zip,
        centroid: { latitude: centroid.latitude, longitude: centroid.longitude },
        centroids,
      };
    } else {
      geoUnknownZip = true;
    }
  }

  // ZIP searches are distance-ordered by searchProfessionals; the curated
  // featured re-order only applies to non-GEO (query/category/city) searches.
  const searched = searchProfessionals(contractors, agentProfiles, { query: q, category, location, geo, geoUnknownZip });
  const professionals =
    geo && !geoUnknownZip
      ? searched
      : orderProfessionalResults(searched, settings?.featuredContractorIds ?? [], settings?.featuredAgentProfileIds ?? []);

  // Single display source: the shared taxonomy. audience: "both" lists every
  // active category (contractor + professional) with locale-resolved labels and
  // stable ids that preserve the /results?category= URL contract.
  const categories = listSouthlineHomeServices({ locale: lang, audience: "both" });

  return (
    <>
      <Header lang={lang} />
      <main className="min-h-screen bg-page text-primary">
        <section className="border-b border-border-default px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">
              Southline Living · {t("navPros", lang)}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
              {t("resultsTitle", lang)}
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-secondary">{t("resultsSubtitle", lang)}</p>
            <form className="mt-7 flex max-w-xl gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder", lang)}
                className="min-w-0 flex-1 rounded-xl border border-border-default bg-surface-raised/70 px-4 py-3 text-base text-primary placeholder:text-secondary/60 outline-none focus:border-accent-gold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              />
              <input
                name="location"
                defaultValue={location}
                placeholder={t("searchLocation", lang)}
                className="w-40 rounded-xl border border-border-default bg-surface-raised/70 px-4 py-3 text-base text-primary placeholder:text-secondary/60 outline-none focus:border-accent-gold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page sm:w-52"
              />
              {category && <input type="hidden" name="category" value={category} />}
              <button className="southline-btn-secondary">
                {t("heroSearch", lang)}
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-secondary">
              {t("resultsFilterLabel", lang)}
            </span>
            {location && (
              <span className="inline-flex min-h-11 items-center rounded-full bg-accent-gold/10 px-3.5 py-1.5 text-xs font-semibold text-accent-gold">
                {t("resultsGeoActiveLabel", lang)} {location}
              </span>
            )}
            <Link
              href="/results"
              className={`inline-flex min-h-11 items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                !category
                  ? "bg-accent-dark text-on-dark"
                  : "bg-surface text-secondary hover:bg-border-default"
              }`}
            >
              {t("resultsAll", lang)}
            </Link>
            {categories.map((c) => {
              const active = category === c.id;
              const href = `?${new URLSearchParams({ ...(q ? { q } : {}), ...(location ? { location } : {}), category: c.id }).toString()}`;
              return (
                <Link
                  key={c.id}
                  href={href}
                  className={`inline-flex min-h-11 items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-accent-dark text-on-dark"
                      : "bg-surface text-secondary hover:bg-border-default"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8">
            {professionals.length === 0 ? (
              <div className="rounded-[18px] border border-border-default bg-surface p-10 text-center">
                <h2 className="font-display text-2xl">
                  {geoUnknownZip ? t("searchNoResults", lang) : category ? t("catalogEmptyTitle", lang) : t("searchNoResults", lang)}
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  {geoUnknownZip
                    ? t("resultsGeoUnknownZip", lang)
                    : category
                      ? t("catalogEmptyBody", lang)
                      : t("resultsEmpty", lang)}
                </p>
                {category && (
                  <Link
                    href="/results"
                    className="southline-btn-secondary mt-6"
                  >
                    {t("catalogEmptyExplore", lang)}
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {professionals.map((pro) => (
                  <ProfessionalCard key={`${pro.kind}-${pro.id}`} pro={pro} lang={lang} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer lang={lang} />
      <LucioMount lang={lang} />
    </>
  );
}

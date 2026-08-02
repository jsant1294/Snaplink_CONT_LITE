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
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const lang = ((await cookies()).get("sl_lang")?.value ?? "en") as Lang;
  const { q, category } = await searchParams;

  const [contractors, agentProfiles, settings] = await Promise.all([
    contractorStore.list().catch(() => []),
    agentProfileStore.list().catch(() => []),
    southlineStore.getSettings().catch(() => null),
  ]);

  // Catalog adapter re-applies the curated featured order (featuredOrder asc →
  // updatedAt desc → displayName asc) and marks CMS-featured pros as featured.
  const professionals = orderProfessionalResults(
    searchProfessionals(contractors, agentProfiles, { query: q, category }),
    settings?.featuredContractorIds ?? [],
    settings?.featuredAgentProfileIds ?? []
  );

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
              const href = `?${new URLSearchParams({ ...(q ? { q } : {}), category: c.id }).toString()}`;
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
                  {category ? t("catalogEmptyTitle", lang) : t("searchNoResults", lang)}
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  {category ? t("catalogEmptyBody", lang) : t("resultsEmpty", lang)}
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

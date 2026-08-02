import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import ProfessionalCard from "@/components/southline/ProfessionalCard";
import LucioMount from "@/components/lucio/LucioMount";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { searchProfessionals } from "@/lib/southline-search";

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

  const [contractors, agentProfiles] = await Promise.all([
    contractorStore.list().catch(() => []),
    agentProfileStore.list().catch(() => []),
  ]);

  const professionals = searchProfessionals(contractors, agentProfiles, { query: q, category });

  return (
    <>
      <Header lang={lang} />
      <main className="min-h-screen bg-[#EEE7DA] text-[#2F2923]">
        <section className="border-b border-walnut/15 px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6F552A]">
              Southline Living · {t("navPros", lang)}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
              {t("resultsTitle", lang)}
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-[#62584F]">{t("resultsSubtitle", lang)}</p>
            <form className="mt-7 flex max-w-xl gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder", lang)}
                className="min-w-0 flex-1 rounded-xl border border-walnut/20 bg-[#F5EFE4]/70 px-4 py-3 text-base text-[#2F2923] placeholder:text-[#6F552A]/60 outline-none focus:border-[#B99552] focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEE7DA]"
              />
              {category && <input type="hidden" name="category" value={category} />}
              <button className="rounded-xl bg-[#2F2923] px-5 py-3 text-sm font-semibold text-[#F5EFE4]">
                {t("heroSearch", lang)}
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6F552A]">
              {t("resultsFilterLabel", lang)}
            </span>
            <Link
              href="/results"
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                !category
                  ? "bg-[#2F2923] text-[#F5EFE4]"
                  : "bg-[#E4DACB] text-[#62584F] hover:bg-[#D8CBBA]"
              }`}
            >
              {t("resultsAll", lang)}
            </Link>
            {SERVICE_CATEGORIES.map((c) => {
              const active = category === c.id;
              const href = `?${new URLSearchParams({ ...(q ? { q } : {}), category: c.id }).toString()}`;
              return (
                <Link
                  key={c.id}
                  href={href}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#2F2923] text-[#F5EFE4]"
                      : "bg-[#E4DACB] text-[#62584F] hover:bg-[#D8CBBA]"
                  }`}
                >
                  {lang === "es" ? c.es : c.en}
                </Link>
              );
            })}
          </div>

          <div className="mt-8">
            {professionals.length === 0 ? (
              <div className="rounded-[18px] border border-walnut/15 bg-[#E4DACB] p-10 text-center">
                <h2 className="font-display text-2xl">{t("searchNoResults", lang)}</h2>
                <p className="mt-2 text-sm text-[#6A5F55]">{t("resultsEmpty", lang)}</p>
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

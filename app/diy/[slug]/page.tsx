import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import { getProjectBySlug } from "@/lib/southline-diy";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import Link from "next/link";
import LucioMount from "@/components/lucio/LucioMount";

export const dynamic = "force-dynamic";

export default async function DIYDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const difficultyLabel =
    project.difficulty === "easy"
      ? t("diyEasy", lang)
      : project.difficulty === "medium"
      ? t("diyMedium", lang)
      : t("diyHard", lang);

  return (
    <>
      <Header lang={lang} />
      <main>
        {/* Breadcrumb */}
        <div className="bg-page border-b border-border-default">
          <div className="max-w-3xl mx-auto px-4 py-3 text-xs text-text-muted/60">
            <Link href="/diy" className="hover:text-accent-gold transition-colors">
              {t("diyTitle", lang)}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-primary">{lang === "es" ? project.titleEs : project.titleEn}</span>
          </div>
        </div>

        {/* Header */}
        <section className="bg-page py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="font-display text-3xl sm:text-4xl text-primary leading-tight mb-4">
              {lang === "es" ? project.titleEs : project.titleEn}
            </h1>
            <p className="text-text-muted text-lg leading-relaxed mb-6">
              {lang === "es" ? project.descEs : project.descEn}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-green/15 text-secondary">
                  {difficultyLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="text-xs">{t("diyTime", lang)}:</span>
                <span className="font-medium text-primary">
                  {lang === "es" ? project.timeEs : project.timeEn}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="text-xs">{t("diyBudget", lang)}:</span>
                <span className="font-medium text-primary">
                  {lang === "es" ? project.budgetEs : project.budgetEn}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid sm:grid-cols-3 gap-8">
            {/* Steps */}
            <div className="sm:col-span-2">
              <h2 className="font-display text-xl text-primary mb-6">{t("diySteps", lang)}</h2>
              <div className="space-y-6">
                {project.steps.map((step) => (
                  <div key={step.order} className="bg-surface rounded-xl border border-border-default p-5">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-accent-dark text-on-dark text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.order}
                      </span>
                      <div>
                        <h3 className="font-display text-base text-primary mb-1">
                          {lang === "es" ? step.titleEs : step.titleEn}
                        </h3>
                        <p className="text-sm text-text-muted/90 leading-relaxed">
                          {lang === "es" ? step.descEs : step.descEn}
                        </p>
                        {(lang === "es" ? step.tipsEs : step.tipsEn) && (
                          <p className="mt-2 text-xs text-accent-gold italic">
                            💡 {lang === "es" ? step.tipsEs : step.tipsEn}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Materials */}
              <div className="bg-surface rounded-xl border border-border-default p-5">
                <h3 className="font-display text-sm text-primary mb-3">{t("diyMaterials", lang)}</h3>
                <p className="text-sm text-text-muted/90 leading-relaxed">
                  {lang === "es" ? project.materialsEs : project.materialsEn}
                </p>
              </div>

              {/* Tools */}
              <div className="bg-surface rounded-xl border border-border-default p-5">
                <h3 className="font-display text-sm text-primary mb-3">{t("diyTools", lang)}</h3>
                <p className="text-sm text-text-muted/90 leading-relaxed">
                  {lang === "es" ? project.toolsEs : project.toolsEn}
                </p>
              </div>

              {/* Tips */}
              {(lang === "es" ? project.tipsEs : project.tipsEn) && (
                <div className="bg-amber-900/5 rounded-xl border border-amber-900/20 p-5">
                  <h3 className="font-display text-sm text-primary mb-2">
                    {lang === "es" ? "Consejos" : "Tips"}
                  </h3>
                  <p className="text-sm text-text-muted/90 italic">
                    {lang === "es" ? project.tipsEs : project.tipsEn}
                  </p>
                </div>
              )}

              {/* Hire a pro */}
              <a
                href="/book"
                className="block bg-accent-gold text-primary font-semibold text-center py-3 rounded-xl hover:bg-accent-gold/90 transition-colors"
              >
                {t("diyHirePro", lang)}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
      <LucioMount lang={lang} pageContext={{ type: "diy", ref: project.slug }} />
    </>
  );
}

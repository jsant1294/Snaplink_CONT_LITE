import { cookies } from "next/headers";
import type { Lang } from "@/lib/southline-i18n";
import { t } from "@/lib/southline-i18n";
import { listProjects, getCategories } from "@/lib/southline-diy";
import Header from "@/components/southline/Header";
import Footer from "@/components/southline/Footer";
import Link from "next/link";
import LucioMount from "@/components/lucio/LucioMount";

export const dynamic = "force-dynamic";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-accent-green/15 text-secondary",
  medium: "bg-accent-gold/15 text-accent-gold-text",
  hard: "bg-state-error/15 text-state-error",
};

export default async function DIYPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sl_lang")?.value ?? "en") as Lang;

  const allProjects = await listProjects();
  const categories = await getCategories(lang);

  const projects = cat
    ? allProjects.filter((p) => p.category === cat)
    : allProjects;
  const leadProject = projects[0];
  const journalProjects = projects.slice(1);

  return (
    <>
      <Header lang={lang} />
      <main>
        <section className="bg-page pb-10 pt-14 sm:pb-14 sm:pt-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:px-8">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-eyebrow">
                {lang === "es" ? "El diario de proyectos" : "The project journal"}
              </p>
              <h1 className="max-w-3xl font-display text-5xl leading-[1.02] text-primary sm:text-6xl lg:text-7xl">
                {lang === "es" ? "Ideas que vale la pena hacer con tus propias manos." : "Ideas worth making with your own hands."}
              </h1>
            </div>
            <div className="border-l border-divider pl-6 lg:mb-2">
              <p className="font-display text-xl leading-relaxed text-primary sm:text-2xl">
                {lang === "es" ? "Proyectos considerados para una casa más personal, una habitación y un fin de semana a la vez." : "Thoughtful projects for a more personal home—one room and one weekend at a time."}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-secondary">
                {lang === "es" ? "Guías claras, materiales honestos e inspiración práctica para comenzar." : "Clear guides, honest materials, and practical inspiration to help you begin."}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-page pb-8 pt-2">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-text-muted/60 uppercase tracking-wider mr-1 self-center">
                {lang === "es" ? "Filtrar:" : "Filter:"}
              </span>
              <a
                href="/diy"
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  !cat ? "bg-accent-dark text-on-dark" : "bg-surface-raised border border-border-default text-text-muted hover:border-accent-gold/50"
                }`}
              >
                {lang === "es" ? "Todos" : "All"}
              </a>
              {categories.map((catItem) => (
                <a
                  key={catItem.key}
                  href={`/diy?cat=${catItem.key}`}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    cat === catItem.key ? "bg-accent-dark text-on-dark" : "bg-surface-raised border border-border-default text-text-muted hover:border-accent-gold/50"
                  }`}
                >
                  {catItem.label}
                </a>
              ))}
            </div>
            {cat && (
              <p className="text-xs text-text-muted/60 text-center mt-4">
                {projects.length} {lang === "es" ? "proyectos encontrados" : "projects found"}
              </p>
            )}
          </div>
        </section>

        <section className="bg-page pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-text-muted/60 text-sm">{lang === "es" ? "No hay proyectos en esta categoría todavía." : "No projects in this category yet."}</p>
                <a href="/diy" className="text-accent-gold text-sm mt-2 inline-block hover:underline">{lang === "es" ? "Ver todos" : "See all"}</a>
              </div>
            ) : (
              <div className="space-y-10">
                {leadProject && (
                  <Link href={`/diy/${leadProject.slug}`} className="marketplace-card group grid overflow-hidden lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="relative min-h-[320px] overflow-hidden bg-surface-soft sm:min-h-[430px]">
                      {leadProject.coverImage ? <img src={leadProject.coverImage} alt="" className="marketplace-image-project transition-transform duration-300 group-hover:scale-[1.025]" /> : <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🔨</span>}
                      <span className="absolute left-5 top-5 rounded-full bg-accent-dark/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-dark">
                        {lang === "es" ? "Historia destacada" : "Featured story"}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eyebrow">{lang === "es" ? "Hazlo este fin de semana" : "Make it this weekend"}</p>
                      <h2 className="mt-4 font-display text-3xl leading-tight text-primary sm:text-4xl">{lang === "es" ? leadProject.titleEs : leadProject.titleEn}</h2>
                      <p className="mt-5 text-base leading-relaxed text-secondary">{lang === "es" ? leadProject.descEs : leadProject.descEn}</p>
                      <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
                        <span className={`rounded-full px-3 py-1 ${DIFFICULTY_COLORS[leadProject.difficulty]}`}>{t(leadProject.difficulty === "easy" ? "diyEasy" : leadProject.difficulty === "medium" ? "diyMedium" : "diyHard", lang)}</span>
                        <span>{leadProject.timeEs}</span>
                      </div>
                      <span className="mt-8 inline-flex text-sm font-semibold text-secondary">{lang === "es" ? "Leer la guía" : "Read the guide"} →</span>
                    </div>
                  </Link>
                )}

                {journalProjects.length > 0 && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {journalProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/diy/${project.slug}`}
                    className="marketplace-card group hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="marketplace-card-media flex items-center justify-center text-4xl">
                      {project.coverImage ? (
                        <img src={project.coverImage} alt="" className="marketplace-image-project" />
                      ) : (
                        <span className="opacity-40">🔨</span>
                      )}
                    </div>
                    <div className="marketplace-card-body space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[project.difficulty]}`}>
                          {t(project.difficulty === "easy" ? "diyEasy" : project.difficulty === "medium" ? "diyMedium" : "diyHard", lang)}
                        </span>
                        <span className="text-[10px] text-text-muted">{project.timeEs}</span>
                      </div>
                      <h2 className="marketplace-card-title group-hover:text-accent-gold transition-colors">
                        {lang === "es" ? project.titleEs : project.titleEn}
                      </h2>
                      <p className="marketplace-card-copy line-clamp-2">
                        {lang === "es" ? project.descEs : project.descEn}
                      </p>
                    </div>
                  </Link>
                ))}
                </div>}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer lang={lang} />
      <LucioMount lang={lang} pageContext={{ type: "diy" }} />
    </>
  );
}

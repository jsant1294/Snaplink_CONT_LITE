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
  easy: "bg-sage/15 text-sage",
  medium: "bg-amber-900/15 text-amber",
  hard: "bg-danger/15 text-danger",
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

  return (
    <>
      <Header lang={lang} />
      <main>
        <section className="bg-gradient-to-b from-cream to-sand/30 py-16 sm:py-24 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <p className="text-xs tracking-[0.35em] uppercase text-gold font-medium mb-3">DIY</p>
            <h1 className="font-display text-4xl sm:text-5xl text-obsidian leading-tight mb-4">
              {t("diyTitle", lang)}
            </h1>
            <p className="text-lg text-clay max-w-xl mx-auto">
              {t("diySubtitle", lang)}
            </p>
          </div>
        </section>

        <section className="bg-cream pt-8 pb-4">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-clay/60 uppercase tracking-wider mr-1 self-center">
                {lang === "es" ? "Filtrar:" : "Filter:"}
              </span>
              <a
                href="/diy"
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  !cat ? "bg-obsidian text-cream" : "bg-white border border-sand/40 text-clay hover:border-gold/50"
                }`}
              >
                {lang === "es" ? "Todos" : "All"}
              </a>
              {categories.map((catItem) => (
                <a
                  key={catItem.key}
                  href={`/diy?cat=${catItem.key}`}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    cat === catItem.key ? "bg-obsidian text-cream" : "bg-white border border-sand/40 text-clay hover:border-gold/50"
                  }`}
                >
                  {catItem.label}
                </a>
              ))}
            </div>
            {cat && (
              <p className="text-xs text-clay/60 text-center mt-4">
                {projects.length} {lang === "es" ? "proyectos encontrados" : "projects found"}
              </p>
            )}
          </div>
        </section>

        <section className="bg-cream pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-clay/60 text-sm">{lang === "es" ? "No hay proyectos en esta categoría todavía." : "No projects in this category yet."}</p>
                <a href="/diy" className="text-gold text-sm mt-2 inline-block hover:underline">{lang === "es" ? "Ver todos" : "See all"}</a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/diy/${project.slug}`}
                    className="group bg-paper rounded-2xl border border-sand/40 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="aspect-[16/10] bg-sand/30 flex items-center justify-center text-4xl">
                      {project.coverImage ? (
                        <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="opacity-40">🔨</span>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[project.difficulty]}`}>
                          {t(project.difficulty === "easy" ? "diyEasy" : project.difficulty === "medium" ? "diyMedium" : "diyHard", lang)}
                        </span>
                        <span className="text-[10px] text-muted">{project.timeEs}</span>
                      </div>
                      <h2 className="font-display text-base text-obsidian group-hover:text-gold transition-colors">
                        {lang === "es" ? project.titleEs : project.titleEn}
                      </h2>
                      <p className="text-xs text-clay leading-relaxed line-clamp-2">
                        {lang === "es" ? project.descEs : project.descEn}
                      </p>
                    </div>
                  </Link>
                ))}
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

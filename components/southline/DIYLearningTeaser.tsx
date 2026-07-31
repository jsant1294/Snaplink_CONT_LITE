import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import type { DIYProject } from "@/lib/southline-diy";

const DIFFICULTY_LABEL: Record<DIYProject["difficulty"], "diyEasy" | "diyMedium" | "diyHard"> = {
  easy: "diyEasy",
  medium: "diyMedium",
  hard: "diyHard",
};

export default function DIYLearningTeaser({ lang, projects }: { lang: Lang; projects: DIYProject[] }) {
  if (!projects.length) return null;

  return (
    <section className="bg-ivory py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{t("diyLearningEyebrow", lang)}</p>
            <h2 className="font-display text-3xl leading-tight text-obsidian sm:text-4xl">{t("diyLearningTitle", lang)}</h2>
            <p className="mt-2 max-w-lg text-sm text-clay">{t("diyLearningSubtitle", lang)}</p>
          </div>
          <Link href="/diy" className="whitespace-nowrap rounded-xl border border-walnut/25 px-5 py-2.5 text-sm font-medium text-walnut transition-colors hover:bg-walnut/5">
            {t("exploreDiyProjects", lang)}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/diy/${project.slug}`}
              className="group overflow-hidden rounded-2xl border border-walnut/15 bg-cream shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden">
                {project.coverImage ? (
                  <img
                    src={project.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div className="h-full w-full bg-sand" />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-cream">
                  {t(DIFFICULTY_LABEL[project.difficulty], lang)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg text-obsidian">{lang === "es" ? project.titleEs : project.titleEn}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-clay">{lang === "es" ? project.descEs : project.descEn}</p>
                <p className="mt-2 text-xs text-walnut/70">{lang === "es" ? project.timeEs : project.timeEn}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <section className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="southline-section-header flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="southline-section-eyebrow">{t("diyLearningEyebrow", lang)}</p>
            <h2 className="southline-section-title">{t("diyLearningTitle", lang)}</h2>
            <p className="southline-section-description max-w-lg">{t("diyLearningSubtitle", lang)}</p>
          </div>
          <Link href="/diy" className="whitespace-nowrap rounded-xl border border-border-default/25 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface">
            {t("exploreDiyProjects", lang)}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/diy/${project.slug}`}
              className="marketplace-card group transition-shadow hover:shadow-md"
            >
              <div className="marketplace-card-media">
                {project.coverImage ? (
                  <img
                    src={project.coverImage}
                    alt=""
                    loading="lazy"
                    className="marketplace-image-project transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div className="h-full w-full bg-surface" />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-accent-dark/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-on-dark">
                  {t(DIFFICULTY_LABEL[project.difficulty], lang)}
                </span>
              </div>
              <div className="marketplace-card-body">
                <h3 className="marketplace-card-title">{lang === "es" ? project.titleEs : project.titleEn}</h3>
                <p className="marketplace-card-copy mt-1 line-clamp-2">{lang === "es" ? project.descEs : project.descEn}</p>
                <p className="mt-2 text-xs text-primary/70">{lang === "es" ? project.timeEs : project.timeEn}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

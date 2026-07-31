import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";

export default function CostEstimatorTeaser({ lang }: { lang: Lang }) {
  return (
    <section className="bg-mushroom/20 py-14 sm:py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">{t("costEstimatorEyebrow", lang)}</p>
        <h2 className="font-display text-2xl leading-tight text-walnut sm:text-3xl">{t("costEstimatorTitle", lang)}</h2>
        <p className="max-w-lg text-sm leading-relaxed text-walnut/80">{t("costEstimatorBody", lang)}</p>
        <Link href="/planner" className="mt-2 rounded-xl bg-obsidian px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-obsidian/90">
          {t("costEstimatorCta", lang)}
        </Link>
      </div>
    </section>
  );
}

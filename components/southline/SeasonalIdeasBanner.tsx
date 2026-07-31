import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";

// No seasonal-content data model exists yet — this is a single editorial CTA
// banner into real DIY content, not a fabricated grid of seasonal projects.
const SEASONAL_IMAGE = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=85";

export default function SeasonalIdeasBanner({ lang }: { lang: Lang }) {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div className="absolute inset-0">
        <img src={SEASONAL_IMAGE} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/85 via-obsidian/55 to-obsidian/20" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{t("seasonalIdeasEyebrow", lang)}</p>
          <h2 className="font-display text-3xl leading-tight text-cream sm:text-4xl">{t("seasonalIdeasHeadline", lang)}</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/80 sm:text-base">{t("seasonalIdeasBody", lang)}</p>
          <Link href="/diy" className="mt-6 inline-flex rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-goldlight">
            {t("seasonalIdeasCta", lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}

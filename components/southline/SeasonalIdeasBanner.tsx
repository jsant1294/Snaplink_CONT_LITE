import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import type { SeasonalContent } from "@/lib/southline-types";
import { isSeasonalActive } from "@/lib/seasonal-schedule";

const SEASONAL_IMAGE = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=85";

export default function SeasonalIdeasBanner({
  lang,
  content,
}: {
  lang: Lang;
  content?: SeasonalContent;
}) {
  if (!isSeasonalActive(content)) return null;

  const image = content?.imageUrl ?? content?.mobileImageUrl ?? SEASONAL_IMAGE;
  const alt = lang === "es" ? content?.imageAltEs : content?.imageAltEn;
  const eyebrow = lang === "es" ? content?.eyebrowEs : content?.eyebrowEn;
  const headline = lang === "es" ? content?.titleEs : content?.titleEn;
  const body = lang === "es" ? content?.descriptionEs : content?.descriptionEn;
  const cta = lang === "es" ? content?.ctaLabelEs : content?.ctaLabelEn;
  const href = content?.ctaUrl ?? "/diy";

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div className="absolute inset-0">
        <img src={image} alt={alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/85 via-obsidian/55 to-obsidian/20" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{eyebrow ?? t("seasonalIdeasEyebrow", lang)}</p>
          <h2 className="font-display text-3xl leading-tight text-cream sm:text-4xl">{headline ?? t("seasonalIdeasHeadline", lang)}</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/80 sm:text-base">{body ?? t("seasonalIdeasBody", lang)}</p>
          <Link href={href} className="mt-6 inline-flex rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-goldlight">
            {cta ?? t("seasonalIdeasCta", lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}

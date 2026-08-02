import { t, type Lang } from "@/lib/southline-i18n";
import type { SeasonalContent } from "@/lib/southline-types";
import { isSeasonalActive } from "@/lib/seasonal-schedule";

const SEASONAL_IMAGE = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=85";

const LEGACY_COPY = {
  eyebrowEn: "Seasonal",
  eyebrowEs: "De temporada",
  titleEn: "Seasonal ideas for your home",
  titleEs: "Ideas de temporada para tu hogar",
  descriptionEn: "From getting your garden ready to prepping your home for the next season — find inspiration right on time.",
  descriptionEs: "Desde preparar tu jardín hasta acondicionar tu hogar para el próximo cambio de clima — encuentra inspiración a tiempo.",
};

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
  const savedEyebrow = lang === "es" ? content?.eyebrowEs : content?.eyebrowEn;
  const savedHeadline = lang === "es" ? content?.titleEs : content?.titleEn;
  const savedBody = lang === "es" ? content?.descriptionEs : content?.descriptionEn;
  const eyebrow = savedEyebrow === (lang === "es" ? LEGACY_COPY.eyebrowEs : LEGACY_COPY.eyebrowEn) ? undefined : savedEyebrow;
  const headline = savedHeadline === (lang === "es" ? LEGACY_COPY.titleEs : LEGACY_COPY.titleEn) ? undefined : savedHeadline;
  const body = savedBody === (lang === "es" ? LEGACY_COPY.descriptionEs : LEGACY_COPY.descriptionEn) ? undefined : savedBody;

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div className="absolute inset-0">
        <img src={image} alt={alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-image-overlay/85 via-image-overlay/55 to-image-overlay/20" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="southline-section-eyebrow">{eyebrow ?? t("seasonalIdeasEyebrow", lang)}</p>
          <h2 className="southline-section-title !text-on-dark">{headline ?? t("seasonalIdeasHeadline", lang)}</h2>
          <p className="southline-section-description !text-on-dark/80">{body ?? t("seasonalIdeasBody", lang)}</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-dark/75">
            <span>{lang === "es" ? "Renovación del jardín" : "Garden refresh"}</span>
            <span aria-hidden="true" className="text-eyebrow">·</span>
            <span>{lang === "es" ? "Nivel principiante" : "Beginner friendly"}</span>
            <span aria-hidden="true" className="text-eyebrow">·</span>
            <span>{lang === "es" ? "Proyecto de fin de semana" : "Weekend project"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

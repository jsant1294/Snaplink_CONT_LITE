import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { DEMO_FEATURED_PROFESSIONAL } from "@/lib/featured-services-fixtures";
import { PROFESSION_TYPES, professionTypeLabel, professionPlaceholderPhotoFor } from "@/lib/profession-types";
import type { HomeServicesContent } from "@/lib/southline-types";
import type { Contractor } from "@/lib/types";

// Mirrors RealEstateEntryBlock.tsx's layout exactly (large image-dominant featured
// card | summary card | recruitment card | primary CTAs) so Homes and Services read
// as twin marketplace modules, per the "Featured Services Marketplace" spec.
//
// The featured card uses demo content (see lib/featured-services-fixtures.ts) —
// real contractors don't yet have portfolio photos, years-of-experience, or a
// logo/headshot, and the spec explicitly sanctions demo data for this slice
// ("Future Ready... Initially use demo professionals"). No star rating is shown
// anywhere in this component: this app has no reviews/ratings system for any
// professional yet, so inventing one — even as demo flavor — isn't done here.
export default function FeaturedServicesEntryBlock({
  lang,
  content,
  featuredContractor,
}: {
  lang: Lang;
  content?: HomeServicesContent;
  featuredContractor?: Contractor | null;
}) {
  // The featured card is CMS-driven when an operator picks a real contractor;
  // it falls back to demo content otherwise. Real contractors don't carry
  // years-of-experience, portfolio photos, or a logo/headshot yet, so those
  // fields are only rendered when present.
  const pro = featuredContractor
    ? {
        id: featuredContractor.id,
        companyName: featuredContractor.businessName,
        projectType: professionTypeLabel(featuredContractor.professionType, lang),
        location: featuredContractor.serviceArea,
        yearsExperience: null as number | null,
        heroImage: content?.featuredImageUrl ?? professionPlaceholderPhotoFor(featuredContractor.id, featuredContractor.professionType),
        logoUrl: null as string | null,
        headshotUrl: null as string | null,
        specialties: featuredContractor.services,
        languages: [featuredContractor.preferredLanguage === "es" ? "Español" : "English"],
        profileHref: `/contractor/${featuredContractor.username}`,
      }
    : { ...DEMO_FEATURED_PROFESSIONAL, yearsExperience: DEMO_FEATURED_PROFESSIONAL.yearsExperience as number | null };

  const eyebrow = lang === "es" ? content?.eyebrowEs : content?.eyebrowEn;
  const title = lang === "es" ? content?.titleEs : content?.titleEn;
  const subtitle = lang === "es" ? content?.descriptionEs : content?.descriptionEn;
  const requestQuoteLabel = lang === "es" ? content?.primaryCtaLabelEs : content?.primaryCtaLabelEn;
  const requestQuoteHref = content?.primaryCtaUrl ?? "/book";

  return (
    <section id="services" className="bg-sand/20 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{eyebrow ?? t("featuredServicesEyebrow", lang)}</p>
          <h2 className="font-display text-3xl leading-tight text-walnut sm:text-4xl">{title ?? t("featuredServicesTitle", lang)}</h2>
          <p className="mt-3 text-sm leading-relaxed text-walnut/80 sm:text-base">{subtitle ?? t("featuredServicesSubtitle", lang)}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
          {/* Left: large featured professional project — image-dominant, like the featured home */}
          <div className="overflow-hidden rounded-2xl border border-olive/20 bg-paper shadow-[0_18px_40px_rgba(93,70,53,0.14)]">
            <div className="relative h-80 sm:h-[26rem] lg:h-full lg:min-h-[460px]">
              <img src={pro.heroImage} alt={pro.projectType} className="h-full w-full object-cover" />
              <span className="absolute left-5 top-5 rounded-full bg-obsidian/85 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gold">
                {t("featuredProject", lang)}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/90 via-obsidian/55 to-transparent p-6 sm:p-8">
                <p className="text-xl font-semibold text-cream sm:text-2xl">{pro.companyName}</p>
                <h3 className="mt-1 font-display text-lg text-cream sm:text-xl">{pro.projectType}</h3>
                {pro.yearsExperience != null && (
                  <p className="mt-1 text-sm text-cream/80">
                    {pro.location} · {pro.yearsExperience} {t("yearsExperience", lang)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={pro.profileHref} className="inline-flex rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-obsidian transition-colors hover:bg-goldlight">
                    {t("viewProfile", lang)}
                  </Link>
                  <Link href={requestQuoteHref} className="inline-flex rounded-xl border border-cream/40 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10">
                    {requestQuoteLabel ?? t("requestQuote", lang)}
                  </Link>
                  <Link href="/book" className="inline-flex rounded-xl border border-cream/40 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10">
                    {t("bookConsultationCta2", lang)}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: professional summary card + recruitment callout */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-olive/20 bg-cream p-5 shadow-sm">
              <div className="flex items-start gap-3">
                {pro.logoUrl && <img src={pro.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                {pro.headshotUrl && <img src={pro.headshotUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-lg text-obsidian">{pro.companyName}</h3>
                    <span className="shrink-0 rounded-full bg-olive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-olive">
                      {t("snaplinkVerified", lang)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-clay">{pro.location}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-walnut/50">{t("specialties", lang)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {pro.specialties.map((s) => (
                  <span key={s} className="rounded-md bg-sand/40 px-2 py-1 text-xs text-clay">{s}</span>
                ))}
              </div>
              {pro.languages.length > 0 && (
                <p className="mt-2 text-xs font-medium text-sage">{pro.languages.join(", ")}</p>
              )}
              <p className="mt-3 text-[11px] text-walnut/50">{t("profilePoweredBySnaplink", lang)}</p>
              <div className="mt-4 flex gap-2">
                <Link href={pro.profileHref} className="flex-1 rounded-xl border border-olive/30 py-2 text-center text-sm font-medium text-olive transition-colors hover:bg-olive/5">
                  {t("viewProfile", lang)}
                </Link>
                <Link href={requestQuoteHref} className="flex-1 rounded-xl bg-obsidian py-2 text-center text-sm font-medium text-cream transition-colors hover:bg-obsidian/90">
                  {requestQuoteLabel ?? t("requestQuote", lang)}
                </Link>
              </div>
            </div>

            {/* Business-facing recruitment callout — mirrors RealEstateEntryBlock's, deliberately small */}
            <div className="mt-auto rounded-2xl border border-gold/25 bg-obsidian/95 p-5">
              <p className="font-display text-base text-cream">{t("servicesRecruitmentHeadline", lang)}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-cream/70">{t("servicesRecruitmentBody", lang)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/contractor-admin" className="rounded-lg bg-gold px-3.5 py-1.5 text-xs font-semibold text-obsidian">
                  {t("createSnaplinkProfile", lang)}
                </Link>
                <Link href="/for-contractors" className="rounded-lg border border-gold/40 px-3.5 py-1.5 text-xs font-medium text-gold">
                  {t("claimYourBusiness", lang)}
                </Link>
                <Link href="/for-contractors" className="rounded-lg border border-cream/25 px-3.5 py-1.5 text-xs font-medium text-cream">
                  {t("viewPlans", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/#professionals" className="w-full rounded-xl bg-obsidian px-6 py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-obsidian/90 sm:w-auto">
            {t("exploreProfessionals", lang)}
          </Link>
          <Link href="#service-categories" className="w-full rounded-xl border border-olive/30 px-6 py-3 text-center text-sm font-medium text-olive transition-colors hover:bg-olive/5 sm:w-auto">
            {t("findByTrade", lang)}
          </Link>
          <Link href="#service-categories" className="w-full rounded-xl border border-olive/30 px-6 py-3 text-center text-sm font-medium text-olive transition-colors hover:bg-olive/5 sm:w-auto">
            {t("browseCategories", lang)}
          </Link>
        </div>

        {/* Category strip — no dedicated professional-search-by-category page exists yet,
            so every chip points at the real professionals grid rather than a dead link. */}
        <div id="service-categories" className="mt-6 flex flex-wrap gap-2">
          {PROFESSION_TYPES.map((p) => (
            <Link
              key={p.id}
              href="/#professionals"
              className="rounded-full border border-walnut/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-walnut transition-colors hover:border-olive/40 hover:text-obsidian"
            >
              {professionTypeLabel(p.id, lang)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { DEMO_FEATURED_PROFESSIONAL } from "@/lib/featured-services-fixtures";
import { professionTypeLabel, professionPlaceholderPhotoFor } from "@/lib/profession-types";
import { listSouthlineHomeServices } from "@/lib/home-service-taxonomy";
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
  // Home Services cards come from the shared taxonomy (single display source).
  // Deterministic ordering (group + sortOrder), locale-resolved labels, and each
  // card links into the real professionals directory filter (/results?category=).
  const serviceCategories = listSouthlineHomeServices({ locale: lang });

  return (
    <section id="services" className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="southline-section-header max-w-2xl">
          <p className="southline-section-eyebrow">{eyebrow ?? t("featuredServicesEyebrow", lang)}</p>
          <h2 className="southline-section-title">{title ?? t("featuredServicesTitle", lang)}</h2>
          <p className="southline-section-description">{subtitle ?? t("featuredServicesSubtitle", lang)}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
          {/* Left: large featured professional project — image-dominant, like the featured home */}
          <div className="marketplace-card">
            <div className="relative h-80 sm:h-[26rem] lg:h-full lg:min-h-[460px]">
              <img src={pro.heroImage} alt={pro.projectType} className="marketplace-image-project" />
              <span className="absolute left-5 top-5 rounded-full bg-accent-dark/85 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-accent-gold">
                {t("featuredProject", lang)}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-image-overlay/90 via-image-overlay/55 to-transparent p-6 sm:p-8">
                <p className="text-xl font-semibold text-on-dark sm:text-2xl">{pro.companyName}</p>
                <h3 className="mt-1 font-display text-lg text-on-dark sm:text-xl">{pro.projectType}</h3>
                {pro.yearsExperience != null && (
                  <p className="mt-1 text-sm text-on-dark/80">
                    {pro.location} · {pro.yearsExperience} {t("yearsExperience", lang)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={pro.profileHref} className="inline-flex rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent-gold/90">
                    {t("viewProfile", lang)}
                  </Link>
                  <Link href={requestQuoteHref} className="inline-flex rounded-xl border border-on-dark/40 px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-page/10">
                    {requestQuoteLabel ?? t("requestQuote", lang)}
                  </Link>
                  <Link href="/book" className="inline-flex rounded-xl border border-on-dark/40 px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-page/10">
                    {t("bookConsultationCta2", lang)}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: professional summary card + recruitment callout */}
          <div className="flex flex-col gap-4">
            <div className="marketplace-card marketplace-card-body">
              <div className="flex items-start gap-3">
                {pro.logoUrl && <img src={pro.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover object-center" />}
                {pro.headshotUrl && <img src={pro.headshotUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover object-[center_20%]" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-lg text-primary">{pro.companyName}</h3>
                    <span className="marketplace-chip shrink-0 rounded-full text-[10px] uppercase tracking-wide">
                      {t("snaplinkVerified", lang)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-text-muted">{pro.location}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary/50">{t("specialties", lang)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {pro.specialties.map((s) => (
                  <span key={s} className="marketplace-chip">{s}</span>
                ))}
              </div>
              {pro.languages.length > 0 && (
                <p className="mt-2 text-xs font-medium text-secondary">{pro.languages.join(", ")}</p>
              )}
              <p className="mt-3 text-[11px] text-primary/50">{t("profilePoweredBySnaplink", lang)}</p>
              <div className="mt-4 flex gap-2">
                <Link href={pro.profileHref} className="flex-1 rounded-xl border border-border-default py-2 text-center text-sm font-medium text-secondary transition-colors hover:bg-accent-green/10">
                  {t("viewProfile", lang)}
                </Link>
                <Link href={requestQuoteHref} className="flex-1 rounded-xl bg-accent-dark py-2 text-center text-sm font-medium text-on-dark transition-colors hover:bg-accent-dark/90">
                  {requestQuoteLabel ?? t("requestQuote", lang)}
                </Link>
              </div>
            </div>

            {/* Business-facing recruitment callout — mirrors RealEstateEntryBlock's, deliberately small */}
            <div className="mt-auto rounded-2xl border border-accent-gold/25 bg-accent-dark/95 p-5">
              <p className="font-display text-base text-on-dark">{t("servicesRecruitmentHeadline", lang)}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-on-dark/70">{t("servicesRecruitmentBody", lang)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/contractor-admin" className="rounded-lg bg-accent-gold px-3.5 py-1.5 text-xs font-semibold text-primary">
                  {t("createSnaplinkProfile", lang)}
                </Link>
                <Link href="/for-contractors" className="rounded-lg border border-accent-gold/40 px-3.5 py-1.5 text-xs font-medium text-accent-gold">
                  {t("claimYourBusiness", lang)}
                </Link>
                <Link href="/for-contractors" className="rounded-lg border border-on-dark/25 px-3.5 py-1.5 text-xs font-medium text-on-dark">
                  {t("viewPlans", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/#professionals" className="w-full rounded-xl bg-accent-dark px-6 py-3 text-center text-sm font-semibold text-on-dark transition-colors hover:bg-accent-dark/90 sm:w-auto">
            {t("exploreProfessionals", lang)}
          </Link>
          <Link href="#service-categories" className="w-full rounded-xl border border-border-default px-6 py-3 text-center text-sm font-medium text-secondary transition-colors hover:bg-accent-green/10 sm:w-auto">
            {t("findByTrade", lang)}
          </Link>
          <Link href="#service-categories" className="w-full rounded-xl border border-border-default px-6 py-3 text-center text-sm font-medium text-secondary transition-colors hover:bg-accent-green/10 sm:w-auto">
            {t("browseCategories", lang)}
          </Link>
        </div>

        {/* Category cards — sourced from the shared taxonomy; every card points at
            the real professionals directory filter rather than a dead link. */}
        <div id="service-categories" className="mt-6 flex flex-wrap gap-2">
          {serviceCategories.map((c) => (
            <Link
              key={c.id}
              href={`/results?category=${c.id}`}
              className="rounded-full border border-border-default bg-surface px-3.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:text-primary"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

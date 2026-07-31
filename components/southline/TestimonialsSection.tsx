import { t, type Lang } from "@/lib/southline-i18n";
import { visibleTestimonials } from "@/lib/southline-testimonials";
import type { SouthlineTestimonialsContent } from "@/lib/southline-types";

export default function TestimonialsSection({
  lang,
  content,
}: {
  lang: Lang;
  content?: SouthlineTestimonialsContent;
}) {
  if (content?.enabled === false) return null;

  const items = visibleTestimonials(content);
  if (items.length === 0) return null;

  const heading = lang === "es" ? (content?.headingEs ?? content?.heading) : content?.heading;
  const body = lang === "es" ? (content?.bodyEs ?? content?.body) : content?.body;
  const reviewCtaLabel = lang === "es"
    ? (content?.reviewCtaLabelEs ?? content?.reviewCtaLabel)
    : content?.reviewCtaLabel;

  return (
    <section className="bg-ivory py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {t("testimonialsEyebrow", lang)}
          </p>
          <h2 className="mt-4 font-display text-3xl text-obsidian sm:text-4xl">
            {heading ?? t("testimonialsHeading", lang)}
          </h2>
          <p className="mt-3 text-clay">{body ?? t("testimonialsBody", lang)}</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const quote = lang === "es" ? (item.quoteEs ?? item.quote) : item.quote;
            const authorName = lang === "es" ? (item.authorNameEs ?? item.authorName) : item.authorName;
            const authorTitle = lang === "es" ? (item.authorTitleEs ?? item.authorTitle) : item.authorTitle;
            const companyName = lang === "es" ? (item.companyNameEs ?? item.companyName) : item.companyName;
            const rating =
              typeof item.rating === "number" && Number.isFinite(item.rating)
                ? item.rating
                : null;

            return (
              <figure
                key={item.id}
                className={`flex flex-col rounded-2xl border bg-cream p-6 ${
                  item.featured ? "border-gold" : "border-walnut/15"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  {rating !== null ? (
                    <span className="inline-flex rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-obsidian">
                      {rating} / 5
                    </span>
                  ) : (
                    <span />
                  )}
                  {item.featured && (
                    <span className="text-xs uppercase tracking-wider text-gold">
                      {t("testimonialsFeaturedBadge", lang)}
                    </span>
                  )}
                </div>

                <blockquote className="flex-1 text-sm leading-relaxed text-obsidian">
                  “{quote}”
                </blockquote>

                <figcaption className="mt-5 flex items-center gap-3 border-t border-walnut/10 pt-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={authorName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-obsidian">{authorName}</p>
                    {[authorTitle, companyName].filter(Boolean).length > 0 && (
                      <p className="truncate text-xs text-clay">
                        {[authorTitle, companyName].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </figcaption>

                {item.sourceLabel && (
                  <a
                    href={item.sourceUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-xs text-clay hover:text-gold transition-colors"
                  >
                    {lang === "es" ? "Vía" : "Via"} {item.sourceLabel}
                  </a>
                )}
              </figure>
            );
          })}
        </div>

        {content?.reviewCtaUrl && (
          <div className="mt-10 text-center">
            <a
              href={content.reviewCtaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl border border-gold px-6 py-3 text-sm font-semibold text-obsidian hover:bg-gold/10 transition-colors"
            >
              {reviewCtaLabel ?? t("testimonialsReviewCta", lang)}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";

const ESTIMATOR_IMAGE = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=85";
const BOOKING_IMAGE = "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=85";

function Card({
  image,
  eyebrow,
  title,
  body,
  ctaLabel,
  href,
}: {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <div className="marketplace-card">
      <div className="marketplace-card-media">
        <img src={image} alt="" loading="lazy" className="marketplace-image-project" />
      </div>
      <div className="marketplace-card-body flex flex-col items-start gap-3">
        <p className="southline-section-eyebrow !mb-0">{eyebrow}</p>
        <h2 className="font-display text-2xl leading-tight text-primary">{title}</h2>
        <p className="text-sm leading-relaxed text-primary/80">{body}</p>
        <Link href={href} className="mt-1 rounded-xl bg-accent-dark px-6 py-3 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-dark/90">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export default function EstimatorBookingSection({
  lang,
  showEstimator,
  showBooking,
}: {
  lang: Lang;
  showEstimator: boolean;
  showBooking: boolean;
}) {
  if (!showEstimator && !showBooking) return null;

  return (
    <section className="bg-page py-14 sm:py-20">
      <div className={`mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:px-8 ${showEstimator && showBooking ? "sm:grid-cols-2" : "max-w-3xl"}`}>
        {showEstimator && (
          <Card
            image={ESTIMATOR_IMAGE}
            eyebrow={t("costEstimatorEyebrow", lang)}
            title={t("costEstimatorTitle", lang)}
            body={t("costEstimatorBody", lang)}
            ctaLabel={t("costEstimatorCta", lang)}
            href="/planner"
          />
        )}
        {showBooking && (
          <Card
            image={BOOKING_IMAGE}
            eyebrow={t("bookConsultationEyebrow", lang)}
            title={t("bookConsultationTitle", lang)}
            body={t("bookConsultationBody", lang)}
            ctaLabel={t("bookConsultationCta", lang)}
            href="/book"
          />
        )}
      </div>
    </section>
  );
}

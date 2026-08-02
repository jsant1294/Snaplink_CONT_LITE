import Link from "next/link";
import { t, type Lang } from "@/lib/southline-i18n";
import { PRODUCT_FLOW, FEATURE_GRID, TRUST_POINTS, CONSUMER_JOURNEY, PROFESSIONAL_JOURNEY } from "@/lib/snaplink-content";

// No real NFC/product photography exists in this repo yet (checked public/ —
// only hero-contractor.jpg and og-image.png). Rather than use generic stock
// photography for the "hero graphic" the spec calls for, this section uses a
// typographic/numbered flow diagram instead — consistent with "no generic
// stock imagery," honest about what assets actually exist today.

function FlowDiagram({ steps, lang }: { steps: { es: string; en: string }[]; lang: Lang }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border-default bg-page px-3.5 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold text-primary">
              {i + 1}
            </span>
            <span className="text-xs font-medium text-primary sm:text-sm">{lang === "es" ? step.es : step.en}</span>
          </div>
          {i < steps.length - 1 && <span className="text-primary/30">→</span>}
        </div>
      ))}
    </div>
  );
}

export default function PoweredBySnapLink({ lang }: { lang: Lang }) {
  return (
    <section id="powered-by-snaplink" className="bg-accent-dark py-14 text-on-dark sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-accent-gold">{t("poweredBySnaplinkEyebrow", lang)}</p>
          <h2 className="font-display text-3xl leading-tight text-on-dark sm:text-4xl">{t("poweredBySnaplinkTitle", lang)}</h2>
          <p className="mt-1 font-display text-xl text-accent-gold sm:text-2xl">{t("poweredBySnaplinkSubtitle", lang)}</p>
          <p className="mt-4 text-sm leading-relaxed text-on-dark/70 sm:text-base">{t("poweredBySnaplinkBody", lang)}</p>
        </div>

        {/* Physical products -> digital profile -> ... -> business growth */}
        <div className="mb-14 overflow-x-auto pb-2">
          <FlowDiagram steps={PRODUCT_FLOW} lang={lang} />
        </div>

        {/* Feature grid */}
        <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {FEATURE_GRID.map((f) => (
            <div key={f.titleEn} className="rounded-2xl border border-on-dark/10 bg-page/5 p-5">
              <h3 className="font-display text-base text-on-dark">{lang === "es" ? f.titleEs : f.titleEn}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-on-dark/60">{lang === "es" ? f.descEs : f.descEn}</p>
            </div>
          ))}
        </div>

        {/* Why homeowners trust SnapLink */}
        <div className="mb-14">
          <h3 className="mb-4 font-display text-xl text-on-dark">{t("whyTrustSnaplink", lang)}</h3>
          <div className="flex flex-wrap gap-2">
            {TRUST_POINTS.map((p, i) => (
              <span key={i} className="rounded-full border border-accent-gold/25 px-3.5 py-1.5 text-xs font-medium text-accent-gold">
                {lang === "es" ? p.es : p.en}
              </span>
            ))}
          </div>
        </div>

        {/* Consumer + professional journeys */}
        <div className="mb-14 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 font-display text-lg text-on-dark">{t("consumerJourneyTitle", lang)}</h3>
            <FlowDiagram steps={CONSUMER_JOURNEY} lang={lang} />
          </div>
          <div>
            <h3 className="mb-4 font-display text-lg text-on-dark">{t("professionalJourneyTitle", lang)}</h3>
            <FlowDiagram steps={PROFESSIONAL_JOURNEY} lang={lang} />
          </div>
        </div>

        {/* Grow your business CTA */}
        <div className="rounded-2xl border border-accent-gold/25 bg-page/5 p-6 sm:p-10">
          <h3 className="font-display text-2xl text-on-dark sm:text-3xl">{t("snaplinkGrowHeadline", lang)}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-dark/70">{t("snaplinkGrowBody", lang)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contractor-admin" className="rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent-gold/90">
              {t("joinSnaplink", lang)}
            </Link>
            <Link href="/contractor/ridgeline-demo" className="rounded-xl border border-on-dark/25 px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-page/10">
              {t("viewDemoProfile", lang)}
            </Link>
            <Link href="/snaplink" className="rounded-xl border border-on-dark/25 px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-page/10">
              {t("learnMore", lang)}
            </Link>
            <Link href="/contractor-admin" className="rounded-xl border border-on-dark/25 px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-page/10">
              {t("professionalLogin", lang)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

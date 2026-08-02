import { t, type Lang } from "@/lib/southline-i18n";

// Extracted from the inline JSX that used to live directly in app/page.tsx, and
// restyled onto the site's dominant obsidian/gold palette (the old block used
// snaplink-* tokens, inconsistent with every section shipped since). Copy is
// profession-inclusive per the master refactor brief — every professional
// category should feel invited, not only contractors. CTAs are unchanged
// (/for-contractors, /contractor-admin): no new profession-agnostic signup
// surface exists yet, so pointing at the real existing one is correct.
export default function BecomeAProfessionalSection({ lang }: { lang: Lang }) {
  return (
    <section className="border-y border-accent-gold/25 bg-accent-dark py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="southline-section-eyebrow">{t("becomeAProEyebrow", lang)}</p>
        <h2 className="southline-section-title !text-on-dark">{t("becomeAProTitle", lang)}</h2>
        <p className="southline-section-description mx-auto mb-8 max-w-2xl !text-on-dark/75">{t("becomeAProBody", lang)}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/for-contractors" className="w-full rounded-xl bg-accent-gold px-7 py-3 font-semibold text-primary transition-colors hover:bg-accent-gold/90 sm:w-auto">
            {t("becomeAProJoin", lang)}
          </a>
          <a href="/for-contractors" className="w-full rounded-xl border border-accent-gold/60 px-7 py-3 font-medium text-accent-gold transition-colors hover:bg-page/5 sm:w-auto">
            {t("becomeAProClaim", lang)}
          </a>
          <a href="/contractor-admin" className="w-full rounded-xl border border-on-dark/20 px-7 py-3 font-medium text-on-dark transition-colors hover:border-accent-gold/60 sm:w-auto">
            {t("becomeAProLogin", lang)}
          </a>
        </div>
      </div>
    </section>
  );
}

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
    <section className="border-y border-gold/25 bg-obsidian py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">{t("becomeAProEyebrow", lang)}</p>
        <h2 className="mb-4 font-display text-3xl leading-tight text-cream sm:text-5xl">{t("becomeAProTitle", lang)}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-cream/75 sm:text-lg">{t("becomeAProBody", lang)}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/for-contractors" className="w-full rounded-xl bg-gold px-7 py-3 font-semibold text-obsidian transition-colors hover:bg-goldlight sm:w-auto">
            {t("becomeAProJoin", lang)}
          </a>
          <a href="/for-contractors" className="w-full rounded-xl border border-gold/60 px-7 py-3 font-medium text-gold transition-colors hover:bg-cream/5 sm:w-auto">
            {t("becomeAProClaim", lang)}
          </a>
          <a href="/contractor-admin" className="w-full rounded-xl border border-cream/20 px-7 py-3 font-medium text-cream transition-colors hover:border-gold/60 sm:w-auto">
            {t("becomeAProLogin", lang)}
          </a>
        </div>
      </div>
    </section>
  );
}

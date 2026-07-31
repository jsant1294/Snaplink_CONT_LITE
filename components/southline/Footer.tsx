import { t, type Lang } from "@/lib/southline-i18n";
import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export default function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="bg-obsidian text-bone/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <span className="text-xl font-display font-bold text-bone tracking-tight">
                Southline
              </span>
              <span className="text-xl font-display font-light text-gold">
                Living
              </span>
            </Link>
            <p className="text-sm text-bone/60 leading-relaxed max-w-xs">
              {t("footerTagline", lang)}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-gold font-medium mb-4">
              {t("footerExplore", lang)}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/homes" className="text-sm hover:text-gold transition-colors">{t("navRealEstate", lang)}</Link></li>
              <li><Link href="/diy" className="text-sm hover:text-gold transition-colors">{t("navIdeas", lang)}</Link></li>
              <li><Link href="/planner" className="text-sm hover:text-gold transition-colors">{t("navProjects", lang)}</Link></li>
              <li><Link href="/diy" className="text-sm hover:text-gold transition-colors">{t("navDIY", lang)}</Link></li>
              <li><Link href="/#professionals" className="text-sm hover:text-gold transition-colors">{t("navPros", lang)}</Link></li>
              <li><Link href="/agents" className="text-sm hover:text-gold transition-colors">{t("navAgents", lang)}</Link></li>
            </ul>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-gold font-medium mb-4">
              {t("footerProfessionals", lang)}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/for-contractors" className="text-sm hover:text-gold transition-colors">{t("footerJoin", lang)}</Link></li>
              <li><Link href="/for-contractors" className="text-sm hover:text-gold transition-colors">{t("footerClaim", lang)}</Link></li>
              <li><Link href="/contractor-admin" className="text-sm hover:text-gold transition-colors">{t("contractorLogin", lang)}</Link></li>
              <li><Link href="/agents" className="text-sm hover:text-gold transition-colors">{t("footerAgentProfiles", lang)}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-gold font-medium mb-4">
              {t("footerCompany", lang)}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/how-it-works" className="text-sm hover:text-gold transition-colors">
                {lang === "es" ? "Cómo funciona" : "How it works"}
              </Link></li>
              <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerAbout", lang)}</Link></li>
              <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerContact", lang)}</Link></li>
              <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerPrivacy", lang)}</Link></li>
              <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerTerms", lang)}</Link></li>
              <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerAccessibility", lang)}</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-bone/10 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-display text-lg text-bone mb-2">{t("newsletterTitle", lang)}</h4>
            <p className="text-sm text-bone/60 mb-4">{t("newsletterDesc", lang)}</p>
            <NewsletterForm lang={lang} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-bone/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-bone/40">
          <p>{t("footerCopyright", lang)}</p>
          <p className="text-snaplink-gold-light">{t("footerPoweredBy", lang)}</p>
        </div>
      </div>
    </footer>
  );
}

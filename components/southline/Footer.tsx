import { t, type Lang } from "@/lib/southline-i18n";
import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import type { SouthlineContactContent, SouthlineFooterContent } from "@/lib/southline-types";

export default function Footer({
  lang,
  footer,
  contact,
}: {
  lang: Lang;
  footer?: SouthlineFooterContent;
  contact?: SouthlineContactContent;
}) {
  const tagline = lang === "es" ? footer?.taglineEs : footer?.taglineEn;
  const newsletterTitle = lang === "es" ? footer?.newsletterTitleEs : footer?.newsletterTitleEn;
  const newsletterDesc = lang === "es" ? footer?.newsletterDescEs : footer?.newsletterDescEn;
  const copyright = lang === "es" ? footer?.copyrightEs : footer?.copyrightEn;
  const poweredBy = lang === "es" ? footer?.poweredByEs : footer?.poweredByEn;
  const cmsColumns = footer?.columns
    ?.filter((column) => column.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const showNewsletter = footer?.newsletterVisible !== false;

  const businessName = contact?.businessName;
  const businessDescription = contact?.businessDescription;
  const contactLines = [
    contact?.phone ? { key: "phone", href: `tel:${contact.phone}`, label: contact.phone } : null,
    contact?.email ? { key: "email", href: `mailto:${contact.email}`, label: contact.email } : null,
    contact?.whatsapp
      ? { key: "whatsapp", href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`, label: contact.whatsapp }
      : null,
  ].filter((line) => line !== null);
  const footerAddress = [contact?.addressLine1, contact?.addressLine2, [contact?.city, contact?.region, contact?.postalCode].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(", ");
  const showContactBlock = contactLines.length > 0 || footerAddress.length > 0;

  return (
    <footer className="bg-obsidian text-bone/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            {businessName ? (
              <Link href="/" className="inline-flex items-center gap-2 mb-3">
                <span className="text-xl font-display font-bold text-bone tracking-tight">
                  {businessName}
                </span>
              </Link>
            ) : (
              <Link href="/" className="inline-flex items-center gap-2 mb-3">
                <span className="text-xl font-display font-bold text-bone tracking-tight">
                  Southline
                </span>
                <span className="text-xl font-display font-light text-gold">
                  Living
                </span>
              </Link>
            )}
            <p className="text-sm text-bone/60 leading-relaxed max-w-xs">
              {tagline ?? businessDescription ?? t("footerTagline", lang)}
            </p>
            {showContactBlock && (
              <ul className="mt-4 space-y-2 text-sm">
                {contactLines.map((line) => (
                  <li key={line.key}>
                    <a href={line.href} className="text-bone/60 hover:text-gold transition-colors">
                      {line.label}
                    </a>
                  </li>
                ))}
                {footerAddress.length > 0 && (
                  <li className="text-bone/60">{footerAddress}</li>
                )}
              </ul>
            )}
          </div>

          {cmsColumns && cmsColumns.length > 0 ? (
            cmsColumns.map((column) => (
              <div key={column.id}>
                <h4 className="text-xs tracking-[0.2em] uppercase text-gold font-medium mb-4">
                  {lang === "es" ? column.titleEs : column.titleEn}
                </h4>
                <ul className="space-y-2.5">
                  {column.links
                    .filter((link) => link.visible !== false)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((link) => (
                      <li key={link.id}>
                        <Link href={link.href} className="text-sm hover:text-gold transition-colors">
                          {lang === "es" ? link.labelEs : link.labelEn}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <>
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
                  <li><Link href="/snaplink" className="text-sm hover:text-gold transition-colors">{t("footerSnaplink", lang)}</Link></li>
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
                  <li><Link href="/faq" className="text-sm hover:text-gold transition-colors">{t("footerFaq", lang)}</Link></li>
                  <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerAbout", lang)}</Link></li>
                  <li><Link href="/contact" className="text-sm hover:text-gold transition-colors">{t("footerContact", lang)}</Link></li>
                  <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerPrivacy", lang)}</Link></li>
                  <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerTerms", lang)}</Link></li>
                  <li><Link href="#" className="text-sm hover:text-gold transition-colors">{t("footerAccessibility", lang)}</Link></li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Newsletter */}
        {showNewsletter && (
          <div className="border-t border-bone/10 pt-8 mb-8">
            <div className="max-w-md mx-auto text-center">
              <h4 className="font-display text-lg text-bone mb-2">{newsletterTitle ?? t("newsletterTitle", lang)}</h4>
              <p className="text-sm text-bone/60 mb-4">{newsletterDesc ?? t("newsletterDesc", lang)}</p>
              <NewsletterForm lang={lang} />
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="border-t border-bone/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-bone/40">
          <p>{copyright ?? t("footerCopyright", lang)}</p>
          <p className="text-snaplink-gold-light">{poweredBy ?? t("footerPoweredBy", lang)}</p>
        </div>
      </div>
    </footer>
  );
}

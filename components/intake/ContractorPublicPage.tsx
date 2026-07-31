"use client";

import { useState } from "react";
import type { Contractor } from "@/lib/types";
import type { ContractorLandingPage } from "@/lib/landing-page-types";
import { t, type Lang } from "@/lib/i18n";
import { serviceLabel } from "@/lib/services";
import IntakeWizard from "./IntakeWizard";

export default function ContractorPublicPage({
  contractor,
  landingPage,
}: {
  contractor: Contractor;
  /** Only rendered when `published` — otherwise this page looks exactly as it always has. */
  landingPage?: ContractorLandingPage | null;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<"home" | "intake">("home");
  const [intakeIntent, setIntakeIntent] = useState<"estimate" | "photos" | "walkthrough">("estimate");

  const wa = (contractor.whatsapp ?? contractor.phone).replace(/[^\d]/g, "");

  const lp = landingPage?.published ? landingPage : null;
  const headline = lp && (lang === "en" ? lp.headlineEn : lp.headlineEs);
  const subheadline = lp && (lang === "en" ? lp.subheadlineEn : lp.subheadlineEs);
  const ctaLabel = lp && (lang === "en" ? lp.ctaLabelEn : lp.ctaLabelEs);

  function startIntake(intent: "estimate" | "photos" | "walkthrough") {
    setIntakeIntent(intent);
    setMode("intake");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveContact() {
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${contractor.businessName}`,
      `ORG:${contractor.businessName}`,
      `TEL;TYPE=CELL:${contractor.phone}`,
      `EMAIL:${contractor.email}`,
      `NOTE:${contractor.tagline ?? ""} — via SnapLink Contractor`,
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contractor.username}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (mode === "intake") {
    return (
      <IntakeWizard
        contractor={contractor}
        intent={intakeIntent}
        lang={lang}
        onExit={() => setMode("home")}
      />
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto px-5 pb-16 pt-6 text-[#2F2923]">
      {/* Language toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-full border border-[#B99552]/60 bg-[#F5EFE4]/45 overflow-hidden text-xs">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-1 ${lang === "en" ? "bg-[#B99552] text-[#2F2923] font-semibold" : "text-[#6F552A]"}`}
          >
            English
          </button>
          <button
            onClick={() => setLang("es")}
            className={`px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-1 ${lang === "es" ? "bg-[#B99552] text-[#2F2923] font-semibold" : "text-[#6F552A]"}`}
          >
            Español
          </button>
        </div>
      </div>

      {/* Hero banner — only when a published landing page has a hero image */}
      {lp?.heroImageUrl && (
        <div className="relative rounded-2xl overflow-hidden mb-6 aspect-[16/10]">
          <img src={lp.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1712]/90 via-[#1c1712]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#D6AD55] font-semibold mb-1">
              {lp?.locationText || contractor.serviceArea}
            </p>
            <h1 className="font-display text-2xl leading-tight text-[#F5EFE4]">{headline || contractor.businessName}</h1>
            {(subheadline || contractor.tagline) && (
              <p className="text-[#F5EFE4]/85 text-sm mt-1.5">{subheadline || contractor.tagline}</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="text-center mb-8">
        {!lp?.heroImageUrl && contractor.logoUrl && (
          <img
            src={contractor.logoUrl}
            alt=""
            className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover border border-[#B99552]/30"
          />
        )}
        {!lp?.heroImageUrl && (
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#6F552A] font-semibold mb-2">
            {contractor.serviceArea}
          </p>
        )}
        <h1 className="font-display text-4xl leading-tight text-[#2F2923]">
          {lp?.heroImageUrl ? contractor.businessName : headline || contractor.businessName}
        </h1>
        {!lp?.heroImageUrl && (subheadline || contractor.tagline) && (
          <p className="text-[#62584F] text-sm mt-2">{subheadline || contractor.tagline}</p>
        )}
        {contractor.licenseInfo && (
          <p className="text-xs text-[#6B6158] mt-1">{contractor.licenseInfo}</p>
        )}
        {lp && (lp.hoursText || lp.noteText) && (
          <p className="text-xs text-[#6B6158] mt-1">
            {[lp.hoursText, lp.noteText].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="gold-rule w-32 mx-auto mt-5" />
      </header>

      {/* Primary actions */}
      <div className="space-y-3 mb-6">
        <button onClick={() => startIntake("estimate")} className="btn-gold w-full text-lg">
          {t("requestEstimate", lang)}
        </button>
        <button onClick={() => startIntake("photos")} className="btn-outline w-full !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55">
          {t("uploadPhotos", lang)}
        </button>
        {ctaLabel && (
          <a
            href={lp?.ctaUrl || `tel:${contractor.phone}`}
            target={lp?.ctaUrl ? "_blank" : undefined}
            rel={lp?.ctaUrl ? "noopener noreferrer" : undefined}
            className="btn-outline w-full block text-center !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55"
          >
            {ctaLabel}
          </a>
        )}
      </div>

      {/* Contact grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <a href={`tel:${contractor.phone}`} className="card p-3 text-center !bg-[#F5EFE4]/65 !border-[#B99552]/45 !text-[#2F2923] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-2">
          <span aria-hidden="true" className="block text-xl mb-1">📞</span>
          <span className="text-xs font-medium">{t("callNow", lang)}</span>
        </a>
        <a href={`sms:${contractor.phone}`} className="card p-3 text-center !bg-[#F5EFE4]/65 !border-[#B99552]/45 !text-[#2F2923] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-2">
          <span aria-hidden="true" className="block text-xl mb-1">💬</span>
          <span className="text-xs font-medium">{t("textUs", lang)}</span>
        </a>
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card p-3 text-center !bg-[#F5EFE4]/65 !border-[#B99552]/45 !text-[#2F2923] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F2923] focus-visible:ring-offset-2"
        >
          <span aria-hidden="true" className="block text-xl mb-1">🟢</span>
          <span className="text-xs font-medium">{t("whatsapp", lang)}</span>
        </a>
      </div>

      {/* Secondary actions */}
      <div className="space-y-3">
        <button
          onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
          className="btn-outline w-full !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55"
        >
          {t("viewServices", lang)}
        </button>
        {/* galleryUrl/reviewsUrl are optional — only render these as links when a
            real destination exists, rather than falling back to a dead "#" href. */}
        {contractor.galleryUrl && (
          <a href={contractor.galleryUrl} className="btn-outline w-full block !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55">
            {t("beforeAfter", lang)}
          </a>
        )}
        {contractor.reviewsUrl && (
          <a
            href={contractor.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full block !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55"
          >
            {t("readReviews", lang)}
          </a>
        )}
        {contractor.website && (
          <a
            href={contractor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full block !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55"
          >
            {t("visitWebsite", lang)}
          </a>
        )}
        <button onClick={() => startIntake("walkthrough")} className="btn-outline w-full !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55">
          {t("bookWalkthrough", lang)}
        </button>
        <button onClick={saveContact} className="btn-outline w-full !border-[#B99552] !text-[#6F552A] !bg-[#F5EFE4]/55">
          {t("saveContact", lang)}
        </button>
      </div>

      {/* Services */}
      <section id="services" className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-[#2F2923] mb-4">{t("services", lang)}</h2>
        <div className="grid grid-cols-2 gap-3">
          {contractor.services.map((s) => (
            <button
              key={s}
              onClick={() => startIntake("estimate")}
              className="card p-4 text-left !bg-[#26241F] !border-[rgba(214,173,85,0.20)] hover:!border-[rgba(214,173,85,0.42)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AD55] focus-visible:ring-offset-2"
            >
              <span className="text-sm font-medium text-[#F5EFE4]">{serviceLabel(s, lang)}</span>
              <span className="block text-xs font-medium text-[#D6AD55] mt-1">{t("getEstimate", lang)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Gallery */}
      {contractor.galleryUrls && contractor.galleryUrls.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-[#2F2923] mb-4">{t("ourWork", lang)}</h2>
          <div className="grid grid-cols-3 gap-2">
            {contractor.galleryUrls.slice(0, 6).map((url, i) => (
              <img
                key={url}
                src={url}
                alt=""
                loading="lazy"
                className={`w-full rounded-lg object-cover border border-[#B99552]/25 ${
                  i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                }`}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="mt-12 text-center text-xs text-[#6B6158]">
        {t("poweredBy", lang)} <span className="font-medium text-[#6F552A]">SnapLink Contractor</span>
      </footer>
    </main>
  );
}

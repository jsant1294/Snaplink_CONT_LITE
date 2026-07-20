"use client";

import { useState } from "react";
import type { Contractor } from "@/lib/types";
import { t, type Lang } from "@/lib/i18n";
import { serviceLabel } from "@/lib/services";
import IntakeWizard from "./IntakeWizard";

export default function ContractorPublicPage({ contractor }: { contractor: Contractor }) {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<"home" | "intake">("home");
  const [intakeIntent, setIntakeIntent] = useState<"estimate" | "photos" | "walkthrough">("estimate");

  const wa = (contractor.whatsapp ?? contractor.phone).replace(/[^\d]/g, "");

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
    <main className="min-h-screen max-w-md mx-auto px-5 pb-16 pt-6">
      {/* Language toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-full border border-white/15 overflow-hidden text-xs">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 ${lang === "en" ? "bg-gold text-obsidian font-semibold" : "text-muted"}`}
          >
            English
          </button>
          <button
            onClick={() => setLang("es")}
            className={`px-3 py-1.5 ${lang === "es" ? "bg-gold text-obsidian font-semibold" : "text-muted"}`}
          >
            Español
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="text-center mb-8">
        <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-2">
          {contractor.serviceArea}
        </p>
        <h1 className="font-display text-4xl leading-tight">{contractor.businessName}</h1>
        {contractor.tagline && (
          <p className="text-muted text-sm mt-2">{contractor.tagline}</p>
        )}
        {contractor.licenseInfo && (
          <p className="text-xs text-muted/70 mt-1">{contractor.licenseInfo}</p>
        )}
        <div className="gold-rule w-32 mx-auto mt-5" />
      </header>

      {/* Primary actions */}
      <div className="space-y-3 mb-6">
        <button onClick={() => startIntake("estimate")} className="btn-gold w-full text-lg">
          {t("requestEstimate", lang)}
        </button>
        <button onClick={() => startIntake("photos")} className="btn-outline w-full">
          {t("uploadPhotos", lang)}
        </button>
      </div>

      {/* Contact grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <a href={`tel:${contractor.phone}`} className="card p-3 text-center">
          <span className="block text-xl mb-1">📞</span>
          <span className="text-xs font-medium">{t("callNow", lang)}</span>
        </a>
        <a href={`sms:${contractor.phone}`} className="card p-3 text-center">
          <span className="block text-xl mb-1">💬</span>
          <span className="text-xs font-medium">{t("textUs", lang)}</span>
        </a>
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card p-3 text-center"
        >
          <span className="block text-xl mb-1">🟢</span>
          <span className="text-xs font-medium">{t("whatsapp", lang)}</span>
        </a>
      </div>

      {/* Secondary actions */}
      <div className="space-y-3">
        <button
          onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
          className="btn-outline w-full"
        >
          {t("viewServices", lang)}
        </button>
        <a href={contractor.galleryUrl ?? "#"} className="btn-outline w-full block">
          {t("beforeAfter", lang)}
        </a>
        <a
          href={contractor.reviewsUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline w-full block"
        >
          {t("readReviews", lang)}
        </a>
        <button onClick={() => startIntake("walkthrough")} className="btn-outline w-full">
          {t("bookWalkthrough", lang)}
        </button>
        <button onClick={saveContact} className="btn-outline w-full">
          {t("saveContact", lang)}
        </button>
      </div>

      {/* Services */}
      <section id="services" className="mt-10">
        <h2 className="font-display text-2xl mb-4">{t("services", lang)}</h2>
        <div className="grid grid-cols-2 gap-3">
          {contractor.services.map((s) => (
            <button key={s} onClick={() => startIntake("estimate")} className="card p-4 text-left">
              <span className="text-sm font-medium">{serviceLabel(s, lang)}</span>
              <span className="block text-xs text-gold mt-1">{t("getEstimate", lang)}</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="mt-12 text-center text-xs text-muted/60">
        {t("poweredBy", lang)} <span className="text-gold">SnapLink Contractor</span>
      </footer>
    </main>
  );
}

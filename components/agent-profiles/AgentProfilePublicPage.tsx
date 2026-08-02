"use client";

import { useEffect } from "react";
import type { AgentProfile } from "@/lib/agent-profiles/types";
import { agentProfessionTypeLabel, professionPlaceholderPhotoFor } from "@/lib/profession-types";
import { t, type Lang } from "@/lib/southline-i18n";

function track(id: string, eventType: string) {
  fetch(`/api/agent-profiles/${id}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType }),
  }).catch(() => {});
}

export default function AgentProfilePublicPage({
  profile,
  lang,
  variant = "snaplink",
}: {
  profile: Omit<AgentProfile, "pin">;
  lang: Lang;
  /** "southline" adds a CTA back to the full SnapLink profile + booking/website links. */
  variant?: "southline" | "snaplink";
}) {
  useEffect(() => {
    track(profile.id, "view");
  }, [profile.id]);

  function saveContact() {
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.name}`,
      `ORG:${profile.brokerageName || "Snaplink Profile"}`,
      `TEL;TYPE=CELL:${profile.phone}`,
      `EMAIL:${profile.email}`,
      `NOTE:${profile.tagline ?? ""} — via Snaplink Profile`,
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.slug}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const photo = profile.photoUrl || professionPlaceholderPhotoFor(profile.id, profile.professionType);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6 text-[#2F2923] sm:max-w-2xl sm:px-8 sm:pt-10 lg:max-w-4xl">
      <header className="mb-8 text-center sm:mb-12 sm:flex sm:items-center sm:gap-8 sm:text-left">
        <img
          src={photo}
          alt={profile.name}
          className="mx-auto mb-4 h-28 w-28 shrink-0 rounded-full border border-walnut/15 object-cover sm:mx-0 sm:mb-0 sm:h-36 sm:w-36"
        />
        <div className="sm:flex-1">
          {profile.serviceArea && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#6F552A]">{profile.serviceArea}</p>
          )}
          <h1 className="font-display text-4xl leading-tight text-[#2F2923] sm:text-5xl">{profile.name}</h1>
          <p className="mt-3 inline-block rounded-full border border-[#B99552]/40 bg-[#F5EFE4]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6F552A]">
            {agentProfessionTypeLabel(profile.professionType, lang)}
          </p>
          {profile.brokerageName && <p className="mt-2 text-sm text-[#62584F]">{profile.brokerageName}</p>}
          {profile.tagline && <p className="mt-2 text-sm text-[#62584F]">{profile.tagline}</p>}
          {profile.licenseNumber && <p className="mt-1 text-xs text-[#6B6158]">{t("agentLicense", lang)} {profile.licenseNumber}</p>}
          <div className="gold-rule mx-auto mt-5 w-32 sm:mx-0" />
        </div>
      </header>

      <div className="sm:grid sm:grid-cols-5 sm:gap-10">
        <div className="sm:col-span-3">
          <div className="mb-6 grid grid-cols-3 gap-3">
            <a href={`tel:${profile.phone}`} onClick={() => track(profile.id, "phone_click")} className="card !border-[#B99552]/45 !bg-[#F5EFE4]/65 p-3 text-center !text-[#2F2923] sm:p-4">
              <span className="mb-1 block text-xl">📞</span>
              <span className="text-xs font-medium">{t("callNow", lang)}</span>
            </a>
            <a href={`sms:${profile.phone}`} onClick={() => track(profile.id, "contact_click")} className="card !border-[#B99552]/45 !bg-[#F5EFE4]/65 p-3 text-center !text-[#2F2923] sm:p-4">
              <span className="mb-1 block text-xl">💬</span>
              <span className="text-xs font-medium">{t("textUs", lang)}</span>
            </a>
            <a href={`mailto:${profile.email}`} onClick={() => track(profile.id, "email_click")} className="card !border-[#B99552]/45 !bg-[#F5EFE4]/65 p-3 text-center !text-[#2F2923] sm:p-4">
              <span className="mb-1 block text-xl">✉️</span>
              <span className="text-xs font-medium">{t("emailAgent", lang)}</span>
            </a>
          </div>

          {profile.bio && (
            <section className="mb-6">
              <h2 className="mb-2 font-display text-lg text-[#2F2923]">{t("aboutProfessional", lang)}</h2>
              <p className="text-sm leading-relaxed text-[#62584F]">{profile.bio}</p>
            </section>
          )}

          {profile.specialties.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 font-display text-lg text-[#2F2923]">{t("specialties", lang)}</h2>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((s) => <span key={s} className="rounded-full bg-sand/30 px-3 py-1 text-xs text-clay">{s}</span>)}
              </div>
            </section>
          )}

          <div className="sm:flex sm:gap-8">
            {profile.languages.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 font-display text-lg text-[#2F2923]">{t("languages", lang)}</h2>
                <p className="text-sm text-[#62584F]">{profile.languages.join(", ")}</p>
              </section>
            )}

            {profile.serviceAreas.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 font-display text-lg text-[#2F2923]">{t("serviceAreasLabel", lang)}</h2>
                <p className="text-sm text-[#62584F]">{profile.serviceAreas.join(", ")}</p>
              </section>
            )}
          </div>

          {typeof profile.yearsExperience === "number" && (
            <p className="mb-6 text-sm text-[#62584F]">{t("yearsExperience", lang)}: {profile.yearsExperience}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          {variant === "southline" && (
            <div className="mb-6 space-y-2">
              {profile.bookingLink && (
                <a href={profile.bookingLink} target="_blank" rel="noreferrer" className="btn-gold block w-full text-center">
                  {t("bookingTitle", lang)}
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="btn-outline block w-full text-center !border-[#B99552] !bg-[#F5EFE4]/55 !text-[#6F552A]">
                  {t("visitWebsite", lang)}
                </a>
              )}
              {profile.username && (
                <a href={`/p/${profile.username}`} className="btn-outline block w-full text-center !border-[#B99552] !bg-[#F5EFE4]/55 !text-[#6F552A]">
                  {t("viewFullSnaplinkProfile", lang)}
                </a>
              )}
            </div>
          )}

          <button onClick={saveContact} className="btn-outline w-full !border-[#B99552] !bg-[#F5EFE4]/55 !text-[#6F552A]">
            {t("saveContact", lang)}
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-[#8A8074]">{t("poweredBySnaplinkProfile", lang)}</p>
    </main>
  );
}

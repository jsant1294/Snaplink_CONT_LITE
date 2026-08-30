"use client";

import { useEffect, useState } from "react";
import type { Contractor } from "@/lib/types";
import type { ContractorLandingPage } from "@/lib/landing-page-types";
import type { PublicationEligibility } from "@/lib/professional-intake-payment/types";
import { PROFESSION_TYPES } from "@/lib/profession-types";
import { LANDING_TEMPLATES, landingTemplateFor } from "@/lib/landing-templates";

type PublicContractor = Omit<Contractor, "pin">;
type Lang = "en" | "es";

const EMPTY_FORM = {
  headlineEn: "",
  headlineEs: "",
  subheadlineEn: "",
  subheadlineEs: "",
  ctaLabelEn: "",
  ctaLabelEs: "",
  ctaUrl: "",
  locationText: "",
  hoursText: "",
  noteText: "",
};

export default function LandingPageEditor({ pin, contractor }: { pin: string; contractor: PublicContractor | null }) {
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState(EMPTY_FORM);
  const [templateKey, setTemplateKey] = useState<string | undefined>(undefined);
  const [published, setPublished] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<PublicationEligibility | null>(null);

  const authHeaders = { "x-snaplink-pin": pin };

  useEffect(() => {
    if (!contractor) return;
    fetch(`/api/contractor/landing-page?contractorId=${contractor.id}`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => {
        const page: ContractorLandingPage = d.page;
        setEligibility(d.eligibility ?? null);
        setForm({
          headlineEn: page.headlineEn ?? "",
          headlineEs: page.headlineEs ?? "",
          subheadlineEn: page.subheadlineEn ?? "",
          subheadlineEs: page.subheadlineEs ?? "",
          ctaLabelEn: page.ctaLabelEn ?? "",
          ctaLabelEs: page.ctaLabelEs ?? "",
          ctaUrl: page.ctaUrl ?? "",
          locationText: page.locationText ?? "",
          hoursText: page.hoursText ?? "",
          noteText: page.noteText ?? "",
        });
        setTemplateKey(page.templateKey);
        setPublished(page.published);
        setHeroImageUrl(page.heroImageUrl ?? "");
      })
      .finally(() => setLoading(false));
    // contractor.id is stable for the life of this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractor?.id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  /** Fills empty fields only — never overwrites something already written. */
  function fillFromProfile() {
    if (!contractor) return;
    setForm((f) => ({
      ...f,
      headlineEn: f.headlineEn || contractor.businessName,
      subheadlineEn: f.subheadlineEn || contractor.tagline || "",
      locationText: f.locationText || contractor.serviceArea || "",
      ctaUrl: f.ctaUrl || contractor.website || "",
    }));
    showToast("Filled from profile — nothing you'd already written was overwritten.");
  }

  function applyTemplate(id: string) {
    const tpl = landingTemplateFor(id);
    setTemplateKey(id);
    setForm((f) => ({
      ...f,
      headlineEn: tpl.headlineEn,
      headlineEs: tpl.headlineEs,
      subheadlineEn: tpl.subheadlineEn,
      subheadlineEs: tpl.subheadlineEs,
      ctaLabelEn: tpl.ctaLabelEn,
      ctaLabelEs: tpl.ctaLabelEs,
    }));
  }

  async function uploadHero(file: File) {
    if (!contractor) return;
    setUploading(true);
    const body = new FormData();
    body.append("contractorId", contractor.id);
    body.append("kind", "hero");
    body.append("file", file);
    const res = await fetch("/api/contractor/avatar-upload", { method: "POST", headers: authHeaders, body });
    const data = await res.json();
    setUploading(false);
    if (data.url) setHeroImageUrl(data.url);
    else showToast(data.error ?? "Upload failed");
  }

  async function save() {
    if (!contractor) return;
    setSaving(true);
    const res = await fetch("/api/contractor/landing-page", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        contractorId: contractor.id,
        templateKey,
        published,
        heroImageUrl,
        ...form,
      }),
    });
    const data = await res.json();
    setSaving(false);
    showToast(res.ok ? "Saved" : (data.error ?? "Save failed"));
  }

  if (!contractor) return <p className="text-center pt-16 text-muted">Loading…</p>;
  if (loading) return <p className="text-center pt-16 text-muted">Loading…</p>;

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-5 pt-8 pb-20">
      <a href="/contractor-admin" className="text-sm text-muted">
        ← Operator console
      </a>
      <h1 className="font-display text-4xl mt-3 mb-1">Landing Page</h1>
      <p className="text-muted text-sm mb-6">{contractor.businessName} · /{contractor.username}</p>

      <div className="space-y-4">
        <div className="card p-4 border-gold/40">
          <p className="text-gold font-semibold mb-1">Use this client&apos;s own info</p>
          <p className="text-xs text-muted mb-3">
            Pulls the headline, description, and link straight from their profile. Only fills what&apos;s still
            empty — nothing you&apos;ve written gets overwritten.
          </p>
          <button onClick={fillFromProfile} className="btn-gold !py-2 !px-4 text-sm">
            Fill from profile
          </button>
        </div>

        <div>
          <p className="text-gold font-semibold mb-1">Start from a template</p>
          <p className="text-xs text-muted mb-3">Pick a trade to pre-fill headline copy. You can edit everything after.</p>
          <div className="flex flex-wrap gap-2">
            {PROFESSION_TYPES.filter((p) => p.id in LANDING_TEMPLATES).map((p) => (
              <button
                key={p.id}
                onClick={() => applyTemplate(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  templateKey === p.id ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15 text-bone"
                }`}
              >
                {p.en}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Published</p>
            <p className="text-xs text-muted mt-0.5">
              {published
                ? `Live — /contractor/${contractor.username} shows this landing page.`
                : `Off — /contractor/${contractor.username} keeps its current simple layout.`}
            </p>
            {eligibility && !eligibility.canPublish && published !== true && (
              <p className="mt-1 text-[11px] text-amber-300">Can&apos;t publish: {eligibility.reasons.join(" ")}</p>
            )}
          </div>
          <button
            onClick={() => setPublished((v) => !v)}
            disabled={!published && Boolean(eligibility) && !eligibility!.canPublish}
            aria-label="Toggle published"
            className={`w-12 h-7 rounded-full relative transition-colors ${
              published ? "bg-gold" : "bg-white/15"
            } ${!published && eligibility && !eligibility.canPublish ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-obsidian transition-transform ${
                published ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-1">Hero & link preview image</p>
          <p className="text-xs text-muted mb-3">
            Shown across the top of the page, and used as the preview picture when the link is texted or shared. Wide
            images work best.
          </p>
          {heroImageUrl && (
            <img src={heroImageUrl} alt="" className="w-full aspect-[2/1] rounded-lg object-cover border border-white/10 mb-3" />
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadHero(file);
            }}
            className="file-picker"
          />
        </div>

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

        <div className="card p-4 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Hero</p>
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              value={lang === "en" ? form.headlineEn : form.headlineEs}
              onChange={set(lang === "en" ? "headlineEn" : "headlineEs")}
            />
          </div>
          <div>
            <label className="label">Subheadline</label>
            <textarea
              className="input"
              rows={2}
              value={lang === "en" ? form.subheadlineEn : form.subheadlineEs}
              onChange={set(lang === "en" ? "subheadlineEn" : "subheadlineEs")}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Button label</label>
              <input
                className="input"
                value={lang === "en" ? form.ctaLabelEn : form.ctaLabelEs}
                onChange={set(lang === "en" ? "ctaLabelEn" : "ctaLabelEs")}
              />
            </div>
            <div>
              <label className="label">Button link (optional)</label>
              <input
                className="input"
                placeholder="https://…"
                value={form.ctaUrl}
                onChange={set("ctaUrl")}
              />
              <p className="text-[11px] text-muted mt-1">Set this and the button opens the link. Leave it blank and it uses their phone number.</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Business details</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.locationText} onChange={set("locationText")} />
            </div>
            <div>
              <label className="label">Hours</label>
              <input className="input" value={form.hoursText} onChange={set("hoursText")} />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Note (certifications, minimums, policies)</label>
            <input className="input" value={form.noteText} onChange={set("noteText")} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Services</p>
            <a href={`/contractor-admin/${contractor.username}/profile`} className="text-xs text-gold underline">
              Edit in Profile →
            </a>
          </div>
          <p className="text-xs text-muted">
            {contractor.services?.length ? `${contractor.services.length} services selected` : "No services selected yet"} — shown on the page automatically.
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Gallery images</p>
            <a href={`/contractor-admin/${contractor.username}/profile`} className="text-xs text-gold underline">
              Edit in Profile →
            </a>
          </div>
          <p className="text-xs text-muted">{contractor.galleryUrls?.length ?? 0}/6 photos — shown on the page automatically.</p>
        </div>

        <button onClick={save} disabled={saving} className="btn-gold w-full disabled:opacity-40">
          {saving ? "Saving…" : "Save page"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </main>
  );
}

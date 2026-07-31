"use client";

import { useState, useEffect } from "react";
import type {
  SouthlinePageSeoOverride,
  SouthlineRobotsContent,
  SouthlineSeoContent,
} from "@/lib/southline-types";

const PAGE_KEYS = ["home", "faq", "contact"] as const;
type PageKey = (typeof PAGE_KEYS)[number];

const ROBOT_FIELDS: { key: keyof SouthlineRobotsContent; label: string }[] = [
  { key: "index", label: "index" },
  { key: "follow", label: "follow" },
  { key: "noarchive", label: "noarchive" },
  { key: "nosnippet", label: "nosnippet" },
  { key: "noimageindex", label: "noimageindex" },
];

export default function SeoEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineSeoContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => setContent(d.settings.seo));
  }, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify({ seo: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.seo);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-muted text-sm">Loading SEO settings…</p>;

  function set(field: keyof SouthlineSeoContent, value: string | null) {
    setContent((current) => (current ? { ...current, [field]: value } : current));
  }

  function toggleRobot(field: keyof SouthlineRobotsContent, value: boolean) {
    setContent((current) =>
      current ? { ...current, defaultRobots: { ...current.defaultRobots, [field]: value } } : current
    );
  }

  function setPage(pageKey: PageKey, field: keyof SouthlinePageSeoOverride, value: string | null) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        pages: { ...current.pages, [pageKey]: { ...current.pages[pageKey], [field]: value } },
      };
    });
  }

  function setPageRobots(pageKey: PageKey, enabled: boolean) {
    setContent((current) => {
      if (!current) return current;
      const currentRobots = current.pages[pageKey].robots;
      const robots = enabled
        ? (currentRobots ?? { ...current.defaultRobots })
        : null;
      return {
        ...current,
        pages: { ...current.pages, [pageKey]: { ...current.pages[pageKey], robots } },
      };
    });
  }

  function togglePageRobot(pageKey: PageKey, field: keyof SouthlineRobotsContent, value: boolean) {
    setContent((current) => {
      if (!current) return current;
      const page = current.pages[pageKey];
      return {
        ...current,
        pages: {
          ...current.pages,
          [pageKey]: {
            ...page,
            robots: { ...(page.robots ?? current.defaultRobots), [field]: value },
          },
        },
      };
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">
        Control the global metadata (title, description, canonical URL, social share cards, robots and
        verification) plus per-page overrides for Home, FAQ, and Contact. Blank fields fall back to the
        site&apos;s built-in defaults; blank Spanish fields fall back to their English value.
      </p>

      <section className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
        <p className="text-sm font-medium text-gold">Defaults</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Site name" value={content.siteName} onChange={(v) => set("siteName", v)} placeholder="Southline Living" />
          <Field label="Canonical site URL" value={content.canonicalSiteUrl} onChange={(v) => set("canonicalSiteUrl", v)} placeholder="https://southlineliving.com" />
          <Field label="Default title (EN)" value={content.defaultTitle} onChange={(v) => set("defaultTitle", v)} placeholder="Southline Living — Home ideas and trusted professionals" />
          <Field label="Default title (ES)" value={content.defaultTitleEs} onChange={(v) => set("defaultTitleEs", v)} placeholder="Southline Living — Ideas para tu hogar y profesionales de confianza" />
          <Field label="Title template (EN)" value={content.titleTemplate} onChange={(v) => set("titleTemplate", v)} placeholder="%s | Southline Living" />
          <Field label="Title template (ES)" value={content.titleTemplateEs} onChange={(v) => set("titleTemplateEs", v)} placeholder="%s | Southline Living" />
          <TextareaField label="Default description (EN)" value={content.defaultDescription} onChange={(v) => set("defaultDescription", v)} placeholder="Explore inspiring spaces, plan your next project, and connect with local Snaplink professionals." />
          <TextareaField label="Default description (ES)" value={content.defaultDescriptionEs} onChange={(v) => set("defaultDescriptionEs", v)} placeholder="Explora espacios inspiradores, planifica tu próximo proyecto y conecta con profesionales locales de Snaplink." />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
        <p className="text-sm font-medium text-gold">Open Graph (social sharing)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="OG title (EN)" value={content.defaultOpenGraphTitle} onChange={(v) => set("defaultOpenGraphTitle", v)} placeholder="Southline Living — Ideas for every home" />
          <Field label="OG title (ES)" value={content.defaultOpenGraphTitleEs} onChange={(v) => set("defaultOpenGraphTitleEs", v)} placeholder="Southline Living — Ideas para cada hogar" />
          <TextareaField label="OG description (EN)" value={content.defaultOpenGraphDescription} onChange={(v) => set("defaultOpenGraphDescription", v)} placeholder="Explore, plan, and connect with trusted home professionals." />
          <TextareaField label="OG description (ES)" value={content.defaultOpenGraphDescriptionEs} onChange={(v) => set("defaultOpenGraphDescriptionEs", v)} placeholder="Explora, planifica y conecta con profesionales de confianza para tu hogar." />
          <Field label="OG image URL" value={content.defaultOpenGraphImageUrl} onChange={(v) => set("defaultOpenGraphImageUrl", v)} placeholder="/og-image.png" />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
        <p className="text-sm font-medium text-gold">Twitter card</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Twitter title (EN)" value={content.defaultTwitterTitle} onChange={(v) => set("defaultTwitterTitle", v)} />
          <Field label="Twitter title (ES)" value={content.defaultTwitterTitleEs} onChange={(v) => set("defaultTwitterTitleEs", v)} />
          <TextareaField label="Twitter description (EN)" value={content.defaultTwitterDescription} onChange={(v) => set("defaultTwitterDescription", v)} />
          <TextareaField label="Twitter description (ES)" value={content.defaultTwitterDescriptionEs} onChange={(v) => set("defaultTwitterDescriptionEs", v)} />
          <Field label="Twitter image URL" value={content.defaultTwitterImageUrl} onChange={(v) => set("defaultTwitterImageUrl", v)} placeholder="/og-image.png" />
          <div>
            <label className="label">Card type</label>
            <select
              className="input"
              value={content.twitterCardType}
              onChange={(e) => set("twitterCardType", e.target.value)}
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
        <p className="text-sm font-medium text-gold">Robots (default, applied everywhere)</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {ROBOT_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <span className="w-28 text-muted">{label}</span>
              <Toggle on={content.defaultRobots[key]} onToggle={() => toggleRobot(key, !content.defaultRobots[key])} />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
        <p className="text-sm font-medium text-gold">Organization (JSON-LD)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Organization name" value={content.organizationName} onChange={(v) => set("organizationName", v)} />
          <Field label="Organization logo URL" value={content.organizationLogoUrl} onChange={(v) => set("organizationLogoUrl", v)} placeholder="https://.../logo.png" />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
        <p className="text-sm font-medium text-gold">Verification</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Google site verification" value={content.googleSiteVerification} onChange={(v) => set("googleSiteVerification", v)} />
          <Field label="Bing site verification" value={content.bingSiteVerification} onChange={(v) => set("bingSiteVerification", v)} />
        </div>
      </section>

      {PAGE_KEYS.map((pageKey) => {
        const page = content.pages[pageKey];
        const robotsEnabled = page.robots !== null;
        return (
          <section key={pageKey} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
            <p className="text-sm font-medium text-gold uppercase tracking-wider">{pageKey} page</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title (EN)" value={page.title} onChange={(v) => setPage(pageKey, "title", v)} />
              <Field label="Title (ES)" value={page.titleEs} onChange={(v) => setPage(pageKey, "titleEs", v)} />
              <TextareaField label="Description (EN)" value={page.description} onChange={(v) => setPage(pageKey, "description", v)} />
              <TextareaField label="Description (ES)" value={page.descriptionEs} onChange={(v) => setPage(pageKey, "descriptionEs", v)} />
              <Field label="Canonical path" value={page.canonicalPath} onChange={(v) => setPage(pageKey, "canonicalPath", v)} placeholder={pageKey === "home" ? "/" : `/${pageKey}`} />
              <Field label="OG image URL" value={page.openGraphImageUrl} onChange={(v) => setPage(pageKey, "openGraphImageUrl", v)} placeholder="/og-image.png" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="OG title (EN)" value={page.openGraphTitle} onChange={(v) => setPage(pageKey, "openGraphTitle", v)} />
              <Field label="OG title (ES)" value={page.openGraphTitleEs} onChange={(v) => setPage(pageKey, "openGraphTitleEs", v)} />
              <TextareaField label="OG description (EN)" value={page.openGraphDescription} onChange={(v) => setPage(pageKey, "openGraphDescription", v)} />
              <TextareaField label="OG description (ES)" value={page.openGraphDescriptionEs} onChange={(v) => setPage(pageKey, "openGraphDescriptionEs", v)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Twitter title (EN)" value={page.twitterTitle} onChange={(v) => setPage(pageKey, "twitterTitle", v)} />
              <Field label="Twitter title (ES)" value={page.twitterTitleEs} onChange={(v) => setPage(pageKey, "twitterTitleEs", v)} />
              <TextareaField label="Twitter description (EN)" value={page.twitterDescription} onChange={(v) => setPage(pageKey, "twitterDescription", v)} />
              <TextareaField label="Twitter description (ES)" value={page.twitterDescriptionEs} onChange={(v) => setPage(pageKey, "twitterDescriptionEs", v)} />
              <Field label="Twitter image URL" value={page.twitterImageUrl} onChange={(v) => setPage(pageKey, "twitterImageUrl", v)} placeholder="/og-image.png" />
            </div>
            <div className="pt-1">
              <label className="flex items-center justify-between border-t border-white/5 py-3">
                <span className="text-sm">Custom robots for this page</span>
                <Toggle on={robotsEnabled} onToggle={() => setPageRobots(pageKey, !robotsEnabled)} />
              </label>
              {robotsEnabled && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 pb-2">
                  {ROBOT_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <span className="w-28 text-muted">{label}</span>
                      <Toggle
                        on={(page.robots ?? content.defaultRobots)[key]}
                        onToggle={() => togglePageRobot(pageKey, key, !(page.robots ?? content.defaultRobots)[key])}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <div>
        <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save SEO Settings"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input !resize-y" rows={2} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} />
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-10 h-6 rounded-full transition-colors ${on ? "bg-gold" : "bg-white/10"}`}
    >
      <span
        className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 mx-0.5 ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

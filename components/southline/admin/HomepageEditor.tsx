"use client";

import { useState, useEffect } from "react";
import type { SouthlineSettings, HeroContent, SectionVisibility } from "@/lib/southline-types";

export default function HomepageEditor({ pin }: { pin: string }) {
  const [settings, setSettings] = useState<SouthlineSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hero" | "sections">("hero");

  useEffect(() => {
    fetch("/api/southline/settings", {
      headers: { "x-snaplink-pin": pin },
    })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save(patch: Partial<SouthlineSettings>) {
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return <p className="text-muted text-sm">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("hero")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
            activeTab === "hero"
              ? "bg-charcoal text-bone border border-white/10 border-b-transparent"
              : "text-muted hover:text-bone"
          }`}
        >
          Hero & Copy
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
            activeTab === "sections"
              ? "bg-charcoal text-bone border border-white/10 border-b-transparent"
              : "text-muted hover:text-bone"
          }`}
        >
          Sections
        </button>
      </div>

      {activeTab === "hero" && (
        <HeroTab hero={settings.hero} busy={busy} onSave={save} />
      )}
      {activeTab === "sections" && (
        <SectionsTab sections={settings.sections} busy={busy} onSave={save} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function HeroTab({
  hero,
  busy,
  onSave,
}: {
  hero: HeroContent;
  busy: boolean;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(hero);

  useEffect(() => setLocal(hero), [hero]);

  const fields: { key: keyof HeroContent; label: string; rows?: number }[] = [
    { key: "tagline", label: "Tagline" },
    { key: "titleEs", label: "Title (ES)", rows: 2 },
    { key: "titleEn", label: "Title (EN)", rows: 2 },
    { key: "subtitleEs", label: "Subtitle (ES)", rows: 2 },
    { key: "subtitleEn", label: "Subtitle (EN)", rows: 2 },
    { key: "searchPromptEs", label: "Search prompt (ES)" },
    { key: "searchPromptEn", label: "Search prompt (EN)" },
    { key: "ctaExploreEs", label: "Explore CTA (ES)" },
    { key: "ctaExploreEn", label: "Explore CTA (EN)" },
    { key: "ctaPlanEs", label: "Plan CTA (ES)" },
    { key: "ctaPlanEn", label: "Plan CTA (EN)" },
    { key: "ctaFindProEs", label: "Find Pro CTA (ES)" },
    { key: "ctaFindProEn", label: "Find Pro CTA (EN)" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the hero section copy. Spanish is the default consumer language.
      </p>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="label">{f.label}</label>
          {f.rows ? (
            <textarea
              className="input !resize-y"
              rows={f.rows}
              value={local[f.key] as string}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
            />
          ) : (
            <input
              className="input"
              value={local[f.key] as string}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
            />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave({ hero: local })}
        disabled={busy}
        className="btn-gold disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save hero"}
      </button>
    </div>
  );
}

function SectionsTab({
  sections,
  busy,
  onSave,
}: {
  sections: SectionVisibility;
  busy: boolean;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(sections);

  useEffect(() => setLocal(sections), [sections]);

  const items: { key: keyof SectionVisibility; label: string }[] = [
    { key: "hero", label: "Hero section" },
    { key: "categories", label: "Inspiration categories" },
    { key: "featuredPros", label: "Featured professionals" },
    { key: "featuredAgents", label: "Real estate discovery block" },
    { key: "featuredHomes", label: "Featured homes" },
    { key: "featuredServices", label: "Featured services marketplace" },
    { key: "poweredBySnaplink", label: "Powered by SnapLink" },
    { key: "diyLearning", label: "DIY learning" },
    { key: "trending", label: "Trending & editorial" },
    { key: "seasonalIdeas", label: "Seasonal ideas banner" },
    { key: "costEstimator", label: "Cost estimator CTA" },
    { key: "bookConsultation", label: "Book consultation CTA" },
    { key: "recruitment", label: "Become a SnapLink Professional CTA" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">Toggle homepage sections on or off.</p>
      {items.map((item) => (
        <label
          key={item.key}
          className="flex items-center justify-between py-3 border-b border-white/5"
        >
          <span className="text-sm">{item.label}</span>
          <button
            onClick={() => {
              const next = { ...local, [item.key]: !local[item.key] };
              setLocal(next);
              onSave({ sections: next });
            }}
            className={`w-10 h-6 rounded-full transition-colors ${
              local[item.key] ? "bg-gold" : "bg-white/10"
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 mx-0.5 ${
                local[item.key] ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      ))}
    </div>
  );
}

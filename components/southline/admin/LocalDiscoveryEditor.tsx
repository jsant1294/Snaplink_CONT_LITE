"use client";

import { useState, useEffect } from "react";
import type { SouthlineLocalCategory, SouthlineLocalDiscoveryContent } from "@/lib/southline-types";

export default function LocalDiscoveryEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineLocalDiscoveryContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => setContent(d.settings.localDiscovery));
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
        body: JSON.stringify({ localDiscovery: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.localDiscovery);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-muted text-sm">Loading local discovery…</p>;

  function set(field: keyof SouthlineLocalDiscoveryContent, value: string | null | boolean) {
    setContent((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateCategory(index: number, patch: Partial<SouthlineLocalCategory>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: current.categories.map((category, i) =>
          i === index ? { ...category, ...patch } : category
        ),
      };
    });
  }

  function moveCategory(index: number, offset: number) {
    setContent((current) => {
      if (!current) return current;
      const next = [...current.categories];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...current, categories: next.map((category, i) => ({ ...category, order: i })) };
    });
  }

  function addCategory() {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: [
          ...current.categories,
          {
            id: `category_${Date.now()}`,
            labelEn: "",
            labelEs: "",
            descriptionEn: null,
            descriptionEs: null,
            icon: null,
            imageUrl: null,
            snaplinkCategory: null,
            visible: true,
            featured: false,
            order: current.categories.length,
          },
        ],
      };
    });
  }

  function removeCategory(index: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: current.categories
          .filter((_, i) => i !== index)
          .map((category, i) => ({ ...category, order: i })),
      };
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Local discovery sends visitors from Southline to the SnapLink local directory by ZIP code and
        category. Categories are entry-point placeholders only — no merchant names, ratings, or counts
        are fabricated here. Blank Spanish fields fall back to their English value.
      </p>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Local discovery enabled</span>
        <Toggle on={content.enabled} onToggle={() => set("enabled", !content.enabled)} />
      </label>
      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Show on homepage</span>
        <Toggle on={content.showOnHomepage} onToggle={() => set("showOnHomepage", !content.showOnHomepage)} />
      </label>
      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Show category cards</span>
        <Toggle on={content.showCategoryCards} onToggle={() => set("showCategoryCards", !content.showCategoryCards)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Eyebrow (EN)</label>
          <input className="input" value={content.eyebrowEn ?? ""} onChange={(e) => set("eyebrowEn", e.target.value || null)} placeholder="Local" />
        </div>
        <div>
          <label className="label">Eyebrow (ES)</label>
          <input className="input" value={content.eyebrowEs ?? ""} onChange={(e) => set("eyebrowEs", e.target.value || null)} placeholder="Local" />
        </div>
        <div>
          <label className="label">Title (EN)</label>
          <input className="input" value={content.titleEn ?? ""} onChange={(e) => set("titleEn", e.target.value || null)} placeholder="Find trusted professionals near you" />
        </div>
        <div>
          <label className="label">Title (ES)</label>
          <input className="input" value={content.titleEs ?? ""} onChange={(e) => set("titleEs", e.target.value || null)} placeholder="Encuentra profesionales de confianza cerca de ti" />
        </div>
        <div>
          <label className="label">Description (EN)</label>
          <textarea className="input !resize-y" rows={2} value={content.descriptionEn ?? ""} onChange={(e) => set("descriptionEn", e.target.value || null)} placeholder="Enter your ZIP code to browse local professionals powered by SnapLink." />
        </div>
        <div>
          <label className="label">Description (ES)</label>
          <textarea className="input !resize-y" rows={2} value={content.descriptionEs ?? ""} onChange={(e) => set("descriptionEs", e.target.value || null)} placeholder="Ingresa tu código postal para explorar profesionales locales en SnapLink." />
        </div>
        <div>
          <label className="label">ZIP placeholder (EN)</label>
          <input className="input" value={content.zipPlaceholderEn ?? ""} onChange={(e) => set("zipPlaceholderEn", e.target.value || null)} placeholder="e.g. 75204" />
        </div>
        <div>
          <label className="label">ZIP placeholder (ES)</label>
          <input className="input" value={content.zipPlaceholderEs ?? ""} onChange={(e) => set("zipPlaceholderEs", e.target.value || null)} placeholder="ej. 75204" />
        </div>
        <div>
          <label className="label">Submit label (EN)</label>
          <input className="input" value={content.submitLabelEn ?? ""} onChange={(e) => set("submitLabelEn", e.target.value || null)} placeholder="Continue to SnapLink" />
        </div>
        <div>
          <label className="label">Submit label (ES)</label>
          <input className="input" value={content.submitLabelEs ?? ""} onChange={(e) => set("submitLabelEs", e.target.value || null)} placeholder="Continuar a SnapLink" />
        </div>
        <div>
          <label className="label">Powered-by label (EN)</label>
          <input className="input" value={content.poweredByLabelEn ?? ""} onChange={(e) => set("poweredByLabelEn", e.target.value || null)} placeholder="Powered by the SnapLink professional network" />
        </div>
        <div>
          <label className="label">Powered-by label (ES)</label>
          <input className="input" value={content.poweredByLabelEs ?? ""} onChange={(e) => set("poweredByLabelEs", e.target.value || null)} placeholder="Impulsado por la red profesional de SnapLink" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">SnapLink directory URL</label>
          <input className="input" value={content.directoryBaseUrl ?? ""} onChange={(e) => set("directoryBaseUrl", e.target.value || null)} placeholder="https://snaplink.southlineone.com/en/local" />
          <p className="text-xs text-muted mt-1">The locale segment is resolved automatically for each language. Host comes from this trusted CMS setting only.</p>
        </div>
        <div>
          <label className="label">Default category (id)</label>
          <input className="input" value={content.defaultCategory ?? ""} onChange={(e) => set("defaultCategory", e.target.value || null)} placeholder="interior-designers" />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Categories</p>
      </div>
      {content.categories.map((category, index) => (
        <div key={category.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">
              {category.labelEn || `Category ${index + 1}`}
              <span className="ml-2 text-xs text-muted font-normal">({category.id})</span>
            </span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveCategory(index, -1)} disabled={index === 0} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => moveCategory(index, 1)} disabled={index === content.categories.length - 1} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Visible
                <Toggle on={category.visible} onToggle={() => updateCategory(index, { visible: !category.visible })} />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                Featured
                <Toggle on={category.featured} onToggle={() => updateCategory(index, { featured: !category.featured })} />
              </label>
              <button type="button" onClick={() => removeCategory(index)} className="text-xs text-danger">
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">ID</label>
              <input className="input" value={category.id} onChange={(e) => updateCategory(index, { id: e.target.value })} placeholder="interior-designers" />
            </div>
            <div>
              <label className="label">SnapLink category</label>
              <input className="input" value={category.snaplinkCategory ?? ""} onChange={(e) => updateCategory(index, { snaplinkCategory: e.target.value || null })} placeholder="optional SnapLink category slug" />
            </div>
            <div>
              <label className="label">Label (EN)</label>
              <input className="input" value={category.labelEn} onChange={(e) => updateCategory(index, { labelEn: e.target.value })} />
            </div>
            <div>
              <label className="label">Label (ES)</label>
              <input className="input" value={category.labelEs} onChange={(e) => updateCategory(index, { labelEs: e.target.value })} />
            </div>
            <div>
              <label className="label">Description (EN)</label>
              <input className="input" value={category.descriptionEn ?? ""} onChange={(e) => updateCategory(index, { descriptionEn: e.target.value || null })} placeholder="Browse local interior designers" />
            </div>
            <div>
              <label className="label">Description (ES)</label>
              <input className="input" value={category.descriptionEs ?? ""} onChange={(e) => updateCategory(index, { descriptionEs: e.target.value || null })} placeholder="Explora diseñadores de interiores locales" />
            </div>
            <div>
              <label className="label">Icon</label>
              <input className="input" value={category.icon ?? ""} onChange={(e) => updateCategory(index, { icon: e.target.value || null })} placeholder="optional, hidden from screen readers" />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={category.imageUrl ?? ""} onChange={(e) => updateCategory(index, { imageUrl: e.target.value || null })} placeholder="https://..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addCategory} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Category
      </button>

      <div>
        <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save Local Discovery"}
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

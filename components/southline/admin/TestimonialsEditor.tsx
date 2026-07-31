"use client";

import { useState, useEffect } from "react";
import type { SouthlineTestimonialItem, SouthlineTestimonialsContent } from "@/lib/southline-types";

export default function TestimonialsEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineTestimonialsContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => setContent(d.settings.testimonials));
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
        body: JSON.stringify({ testimonials: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.testimonials);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-muted text-sm">Loading testimonials…</p>;

  function set(field: keyof SouthlineTestimonialsContent, value: string | null) {
    setContent((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateItem(index: number, patch: Partial<SouthlineTestimonialItem>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      };
    });
  }

  function moveItem(index: number, offset: number) {
    setContent((current) => {
      if (!current) return current;
      const next = [...current.items];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...current, items: next.map((item, i) => ({ ...item, sortOrder: i })) };
    });
  }

  function addItem() {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        items: [
          ...current.items,
          {
            id: `testimonial_${Date.now()}`,
            quote: "",
            quoteEs: null,
            authorName: "",
            authorNameEs: null,
            authorTitle: null,
            authorTitleEs: null,
            companyName: null,
            companyNameEs: null,
            imageUrl: null,
            rating: null,
            sourceLabel: null,
            sourceUrl: null,
            enabled: true,
            featured: false,
            sortOrder: current.items.length,
          },
        ],
      };
    });
  }

  function removeItem(index: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sortOrder: i })),
      };
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Manage curated testimonials shown on the homepage. With no items, the section stays hidden. Blank Spanish
        fields fall back to their English value.
      </p>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Testimonials section enabled</span>
        <Toggle on={content.enabled} onToggle={() => setContent({ ...content, enabled: !content.enabled })} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Heading (EN)</label>
          <input className="input" value={content.heading ?? ""} onChange={(e) => set("heading", e.target.value || null)} placeholder="What homeowners say" />
        </div>
        <div>
          <label className="label">Heading (ES)</label>
          <input className="input" value={content.headingEs ?? ""} onChange={(e) => set("headingEs", e.target.value || null)} placeholder="Lo que dicen los propietarios" />
        </div>
        <div>
          <label className="label">Body (EN)</label>
          <textarea className="input !resize-y" rows={2} value={content.body ?? ""} onChange={(e) => set("body", e.target.value || null)} />
        </div>
        <div>
          <label className="label">Body (ES)</label>
          <textarea className="input !resize-y" rows={2} value={content.bodyEs ?? ""} onChange={(e) => set("bodyEs", e.target.value || null)} />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Review CTA</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Button label (EN)</label>
          <input className="input" value={content.reviewCtaLabel ?? ""} onChange={(e) => set("reviewCtaLabel", e.target.value || null)} placeholder="Leave a review" />
        </div>
        <div>
          <label className="label">Button label (ES)</label>
          <input className="input" value={content.reviewCtaLabelEs ?? ""} onChange={(e) => set("reviewCtaLabelEs", e.target.value || null)} placeholder="Deja una reseña" />
        </div>
        <div>
          <label className="label">Review URL</label>
          <input className="input" value={content.reviewCtaUrl ?? ""} onChange={(e) => set("reviewCtaUrl", e.target.value || null)} placeholder="https://..." />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Testimonials</p>
      </div>
      {content.items.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">Testimonial {index + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  ↑
                </button>
                <button type="button" onClick={() => moveItem(index, 1)} disabled={index === content.items.length - 1} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Visible
                <Toggle on={item.enabled} onToggle={() => updateItem(index, { enabled: !item.enabled })} />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                Featured
                <Toggle on={item.featured} onToggle={() => updateItem(index, { featured: !item.featured })} />
              </label>
              <button type="button" onClick={() => removeItem(index)} className="text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2">
                Remove
              </button>
            </div>
          </div>

          <div>
            <label className="label">Quote (EN)</label>
            <textarea className="input !resize-y" rows={2} value={item.quote} onChange={(e) => updateItem(index, { quote: e.target.value })} />
          </div>
          <div>
            <label className="label">Quote (ES)</label>
            <textarea className="input !resize-y" rows={2} value={item.quoteEs ?? ""} onChange={(e) => updateItem(index, { quoteEs: e.target.value || null })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Author name (EN)</label>
              <input className="input" value={item.authorName} onChange={(e) => updateItem(index, { authorName: e.target.value })} />
            </div>
            <div>
              <label className="label">Author name (ES)</label>
              <input className="input" value={item.authorNameEs ?? ""} onChange={(e) => updateItem(index, { authorNameEs: e.target.value || null })} />
            </div>
            <div>
              <label className="label">Author title (EN)</label>
              <input className="input" value={item.authorTitle ?? ""} onChange={(e) => updateItem(index, { authorTitle: e.target.value || null })} placeholder="Homeowner" />
            </div>
            <div>
              <label className="label">Author title (ES)</label>
              <input className="input" value={item.authorTitleEs ?? ""} onChange={(e) => updateItem(index, { authorTitleEs: e.target.value || null })} />
            </div>
            <div>
              <label className="label">Company name (EN)</label>
              <input className="input" value={item.companyName ?? ""} onChange={(e) => updateItem(index, { companyName: e.target.value || null })} />
            </div>
            <div>
              <label className="label">Company name (ES)</label>
              <input className="input" value={item.companyNameEs ?? ""} onChange={(e) => updateItem(index, { companyNameEs: e.target.value || null })} />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={item.imageUrl ?? ""} onChange={(e) => updateItem(index, { imageUrl: e.target.value || null })} placeholder="https://...avatar.jpg" />
            </div>
            <div>
              <label className="label">Rating (1–5)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={item.rating ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateItem(index, { rating: value === "" ? null : Number(value) });
                }}
              />
            </div>
            <div>
              <label className="label">Source label</label>
              <input className="input" value={item.sourceLabel ?? ""} onChange={(e) => updateItem(index, { sourceLabel: e.target.value || null })} placeholder="Google" />
            </div>
            <div>
              <label className="label">Source URL</label>
              <input className="input" value={item.sourceUrl ?? ""} onChange={(e) => updateItem(index, { sourceUrl: e.target.value || null })} placeholder="https://g.page/..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Testimonial
      </button>

      <div>
        <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save Testimonials"}
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

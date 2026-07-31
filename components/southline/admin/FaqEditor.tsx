"use client";

import { useState, useEffect } from "react";
import type { SouthlineFaqContent, SouthlineFaqItem } from "@/lib/southline-types";

export default function FaqEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineFaqContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => setContent(d.settings.faq));
  }, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save(patch: Partial<SouthlineFaqContent>) {
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify({ faq: { ...content, ...patch } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.faq);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-muted text-sm">Loading FAQ…</p>;

  function updateItem(index: number, patch: Partial<SouthlineFaqItem>) {
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
      return { ...current, items: next.map((it, i) => ({ ...it, sortOrder: i })) };
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
            id: `faq_${Date.now()}`,
            questionEn: "",
            questionEs: "",
            answerEn: "",
            answerEs: "",
            visible: true,
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
        items: current.items.filter((_, i) => i !== index).map((it, i) => ({ ...it, sortOrder: i })),
      };
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Manage the FAQ page. Disabling it takes the FAQ page offline. With no items, the page shows the default reviewed FAQ content.
      </p>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">FAQ enabled</span>
        <Toggle on={content.enabled} onToggle={() => save({ enabled: !content.enabled })} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Eyebrow (ES)</label>
          <input className="input" value={content.eyebrowEs ?? ""} onChange={(e) => setContent({ ...content, eyebrowEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Eyebrow (EN)</label>
          <input className="input" value={content.eyebrowEn ?? ""} onChange={(e) => setContent({ ...content, eyebrowEn: e.target.value })} />
        </div>
        <div>
          <label className="label">Title (ES)</label>
          <input className="input" value={content.titleEs ?? ""} onChange={(e) => setContent({ ...content, titleEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Title (EN)</label>
          <input className="input" value={content.titleEn ?? ""} onChange={(e) => setContent({ ...content, titleEn: e.target.value })} />
        </div>
        <div>
          <label className="label">Subtitle (ES)</label>
          <textarea className="input !resize-y" rows={2} value={content.subtitleEs ?? ""} onChange={(e) => setContent({ ...content, subtitleEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Subtitle (EN)</label>
          <textarea className="input !resize-y" rows={2} value={content.subtitleEn ?? ""} onChange={(e) => setContent({ ...content, subtitleEn: e.target.value })} />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Questions</p>
      </div>
      {content.items.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">Question {index + 1}</span>
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
                <Toggle on={item.visible} onToggle={() => updateItem(index, { visible: !item.visible })} />
              </label>
              <button type="button" onClick={() => removeItem(index)} className="text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2">
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Question (ES)</label>
              <input className="input" value={item.questionEs} onChange={(e) => updateItem(index, { questionEs: e.target.value })} />
            </div>
            <div>
              <label className="label">Question (EN)</label>
              <input className="input" value={item.questionEn} onChange={(e) => updateItem(index, { questionEn: e.target.value })} />
            </div>
            <div>
              <label className="label">Answer (ES)</label>
              <textarea className="input !resize-y" rows={3} value={item.answerEs} onChange={(e) => updateItem(index, { answerEs: e.target.value })} />
            </div>
            <div>
              <label className="label">Answer (EN)</label>
              <textarea className="input !resize-y" rows={3} value={item.answerEn} onChange={(e) => updateItem(index, { answerEn: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Question
      </button>
      <div>
        <button onClick={() => save({})} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save FAQ"}
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

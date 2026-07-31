"use client";

import { useState, useEffect } from "react";
import type { SouthlineFooterColumn, SouthlineFooterContent, SouthlineFooterLink } from "@/lib/southline-types";

export default function FooterEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineFooterContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => setContent(d.settings.footer));
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
        body: JSON.stringify({ footer: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.footer);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-muted text-sm">Loading footer…</p>;

  function updateColumn(index: number, patch: Partial<SouthlineFooterColumn>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((col, i) => (i === index ? { ...col, ...patch } : col)),
      };
    });
  }

  function moveColumn(index: number, offset: number) {
    setContent((current) => {
      if (!current) return current;
      const next = [...current.columns];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [col] = next.splice(index, 1);
      next.splice(target, 0, col);
      return { ...current, columns: next.map((c, i) => ({ ...c, sortOrder: i })) };
    });
  }

  function addColumn() {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: [
          ...current.columns,
          {
            id: `col_${Date.now()}`,
            titleEn: "",
            titleEs: "",
            visible: true,
            sortOrder: current.columns.length,
            links: [],
          },
        ],
      };
    });
  }

  function removeColumn(index: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.filter((_, i) => i !== index).map((c, i) => ({ ...c, sortOrder: i })),
      };
    });
  }

  function updateLink(columnIndex: number, linkIndex: number, patch: Partial<SouthlineFooterLink>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((col, ci) =>
          ci === columnIndex
            ? { ...col, links: col.links.map((link, li) => (li === linkIndex ? { ...link, ...patch } : link)) }
            : col
        ),
      };
    });
  }

  function moveLink(columnIndex: number, linkIndex: number, offset: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((col, ci) => {
          if (ci !== columnIndex) return col;
          const next = [...col.links];
          const target = linkIndex + offset;
          if (target < 0 || target >= next.length) return col;
          const [link] = next.splice(linkIndex, 1);
          next.splice(target, 0, link);
          return { ...col, links: next.map((l, li) => ({ ...l, sortOrder: li })) };
        }),
      };
    });
  }

  function addLink(columnIndex: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((col, ci) =>
          ci === columnIndex
            ? {
                ...col,
                links: [
                  ...col.links,
                  {
                    id: `link_${Date.now()}_${columnIndex}`,
                    labelEn: "",
                    labelEs: "",
                    href: "/",
                    visible: true,
                    sortOrder: col.links.length,
                  },
                ],
              }
            : col
        ),
      };
    });
  }

  function removeLink(columnIndex: number, linkIndex: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((col, ci) =>
          ci === columnIndex
            ? { ...col, links: col.links.filter((_, li) => li !== linkIndex).map((l, li) => ({ ...l, sortOrder: li })) }
            : col
        ),
      };
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Manage the site footer. With no columns, the footer shows its default columns. Text fields fall back to defaults when blank.
      </p>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Footer visible</span>
        <Toggle on={content.visible} onToggle={() => setContent({ ...content, visible: !content.visible })} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tagline (ES)</label>
          <textarea className="input !resize-y" rows={2} value={content.taglineEs ?? ""} onChange={(e) => setContent({ ...content, taglineEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Tagline (EN)</label>
          <textarea className="input !resize-y" rows={2} value={content.taglineEn ?? ""} onChange={(e) => setContent({ ...content, taglineEn: e.target.value })} />
        </div>
      </div>

      <div className="border-b border-white/5 pt-2">
        <label className="flex items-center justify-between py-3">
          <span className="text-sm">Newsletter section</span>
          <Toggle on={content.newsletterVisible} onToggle={() => setContent({ ...content, newsletterVisible: !content.newsletterVisible })} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Newsletter title (ES)</label>
          <input className="input" value={content.newsletterTitleEs ?? ""} onChange={(e) => setContent({ ...content, newsletterTitleEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Newsletter title (EN)</label>
          <input className="input" value={content.newsletterTitleEn ?? ""} onChange={(e) => setContent({ ...content, newsletterTitleEn: e.target.value })} />
        </div>
        <div>
          <label className="label">Newsletter description (ES)</label>
          <textarea className="input !resize-y" rows={2} value={content.newsletterDescEs ?? ""} onChange={(e) => setContent({ ...content, newsletterDescEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Newsletter description (EN)</label>
          <textarea className="input !resize-y" rows={2} value={content.newsletterDescEn ?? ""} onChange={(e) => setContent({ ...content, newsletterDescEn: e.target.value })} />
        </div>
        <div>
          <label className="label">Copyright (ES)</label>
          <input className="input" value={content.copyrightEs ?? ""} onChange={(e) => setContent({ ...content, copyrightEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Copyright (EN)</label>
          <input className="input" value={content.copyrightEn ?? ""} onChange={(e) => setContent({ ...content, copyrightEn: e.target.value })} />
        </div>
        <div>
          <label className="label">Powered by (ES)</label>
          <input className="input" value={content.poweredByEs ?? ""} onChange={(e) => setContent({ ...content, poweredByEs: e.target.value })} />
        </div>
        <div>
          <label className="label">Powered by (EN)</label>
          <input className="input" value={content.poweredByEn ?? ""} onChange={(e) => setContent({ ...content, poweredByEn: e.target.value })} />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Columns</p>
      </div>
      {content.columns.map((column, columnIndex) => (
        <div key={column.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">Column {columnIndex + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveColumn(columnIndex, -1)} disabled={columnIndex === 0} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => moveColumn(columnIndex, 1)} disabled={columnIndex === content.columns.length - 1} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Visible
                <Toggle on={column.visible} onToggle={() => updateColumn(columnIndex, { visible: !column.visible })} />
              </label>
              <button type="button" onClick={() => removeColumn(columnIndex)} className="text-xs text-danger">
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Column title (ES)</label>
              <input className="input" value={column.titleEs} onChange={(e) => updateColumn(columnIndex, { titleEs: e.target.value })} />
            </div>
            <div>
              <label className="label">Column title (EN)</label>
              <input className="input" value={column.titleEn} onChange={(e) => updateColumn(columnIndex, { titleEn: e.target.value })} />
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs font-medium text-muted mb-2">Links</p>
          </div>
          {column.links.map((link, linkIndex) => (
            <div key={link.id} className="space-y-2 rounded-lg border border-white/10 bg-charcoal/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Link {linkIndex + 1}</span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveLink(columnIndex, linkIndex, -1)} disabled={linkIndex === 0} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                      ↑
                    </button>
                    <button type="button" onClick={() => moveLink(columnIndex, linkIndex, 1)} disabled={linkIndex === column.links.length - 1} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                      ↓
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    Visible
                    <Toggle on={link.visible} onToggle={() => updateLink(columnIndex, linkIndex, { visible: !link.visible })} />
                  </label>
                  <button type="button" onClick={() => removeLink(columnIndex, linkIndex)} className="text-xs text-danger">
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="label">Label (ES)</label>
                  <input className="input" value={link.labelEs} onChange={(e) => updateLink(columnIndex, linkIndex, { labelEs: e.target.value })} />
                </div>
                <div>
                  <label className="label">Label (EN)</label>
                  <input className="input" value={link.labelEn} onChange={(e) => updateLink(columnIndex, linkIndex, { labelEn: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Href</label>
                  <input className="input" value={link.href} onChange={(e) => updateLink(columnIndex, linkIndex, { href: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addLink(columnIndex)} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
            + Add Link
          </button>
        </div>
      ))}
      <button type="button" onClick={addColumn} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Column
      </button>
      <div>
        <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save Footer"}
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

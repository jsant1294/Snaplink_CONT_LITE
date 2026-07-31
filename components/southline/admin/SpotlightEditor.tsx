"use client";

import { useState, useEffect } from "react";
import type { SpotlightItem } from "@/lib/southline-types";

export default function SpotlightEditor({ pin }: { pin: string }) {
  const [items, setItems] = useState<SpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SpotlightItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => { setItems(d.settings?.spotlight ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, [pin]);

  async function save(items: SpotlightItem[]) {
    await fetch("/api/southline/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
      body: JSON.stringify({ spotlight: items }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this spotlight item?")) return;
    await save(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{items.length} items</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
          + Add Item
        </button>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {showForm && (
        <SpotlightForm
          initial={editing}
          onSave={(item) => {
            const next = editing
              ? items.map((i) => (i.id === editing.id ? item : i))
              : [...items, item];
            save(next);
            setShowForm(false);
            setEditing(null);
          }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-muted/60 text-center py-8">No spotlight items yet. Add before/after projects or community highlights.</p>
      )}

      <div className="space-y-2">
        {[...items].reverse().map((item) => (
          <div key={item.id} className="bg-obsidian border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.titleEn}</p>
              <p className="text-xs text-muted truncate">{item.categoryEn} · {item.linkUrl}</p>
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <button onClick={() => { setEditing(item); setShowForm(true); }} className="text-xs text-gold">Edit</button>
              <button onClick={() => remove(item.id)} className="text-xs text-danger">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpotlightForm({ initial, onSave, onCancel }: {
  initial: SpotlightItem | null;
  onSave: (item: SpotlightItem) => void;
  onCancel: () => void;
}) {
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [descEs, setDescEs] = useState(initial?.descEs ?? "");
  const [descEn, setDescEn] = useState(initial?.descEn ?? "");
  const [categoryEs, setCategoryEs] = useState(initial?.categoryEs ?? "");
  const [categoryEn, setCategoryEn] = useState(initial?.categoryEn ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  function save() {
    onSave({
      id: initial?.id ?? `spot_${Date.now()}`,
      titleEs, titleEn, descEs, descEn,
      categoryEs, categoryEn, linkUrl, imageUrl,
    });
  }

  return (
    <div className="bg-obsidian border border-white/10 rounded-xl p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Title (ES)</label>
          <input value={titleEs} onChange={(e) => setTitleEs(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Title (EN)</label>
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Description (ES)</label>
          <textarea value={descEs} onChange={(e) => setDescEs(e.target.value)} rows={2} className="input" />
        </div>
        <div>
          <label className="label">Description (EN)</label>
          <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={2} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category (ES)</label>
          <input value={categoryEs} onChange={(e) => setCategoryEs(e.target.value)} placeholder="ej. Antes y Después" className="input" />
        </div>
        <div>
          <label className="label">Category (EN)</label>
          <input value={categoryEn} onChange={(e) => setCategoryEn(e.target.value)} placeholder="e.g. Before & After" className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Link URL</label>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/diy/pintar-habitacion" className="input" />
        </div>
        <div>
          <label className="label">Image URL</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs text-muted hover:text-bone px-3 py-1.5">Cancel</button>
        <button onClick={save} disabled={!titleEn || !descEn} className="text-xs bg-gold text-obsidian font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40">
          {initial ? "Update" : "Add"}
        </button>
      </div>
    </div>
  );
}

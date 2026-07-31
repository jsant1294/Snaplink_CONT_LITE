"use client";

import { useState, useEffect } from "react";
import type { DIYProject } from "@/lib/southline-diy";

export default function DiyEditor({ pin }: { pin: string }) {
  const [projects, setProjects] = useState<DIYProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DIYProject | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/southline/diy")
      .then((r) => r.json())
      .then((d) => { setProjects(d.projects ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function del(id: string) {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/southline/diy/${id}`, {
      method: "DELETE",
      headers: { "x-snaplink-pin": pin },
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{projects.length} projects</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
          + New Project
        </button>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {!loading && projects.length === 0 && (
        <p className="text-sm text-muted/60 text-center py-8">No DIY projects yet.</p>
      )}

      {showForm && (
        <ProjectForm
          pin={pin}
          initial={editing}
          onDone={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      <div className="space-y-2">
        {[...projects].reverse().map((p) => (
          <div key={p.id} className="bg-obsidian border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{p.titleEn}</p>
              <p className="text-xs text-muted">{p.slug} · {p.difficulty}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(p); setShowForm(true); }}
                className="text-xs text-gold hover:text-goldlight"
              >
                Edit
              </button>
              <button onClick={() => del(p.id)} className="text-xs text-danger hover:text-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectForm({ pin, initial, onDone }: { pin: string; initial: DIYProject | null; onDone: () => void }) {
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [descEs, setDescEs] = useState(initial?.descEs ?? "");
  const [descEn, setDescEn] = useState(initial?.descEn ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "easy");
  const [category, setCategory] = useState(initial?.category ?? "catDIY");
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    setSubmitting(true);
    const body = { titleEs, titleEn, descEs, descEn, slug, difficulty, category };
    if (initial) {
      await fetch(`/api/southline/diy/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/southline/diy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(body),
      });
    }
    setSubmitting(false);
    onDone();
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
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")} className="input">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            <option value="catCocinas">Cocinas</option>
            <option value="catBanos">Baños</option>
            <option value="catPatios">Patios</option>
            <option value="catJardineria">Jardinería</option>
            <option value="catReparaciones">Reparaciones</option>
            <option value="catDIY">DIY</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="text-xs text-muted hover:text-bone px-3 py-1.5">Cancel</button>
        <button onClick={save} disabled={submitting || !titleEn} className="text-xs bg-gold text-obsidian font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40">
          {submitting ? "Saving…" : initial ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { Contractor } from "@/lib/types";
import type { AgentProfile } from "@/lib/agent-profiles/types";
import { categoryIdsForContractor, categoryIdsForAgent } from "@/lib/southline-search";
import { catalogDiagnostics, type ProfessionalCatalogDiagnostic, type ProfessionalSource } from "@/lib/southline-professional-catalog";
import { HOME_SERVICE_CATEGORIES } from "@/lib/home-service-taxonomy";

type PublicContractor = Omit<Contractor, "pin">;

interface CatalogRow {
  source: ProfessionalSource;
  id: string;
  name: string;
  professionType: string;
  serviceArea: string;
  categoryIds: string[];
  hasImage: boolean;
  hasSummary: boolean;
  publicUrl: string;
  openUrl: string;
  diagnostic: ProfessionalCatalogDiagnostic | undefined;
}

function labelFor(professionType: string, source: ProfessionalSource): string {
  if (source === "contractor") return professionType || "contractor";
  return professionType || "realtor";
}

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

export default function ProfessionalCatalogPanel({ pin }: { pin: string }) {
  const [contractors, setContractors] = useState<PublicContractor[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [featuredContractorIds, setFeaturedContractorIds] = useState<string[]>([]);
  const [featuredAgentProfileIds, setFeaturedAgentProfileIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"all" | ProfessionalSource>("all");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"all" | "public" | "hidden" | "unmapped">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/contractor/profiles").then((r) => r.json()),
      fetch("/api/agent-profiles", { headers: { "x-snaplink-pin": pin } }).then((r) => r.json()),
      fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } }).then((r) => r.json()),
    ]).then(([profilesData, agentsData, settingsData]) => {
      setContractors(profilesData.contractors ?? []);
      setAgents(agentsData.profiles ?? []);
      setFeaturedContractorIds(settingsData.settings?.featuredContractorIds ?? []);
      setFeaturedAgentProfileIds(settingsData.settings?.featuredAgentProfileIds ?? []);
    });
  }, [pin]);

  const diagnostics = useMemo<Map<string, ProfessionalCatalogDiagnostic>>(() => {
    const map = new Map<string, ProfessionalCatalogDiagnostic>();
    for (const d of catalogDiagnostics(contractors as Contractor[], agents)) {
      map.set(`${d.source}:${d.id}`, d);
    }
    return map;
  }, [contractors, agents]);

  const rows = useMemo<CatalogRow[]>(() => {
    const out: CatalogRow[] = [];
    for (const c of contractors) {
      out.push({
        source: "contractor",
        id: c.id,
        name: c.businessName,
        professionType: c.professionType,
        serviceArea: c.serviceArea,
        categoryIds: categoryIdsForContractor(c),
        hasImage: Boolean(c.avatarUrl || c.logoUrl),
        hasSummary: Boolean(c.tagline),
        publicUrl: `/contractor/${c.username}`,
        // The operator workspace, not the public page — mirrors the agent row
        // below (/southline/admin/agents/{id}). Previously this duplicated
        // publicUrl, so "Open" and "Copy" did the same thing for contractors.
        openUrl: `/contractor-admin/${c.username}`,
        diagnostic: diagnostics.get(`contractor:${c.id}`),
      });
    }
    for (const a of agents) {
      out.push({
        source: "agent",
        id: a.id,
        name: a.displayName || a.name,
        professionType: a.professionType,
        serviceArea: a.serviceArea || a.serviceAreas.join(", "),
        categoryIds: categoryIdsForAgent(a),
        hasImage: Boolean(a.photoUrl),
        hasSummary: Boolean(a.marketplaceSummary || a.bio || a.tagline),
        publicUrl: `/agents/${a.slug}`,
        openUrl: `/southline/admin/agents/${a.id}`,
        diagnostic: diagnostics.get(`agent:${a.id}`),
      });
    }
    return out;
  }, [contractors, agents, diagnostics]);

  const featuredOf = (source: ProfessionalSource): string[] =>
    source === "contractor" ? featuredContractorIds : featuredAgentProfileIds;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (source !== "all" && r.source !== source) return false;
      if (featuredOnly && featuredOf(r.source).indexOf(r.id) === -1) return false;
      if (category && !r.categoryIds.includes(category)) return false;
      if (q && !`${r.name} ${r.professionType} ${r.serviceArea}`.toLowerCase().includes(q)) return false;
      if (status === "public" && r.diagnostic?.status !== "ready" && r.diagnostic?.status !== "warning") return false;
      if (status === "hidden" && r.diagnostic?.status !== "hidden") return false;
      if (status === "unmapped" && r.diagnostic?.status !== "unmapped") return false;
      return true;
    });
  }, [rows, source, category, search, status, featuredOnly, featuredContractorIds, featuredAgentProfileIds]);

  const stats = useMemo(() => {
    const total = rows.length;
    const publicCount = rows.filter((r) => r.diagnostic?.status === "ready" || r.diagnostic?.status === "warning").length;
    const hidden = rows.filter((r) => r.diagnostic?.status === "hidden").length;
    const unmapped = rows.filter((r) => r.diagnostic?.status === "unmapped").length;
    const featured = featuredContractorIds.length + featuredAgentProfileIds.length;
    return { total, publicCount, hidden, unmapped, featured };
  }, [rows, featuredContractorIds, featuredAgentProfileIds]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function patchSettings(next: { featuredContractorIds?: string[]; featuredAgentProfileIds?: string[] }) {
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Catalog updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFeatured(row: CatalogRow) {
    const list = featuredOf(row.source);
    const next = list.includes(row.id) ? list.filter((id) => id !== row.id) : [...list, row.id];
    if (row.source === "contractor") {
      setFeaturedContractorIds(next);
      await patchSettings({ featuredContractorIds: next });
    } else {
      setFeaturedAgentProfileIds(next);
      await patchSettings({ featuredAgentProfileIds: next });
    }
  }

  async function move(row: CatalogRow, delta: number) {
    const list = featuredOf(row.source);
    const idx = list.indexOf(row.id);
    if (idx === -1) return;
    const target = idx + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[idx], next[target]] = [next[target], next[idx]];
    if (row.source === "contractor") {
      setFeaturedContractorIds(next);
      await patchSettings({ featuredContractorIds: next });
    } else {
      setFeaturedAgentProfileIds(next);
      await patchSettings({ featuredAgentProfileIds: next });
    }
  }

  const statusColor: Record<string, string> = {
    ready: "bg-sage/10 text-sage",
    warning: "bg-gold/10 text-gold",
    hidden: "bg-white/10 text-muted",
    unmapped: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Total</p>
          <p className="text-2xl font-display">{stats.total}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Public</p>
          <p className="text-2xl font-display text-sage">{stats.publicCount}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Featured</p>
          <p className="text-2xl font-display text-gold">{stats.featured}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Hidden</p>
          <p className="text-2xl font-display text-muted">{stats.hidden}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Unmapped</p>
          <p className="text-2xl font-display text-red-400">{stats.unmapped}</p>
        </div>
      </div>

      <p className="text-xs text-muted">
        Curate which contractors and licensed professionals appear in Southline public discovery.
        Feature order in the list below is the display order on the homepage and /results.
        Profile content is edited in each source dashboard — this panel only controls directory placement.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, profession, area…"
          className="col-span-1 sm:col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone placeholder:text-muted"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as typeof source)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
        >
          <option value="all">All sources</option>
          <option value="contractor">Contractors</option>
          <option value="agent">Agents</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
        >
          <option value="">All categories</option>
          {HOME_SERVICE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.labelEn}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
        >
          <option value="all">All statuses</option>
          <option value="public">Public</option>
          <option value="hidden">Hidden</option>
          <option value="unmapped">Unmapped</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 accent-gold"
          checked={featuredOnly}
          onChange={(e) => setFeaturedOnly(e.target.checked)}
        />
        Featured only
      </label>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted">No professionals match.</p>}
        {filtered.map((row) => {
          const order = featuredOf(row.source).indexOf(row.id);
          const d = row.diagnostic;
          return (
            <div key={`${row.source}:${row.id}`} className="card p-4 flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 accent-gold shrink-0"
                checked={order !== -1}
                onChange={() => toggleFeatured(row)}
                disabled={busy}
                title="Feature / unfeature"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{row.name}</p>
                  <span className="text-[10px] uppercase tracking-widest text-muted">{labelFor(row.professionType, row.source)}</span>
                  {!row.hasImage && <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">no photo</span>}
                  {!row.hasSummary && <span className="text-[10px] bg-white/10 text-muted px-1.5 py-0.5 rounded-full">no summary</span>}
                </div>
                <p className="text-xs text-muted truncate">
                  {row.source} · {row.serviceArea || "no area"} · {row.publicUrl}
                </p>
              </div>
              {d && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor[d.status] ?? ""}`}>
                  {d.status}
                </span>
              )}
              {order !== -1 && (
                <span className="text-xs text-gold font-medium shrink-0">#{order + 1}</span>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => move(row, -1)}
                  disabled={busy || order <= 0}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-muted disabled:opacity-30 text-sm"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(row, 1)}
                  disabled={busy || order === -1 || order >= featuredOf(row.source).length - 1}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-muted disabled:opacity-30 text-sm"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <a
                href={row.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted hover:text-gold shrink-0"
                title="Preview the public profile"
              >
                Preview
              </a>
              <button
                onClick={() => {
                  copyText(row.publicUrl).then(() => showToast("URL copied"));
                }}
                className="text-xs text-muted hover:text-gold shrink-0"
                title="Copy public URL"
              >
                Copy
              </button>
              <a href={row.openUrl} className="text-xs text-muted hover:text-gold shrink-0" title="Open source workspace">
                Open →
              </a>
              <a
                href={`/southline/admin/intake/${row.source}/${row.id}`}
                className="text-xs text-muted hover:text-gold shrink-0"
                title="Start or resume the guided profile intake"
              >
                Intake
              </a>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { RealEstateBlockSettings, SouthlineSettings } from "@/lib/southline-types";

interface PropertyOption {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
}

interface AgentOption {
  id: string;
  name: string;
  status: string;
}

export default function RealEstateBlockEditor({ pin }: { pin: string }) {
  const [settings, setSettings] = useState<SouthlineSettings | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [local, setLocal] = useState<RealEstateBlockSettings | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin, "x-real-estate-tenant": "re-demo-tenant" };
  }

  async function load() {
    const [s, p, a] = await Promise.all([
      fetch("/api/southline/settings", { headers: headers() }).then((r) => r.json()).catch(() => ({ settings: null })),
      fetch("/api/real-estate/properties?status=published&pageSize=50", { headers: headers() }).then((r) => r.json()).catch(() => ({ properties: [] })),
      fetch("/api/agent-profiles", { headers: headers() }).then((r) => r.json()).catch(() => ({ profiles: [] })),
    ]);
    setSettings(s.settings ?? null);
    setLocal(s.settings?.realEstateBlock ?? null);
    setSelectedAgentIds(s.settings?.featuredAgentProfileIds ?? []);
    setVisible(s.settings?.sections?.featuredAgents !== false);
    setProperties(p.properties ?? []);
    setAgents((a.profiles ?? []).filter((profile: AgentOption) => profile.status === "active"));
  }

  useEffect(() => {
    load();
  }, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save() {
    if (!local || !settings) return;
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          realEstateBlock: local,
          featuredAgentProfileIds: selectedAgentIds,
          sections: { ...settings.sections, featuredAgents: visible },
        }),
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

  function toggleAgent(id: string) {
    setSelectedAgentIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  if (!local) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">
        Content for the homepage &quot;Real Estate Discovery&quot; block (between Featured Professionals and Trending Projects).
      </p>

      <label className="flex items-center justify-between border-b border-white/5 py-3">
        <span className="text-sm">Visible on homepage</span>
        <button
          onClick={() => setVisible((v) => !v)}
          className={`h-6 w-10 rounded-full transition-colors ${visible ? "bg-gold" : "bg-white/10"}`}
        >
          <span className={`mt-0.5 block h-4 w-4 rounded-full bg-white transition-transform ${visible ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </label>

      <div>
        <label className="text-xs text-muted block mb-1">Featured property</label>
        <select
          value={local.featuredPropertyId ?? ""}
          onChange={(e) => setLocal({ ...local, featuredPropertyId: e.target.value || null })}
          className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="">Auto (first published property)</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.title} — {p.city}, {p.state}</option>
          ))}
        </select>
        {properties.length === 0 && <p className="mt-1 text-xs text-amber-300">No published properties found for the demo tenant yet.</p>}
      </div>

      <div>
        <label className="text-xs text-muted block mb-1">Featured agents (first 2 shown)</label>
        <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-white/10 p-2">
          {agents.length === 0 && <p className="text-xs text-muted/60 p-2">No active agent profiles yet.</p>}
          {agents.map((agent) => (
            <label key={agent.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selectedAgentIds.includes(agent.id)} onChange={() => toggleAgent(agent.id)} className="h-4 w-4 accent-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40" />
              {agent.name}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Eyebrow (ES)</label>
          <input value={local.eyebrowEs} onChange={(e) => setLocal({ ...local, eyebrowEs: e.target.value })} className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Eyebrow (EN)</label>
          <input value={local.eyebrowEn} onChange={(e) => setLocal({ ...local, eyebrowEn: e.target.value })} className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Headline (ES)</label>
          <input value={local.headlineEs} onChange={(e) => setLocal({ ...local, headlineEs: e.target.value })} className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Headline (EN)</label>
          <input value={local.headlineEn} onChange={(e) => setLocal({ ...local, headlineEn: e.target.value })} className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Body (ES)</label>
          <textarea rows={2} value={local.bodyEs} onChange={(e) => setLocal({ ...local, bodyEs: e.target.value })} className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Body (EN)</label>
          <textarea rows={2} value={local.bodyEn} onChange={(e) => setLocal({ ...local, bodyEn: e.target.value })} className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2 text-sm text-bone" />
        </div>
      </div>

      <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
        {busy ? "Saving…" : "Save real estate block"}
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { AGENT_MODULE_KEYS, type AgentModuleKey } from "@/lib/agent-profiles/types";

interface AgentProfile {
  id: string;
  slug: string;
  username?: string;
  status: "pending" | "active" | "suspended" | "archived";
  name: string;
  email: string;
  phone: string;
  serviceArea: string;
  brokerageName: string;
  officeName?: string;
  teamName?: string;
  photoUrl?: string;
  tier?: string;
  snaplinkStatus: "draft" | "published" | "unpublished";
  southlineStatus: "draft" | "published" | "featured" | "hidden";
  onboardingStatus: string;
  modules?: Partial<Record<AgentModuleKey, boolean>>;
  createdAt: string;
  updatedAt: string;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("") || "?";
}

function moduleCount(modules?: Partial<Record<AgentModuleKey, boolean>>): string {
  const enabled = AGENT_MODULE_KEYS.filter((k) => modules?.[k]).length;
  return `${enabled}/${AGENT_MODULE_KEYS.length}`;
}

interface BillingPlan {
  id: string;
  name: string;
  billingPeriod: string;
  amountCents: number;
  currency: string;
}

export default function AgentProfilesPanel({ pin }: { pin: string }) {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<Record<string, { pin: string; planId: string; tier: string }>>({});
  const [manageModulesId, setManageModulesId] = useState<string | null>(null);

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin, "x-real-estate-tenant": "re-demo-tenant" };
  }

  async function load() {
    setLoading(true);
    const [p, b] = await Promise.all([
      fetch("/api/agent-profiles", { headers: headers() }).then((r) => r.json()).catch(() => ({ profiles: [] })),
      fetch("/api/real-estate/billing/plans", { headers: headers() }).then((r) => r.json()).catch(() => ({ plans: [] })),
    ]);
    setProfiles(p.profiles ?? []);
    setPlans(b.plans ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [pin]);

  async function activate(id: string) {
    const draft = activating[id];
    if (!draft || !/^\d{6}$/.test(draft.pin) || !draft.tier || !draft.planId) {
      alert("A 6-digit PIN, a tier, and a billing plan are required to activate.");
      return;
    }
    const r = await fetch(`/api/agent-profiles/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "active", pin: draft.pin, tier: draft.tier, planId: draft.planId }),
    });
    if (!r.ok) alert((await r.json()).error || "Activation failed");
    load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const r = await fetch(`/api/agent-profiles/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify(body) });
    if (!r.ok) alert((await r.json()).error || "Update failed");
    load();
  }

  async function publish(id: string) {
    if (!confirm("Publish this agent? Their SnapLink profile and Southline listing both become visible to the public.")) return;
    await patch(id, { snaplinkStatus: "published", southlineStatus: "published", onboardingStatus: "launched" });
  }
  async function unpublish(id: string) {
    if (!confirm("Unpublish this agent? Their SnapLink profile and Southline listing both stop appearing publicly. The account stays active.")) return;
    await patch(id, { snaplinkStatus: "unpublished", southlineStatus: "hidden" });
  }
  async function suspend(id: string) {
    if (!confirm("Suspend this agent? Their SnapLink profile and Southline listing both stop appearing everywhere.")) return;
    await patch(id, { status: "suspended" });
  }
  async function archive(id: string) {
    if (!confirm("Archive this agent? This is a soft, reversible removal — no data is deleted.")) return;
    await patch(id, { status: "archived" });
  }
  async function reinstate(id: string) {
    if (!confirm("Reactivate this agent's account? They will become visible again wherever their publish status allows.")) return;
    await patch(id, { status: "active" });
  }
  async function saveModules(id: string, modules: Partial<Record<AgentModuleKey, boolean>>) {
    await patch(id, { modules });
    setManageModulesId(null);
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(`${window.location.origin}${text}`);
  }

  if (loading) return <p className="text-sm text-muted">Loading agent profiles…</p>;

  const pending = profiles.filter((p) => p.status === "pending");
  const managed = profiles.filter((p) => p.status === "active" || p.status === "suspended" || p.status === "archived");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Agent Management</h3>
        <Link href="/southline/admin/agents/new" className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-obsidian">+ New Agent</Link>
      </div>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Pending requests ({pending.length})</h4>
        {pending.length === 0 && <p className="text-sm text-muted/60">No pending requests.</p>}
        <div className="space-y-3">
          {pending.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-obsidian p-4">
              <p className="text-sm font-medium">{p.name} — {p.brokerageName || "No brokerage listed"}</p>
              <p className="mt-1 text-xs text-muted">{p.email} · {p.phone} · {p.serviceArea}</p>
              {plans.length === 0 && <p className="mt-2 text-xs text-amber-300">No billing plans exist yet — create Basic/Professional/Featured plans under Real Estate Enterprise → Billing before activating.</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  placeholder="6-digit PIN"
                  maxLength={6}
                  value={activating[p.id]?.pin ?? ""}
                  onChange={(e) => setActivating({ ...activating, [p.id]: { ...activating[p.id], pin: e.target.value, tier: activating[p.id]?.tier ?? "", planId: activating[p.id]?.planId ?? "" } })}
                  className="w-28 rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs text-bone placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
                <select
                  value={activating[p.id]?.planId ?? ""}
                  onChange={(e) => {
                    const plan = plans.find((x) => x.id === e.target.value);
                    setActivating({ ...activating, [p.id]: { pin: activating[p.id]?.pin ?? "", planId: e.target.value, tier: plan ? tierFromPlanName(plan.name) : "" } });
                  }}
                  className="rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs text-bone focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  <option value="">Select plan…</option>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({(plan.amountCents / 100).toFixed(2)} {plan.currency}/{plan.billingPeriod})</option>)}
                </select>
                <select
                  value={activating[p.id]?.tier ?? ""}
                  onChange={(e) => setActivating({ ...activating, [p.id]: { pin: activating[p.id]?.pin ?? "", planId: activating[p.id]?.planId ?? "", tier: e.target.value } })}
                  className="rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs text-bone focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  <option value="">Tier…</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="featured">Featured</option>
                </select>
                <button onClick={() => activate(p.id)} className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-obsidian">Activate</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">All agents ({managed.length})</h4>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Photo</th>
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Brokerage</th>
                <th className="px-3 py-2 font-medium">Office / Team</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium">SnapLink</th>
                <th className="px-3 py-2 font-medium">Southline</th>
                <th className="px-3 py-2 font-medium">Onboarding</th>
                <th className="px-3 py-2 font-medium">Modules</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {managed.map((p) => (
                <Fragment key={p.id}>
                <tr className={p.status !== "active" ? "opacity-50" : undefined}>
                  <td className="px-3 py-2">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-bone">{initials(p.name)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-bone">{p.name}</p>
                    <p className="text-muted">{p.username ? `@${p.username}` : "no username"}</p>
                  </td>
                  <td className="px-3 py-2 text-muted">{p.brokerageName || "—"}</td>
                  <td className="px-3 py-2 text-muted">{[p.officeName, p.teamName].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-3 py-2 text-muted">{p.tier ?? "—"}</td>
                  <td className="px-3 py-2 text-muted">{p.status}</td>
                  <td className="px-3 py-2 text-muted">{p.snaplinkStatus}</td>
                  <td className="px-3 py-2 text-muted">{p.southlineStatus}</td>
                  <td className="px-3 py-2 text-muted">{p.onboardingStatus}</td>
                  <td className="px-3 py-2 text-muted">{moduleCount(p.modules)}</td>
                  <td className="px-3 py-2 text-muted">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/southline/admin/agents/${p.id}`} className="rounded border border-white/10 px-2 py-1 text-gold">Edit</Link>
                      <Link href={`/southline/admin/agents/${p.id}#snaplink-workspace`} className="rounded border border-white/10 px-2 py-1 text-bone">Open Workspace</Link>
                      <button onClick={() => setManageModulesId(manageModulesId === p.id ? null : p.id)} className="rounded border border-white/10 px-2 py-1 text-bone">Manage Modules</button>
                      {p.username && <a href={`/p/${p.username}`} target="_blank" rel="noreferrer" className="rounded border border-white/10 px-2 py-1 text-bone">Preview SnapLink</a>}
                      <a href={`/agents/${p.slug}`} target="_blank" rel="noreferrer" className="rounded border border-white/10 px-2 py-1 text-bone">Preview Southline</a>
                      {p.username && <button onClick={() => copy(`/p/${p.username}`)} className="rounded border border-white/10 px-2 py-1 text-bone">Copy SnapLink URL</button>}
                      <button onClick={() => copy(`/agents/${p.slug}`)} className="rounded border border-white/10 px-2 py-1 text-bone">Copy Southline URL</button>
                      {p.status === "active" && (p.snaplinkStatus !== "published" || p.southlineStatus === "draft") && (
                        <button onClick={() => publish(p.id)} className="rounded bg-gold px-2 py-1 font-semibold text-obsidian">Publish</button>
                      )}
                      {p.status === "active" && (p.snaplinkStatus === "published" || p.southlineStatus === "published" || p.southlineStatus === "featured") && (
                        <button onClick={() => unpublish(p.id)} className="rounded border border-white/10 px-2 py-1 text-bone">Unpublish</button>
                      )}
                      {p.status === "active" && <button onClick={() => suspend(p.id)} className="rounded border border-white/10 px-2 py-1 text-danger">Suspend</button>}
                      {p.status === "suspended" && <button onClick={() => reinstate(p.id)} className="rounded border border-white/10 px-2 py-1 text-gold">Reinstate</button>}
                      {p.status !== "archived" && <button onClick={() => archive(p.id)} className="rounded border border-white/10 px-2 py-1 text-muted">Archive</button>}
                      {p.status === "archived" && <button onClick={() => reinstate(p.id)} className="rounded border border-white/10 px-2 py-1 text-gold">Restore</button>}
                    </div>
                  </td>
                </tr>
                {manageModulesId === p.id && (
                  <tr>
                    <td colSpan={12} className="bg-white/5 px-3 py-3">
                      <ManageModulesPanel modules={p.modules} onCancel={() => setManageModulesId(null)} onSave={(modules) => saveModules(p.id, modules)} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Quick inline module toggler used by the "Manage Modules" row action, avoiding a full navigation to the Edit page. */
function ManageModulesPanel({
  modules,
  onSave,
  onCancel,
}: {
  modules?: Partial<Record<AgentModuleKey, boolean>>;
  onSave: (modules: Partial<Record<AgentModuleKey, boolean>>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Record<AgentModuleKey, boolean>>>({ ...modules });

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">Manage modules</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {AGENT_MODULE_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs text-bone">
            <input type="checkbox" checked={Boolean(draft[key])} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} />
            {key}
          </label>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onSave(draft)} className="rounded bg-gold px-3 py-1 text-xs font-semibold text-obsidian">Save modules</button>
        <button onClick={onCancel} className="rounded border border-white/10 px-3 py-1 text-xs text-bone">Cancel</button>
      </div>
    </div>
  );
}

function tierFromPlanName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("featured")) return "featured";
  if (lower.includes("professional")) return "professional";
  if (lower.includes("basic")) return "basic";
  return "";
}


"use client";

import { useEffect, useState } from "react";

interface AgentProfile {
  id: string;
  slug: string;
  status: "pending" | "active" | "suspended";
  name: string;
  email: string;
  phone: string;
  serviceArea: string;
  brokerageName: string;
  tier?: string;
  createdAt: string;
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

  async function suspend(id: string) {
    if (!confirm("Suspend this agent profile? It will stop appearing on the homepage.")) return;
    await fetch(`/api/agent-profiles/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status: "suspended" }) });
    load();
  }

  async function reinstate(id: string) {
    await fetch(`/api/agent-profiles/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status: "active" }) });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Loading agent profiles…</p>;

  const pending = profiles.filter((p) => p.status === "pending");
  const active = profiles.filter((p) => p.status === "active");
  const suspended = profiles.filter((p) => p.status === "suspended");

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Pending requests ({pending.length})</h3>
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
                  className="w-28 rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs"
                />
                <select
                  value={activating[p.id]?.planId ?? ""}
                  onChange={(e) => {
                    const plan = plans.find((x) => x.id === e.target.value);
                    setActivating({ ...activating, [p.id]: { pin: activating[p.id]?.pin ?? "", planId: e.target.value, tier: plan ? tierFromPlanName(plan.name) : "" } });
                  }}
                  className="rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs"
                >
                  <option value="">Select plan…</option>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({(plan.amountCents / 100).toFixed(2)} {plan.currency}/{plan.billingPeriod})</option>)}
                </select>
                <select
                  value={activating[p.id]?.tier ?? ""}
                  onChange={(e) => setActivating({ ...activating, [p.id]: { pin: activating[p.id]?.pin ?? "", planId: activating[p.id]?.planId ?? "", tier: e.target.value } })}
                  className="rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs"
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
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Active profiles ({active.length})</h3>
        <div className="space-y-2">
          {active.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-obsidian p-3">
              <div>
                <p className="text-sm font-medium">{p.name} <span className="text-xs text-muted">/agents/{p.slug}</span></p>
                <p className="text-xs text-muted">{p.tier ?? "no tier"}</p>
              </div>
              <button onClick={() => suspend(p.id)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-danger">Suspend</button>
            </div>
          ))}
        </div>
      </section>

      {suspended.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Suspended ({suspended.length})</h3>
          <div className="space-y-2">
            {suspended.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-obsidian p-3">
                <p className="text-sm font-medium">{p.name}</p>
                <button onClick={() => reinstate(p.id)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gold">Reinstate</button>
              </div>
            ))}
          </div>
        </section>
      )}
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

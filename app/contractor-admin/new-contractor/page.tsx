"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES, SERVICE_LIBRARY } from "@/lib/services";

function cleanPayments(p: { zelle: string; cashApp: string; venmo: string; paypalMe: string; stripeLink: string; cash: boolean; check: boolean; payToName: string }) {
  const out: Record<string, unknown> = {};
  if (p.zelle.trim()) out.zelle = p.zelle.trim();
  if (p.cashApp.trim()) out.cashApp = p.cashApp.trim();
  if (p.venmo.trim()) out.venmo = p.venmo.trim();
  if (p.paypalMe.trim()) out.paypalMe = p.paypalMe.trim();
  if (p.stripeLink.trim()) out.stripeLink = p.stripeLink.trim();
  if (p.cash) out.cash = true;
  if (p.check) { out.check = true; if (p.payToName.trim()) out.payToName = p.payToName.trim(); }
  return Object.keys(out).length ? out : undefined;
}

export default function NewContractorPage() {
  const [operatorPin, setOperatorPin] = useState("");
  const [contractorPin, setContractorPin] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "es">("en");
  const [pay, setPay] = useState({ zelle: "", cashApp: "", venmo: "", paypalMe: "", stripeLink: "", cash: true, check: false, payToName: "" });
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    username: "",
    phone: "",
    whatsapp: "",
    email: "",
    serviceArea: "",
    tagline: "",
    licenseInfo: "",
    reviewsUrl: "",
  });
  const [services, setServices] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ username: string; businessName: string } | null>(null);

  function toggleService(name: string) {
    setServices((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleCategory(categoryId: string) {
    const inCat = SERVICE_LIBRARY.filter((s) => s.category === categoryId).map((s) => s.name);
    const allSelected = inCat.every((n) => services.has(n));
    setServices((prev) => {
      const next = new Set(prev);
      inCat.forEach((n) => (allSelected ? next.delete(n) : next.add(n)));
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": operatorPin },
        body: JSON.stringify({ ...form, pin: contractorPin, preferredLanguage, services: Array.from(services), payments: cleanPayments(pay) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setCreated({ username: data.contractor.username, businessName: data.contractor.businessName });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    const url = `/contractor/${created.username}`;
    return (
      <main className="min-h-screen max-w-md mx-auto px-5 pt-16 pb-16 text-center">
        <p className="text-5xl mb-4">✓</p>
        <h1 className="font-display text-3xl mb-2">{created.businessName} is live</h1>
        <p className="text-muted text-sm mb-8">
          Share this link, or point a SnapLink QR / NFC card at it.
        </p>
        <div className="card p-4 mb-6 text-gold font-mono text-sm break-all">{url}</div>
        <div className="card p-3 mb-6 text-left text-sm">
          <p className="text-muted text-xs mb-1">Their private dashboard (needs their PIN):</p>
          <p className="text-gold font-mono break-all">/contractor-admin{url.replace("/contractor", "")}</p>
        </div>
        <div className="space-y-3">
          <Link href={url} className="btn-gold block">Open public page</Link>
          <Link href="/contractor-admin" className="btn-outline block">Go to operator console</Link>
          <button
            onClick={() => {
              setCreated(null);
              setForm({ businessName: "", ownerName: "", username: "", phone: "", whatsapp: "", email: "", serviceArea: "", tagline: "", licenseInfo: "", reviewsUrl: "" });
              setServices(new Set());
            }}
            className="btn-outline w-full"
          >
            Create another contractor
          </button>
        </div>
      </main>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-5 pt-8 pb-20">
      <Link href="/contractor-admin" className="text-sm text-muted">← Dashboard</Link>
      <h1 className="font-display text-4xl mt-3 mb-1">New Contractor</h1>
      <p className="text-muted text-sm mb-6">
        Creates a live public page at <span className="text-gold font-mono">/contractor/username</span> with its own intake, leads, and estimates.
      </p>

      {error && <div className="card border-danger/40 p-3 mb-4 text-sm text-danger">{error}</div>}

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Business name *</label>
            <input className="input" value={form.businessName} onChange={set("businessName")} placeholder="e.g. Ramirez Roofing LLC" />
          </div>
          <div>
            <label className="label">Owner name</label>
            <input className="input" value={form.ownerName} onChange={set("ownerName")} />
          </div>
          <div>
            <label className="label">Username (URL slug)</label>
            <input className="input" value={form.username} onChange={set("username")} placeholder="auto from business name" />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1..." />
          </div>
          <div>
            <label className="label">WhatsApp (if different)</label>
            <input className="input" type="tel" value={form.whatsapp} onChange={set("whatsapp")} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="label">Service area</label>
            <input className="input" value={form.serviceArea} onChange={set("serviceArea")} placeholder="e.g. North Metro Atlanta" />
          </div>
          <div>
            <label className="label">License / insurance line</label>
            <input className="input" value={form.licenseInfo} onChange={set("licenseInfo")} placeholder="e.g. GA Lic. #... · Fully insured" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline} onChange={set("tagline")} placeholder="e.g. Free estimates. Hablamos español." />
          </div>
          <div className="md:col-span-2">
            <label className="label">Google reviews URL</label>
            <input className="input" value={form.reviewsUrl} onChange={set("reviewsUrl")} placeholder="https://g.page/..." />
          </div>
        </div>

        {/* Access & language */}
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Access & language</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Operator PIN * (yours)</label>
              <input
                className="input font-mono tracking-widest"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={operatorPin}
                onChange={(e) => setOperatorPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="label">Contractor PIN * (their dashboard key)</label>
              <input
                className="input font-mono tracking-widest"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={contractorPin}
                onChange={(e) => setContractorPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 digits"
              />
            </div>
            <div>
              <label className="label">Dashboard language</label>
              <div className="inline-flex rounded-xl border border-white/15 overflow-hidden w-full">
                <button
                  onClick={() => setPreferredLanguage("en")}
                  className={`flex-1 py-3 text-sm ${preferredLanguage === "en" ? "bg-gold text-obsidian font-semibold" : "text-muted"}`}
                >
                  English
                </button>
                <button
                  onClick={() => setPreferredLanguage("es")}
                  className={`flex-1 py-3 text-sm ${preferredLanguage === "es" ? "bg-gold text-obsidian font-semibold" : "text-muted"}`}
                >
                  Español
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1.5">
                Their entire dashboard, estimator, and AI scope notes render in this language.
              </p>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-1">How they get paid</p>
          <p className="text-xs text-muted mb-4">Shows on invoices as “How to pay,” with a scan-to-pay QR. Fill only what they use — SnapLink never touches the money.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Zelle (email or phone)</label><input className="input" value={pay.zelle} onChange={(e)=>setPay({...pay,zelle:e.target.value})} placeholder="jose@email.com" /></div>
            <div><label className="label">Cash App ($cashtag)</label><input className="input" value={pay.cashApp} onChange={(e)=>setPay({...pay,cashApp:e.target.value})} placeholder="$JJStoneworks" /></div>
            <div><label className="label">Venmo (@handle)</label><input className="input" value={pay.venmo} onChange={(e)=>setPay({...pay,venmo:e.target.value})} placeholder="@JJ-Remodeling" /></div>
            <div><label className="label">PayPal.me</label><input className="input" value={pay.paypalMe} onChange={(e)=>setPay({...pay,paypalMe:e.target.value})} placeholder="paypal.me/jjremodeling" /></div>
            <div className="md:col-span-2"><label className="label">Stripe payment link (paste from Stripe dashboard)</label><input className="input" value={pay.stripeLink} onChange={(e)=>setPay({...pay,stripeLink:e.target.value})} placeholder="https://buy.stripe.com/..." /></div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pay.cash} onChange={(e)=>setPay({...pay,cash:e.target.checked})} /> Accepts cash</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pay.check} onChange={(e)=>setPay({...pay,check:e.target.checked})} /> Accepts check</label>
              {pay.check && <input className="input !py-2 flex-1 min-w-[180px]" value={pay.payToName} onChange={(e)=>setPay({...pay,payToName:e.target.value})} placeholder="Make checks payable to..." />}
            </div>
          </div>
        </div>

        {/* Service picker */}
        <div>
          <label className="label">
            Services offered <span className="text-gold">({services.size} selected)</span> — the client intake only shows these
          </label>
          <div className="space-y-4 mt-2">
            {SERVICE_CATEGORIES.map((cat) => {
              const inCat = SERVICE_LIBRARY.filter((s) => s.category === cat.id);
              const allSelected = inCat.every((s) => services.has(s.name));
              return (
                <div key={cat.id} className="card p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{cat.en}</p>
                    <button onClick={() => toggleCategory(cat.id)} className="text-xs text-muted underline">
                      {allSelected ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inCat.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => toggleService(s.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                          services.has(s.name)
                            ? "bg-gold text-obsidian border-gold font-medium"
                            : "border-white/15 text-bone"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !form.businessName || !form.phone || contractorPin.length !== 6 || operatorPin.length !== 6}
          className="btn-gold w-full disabled:opacity-40"
        >
          {submitting ? "Creating…" : "Create contractor page"}
        </button>
      </div>
    </main>
  );
}

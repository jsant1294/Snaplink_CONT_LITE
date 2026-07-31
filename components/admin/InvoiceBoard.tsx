"use client";

import { useEffect, useState } from "react";
import type { Contractor } from "@/lib/types";
import type { Invoice } from "@/lib/invoice-types";
import { formatCents } from "@/lib/money";
import { nt, type Lang } from "@/lib/i18n";
import ModuleLocked from "@/components/admin/ModuleLocked";

type PublicContractor = Omit<Contractor, "pin">;

interface Status {
  stripeEnabled: boolean;
  connected: boolean;
  onboardingComplete: boolean;
}

export default function InvoiceBoard({
  contractor,
  pin,
}: {
  contractor?: PublicContractor | null;
  pin: string;
}) {
  const lang: Lang = contractor?.preferredLanguage ?? "en";
  const [status, setStatus] = useState<Status | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const contractorId = contractor?.id ?? "";

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin };
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function load() {
    if (!contractorId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/contractor/invoices/status?contractorId=${contractorId}`, { headers: headers() }),
      fetch(`/api/contractor/invoices?contractorId=${contractorId}`, { headers: headers() }),
    ])
      .then(async ([statusRes, invoicesRes]) => {
        if (statusRes.status === 403 || invoicesRes.status === 403) {
          setLocked(true);
          setLoading(false);
          return;
        }
        const [s, i] = await Promise.all([statusRes.json(), invoicesRes.json()]);
        setStatus(s);
        setInvoices(i.invoices ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(load, [contractorId]);

  async function connect() {
    setBusy(true);
    const res = await fetch("/api/contractor/invoices/connect", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contractorId }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.url) window.location.href = data.url;
    else showToast(data.error ?? "Could not start Stripe onboarding");
  }

  async function createInvoice() {
    setBusy(true);
    const res = await fetch("/api/contractor/invoices", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contractorId, clientName, clientEmail, amount, description }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.invoice) {
      setInvoices((list) => [data.invoice, ...list]);
      setShowForm(false);
      setClientName("");
      setClientEmail("");
      setAmount("");
      setDescription("");
      showToast(nt("draftCreated", lang));
    } else {
      showToast(data.error ?? "Could not create invoice");
    }
  }

  async function send(id: string) {
    setBusy(true);
    const res = await fetch(`/api/contractor/invoices/${id}/send`, { method: "POST", headers: headers() });
    const data = await res.json();
    setBusy(false);
    if (data.invoice) {
      setInvoices((list) => list.map((i) => (i.id === id ? data.invoice : i)));
      showToast(nt("sent", lang));
    } else {
      showToast(data.error ?? "Could not send invoice");
    }
  }

  if (!contractor || loading) return <p className="text-sm text-muted">{nt("loading", lang)}</p>;
  if (locked) return <ModuleLocked lang={lang} />;
  if (!status) return <p className="text-sm text-muted">{nt("loading", lang)}</p>;

  if (!status.stripeEnabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-charcoal p-6 text-center">
        <p className="text-sm text-muted">{nt("stripeNotConfigured", lang)}</p>
      </div>
    );
  }

  if (!status.connected || !status.onboardingComplete) {
    return (
      <div className="rounded-2xl border border-white/10 bg-charcoal p-6 text-center">
        <p className="mb-4 text-sm text-muted">{nt("connectStripePrompt", lang)}</p>
        <button onClick={connect} disabled={busy} className="btn-gold !py-2 text-sm disabled:opacity-40">
          {busy ? nt("redirecting", lang) : nt("connectStripe", lang)}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {invoices.length} {nt("invoicesCount", lang)}
        </p>
        <button onClick={() => setShowForm((s) => !s)} className="btn-gold !py-2 text-sm">
          {nt("newInvoice", lang)}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-charcoal p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{nt("clientName", lang)}</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{nt("clientEmail", lang)}</label>
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{nt("amount", lang)}</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{nt("description", lang)}</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
            </div>
          </div>
          <button
            onClick={createInvoice}
            disabled={busy || !clientEmail || !amount}
            className="btn-gold w-full !py-2 text-sm disabled:opacity-40"
          >
            {busy ? nt("creating", lang) : nt("createDraft", lang)}
          </button>
        </div>
      )}

      {invoices.length === 0 && (
        <p className="py-8 text-center text-sm text-muted/60">{nt("noInvoices", lang)}</p>
      )}

      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="rounded-xl border border-white/10 bg-obsidian p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.clientName || inv.clientEmail}</p>
                <p className="text-xs text-muted">
                  {formatCents(inv.amountCents)} · {inv.status}
                </p>
              </div>
              {!inv.providerInvoiceId && (
                <button onClick={() => send(inv.id)} disabled={busy} className="btn-gold !py-1.5 !px-3 text-xs disabled:opacity-40">
                  {nt("send", lang)}
                </button>
              )}
              {inv.hostedInvoiceUrl && (
                <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                  {nt("view", lang)}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-gold/40 bg-charcoal px-4 py-2.5 text-sm shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}

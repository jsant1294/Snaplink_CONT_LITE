"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Contractor, Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { serviceLabel } from "@/lib/services";
import { at, statusLabel, type Lang } from "@/lib/i18n";
import { totalPaid } from "@/lib/types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-gold/20 text-goldlight border-gold/40",
  "Needs Call": "bg-warn/15 text-warn border-warn/40",
  "Walkthrough Scheduled": "bg-sky-500/15 text-sky-300 border-sky-500/40",
  "Estimate Sent": "bg-violet-500/15 text-violet-300 border-violet-500/40",
  Approved: "bg-success/15 text-success border-success/40",
  "In Progress": "bg-teal-500/15 text-teal-300 border-teal-500/40",
  Completed: "bg-white/10 text-bone border-white/20",
  "Follow Up": "bg-orange-500/15 text-orange-300 border-orange-500/40",
  Lost: "bg-danger/15 text-danger border-danger/40",
};

type PublicContractor = Omit<Contractor, "pin">;

export function pinStorageKey(username?: string) {
  return username ? `snaplink_pin_${username}` : "snaplink_pin_operator";
}

export function storedPin(username?: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(pinStorageKey(username)) ?? "";
}

// ---------------------------------------------------------------------------
// PIN gate — wraps master or scoped dashboard
// ---------------------------------------------------------------------------

export function PinGate({
  username,
  lang = "en",
  title,
  children,
}: {
  username?: string;
  lang?: Lang;
  title: string;
  children: (pin: string, contractor: PublicContractor | null) => React.ReactNode;
}) {
  const [pin, setPin] = useState("");
  const [input, setInput] = useState("");
  const [contractor, setContractor] = useState<PublicContractor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [restored, setRestored] = useState(false);

  const verify = useCallback(
    async (candidate: string, silent = false) => {
      setChecking(true);
      setError(null);
      try {
        const res = await fetch("/api/contractor/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: candidate, username }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem(pinStorageKey(username), candidate);
        setContractor(data.contractor ?? null);
        setPin(candidate);
      } catch (e) {
        sessionStorage.removeItem(pinStorageKey(username));
        if (!silent) setError(e instanceof Error ? e.message : at("wrongPin", lang));
      } finally {
        setChecking(false);
        setRestored(true);
      }
    },
    [username, lang]
  );

  useEffect(() => {
    const saved = storedPin(username);
    if (saved) {
      verify(saved, true);
      return;
    }
    // ?pin= lets a shared link (demo, PDF, etc.) open straight into the dashboard.
    const urlPin = new URLSearchParams(window.location.search).get("pin");
    if (urlPin && /^\d{6}$/.test(urlPin)) verify(urlPin, true);
    else setRestored(true);
  }, [username, verify]);

  if (pin) return <>{children(pin, contractor)}</>;

  return (
    <main className="min-h-screen max-w-sm mx-auto px-5 pt-24 text-center">
      <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-2">SnapLink Contractor</p>
      <h1 className="font-display text-3xl mb-6">{title}</h1>
      {restored && (
        <>
          <input
            className="input text-center text-2xl tracking-[0.4em] font-mono"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && input.length === 6 && verify(input)}
            aria-label={at("enterPin", lang)}
          />
          <p className="text-xs text-muted mt-2 mb-5">{at("enterPin", lang)}</p>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <button
            onClick={() => verify(input)}
            disabled={checking || input.length !== 6}
            className="btn-gold w-full disabled:opacity-40"
          >
            {checking ? "…" : at("unlock", lang)}
          </button>
        </>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Lead board — used by both the operator master view and the scoped tenant view
// ---------------------------------------------------------------------------

export default function Dashboard({
  mode,
  contractor,
  pin,
}: {
  mode: "master" | "scoped";
  contractor?: PublicContractor | null;
  pin: string;
}) {
  const [lang, setLang] = useState<Lang>(
    mode === "scoped" ? contractor?.preferredLanguage ?? "en" : "en"
  );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({ "x-snaplink-pin": pin }), [pin]);

  const load = useCallback(async () => {
    const qs = mode === "scoped" && contractor ? `?contractor=${contractor.username}` : "";
    const res = await fetch(`/api/contractor/leads${qs}`, { headers: authHeaders });
    const data = await res.json();
    setLeads(res.ok ? data.leads ?? [] : []);
    setLoading(false);
  }, [mode, contractor, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function switchLanguage(next: Lang) {
    setLang(next); // flips the whole dashboard instantly
    if (mode === "scoped" && contractor) {
      // Persist so the estimator + future visits follow. Best-effort.
      fetch("/api/contractor/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ contractorId: contractor.id, preferredLanguage: next }),
      }).catch(() => {});
    }
  }

  async function setStatus(id: string, status: LeadStatus) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/contractor/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status }),
    });
  }

  async function generateAi(id: string) {
    setBusyLead(id);
    try {
      const res = await fetch("/api/contractor/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ leadId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ai: data.ai } : l)));
      showToast(at("aiReady", lang));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "AI failed");
    } finally {
      setBusyLead(null);
    }
  }

  async function recordPayment(leadId: string, amount: number, via: string, kind: string) {
    const res = await fetch("/api/contractor/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ leadId, amount, via, kind }),
    });
    const data = await res.json();
    if (res.ok) {
      setLeads((ls) => ls.map((l) => (l.id === leadId ? data.lead : l)));
      showToast(lang === "es" ? "Pago registrado" : "Payment recorded");
    } else showToast(data.error ?? "Failed");
  }

  function copyFollowUp(lead: Lead) {
    const first = lead.clientName.split(" ")[0];
    const msg =
      lead.ai?.followUpSms ??
      (lead.language === "es"
        ? `Hola ${first}, gracias por tu solicitud de ${serviceLabel(lead.projectType, "es").toLowerCase()}. ¿Cuándo te queda bien una visita rápida?`
        : `Hi ${first}, thanks for your ${lead.projectType.toLowerCase()} request. When is a good time for a quick walkthrough?`);
    navigator.clipboard.writeText(msg);
    showToast(at("copied", lang));
  }

  const visible = filter === "All" ? leads : leads.filter((l) => l.status === filter);

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 pb-20 pt-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold">
            {mode === "scoped" ? contractor?.businessName : "SnapLink Contractor · Operator"}
          </p>
          <h1 className="font-display text-4xl mt-1">{at("leads", lang)}</h1>
          {mode === "scoped" && contractor && (
            <a href={`/contractor/${contractor.username}`} className="text-xs text-gold underline">
              {at("yourPage", lang)}: /contractor/{contractor.username}
            </a>
          )}
        </div>
        {mode === "master" && (
          <a href="/contractor-admin/new-contractor" className="btn-gold !py-2 text-sm">
            + New Contractor
          </a>
        )}
        {mode === "scoped" && (
          <div className="inline-flex rounded-full border border-white/15 overflow-hidden text-xs">
            <button
              onClick={() => switchLanguage("en")}
              className={`px-3 py-1.5 ${lang === "en" ? "bg-gold text-obsidian font-semibold" : "text-muted"}`}
            >
              English
            </button>
            <button
              onClick={() => switchLanguage("es")}
              className={`px-3 py-1.5 ${lang === "es" ? "bg-gold text-obsidian font-semibold" : "text-muted"}`}
            >
              Español
            </button>
          </div>
        )}
      </header>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4">
        {(["All", ...LEAD_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${
              filter === s ? "bg-gold text-obsidian border-gold font-semibold" : "border-white/15 text-muted"
            }`}
          >
            {s === "All" ? at("all", lang) : statusLabel(s, lang)}
            {s !== "All" && <span className="ml-1 opacity-70">{leads.filter((l) => l.status === s).length}</span>}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted">{at("loadingLeads", lang)}</p>}

      {!loading && visible.length === 0 && (
        <div className="card p-8 text-center">
          <p className="font-display text-2xl mb-2">{at("noLeadsTitle", lang)}</p>
          <p className="text-muted text-sm">{at("noLeadsBody", lang)}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            lang={lang}
            pin={pin}
            showTenant={mode === "master"}
            busy={busyLead === lead.id}
            onStatus={(s) => setStatus(lead.id, s)}
            onAi={() => generateAi(lead.id)}
            onCopy={() => copyFollowUp(lead)}
            onRecordPayment={(amt, via, kind) => recordPayment(lead.id, amt, via, kind)}
          />
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card">
          {toast}
        </div>
      )}
    </main>
  );
}

function LeadCard({
  lead,
  lang,
  pin,
  showTenant,
  busy,
  onStatus,
  onAi,
  onCopy,
  onRecordPayment,
}: {
  lead: Lead;
  lang: Lang;
  pin: string;
  showTenant: boolean;
  busy: boolean;
  onStatus: (s: LeadStatus) => void;
  onAi: () => void;
  onCopy: () => void;
  onRecordPayment: (amount: number, via: string, kind: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [payVia, setPayVia] = useState("Zelle");
  const [payKind, setPayKind] = useState("deposit");
  const paid = totalPaid(lead);
  const wa = lead.phone.replace(/[^\d]/g, "");
  const pdfBase = `/api/contractor/proposal-pdf?leadId=${lead.id}&pin=${pin}`;

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h2 className="font-semibold text-lg leading-tight">{lead.clientName}</h2>
          <p className="text-sm text-gold">{serviceLabel(lead.projectType, lang)}</p>
          {showTenant && <p className="text-[11px] text-muted">→ {lead.contractorUsername}</p>}
        </div>
        <select
          value={lead.status}
          onChange={(e) => onStatus(e.target.value as LeadStatus)}
          className={`text-xs rounded-full border px-2.5 py-1 bg-transparent ${STATUS_COLORS[lead.status]}`}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-charcoal text-bone">
              {statusLabel(s, lang)}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-muted space-y-0.5 mb-3">
        <p>{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</p>
        {lead.projectAddress && <p>{lead.projectAddress}</p>}
        <p>
          {lead.timeline || at("timelineTbd", lang)} · {lead.budgetRange || at("budgetTbd", lang)}
        </p>
        <p className="text-xs">
          {at("prefers", lang)} {lead.preferredContact}
          {lead.bestTimeToContact ? ` · ${lead.bestTimeToContact}` : ""} · {at("via", lang)} {lead.source}
          <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-gold/15 text-goldlight border border-gold/30 text-[10px] font-semibold align-middle">
            {lead.language === "es" ? at("speaksSpanish", lang) : at("speaksEnglish", lang)}
          </span>
        </p>
      </div>

      {lead.photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {lead.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.dataUrl} alt={p.kind} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          ))}
        </div>
      )}

      {lead.ai ? (
        <div className="bg-slateink rounded-xl p-3 mb-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-gold mb-1.5">{at("aiSummary", lang)}</p>
          <p className="text-bone/90">{lead.ai.summary}</p>
          <button onClick={() => setOpen(!open)} className="text-xs text-gold mt-2">
            {open ? at("hideDetails", lang) : at("aiDetails", lang)}
          </button>
          {open && (
            <div className="mt-3 space-y-3 text-bone/85">
              <AiList title={at("scopeNotes", lang)} items={lead.ai.scopeNotes} />
              <AiList title={at("questionsToAsk", lang)} items={lead.ai.questionsForClient} />
              <AiList title={at("needsConfirmation", lang)} items={lead.ai.needsConfirmation} accent />
              <p className="text-[10px] text-muted">Model: {lead.ai.model}</p>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={onAi}
          disabled={busy}
          className="w-full mb-3 border border-gold/40 text-goldlight rounded-xl py-2 text-sm disabled:opacity-50"
        >
          {busy ? at("generating", lang) : at("generateAi", lang)}
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <a href={`tel:${lead.phone}`} className="btn-outline !py-2 !rounded-lg">{at("call", lang)}</a>
        <a href={`sms:${lead.phone}`} className="btn-outline !py-2 !rounded-lg">{at("text", lang)}</a>
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !rounded-lg">
          WhatsApp
        </a>
        <button onClick={onCopy} className="btn-outline !py-2 !rounded-lg">{at("copyFollowUp", lang)}</button>
        <a href={`${pdfBase}&lang=en`} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !rounded-lg">
          {at("proposalPdf", lang)} EN
        </a>
        <a href={`${pdfBase}&lang=es`} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !rounded-lg">
          {at("proposalPdf", lang)} ES
        </a>
        <a
          href={`/contractor-admin/estimate/${lead.id}`}
          className="btn-gold !py-2 !rounded-lg col-span-3"
        >
          {at("buildEstimate", lang)}
        </a>
      </div>

      {/* Payments */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-gold">{lang === "es" ? "Pagos" : "Payments"}</span>
          <span className="text-sm font-semibold">
            {paid > 0 ? (lang === "es" ? `Pagado $${paid.toFixed(2)}` : `Paid $${paid.toFixed(2)}`) : (lang === "es" ? "Sin pagos" : "No payments yet")}
          </span>
        </div>
        {(lead.payments ?? []).length > 0 && (
          <ul className="text-xs text-muted space-y-1 mb-2">
            {(lead.payments ?? []).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.kind} · {p.via}</span>
                <span className="text-bone">${p.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPayOpen(!payOpen)} className="btn-outline !py-2 !rounded-lg text-xs">
            {lang === "es" ? "＋ Registrar pago" : "＋ Record payment"}
          </button>
          <a href={`/api/contractor/invoice-pdf?leadId=${lead.id}&pin=${pin}&lang=${lead.language}`} target="_blank" rel="noopener noreferrer" className="btn-gold !py-2 !rounded-lg text-xs">
            {lang === "es" ? "Factura PDF" : "Invoice PDF"}
          </a>
        </div>
        {payOpen && (
          <div className="mt-2 bg-slateink rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="input !py-2 text-sm" type="number" min="0" step="any" placeholder={lang === "es" ? "Monto $" : "Amount $"} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
              <select className="input !py-2 text-sm" value={payKind} onChange={(e) => setPayKind(e.target.value)}>
                <option value="deposit" className="bg-charcoal">{lang === "es" ? "Depósito" : "Deposit"}</option>
                <option value="balance" className="bg-charcoal">{lang === "es" ? "Saldo" : "Balance"}</option>
                <option value="partial" className="bg-charcoal">{lang === "es" ? "Parcial" : "Partial"}</option>
                <option value="full" className="bg-charcoal">{lang === "es" ? "Total" : "Full"}</option>
              </select>
            </div>
            <select className="input !py-2 text-sm w-full" value={payVia} onChange={(e) => setPayVia(e.target.value)}>
              {["Zelle","CashApp","Venmo","PayPal","Stripe","Cash","Check","Other"].map((v) => <option key={v} value={v} className="bg-charcoal">{v}</option>)}
            </select>
            <button
              onClick={() => { const a = Number(payAmt); if (a > 0) { onRecordPayment(a, payVia, payKind); setPayAmt(""); setPayOpen(false); } }}
              className="btn-gold w-full !py-2 text-sm"
            >
              {lang === "es" ? "Guardar pago" : "Save payment"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function AiList({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={`text-xs uppercase tracking-wider mb-1 ${accent ? "text-warn" : "text-muted"}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gold">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

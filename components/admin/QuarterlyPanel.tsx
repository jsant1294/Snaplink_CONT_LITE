"use client";

// ---------------------------------------------------------------------------
// Quarterly & year-end — Lucio Financial Copilot, Delivery 3.
//
// Answers "how do I stay current": what each quarter produced, what to set
// aside, what was actually moved, and where you're short.
//
// The due dates shown are TYPICAL federal estimated-payment dates and are
// labeled as such. This panel does not compute tax owed and is not tax advice.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import type { QuarterlyView, TaxSetAside } from "@/lib/money-types";
import { formatCents, todayIso } from "@/lib/money";
import { qt, mt, type Lang } from "@/lib/i18n";

export default function QuarterlyPanel({
  username,
  pin,
  lang,
  year,
  onClose,
  onChanged,
}: {
  username: string;
  pin: string;
  lang: Lang;
  year: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [view, setView] = useState<QuarterlyView | null>(null);
  const [history, setHistory] = useState<TaxSetAside[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [amount, setAmount] = useState("");
  const [quarter, setQuarter] = useState(1);
  const [movedOn, setMovedOn] = useState(todayIso());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const authHeaders = { "x-snaplink-pin": pin };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/contractor/quarterly?contractor=${username}&year=${year}&lang=${lang}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        setView(d.view);
        setHistory(d.setAsides ?? []);
      }
    } catch {
      setError("Could not load. Check your connection.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, year, lang, pin]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSetAside() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/setasides", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          contractorUsername: username,
          amount,
          quarter,
          taxYear: year,
          movedOn,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setAmount("");
      setNote("");
      setShowForm(false);
      load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeSetAside(id: string) {
    if (!window.confirm(qt("confirmRemove", lang))) return;
    await fetch(`/api/contractor/setasides/${id}`, { method: "DELETE", headers: authHeaders });
    load();
    onChanged();
  }

  const pdfBase = `/api/contractor/year-end-pdf?contractor=${username}&year=${year}&pin=${pin}`;
  const csvUrl = `/api/contractor/year-end-csv?contractor=${username}&year=${year}&pin=${pin}`;

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-2xl">{qt("title", lang)}</h2>
        <button onClick={onClose} className="btn-outline !py-1.5 !px-3 text-xs">
          {qt("close", lang)}
        </button>
      </div>
      <p className="text-sm text-muted mb-4">{qt("intro", lang)}</p>

      {error && <div className="card border-danger/40 p-3 mb-4 text-sm text-danger">{error}</div>}
      {loading && <p className="text-muted text-sm">{qt("loading", lang)}</p>}

      {view && (
        <>
          {/* Quarter cards */}
          <div className="grid gap-3 md:grid-cols-2 mb-4">
            {view.quarters.map((q) => {
              const short = q.shortfallCents > 0;
              return (
                <div key={q.quarter} className={`card p-4 ${short ? "border-warn/40" : ""}`}>
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="font-display text-xl">Q{q.quarter}</span>
                      <span className="text-xs text-muted ml-2">{q.periodLabel}</span>
                    </div>
                    <span className="text-[10px] text-muted">
                      {qt("typicalDue", lang)}: {q.typicalDueDate}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <Row k={qt("income", lang)} v={formatCents(q.incomeCents, lang)} />
                    <Row k={qt("expenses", lang)} v={formatCents(q.expenseCents, lang)} />
                    <Row k={qt("net", lang)} v={formatCents(q.netCents, lang)} bold />
                    <Row k={qt("suggested", lang)} v={formatCents(q.suggestedSetAsideCents, lang)} gold />
                    <Row k={qt("actuallySetAside", lang)} v={formatCents(q.setAsideCents, lang)} />
                    {short ? (
                      <Row k={qt("shortfall", lang)} v={formatCents(q.shortfallCents, lang)} warn />
                    ) : (
                      q.suggestedSetAsideCents > 0 && (
                        <p className="text-[11px] text-success pt-1">✓ {qt("caughtUp", lang)}</p>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slateink rounded-xl p-3 mb-4">
            <p className="text-[11px] text-warn">⚠ {qt("dueDateWarning", lang)}</p>
          </div>

          {/* Year totals */}
          <div className="card p-4 mb-4">
            <p className="text-xs uppercase tracking-wider text-gold mb-2">
              {qt("yearTotals", lang)} · {view.taxYear} · {view.setAsidePercent}%
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Stat label={qt("income", lang)} value={formatCents(view.totals.incomeCents, lang)} />
              <Stat label={qt("expenses", lang)} value={formatCents(view.totals.expenseCents, lang)} />
              <Stat label={qt("net", lang)} value={formatCents(view.totals.netCents, lang)} big />
              <Stat label={qt("suggested", lang)} value={formatCents(view.totals.suggestedSetAsideCents, lang)} gold />
              <Stat label={qt("actuallySetAside", lang)} value={formatCents(view.totals.setAsideCents, lang)} />
              {view.totals.shortfallCents > 0 && (
                <Stat label={qt("shortfall", lang)} value={formatCents(view.totals.shortfallCents, lang)} warn />
              )}
            </div>
          </div>

          {/* Log a set-aside */}
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-outline !py-2 text-sm mb-4">
              ＋ {qt("logSetAside", lang)}
            </button>
          ) : (
            <div className="bg-slateink rounded-xl p-4 mb-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">{qt("amount", lang)} *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                    <input
                      className="input !py-2 !pl-7"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{qt("whichQuarter", lang)}</label>
                  <select className="input !py-2" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
                    {view.quarters.map((q) => (
                      <option key={q.quarter} value={q.quarter} className="bg-charcoal">
                        Q{q.quarter} · {q.periodLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{qt("dateMoved", lang)}</label>
                  <input className="input !py-2" type="date" value={movedOn} onChange={(e) => setMovedOn(e.target.value)} />
                </div>
                <div>
                  <label className="label">{qt("note", lang)}</label>
                  <input className="input !py-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder={mt("notePlaceholder", lang)} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveSetAside}
                  disabled={saving || !amount || Number(amount) <= 0}
                  className="btn-gold flex-1 !py-2 text-sm disabled:opacity-40"
                >
                  {saving ? qt("saving", lang) : qt("save", lang)}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline !py-2 text-sm">
                  {qt("cancel", lang)}
                </button>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-gold mb-2">{qt("history", lang)}</p>
              <div className="space-y-1">
                {history.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-sm bg-slateink rounded-lg px-3 py-2">
                    <span className="text-muted text-xs w-24">{s.movedOn}</span>
                    <span className="text-xs text-gold">Q{s.quarter}</span>
                    <span className="flex-1 truncate text-xs text-muted">{s.note}</span>
                    <span className="font-semibold">{formatCents(s.amountCents, lang)}</span>
                    <button onClick={() => removeSetAside(s.id)} className="text-[11px] text-danger">
                      {qt("remove", lang)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Year-end pack */}
          <div className="card p-4 border-gold/30">
            <p className="text-xs uppercase tracking-wider text-gold mb-1">{qt("yearEnd", lang)}</p>
            <p className="text-[11px] text-muted mb-3">{qt("yearEndNote", lang)}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`${pdfBase}&lang=en`} target="_blank" rel="noopener noreferrer" className="btn-gold !py-2 text-xs">
                {qt("downloadPdfEn", lang)}
              </a>
              <a href={`${pdfBase}&lang=es`} target="_blank" rel="noopener noreferrer" className="btn-gold !py-2 text-xs">
                {qt("downloadPdfEs", lang)}
              </a>
              <a href={csvUrl} className="btn-outline !py-2 text-xs">
                {qt("downloadCsv", lang)}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ k, v, bold, gold, warn }: { k: string; v: string; bold?: boolean; gold?: boolean; warn?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={gold ? "text-goldlight" : warn ? "text-warn" : "text-muted"}>{k}</span>
      <span className={`${bold ? "font-semibold" : ""} ${gold ? "text-goldlight" : warn ? "text-warn" : ""}`}>{v}</span>
    </div>
  );
}

function Stat({ label, value, big, gold, warn }: { label: string; value: string; big?: boolean; gold?: boolean; warn?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`${big ? "font-display text-2xl" : "text-base font-semibold"} ${gold ? "text-goldlight" : warn ? "text-warn" : ""}`}>
        {value}
      </p>
    </div>
  );
}

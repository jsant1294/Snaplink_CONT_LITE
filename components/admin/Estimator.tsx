"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lead, Estimate, EstimateLineItem } from "@/lib/types";
import { estimateTotals } from "@/lib/types";
import {
  ESTIMATE_LIBRARY,
  UNIT_LABELS,
  searchItems,
  type EstimateItemDef,
  type Unit,
} from "@/lib/estimate-library";
import { SERVICE_CATEGORIES, getService, serviceLabel, categoryLabel } from "@/lib/services";
import { at, type Lang } from "@/lib/i18n";
import { storedPin } from "@/components/admin/Dashboard";
import type { Contractor } from "@/lib/types";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const UNITS = Object.keys(UNIT_LABELS) as Unit[];

function newLineId() {
  return `li_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export default function Estimator({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [contractor, setContractor] = useState<Omit<Contractor, "pin"> | null>(null);
  const [pin, setPin] = useState("");
  const [denied, setDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [items, setItems] = useState<EstimateLineItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [depositPercent, setDepositPercent] = useState(30);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load lead + existing estimate (PIN from whichever session unlocked a dashboard)
  useEffect(() => {
    (async () => {
      // Try operator pin first, then any contractor-scoped pin in this session
      const candidates: string[] = [];
      const op = storedPin();
      if (op) candidates.push(op);
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("snaplink_pin_") && k !== "snaplink_pin_operator") {
          const v = sessionStorage.getItem(k);
          if (v) candidates.push(v);
        }
      }
      let leadData: Lead | null = null;
      let goodPin = "";
      for (const p of candidates) {
        const r = await fetch(`/api/contractor/leads/${leadId}`, { headers: { "x-snaplink-pin": p } });
        if (r.ok) {
          leadData = (await r.json()).lead;
          goodPin = p;
          break;
        }
        if (r.status === 404) {
          setNotFound(true);
          return;
        }
      }
      if (!leadData) {
        setDenied(true);
        return;
      }
      setPin(goodPin);
      const lead = leadData;
      setLead(lead);
      // Contractor language drives the estimator UI
      const profRes = await fetch("/api/contractor/profiles");
      const { contractors } = await profRes.json();
      const ctr = (contractors as Omit<Contractor, "pin">[]).find((c) => c.id === lead.contractorId);
      if (ctr) setContractor(ctr);
      // Default the library filter to the lead's trade category
      const svc = getService(lead.projectType);
      if (svc) setCategory(svc.category);

      const estRes = await fetch(`/api/contractor/estimates?leadId=${leadId}`, { headers: { "x-snaplink-pin": goodPin } });
      const { estimate } = (await estRes.json()) as { estimate: Estimate | null };
      if (estimate) {
        setItems(estimate.lineItems);
        setTaxRate(estimate.taxRate);
        setDiscount(estimate.discount);
        setDepositPercent(estimate.depositPercent);
        setNotes(estimate.notes);
        setValidDays(estimate.validDays);
      }
    })();
  }, [leadId]);

  const lang: Lang = contractor?.preferredLanguage ?? "en";

  const results = useMemo(() => searchItems(query, category).slice(0, 24), [query, category]);
  const totals = useMemo(
    () => estimateTotals({ lineItems: items, taxRate, discount, depositPercent }),
    [items, taxRate, discount, depositPercent]
  );

  function addFromLibrary(def: EstimateItemDef) {
    setItems((prev) => [
      ...prev,
      {
        id: newLineId(),
        libraryId: def.id,
        description: def.en,
        descriptionEs: def.es,
        qty: 1,
        unit: def.unit,
        unitPrice: 0,
      },
    ]);
  }

  function addCustom() {
    setItems((prev) => [
      ...prev,
      { id: newLineId(), description: "", qty: 1, unit: "each", unitPrice: 0 },
    ]);
  }

  function updateItem(id: string, patch: Partial<EstimateLineItem>) {
    setItems((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((li) => li.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((li) => li.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify({ leadId, lineItems: items, taxRate, discount, depositPercent, notes, validDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSavedAt(new Date().toLocaleTimeString());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndPdf(targetLang: Lang) {
    const ok = await save();
    if (ok) window.open(`/api/contractor/estimate-pdf?leadId=${leadId}&pin=${pin}&lang=${targetLang}`, "_blank");
  }

  if (notFound || denied) {
    return (
      <main className="min-h-screen max-w-md mx-auto px-5 pt-16 text-center">
        <h1 className="font-display text-3xl mb-3">
          {notFound ? at("leadNotFound", lang) : "Unlock a dashboard first"}
        </h1>
        <Link href="/contractor-admin" className="btn-outline inline-block">{at("backToDashboard", lang)}</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 pt-8 pb-40">
      <Link href={contractor ? `/contractor-admin/${contractor.username}` : "/contractor-admin"} className="text-sm text-muted">← {at("dashboard", lang)}</Link>
      <div className="flex flex-wrap items-end justify-between gap-3 mt-2 mb-6">
        <div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold">{at("estimator", lang)}</p>
          <h1 className="font-display text-3xl mt-0.5">
            {lead ? `${lead.clientName} · ${serviceLabel(lead.projectType, lang)}` : at("loading", lang)}
          </h1>
          {lead && (
            <p className="text-sm text-muted">
              {lead.projectAddress || at("noAddress", lang)} · {lead.budgetRange || at("budgetTbd", lang)}
              <span className="ml-2 px-1.5 py-0.5 rounded bg-gold/15 text-goldlight border border-gold/30 text-[10px] font-semibold">
                {lead.language === "es" ? at("speaksSpanish", lang) : at("speaksEnglish", lang)}
              </span>
            </p>
          )}
        </div>
      </div>

      {error && <div className="card border-danger/40 p-3 mb-4 text-sm text-danger">{error}</div>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* LEFT: line items */}
        <section>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{at("lineItems", lang)}</h2>
              <button onClick={addCustom} className="text-xs text-gold border border-gold/40 rounded-lg px-2.5 py-1.5">
                {at("customItem", lang)}
              </button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-muted py-6 text-center">
                {at("noItemsYet", lang)}
              </p>
            )}

            <div className="space-y-3">
              {items.map((li, idx) => (
                <div key={li.id} className="bg-slateink rounded-xl p-3">
                  <div className="flex gap-2 items-start">
                    <div className="flex flex-col gap-1 pt-1">
                      <button onClick={() => move(li.id, -1)} disabled={idx === 0} className="text-muted text-xs disabled:opacity-20">▲</button>
                      <button onClick={() => move(li.id, 1)} disabled={idx === items.length - 1} className="text-muted text-xs disabled:opacity-20">▼</button>
                    </div>
                    <div className="flex-1">
                      <input
                        className="input !py-2 text-sm"
                        placeholder={at("descriptionPh", lang)}
                        value={li.description}
                        onChange={(e) => updateItem(li.id, { description: e.target.value })}
                      />
                      <div className="grid grid-cols-[80px_110px_1fr_auto] gap-2 mt-2 items-center">
                        <input
                          className="input !py-2 text-sm"
                          type="number"
                          min={0}
                          step="any"
                          value={li.qty}
                          onChange={(e) => updateItem(li.id, { qty: Number(e.target.value) })}
                          aria-label={at("quantity", lang)}
                        />
                        <select
                          className="input !py-2 text-sm"
                          value={li.unit}
                          onChange={(e) => updateItem(li.id, { unit: e.target.value })}
                          aria-label={at("unitLbl", lang)}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u} className="bg-charcoal">{UNIT_LABELS[u][lang]}</option>
                          ))}
                        </select>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                          <input
                            className="input !py-2 !pl-7 text-sm"
                            type="number"
                            min={0}
                            step="any"
                            value={li.unitPrice}
                            onChange={(e) => updateItem(li.id, { unitPrice: Number(e.target.value) })}
                            aria-label="Unit price"
                          />
                        </div>
                        <span className="text-sm font-semibold w-20 text-right">{money(li.qty * li.unitPrice)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(li.id)} className="text-danger text-sm pt-1" aria-label="Remove item">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Library */}
          <div className="card p-4 mt-4">
            <h2 className="font-semibold mb-3">{at("itemLibrary", lang)} <span className="text-muted text-xs font-normal">({ESTIMATE_LIBRARY.length} {at("yourRates", lang)})</span></h2>
            <div className="flex gap-2 mb-3">
              <input
                className="input !py-2 text-sm flex-1"
                placeholder={at("searchPlaceholder", lang)}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select className="input !py-2 text-sm w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all" className="bg-charcoal">{at("allTrades", lang)}</option>
                <option value="general" className="bg-charcoal">{at("generalAnyJob", lang)}</option>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-charcoal">{categoryLabel(c.id, lang)}</option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {results.map((def) => (
                <button
                  key={def.id}
                  onClick={() => addFromLibrary(def)}
                  className="text-left bg-slateink hover:border-gold/50 border border-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-sm">{lang === "es" ? def.es : def.en}</span>
                  <span className="block text-[11px] text-muted">{at("per", lang)} {UNIT_LABELS[def.unit][lang]} · {lang === "es" ? def.en : def.es}</span>
                </button>
              ))}
              {results.length === 0 && <p className="text-sm text-muted col-span-2 py-4 text-center">{at("noMatches", lang)}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4 mt-4">
            <label className="label">{at("notesLabel", lang)}</label>
            <textarea
              className="input min-h-[80px] text-sm"
              placeholder={at("notesPlaceholder", lang)}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        {/* RIGHT: totals panel */}
        <aside className="card p-4 lg:sticky lg:top-4">
          <h2 className="font-semibold mb-3">{at("totals", lang)}</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label !mb-1">{at("taxRate", lang)}</label>
                <input className="input !py-2" type="number" min={0} max={25} step="any" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
              </div>
              <div>
                <label className="label !mb-1">{at("discountLbl", lang)}</label>
                <input className="input !py-2" type="number" min={0} step="any" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </div>
              <div>
                <label className="label !mb-1">{at("depositLbl", lang)}</label>
                <input className="input !py-2" type="number" min={0} max={100} value={depositPercent} onChange={(e) => setDepositPercent(Number(e.target.value))} />
              </div>
              <div>
                <label className="label !mb-1">{at("validDaysLbl", lang)}</label>
                <input className="input !py-2" type="number" min={1} max={365} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 space-y-1.5">
              <Row k={at("subtotal", lang)} v={money(totals.subtotal)} />
              {discount > 0 && <Row k={at("discountRow", lang)} v={`-${money(discount)}`} />}
              {taxRate > 0 && <Row k={`${at("tax", lang)} (${taxRate}%)`} v={money(totals.tax)} />}
              <Row k={at("total", lang)} v={money(totals.total)} big />
              {depositPercent > 0 && (
                <>
                  <Row k={`${at("deposit", lang)} (${depositPercent}%)`} v={money(totals.deposit)} gold />
                  <Row k={at("balance", lang)} v={money(totals.balance)} />
                </>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button onClick={save} disabled={saving} className="btn-outline w-full disabled:opacity-50">
                {saving ? at("saving", lang) : at("saveEstimate", lang)}
              </button>
              <button
                onClick={() => saveAndPdf("en")}
                disabled={saving || items.length === 0}
                className="btn-gold w-full disabled:opacity-40"
              >
                {at("savePdfEn", lang)}
              </button>
              <button
                onClick={() => saveAndPdf("es")}
                disabled={saving || items.length === 0}
                className="btn-gold w-full disabled:opacity-40"
              >
                {at("savePdfEs", lang)}
              </button>
              <p className="text-[11px] text-muted text-center">{at("pdfInBoth", lang)}</p>
              {savedAt && <p className="text-xs text-muted text-center">{at("saved", lang)} {savedAt}</p>}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ k, v, big, gold }: { k: string; v: string; big?: boolean; gold?: boolean }) {
  return (
    <div className={`flex justify-between ${big ? "text-base font-bold" : ""} ${gold ? "text-goldlight" : ""}`}>
      <span className={big || gold ? "" : "text-muted"}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

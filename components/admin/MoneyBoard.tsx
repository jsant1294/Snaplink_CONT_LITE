"use client";

// ---------------------------------------------------------------------------
// Lucio Financial Copilot — the contractor's money board.
// Renders in the contractor's preferredLanguage with the same EN/ES pill used
// on the leads board. Visual language matches components/admin/Dashboard.tsx.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Contractor, Lead } from "@/lib/types";
import type { Expense, ExpenseCategory, MoneySummary, TaxProfile, EntityType } from "@/lib/money-types";
import { formatCents, todayIso } from "@/lib/money";
import { mt, bt, ft, qt, type Lang } from "@/lib/i18n";
import BatchReceipts from "@/components/admin/BatchReceipts";
import Subs1099 from "@/components/admin/Subs1099";
import QuarterlyPanel from "@/components/admin/QuarterlyPanel";
import ModuleLocked from "@/components/admin/ModuleLocked";
import { serviceLabel } from "@/lib/services";

type PublicContractor = Omit<Contractor, "pin">;

/** Same compression settings as components/intake/IntakeWizard.tsx. */
async function compressImage(file: File, maxDim = 1200, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

const ENTITY_LABEL_KEYS: Record<EntityType, "soleProp" | "llcSingle" | "llcMulti" | "sCorp"> = {
  sole_prop: "soleProp",
  llc_single: "llcSingle",
  llc_multi: "llcMulti",
  s_corp: "sCorp",
};

export default function MoneyBoard({
  contractor,
  pin,
}: {
  contractor?: PublicContractor | null;
  pin: string;
}) {
  const [lang, setLang] = useState<Lang>(contractor?.preferredLanguage ?? "en");
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [showQtr, setShowQtr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({ "x-snaplink-pin": pin }), [pin]);
  const username = contractor?.username ?? "";

  // --- add-expense form state ---
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isJob, setIsJob] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [spentOn, setSpentOn] = useState(todayIso());
  const [vendor, setVendor] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<{ dataUrl: string; filename: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const load = useCallback(async () => {
    if (!username) return;
    try {
      const [sRes, eRes, cRes, lRes, pRes] = await Promise.all([
        fetch(`/api/contractor/money-summary?contractor=${username}&year=${year}`, { headers: authHeaders }),
        fetch(`/api/contractor/expenses?contractor=${username}&year=${year}`, { headers: authHeaders }),
        fetch(`/api/contractor/expense-categories?contractor=${username}`, { headers: authHeaders }),
        fetch(`/api/contractor/leads?contractor=${username}`, { headers: authHeaders }),
        fetch(`/api/contractor/tax-profile?contractor=${username}`, { headers: authHeaders }),
      ]);
      if (sRes.status === 403) {
        setLocked(true);
        return;
      }
      if (sRes.ok) setSummary((await sRes.json()).summary);
      if (eRes.ok) setExpenses((await eRes.json()).expenses ?? []);
      if (cRes.ok) {
        const cats: ExpenseCategory[] = (await cRes.json()).categories ?? [];
        setCategories(cats);
        if (!categoryId && cats.length) setCategoryId(cats[0].id);
      }
      if (lRes.ok) setLeads((await lRes.json()).leads ?? []);
      if (pRes.ok) setProfile((await pRes.json()).profile);
    } catch {
      setError("Could not load your money data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
    // categoryId intentionally excluded — only seeds the initial selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, year, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  async function switchLanguage(next: Lang) {
    setLang(next);
    if (contractor) {
      fetch("/api/contractor/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ contractorId: contractor.id, preferredLanguage: next }),
      }).catch(() => {});
    }
  }

  async function handleReceipt(files: FileList | null) {
    if (!files || !files[0]) return;
    try {
      setReceipt({ dataUrl: await compressImage(files[0]), filename: files[0].name });
    } catch {
      setError("Couldn't read that photo. Try another one.");
    }
  }

  function resetForm() {
    setAmount("");
    setIsJob(false);
    setLeadId("");
    setSpentOn(todayIso());
    setVendor("");
    setNote("");
    setReceipt(null);
  }

  async function saveExpense() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          contractorUsername: username,
          amount,
          categoryId,
          leadId: isJob && leadId ? leadId : undefined,
          spentOn,
          vendor,
          note,
          receipt: receipt ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      showToast(mt("saved", lang));
      resetForm();
      setShowAdd(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBilled(exp: Expense) {
    await fetch(`/api/contractor/expenses/${exp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ billedToClient: !exp.billedToClient }),
    });
    load();
  }

  async function removeExpense(exp: Expense) {
    if (!window.confirm(mt("confirmDelete", lang))) return;
    await fetch(`/api/contractor/expenses/${exp.id}`, { method: "DELETE", headers: authHeaders });
    showToast(mt("deleted", lang));
    load();
  }

  async function saveProfile(patch: Partial<TaxProfile>) {
    const res = await fetch("/api/contractor/tax-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ contractorUsername: username, ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data.profile);
      showToast(mt("settingsSaved", lang));
      load();
    } else {
      setError(data.error ?? "Save failed");
    }
  }

  const catLabel = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? (lang === "es" ? c.labelEs : c.labelEn) : "—";
  };

  const leadLabel = (id?: string) => {
    if (!id) return null;
    const l = leads.find((x) => x.id === id);
    return l ? `${l.clientName} · ${serviceLabel(l.projectType, lang)}` : id;
  };

  // Group expenses by YYYY-MM for the list
  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const key = e.spentOn.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  const monthName = (ym: string) => {
    const [y, m] = ym.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now, now - 1, now - 2];
  }, []);

  if (locked) return <ModuleLocked lang={lang} />;

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 pb-20 pt-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold">{contractor?.businessName}</p>
          <h1 className="font-display text-4xl mt-1">{mt("moneyTitle", lang)}</h1>
          <p className="text-[11px] text-gold/80 mt-1">{mt("poweredByLfc", lang)}</p>
          {username && (
            <a href={`/contractor-admin/${username}`} className="text-xs text-gold underline">
              {mt("backToLeads", lang)}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input !py-1.5 !px-3 text-sm w-auto"
            aria-label={mt("thisYear", lang)}
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-charcoal">
                {y}
              </option>
            ))}
          </select>
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
        </div>
      </header>

      {error && <div className="card border-danger/40 p-3 mb-4 text-sm text-danger">{error}</div>}

      {loading && <p className="text-muted">{mt("loading", lang)}</p>}

      {/* Summary */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-[1fr_300px] mb-6">
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Stat label={mt("incomeYtd", lang)} value={formatCents(summary.incomeCents, lang)} />
              <Stat label={mt("overheadYtd", lang)} value={formatCents(summary.overheadCents, lang)} />
              <Stat label={mt("materialsYtd", lang)} value={formatCents(summary.jobMaterialCents, lang)} />
              <Stat
                label={mt("netYtd", lang)}
                value={formatCents(summary.netCents, lang)}
                big
                negative={summary.netCents < 0}
              />
            </div>

            {summary.unbilledMaterialCents > 0 && (
              <div className="bg-slateink rounded-xl p-3 mb-4">
                <p className="text-xs uppercase tracking-wider text-warn mb-1">{mt("unbilledMaterials", lang)}</p>
                <p className="text-lg font-semibold">{formatCents(summary.unbilledMaterialCents, lang)}</p>
                <p className="text-xs text-muted mt-1">{mt("unbilledHelp", lang)}</p>
              </div>
            )}

            {summary.byCategory.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gold mb-2">{mt("byCategory", lang)}</p>
                <ul className="space-y-1 text-sm">
                  {summary.byCategory.map((c) => (
                    <li key={c.categoryId} className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-muted">{lang === "es" ? c.labelEs : c.labelEn}</span>
                      <span>{formatCents(c.totalCents, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Set-aside + disclaimer */}
          <div className="space-y-4">
            <div className="card p-5 border-gold/30">
              <p className="text-xs uppercase tracking-wider text-gold mb-1">{mt("setAside", lang)}</p>
              <p className="font-display text-3xl text-goldlight">
                {formatCents(summary.suggestedSetAsideCents, lang)}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min={0}
                  max={60}
                  step="0.5"
                  value={profile?.setAsidePercent ?? 25}
                  onChange={(e) => setProfile((p) => (p ? { ...p, setAsidePercent: Number(e.target.value) } : p))}
                  onBlur={(e) => saveProfile({ setAsidePercent: Number(e.target.value) })}
                  className="input !py-1.5 w-20 text-sm"
                  aria-label={mt("setAsidePercent", lang)}
                />
                <span className="text-sm text-muted">%</span>
              </div>
              <p className="text-[11px] text-muted mt-2">{mt("setAsideHelp", lang)}</p>
            </div>

            {/* Required disclaimer — always visible */}
            <div className="card p-4 border-white/10">
              <p className="text-xs font-semibold text-warn mb-1">{mt("disclaimerTitle", lang)}</p>
              <p className="text-[11px] text-muted leading-relaxed">{mt("disclaimerBody", lang)}</p>
            </div>

            <button onClick={() => setShowSettings(!showSettings)} className="btn-outline w-full !py-2 text-sm">
              {mt("taxSettings", lang)}
            </button>

            {showSettings && profile && (
              <div className="card p-4 space-y-3">
                <div>
                  <label className="label">{mt("entityType", lang)}</label>
                  <select
                    value={profile.entityType}
                    onChange={(e) => saveProfile({ entityType: e.target.value as EntityType })}
                    className="input !py-2 text-sm"
                  >
                    {(Object.keys(ENTITY_LABEL_KEYS) as EntityType[]).map((et) => (
                      <option key={et} value={et} className="bg-charcoal">
                        {mt(ENTITY_LABEL_KEYS[et], lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{mt("businessLegalName", lang)}</label>
                  <input
                    className="input !py-2 text-sm"
                    defaultValue={profile.businessLegalName ?? ""}
                    onBlur={(e) => saveProfile({ businessLegalName: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quarterly & year-end */}
      {showQtr && username && (
        <QuarterlyPanel
          username={username}
          pin={pin}
          lang={lang}
          year={year}
          onClose={() => setShowQtr(false)}
          onChanged={load}
        />
      )}

      {/* Subs & 1099s */}
      {showSubs && username && (
        <Subs1099
          username={username}
          pin={pin}
          lang={lang}
          year={year}
          onClose={() => setShowSubs(false)}
          onChanged={load}
        />
      )}

      {/* Batch receipts */}
      {showBatch && username && (
        <BatchReceipts
          username={username}
          pin={pin}
          lang={lang}
          categories={categories}
          leads={leads}
          onClose={() => setShowBatch(false)}
          onSaved={load}
        />
      )}

      {/* Add expense */}
      <section className="mb-6">
        {!showAdd ? (
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowAdd(true)} className="btn-gold">
              ＋ {mt("addExpense", lang)}
            </button>
            <button onClick={() => setShowBatch((v) => !v)} className="btn-outline">
              🧾 {bt("batchReceipts", lang)}
            </button>
            <button onClick={() => setShowSubs((v) => !v)} className="btn-outline">
              👷 {ft("subs1099", lang)}
            </button>
            <button onClick={() => setShowQtr((v) => !v)} className="btn-outline">
              📅 {qt("quarterlyTab", lang)}
            </button>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="font-semibold mb-4">{mt("addExpense", lang)}</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{mt("amount", lang)} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                  <input
                    className="input !pl-7"
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
                <label className="label">{mt("date", lang)}</label>
                <input className="input" type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <label className="label">{mt("receipt", lang)}</label>
                {receipt ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receipt.dataUrl} alt={receipt.filename} className="w-20 h-20 rounded-lg object-cover" />
                    <button onClick={() => setReceipt(null)} className="text-danger text-sm">
                      {mt("removePhoto", lang)}
                    </button>
                  </div>
                ) : (
                  <label className="card block p-4 cursor-pointer text-center">
                    <span className="text-sm text-gold">{mt("takePhoto", lang)}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReceipt(e.target.files)}
                    />
                  </label>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="label">{mt("jobOrOverhead", lang)}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsJob(false)}
                    className={`px-3 py-3 rounded-xl text-sm border text-left ${
                      !isJob ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"
                    }`}
                  >
                    {mt("overhead", lang)}
                  </button>
                  <button
                    onClick={() => setIsJob(true)}
                    className={`px-3 py-3 rounded-xl text-sm border text-left ${
                      isJob ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"
                    }`}
                  >
                    {mt("jobMaterial", lang)}
                  </button>
                </div>
              </div>

              {isJob && (
                <div className="md:col-span-2">
                  <label className="label">{mt("whichJob", lang)}</label>
                  <select className="input" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                    <option value="" className="bg-charcoal">
                      {mt("pickJob", lang)}
                    </option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id} className="bg-charcoal">
                        {l.clientName} · {serviceLabel(l.projectType, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">{mt("category", lang)}</label>
                <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-charcoal">
                      {lang === "es" ? c.labelEs : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{mt("vendor", lang)}</label>
                <input
                  className="input"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder={mt("vendorPlaceholder", lang)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">{mt("note", lang)}</label>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={mt("notePlaceholder", lang)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={saveExpense}
                disabled={saving || !amount || Number(amount) <= 0 || (isJob && !leadId)}
                className="btn-gold flex-1 disabled:opacity-40"
              >
                {saving ? mt("saving", lang) : mt("save", lang)}
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  resetForm();
                }}
                className="btn-outline"
              >
                {mt("cancel", lang)}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Expense list */}
      <section>
        <h2 className="font-display text-2xl mb-3">{mt("expenses", lang)}</h2>
        {!loading && expenses.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-muted text-sm">{mt("noExpenses", lang)}</p>
          </div>
        )}

        {grouped.map(([ym, rows]) => (
          <div key={ym} className="mb-5">
            <p className="text-xs uppercase tracking-wider text-gold mb-2">{monthName(ym)}</p>
            <div className="space-y-2">
              {rows.map((e) => (
                <div key={e.id} className="card p-3 flex items-center gap-3">
                  {e.receiptUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.receiptUrl} alt={mt("viewReceipt", lang)} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slateink shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {catLabel(e.categoryId)}
                      {e.vendor ? ` · ${e.vendor}` : ""}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {e.spentOn}
                      {e.leadId ? ` · ${leadLabel(e.leadId)}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                    {e.leadId && (
                      <button
                        onClick={() => toggleBilled(e)}
                        className={`mt-1 text-[10px] px-1.5 py-0.5 rounded border ${
                          e.billedToClient
                            ? "border-success/40 text-success"
                            : "border-warn/40 text-warn"
                        }`}
                      >
                        {e.billedToClient ? mt("billedToClient", lang) : mt("notBilled", lang)}
                      </button>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCents(e.amountCents, lang)}</p>
                    <button onClick={() => removeExpense(e)} className="text-[11px] text-danger">
                      {mt("deleteExpense", lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  big,
  negative,
}: {
  label: string;
  value: string;
  big?: boolean;
  negative?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`${big ? "font-display text-3xl" : "text-lg font-semibold"} ${
          negative ? "text-danger" : big ? "text-goldlight" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

"use client";

// ---------------------------------------------------------------------------
// Subcontractors & 1099s — Lucio Financial Copilot, Delivery 2.
//
// Two directions:
//   1. Who I pay      -> payees, W-9 on file, paid-this-year, threshold alert
//   2. 1099s I receive -> logged and reconciled against recorded income
//
// SECURITY: full SSN/EIN is never collected. The form accepts last-4 only and
// says so plainly. The full number lives on the uploaded W-9 image.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import type {
  PayeeWithTotal,
  Form1099Received,
  Reconciliation,
  PayeeType,
  TinType,
  Form1099Type,
} from "@/lib/money-types";
import { FORM_1099_TYPES } from "@/lib/money-types";
import { formatCents, fromCents, todayIso } from "@/lib/money";
import { ft, mt, type Lang } from "@/lib/i18n";

async function compressImage(file: File, maxDim = 1600, quality = 0.78): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function Subs1099({
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
  const [payees, setPayees] = useState<PayeeWithTotal[]>([]);
  const [forms, setForms] = useState<Form1099Received[]>([]);
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [thresholdCents, setThresholdCents] = useState(60000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayeeForm, setShowPayeeForm] = useState(false);
  const [showFormForm, setShowFormForm] = useState(false);

  const authHeaders = { "x-snaplink-pin": pin };

  // payee form
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState<PayeeType>("individual");
  const [pLegal, setPLegal] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [pTinType, setPTinType] = useState<TinType>("unknown");
  const [pLast4, setPLast4] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pW9, setPW9] = useState<{ dataUrl: string; filename: string } | null>(null);
  const [savingPayee, setSavingPayee] = useState(false);

  // 1099 form
  const [fIssuer, setFIssuer] = useState("");
  const [fType, setFType] = useState<Form1099Type>("1099-NEC");
  const [fAmount, setFAmount] = useState("");
  const [fYear, setFYear] = useState(year);
  const [fDoc, setFDoc] = useState<{ dataUrl: string; filename: string } | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch(`/api/contractor/payees?contractor=${username}&year=${year}`, { headers: authHeaders }),
        fetch(`/api/contractor/forms-1099?contractor=${username}&year=${year}`, { headers: authHeaders }),
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setPayees(d.payees ?? []);
        setThresholdCents(d.thresholdCents ?? 60000);
      }
      if (fRes.ok) {
        const d = await fRes.json();
        setForms(d.forms ?? []);
        setRecon(d.reconciliation ?? null);
      }
    } catch {
      setError("Could not load. Check your connection.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, year, pin]);

  useEffect(() => {
    load();
  }, [load]);

  async function savePayee() {
    setSavingPayee(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/payees", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          contractorUsername: username,
          name: pName,
          payeeType: pType,
          legalName: pLegal || undefined,
          address: pAddress || undefined,
          tinType: pTinType,
          tinLast4: pLast4 || undefined,
          email: pEmail,
          phone: pPhone,
          w9OnFile: Boolean(pW9),
          w9ReceivedOn: pW9 ? todayIso() : undefined,
          w9Doc: pW9 ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setPName(""); setPLegal(""); setPAddress(""); setPLast4(""); setPEmail(""); setPPhone(""); setPW9(null);
      setShowPayeeForm(false);
      load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPayee(false);
    }
  }

  async function attachW9(payeeId: string, files: FileList | null) {
    if (!files || !files[0]) return;
    try {
      const dataUrl = await compressImage(files[0]);
      await fetch(`/api/contractor/payees/${payeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ w9Doc: { dataUrl, filename: files[0].name }, w9ReceivedOn: todayIso() }),
      });
      load();
    } catch {
      setError("Couldn't read that photo.");
    }
  }

  async function removePayee(id: string) {
    if (!window.confirm(ft("confirmRemove", lang))) return;
    await fetch(`/api/contractor/payees/${id}`, { method: "DELETE", headers: authHeaders });
    load();
  }

  async function saveForm() {
    setSavingForm(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/forms-1099", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          contractorUsername: username,
          issuerName: fIssuer,
          formType: fType,
          amount: fAmount,
          taxYear: fYear,
          doc: fDoc ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFIssuer(""); setFAmount(""); setFDoc(null);
      setShowFormForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingForm(false);
    }
  }

  async function removeForm(id: string) {
    if (!window.confirm(ft("confirmRemove", lang))) return;
    await fetch(`/api/contractor/forms-1099/${id}`, { method: "DELETE", headers: authHeaders });
    load();
  }

  async function saveThreshold(dollars: number) {
    const cents = Math.round(dollars * 100);
    setThresholdCents(cents);
    await fetch("/api/contractor/tax-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ contractorUsername: username, payeeAlertThresholdCents: cents }),
    });
    load();
  }

  const needsW9Count = payees.filter((p) => p.needsW9).length;

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-2xl">{ft("title", lang)}</h2>
        <button onClick={onClose} className="btn-outline !py-1.5 !px-3 text-xs">
          {ft("close", lang)}
        </button>
      </div>
      <p className="text-sm text-muted mb-4">{ft("intro", lang)}</p>

      {error && <div className="card border-danger/40 p-3 mb-4 text-sm text-danger">{error}</div>}
      {loading && <p className="text-muted text-sm">{mt("loading", lang)}</p>}

      {/* ---------- WHO I PAY ---------- */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-xs uppercase tracking-wider text-gold">{ft("whoIPay", lang)}</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">{ft("thresholdLabel", lang)}</span>
            <span className="text-muted">$</span>
            <input
              type="number"
              min={0}
              step="50"
              value={fromCents(thresholdCents)}
              onChange={(e) => setThresholdCents(Math.round(Number(e.target.value) * 100))}
              onBlur={(e) => saveThreshold(Number(e.target.value))}
              className="input !py-1 !px-2 w-20 text-xs"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted mb-3">{ft("thresholdHelp", lang)}</p>

        {needsW9Count > 0 && (
          <div className="bg-slateink border border-warn/30 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-warn mb-1">
              ⚠ {needsW9Count} · {ft("needsW9Alert", lang)}
            </p>
            <p className="text-[11px] text-muted">{ft("needsW9Help", lang)}</p>
          </div>
        )}

        <div className="space-y-2 mb-3">
          {payees.map((p) => (
            <div key={p.id} className={`card p-3 ${p.needsW9 ? "border-warn/40" : ""}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.name}
                    {p.tinLast4 ? <span className="text-muted"> · ···{p.tinLast4}</span> : null}
                  </p>
                  <p className="text-[11px] text-muted">
                    {p.payeeType === "business" ? ft("business", lang) : ft("individual", lang)}
                    {p.email ? ` · ${p.email}` : ""}
                    {p.phone ? ` · ${p.phone}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted">{ft("paidThisYear", lang)}</p>
                  <p className={`text-sm font-semibold ${p.overThreshold ? "text-goldlight" : ""}`}>
                    {formatCents(p.paidCents, lang)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.w9OnFile ? (
                    p.w9DocUrl ? (
                      <a
                        href={p.w9DocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-1 rounded border border-success/40 text-success"
                      >
                        {ft("viewW9", lang)}
                      </a>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded border border-success/40 text-success">
                        {ft("w9OnFile", lang)}
                      </span>
                    )
                  ) : (
                    <label className="text-[10px] px-2 py-1 rounded border border-warn/40 text-warn cursor-pointer">
                      {ft("uploadW9", lang)}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => attachW9(p.id, e.target.files)}
                      />
                    </label>
                  )}
                  <button onClick={() => removePayee(p.id)} className="text-[11px] text-danger px-1">
                    {ft("remove", lang)}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && payees.length === 0 && (
            <p className="text-sm text-muted text-center py-3">{ft("noPayees", lang)}</p>
          )}
        </div>

        {!showPayeeForm ? (
          <button onClick={() => setShowPayeeForm(true)} className="btn-outline !py-2 text-sm">
            ＋ {ft("addPayee", lang)}
          </button>
        ) : (
          <div className="bg-slateink rounded-xl p-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">{ft("payeeName", lang)} *</label>
                <input className="input !py-2" value={pName} onChange={(e) => setPName(e.target.value)} placeholder={ft("payeeNamePh", lang)} />
              </div>
              <div>
                <label className="label">{ft("payeeType", lang)}</label>
                <select className="input !py-2" value={pType} onChange={(e) => setPType(e.target.value as PayeeType)}>
                  <option value="individual" className="bg-charcoal">{ft("individual", lang)}</option>
                  <option value="business" className="bg-charcoal">{ft("business", lang)}</option>
                </select>
              </div>
              <div>
                <label className="label">{ft("legalName", lang)}</label>
                <input className="input !py-2" value={pLegal} onChange={(e) => setPLegal(e.target.value)} />
              </div>
              <div>
                <label className="label">{ft("address", lang)}</label>
                <input className="input !py-2" value={pAddress} onChange={(e) => setPAddress(e.target.value)} />
              </div>
              <div>
                <label className="label">{ft("tinType", lang)}</label>
                <select className="input !py-2" value={pTinType} onChange={(e) => setPTinType(e.target.value as TinType)}>
                  <option value="unknown" className="bg-charcoal">{ft("unknown", lang)}</option>
                  <option value="ssn" className="bg-charcoal">{ft("ssn", lang)}</option>
                  <option value="ein" className="bg-charcoal">{ft("ein", lang)}</option>
                </select>
              </div>
              <div>
                <label className="label">{ft("tinLast4", lang)}</label>
                <input
                  className="input !py-2"
                  inputMode="numeric"
                  maxLength={4}
                  value={pLast4}
                  onChange={(e) => setPLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input !py-2" type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">{lang === "es" ? "Teléfono" : "Phone"}</label>
                <input className="input !py-2" type="tel" value={pPhone} onChange={(e) => setPPhone(e.target.value)} />
              </div>
            </div>

            <div className="bg-obsidian/60 border border-warn/30 rounded-lg p-3">
              <p className="text-[11px] text-warn">🔒 {ft("tinWarning", lang)}</p>
            </div>

            <div>
              <label className="label">{ft("w9", lang)}</label>
              {pW9 ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pW9.dataUrl} alt="W-9" className="w-16 h-16 rounded-lg object-cover" />
                  <button onClick={() => setPW9(null)} className="text-danger text-xs">{mt("removePhoto", lang)}</button>
                </div>
              ) : (
                <label className="card block p-3 cursor-pointer text-center">
                  <span className="text-xs text-gold">{ft("uploadW9", lang)}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setPW9({ dataUrl: await compressImage(f), filename: f.name });
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={savePayee} disabled={savingPayee || !pName.trim()} className="btn-gold flex-1 !py-2 text-sm disabled:opacity-40">
                {savingPayee ? ft("saving", lang) : ft("save", lang)}
              </button>
              <button onClick={() => setShowPayeeForm(false)} className="btn-outline !py-2 text-sm">
                {ft("cancel", lang)}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------- 1099s I RECEIVED ---------- */}
      <section>
        <h3 className="text-xs uppercase tracking-wider text-gold mb-3">{ft("whoPaysMe", lang)}</h3>

        {recon && forms.length > 0 && (
          <div className="card p-4 mb-3">
            <p className="text-xs uppercase tracking-wider text-gold mb-2">{ft("reconcile", lang)}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{ft("total1099s", lang)}</span>
                <span>{formatCents(recon.forms1099TotalCents, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{ft("yourRecords", lang)}</span>
                <span>{formatCents(recon.recordedIncomeCents, lang)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1 font-semibold">
                <span>{ft("difference", lang)}</span>
                <span className={Math.abs(recon.differenceCents) > 100 ? "text-warn" : "text-success"}>
                  {formatCents(recon.differenceCents, lang)}
                </span>
              </div>
            </div>
            <p className={`text-[11px] mt-2 ${Math.abs(recon.differenceCents) > 100 ? "text-warn" : "text-success"}`}>
              {Math.abs(recon.differenceCents) > 100 ? ft("matchOff", lang) : ft("matchOk", lang)}
            </p>
          </div>
        )}

        <div className="space-y-2 mb-3">
          {forms.map((f) => (
            <div key={f.id} className="card p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.issuerName}</p>
                <p className="text-[11px] text-muted">{f.formType} · {f.taxYear}</p>
              </div>
              <p className="text-sm font-semibold">{formatCents(f.amountCents, lang)}</p>
              {f.docUrl && (
                <a href={f.docUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded border border-gold/40 text-goldlight">
                  {ft("viewForm", lang)}
                </a>
              )}
              <button onClick={() => removeForm(f.id)} className="text-[11px] text-danger px-1">
                {ft("remove", lang)}
              </button>
            </div>
          ))}
          {!loading && forms.length === 0 && (
            <p className="text-sm text-muted text-center py-3">{ft("no1099s", lang)}</p>
          )}
        </div>

        {!showFormForm ? (
          <button onClick={() => setShowFormForm(true)} className="btn-outline !py-2 text-sm">
            ＋ {ft("add1099", lang)}
          </button>
        ) : (
          <div className="bg-slateink rounded-xl p-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">{ft("issuer", lang)} *</label>
                <input className="input !py-2" value={fIssuer} onChange={(e) => setFIssuer(e.target.value)} placeholder={ft("issuerPh", lang)} />
              </div>
              <div>
                <label className="label">{ft("amountOnForm", lang)} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input className="input !py-2 !pl-7" type="number" inputMode="decimal" min="0" step="0.01" value={fAmount} onChange={(e) => setFAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="label">{ft("formType", lang)}</label>
                <select className="input !py-2" value={fType} onChange={(e) => setFType(e.target.value as Form1099Type)}>
                  {FORM_1099_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-charcoal">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{ft("taxYear", lang)}</label>
                <input className="input !py-2" type="number" value={fYear} onChange={(e) => setFYear(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="label">{ft("uploadForm", lang)}</label>
              {fDoc ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fDoc.dataUrl} alt="1099" className="w-16 h-16 rounded-lg object-cover" />
                  <button onClick={() => setFDoc(null)} className="text-danger text-xs">{mt("removePhoto", lang)}</button>
                </div>
              ) : (
                <label className="card block p-3 cursor-pointer text-center">
                  <span className="text-xs text-gold">{mt("takePhoto", lang)}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setFDoc({ dataUrl: await compressImage(f), filename: f.name });
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={saveForm} disabled={savingForm || !fIssuer.trim() || !fAmount} className="btn-gold flex-1 !py-2 text-sm disabled:opacity-40">
                {savingForm ? ft("saving", lang) : ft("save", lang)}
              </button>
              <button onClick={() => setShowFormForm(false)} className="btn-outline !py-2 text-sm">
                {ft("cancel", lang)}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { getQuestionsFor, questionLabel, optionLabel } from "@/lib/professional-intake/questions";
import type { IntakeOwnerType, IntakeQuestion, IntakeSession, ProfileApplyMode, ProfileFieldPreview } from "@/lib/professional-intake/types";
import { PROFILE_PAYMENT_STATUSES, type ProfessionalBillingSummary, type PublicationEligibility, type ProfilePaymentStatus } from "@/lib/professional-intake-payment/types";

type Lang = "en" | "es";

async function api(pin: string, path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-snaplink-pin": pin, ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function QuestionField({
  question,
  lang,
  value,
  onChange,
}: {
  question: IntakeQuestion;
  lang: Lang;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = questionLabel(question, lang);
  const help = lang === "es" ? question.helpEs : question.helpEn;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-bone">
        {label} {question.required && <span className="text-gold">*</span>}
      </label>
      {help && <p className="text-xs text-muted">{help}</p>}

      {(question.type === "text" || question.type === "phone" || question.type === "email" || question.type === "url") && (
        <input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={question.maxLength}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
        />
      )}

      {question.type === "textarea" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={question.maxLength}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
        />
      )}

      {question.type === "boolean" && (
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-gold" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          {lang === "es" ? "Sí" : "Yes"}
        </label>
      )}

      {question.type === "select" && (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
        >
          <option value="">—</option>
          {question.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {optionLabel(o, lang)}
            </option>
          ))}
        </select>
      )}

      {question.type === "multiselect" && (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const active = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => onChange(active ? arr.filter((v) => v !== o.value) : [...arr, o.value])}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  active ? "bg-gold/20 border-gold text-gold" : "bg-white/5 border-white/10 text-muted"
                }`}
              >
                {optionLabel(o, lang)}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "image" && (
        <p className="text-xs text-muted italic">
          {lang === "es" ? "Sube imágenes desde el panel de edición del perfil." : "Upload images from the profile edit panel."}
        </p>
      )}
    </div>
  );
}

export default function IntakeConsole({
  pin,
  ownerType,
  ownerId,
  isOperator,
}: {
  pin: string;
  ownerType: IntakeOwnerType;
  ownerId: string;
  isOperator: boolean;
}) {
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [professionType, setProfessionType] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ preview: ProfileFieldPreview[]; generatedCopy: Record<string, string> } | null>(null);
  const [applyMode, setApplyMode] = useState<ProfileApplyMode>("fill_empty");
  const [gate, setGate] = useState<{ billing: ProfessionalBillingSummary; eligibility: PublicationEligibility } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<ProfilePaymentStatus | "derived">("derived");
  const [paymentNote, setPaymentNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const lang: Lang = session?.locale ?? "en";

  useEffect(() => {
    api(pin, "/api/professional-intake/sessions", { method: "POST", body: JSON.stringify({ ownerType, ownerId }) })
      .then((data) => setSession(data.session))
      .catch((e) => setError(e.message));
  }, [pin, ownerType, ownerId]);

  useEffect(() => {
    if (!session) return;
    const answered = session.answers.professionType;
    setProfessionType(typeof answered === "string" && answered ? answered : professionType);
  }, [session]);

  const questions = useMemo(() => getQuestionsFor(ownerType, professionType), [ownerType, professionType]);
  const steps = useMemo(() => Array.from(new Set(questions.map((q) => q.step))).sort((a, b) => a - b), [questions]);
  const currentStep = session?.currentStep ?? 1;
  const currentQuestions = questions.filter((q) => q.step === currentStep);
  const stepIndex = steps.indexOf(currentStep);

  function setAnswer(id: string, value: unknown) {
    if (!session) return;
    setSession({ ...session, answers: { ...session.answers, [id]: value } });
    if (id === "professionType" && typeof value === "string") setProfessionType(value);
  }

  async function saveStep(nextStep?: number) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api(pin, `/api/professional-intake/sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ answers: session.answers, currentStep: nextStep ?? session.currentStep }),
      });
      setSession(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    const next = steps[stepIndex + 1];
    if (next) await saveStep(next);
  }
  async function goBack() {
    const prev = steps[stepIndex - 1];
    if (prev) await saveStep(prev);
  }

  async function submit() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await saveStep();
      const data = await api(pin, `/api/professional-intake/sessions/${session.id}/submit`, { method: "POST" });
      setSession(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadPreview() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api(pin, `/api/professional-intake/sessions/${session.id}/preview`);
      setPreview({ preview: data.preview, generatedCopy: data.generatedCopy });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyIntake(fields?: string[]) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api(pin, `/api/professional-intake/sessions/${session.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ mode: applyMode, fields }),
      });
      setSession(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadGate() {
    if (!session) return;
    const data = await api(pin, `/api/professional-intake/sessions/${session.id}/status`);
    setSession(data.session);
    setGate({ billing: data.billing, eligibility: data.eligibility });
    setPaymentStatus(data.billing.isManualOverride ? data.billing.paymentStatus : "derived");
    setPaymentNote(data.billing.manualNote ?? "");
  }

  async function gateAction(action: "approval" | "payment" | "publish") {
    if (!session) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (action === "approval") {
        const data = await api(pin, `/api/professional-intake/sessions/${session.id}/approval`, { method: "POST", body: JSON.stringify({ approvedBy: "operator" }) });
        setSession(data.session);
        setNotice("Content approved.");
      } else if (action === "payment") {
        await api(pin, `/api/professional-intake/sessions/${session.id}/payment`, {
          method: "PATCH",
          body: JSON.stringify({ status: paymentStatus === "derived" ? null : paymentStatus, note: paymentNote, setBy: "operator" }),
        });
        setNotice(paymentStatus === "derived" ? "Manual override cleared." : "Payment status saved.");
      } else {
        await api(pin, `/api/professional-intake/sessions/${session.id}/publish`, { method: "POST" });
        setNotice(ownerType === "agent" ? "Profile published to SnapLink and Southline." : "Contractor profile publication gate passed.");
      }
      await loadGate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !session) return <p className="text-sm text-red-400">{error}</p>;
  if (!session) return <p className="text-sm text-muted">Loading…</p>;

  if (session.status === "applied") {
    return (
      <div className="space-y-5">
        <p className="text-sm text-sage">This intake has been applied to the profile.</p>
        <p className="text-xs text-muted">Applied at {session.appliedAt}</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {notice && <p className="text-sm text-sage">{notice}</p>}
        {isOperator && !gate && <button onClick={loadGate} disabled={busy} className="text-xs px-4 py-2 rounded-lg bg-white/10 text-bone">Load approval &amp; payment status</button>}
        {isOperator && gate && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-sm font-semibold text-bone">Publication readiness</p>
              <p className="mt-1 text-xs text-muted">Plan: {gate.billing.plan ?? "No paid plan"} · Payment: {gate.billing.paymentStatus.replaceAll("_", " ")}{gate.billing.isManualOverride ? " (manual override)" : ""}</p>
              {typeof gate.billing.amountDueCents === "number" && (
                <p className="mt-1 text-xs text-muted">
                  Amount due: {(gate.billing.amountDueCents / 100).toFixed(2)} {gate.billing.currency?.toUpperCase() ?? ""}
                </p>
              )}
              {gate.billing.lastPaymentAt && <p className="mt-1 text-xs text-muted">Last payment: {gate.billing.lastPaymentAt}</p>}
              {gate.billing.nextBillingAt && <p className="mt-1 text-xs text-muted">Next billing: {gate.billing.nextBillingAt}</p>}
              <p className="mt-1 text-xs text-muted">
                Entitlements: {gate.billing.entitlementValid ? "match the selected plan" : `drift — added ${gate.billing.entitlementModulesAdded.join(", ") || "none"}, removed ${gate.billing.entitlementModulesRemoved.join(", ") || "none"}`}
              </p>
              {gate.eligibility.reasons.map((reason) => <p key={reason} className="mt-1 text-xs text-amber-300">{reason}</p>)}
            </div>
            <button onClick={() => gateAction("approval")} disabled={busy || Boolean(session.contentApprovedAt)} className="text-xs px-4 py-2 rounded-lg bg-white/10 text-bone disabled:opacity-40">
              {session.contentApprovedAt ? "Content approved" : "Approve reviewed content"}
            </button>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as ProfilePaymentStatus | "derived")} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone">
                <option value="derived">Use derived status</option>
                {PROFILE_PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
              <input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} maxLength={500} placeholder="Override note" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone" />
              <button
                onClick={() => {
                  const label = paymentStatus === "derived" ? "clear the manual payment override" : `set payment status to "${paymentStatus.replaceAll("_", " ")}"`;
                  if (window.confirm(`Are you sure you want to ${label}? This is an internal administrative record only — it never charges or modifies Stripe.`)) {
                    gateAction("payment");
                  }
                }}
                disabled={busy}
                className="text-xs px-4 py-2 rounded-lg bg-white/10 text-bone"
              >
                Save payment
              </button>
            </div>
            <button onClick={() => gateAction("publish")} disabled={busy || !gate.eligibility.canPublish} className="text-xs px-4 py-2 rounded-lg bg-gold text-obsidian font-semibold disabled:opacity-40">Publish profile</button>
          </div>
        )}
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-gold">Intake completed. {isOperator ? "Review the proposed changes below before applying." : "Waiting for operator review."}</p>
        {isOperator && (
          <>
            <button onClick={loadPreview} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-bone">
              Load review preview
            </button>
            {preview && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {preview.preview.map((p) => (
                    <div key={p.field} className="card p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-bone">{p.field}</span>
                        {p.sensitive && <span className="text-gold">sensitive — verify before publishing</span>}
                      </div>
                      <p className="text-muted mt-1">Current: {String(p.currentValue ?? "(empty)")}</p>
                      <p className="text-sage mt-1">Proposed: {String(p.proposedValue)}</p>
                    </div>
                  ))}
                </div>
                {session.flaggedQuestionIds.length > 0 && (
                  <p className="text-xs text-red-400">Flagged for review: {session.flaggedQuestionIds.join(", ")}</p>
                )}
                <div className="flex items-center gap-3">
                  <select
                    value={applyMode}
                    onChange={(e) => setApplyMode(e.target.value as ProfileApplyMode)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-bone"
                  >
                    <option value="fill_empty">Fill empty fields only</option>
                    <option value="replace_selected">Replace selected fields</option>
                    <option value="replace_all">Replace all mapped fields</option>
                  </select>
                  <button onClick={() => applyIntake()} disabled={busy} className="text-xs px-4 py-2 rounded-lg bg-gold text-obsidian font-semibold">
                    Apply to profile
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-muted">
        Step {stepIndex + 1} of {steps.length}
      </p>
      <div className="space-y-5">
        {currentQuestions.map((q) => (
          <QuestionField key={q.id} question={q} lang={lang} value={session.answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <button onClick={goBack} disabled={busy || stepIndex <= 0} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-muted disabled:opacity-30">
          Back
        </button>
        {stepIndex < steps.length - 1 ? (
          <button onClick={goNext} disabled={busy} className="text-xs px-4 py-2 rounded-lg bg-white/10 text-bone">
            Next
          </button>
        ) : (
          <button onClick={submit} disabled={busy} className="text-xs px-4 py-2 rounded-lg bg-gold text-obsidian font-semibold">
            Submit intake
          </button>
        )}
      </div>
    </div>
  );
}

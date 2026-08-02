"use client";

import { useState, useMemo } from "react";
import { SERVICE_CATEGORIES, SERVICE_LIBRARY, serviceLabel } from "@/lib/services";
import type { Contractor } from "@/lib/types";
import { t, type Lang } from "@/lib/southline-i18n";

type Step = "contractor" | "service" | "details" | "contact" | "confirm" | "done";

const BUDGET_OPTIONS = [
  { value: "Under $1,000", es: "Menos de $1,000" },
  { value: "$1,000 – $5,000", es: "$1,000 – $5,000" },
  { value: "$5,000 – $15,000", es: "$5,000 – $15,000" },
  { value: "$15,000 – $40,000", es: "$15,000 – $40,000" },
  { value: "$40,000+", es: "$40,000+" },
  { value: "Not sure yet", es: "Aún no lo sé" },
];

const TIMELINE_OPTIONS = [
  { value: "ASAP / Emergency", es: "Lo antes posible / Emergencia" },
  { value: "Within 2 weeks", es: "Dentro de 2 semanas" },
  { value: "Within a month", es: "Dentro de un mes" },
  { value: "1-3 months", es: "1-3 meses" },
  { value: "Just planning", es: "Solo estoy planeando" },
];

export default function BookingFlow({
  lang,
  contractors,
  preselectedContractorId,
}: {
  lang: Lang;
  contractors: Contractor[];
  preselectedContractorId?: string;
}) {
  const [step, setStep] = useState<Step>(preselectedContractorId ? "service" : "contractor");
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(
    preselectedContractorId
      ? contractors.find((c) => c.id === preselectedContractorId) ?? null
      : null
  );
  const [selectedService, setSelectedService] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const serviceOptions = useMemo(() => {
    if (!selectedContractor) return SERVICE_LIBRARY;
    return SERVICE_LIBRARY.filter((s) => selectedContractor.services.includes(s.name));
  }, [selectedContractor]);

  function reset() {
    setStep("contractor");
    setSelectedContractor(null);
    setSelectedService("");
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setTimeline("");
    setBudget("");
    setNotes("");
    setDone(false);
    setLeadId(null);
    setError(null);
  }

  async function submit() {
    if (!selectedContractor) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractorUsername: selectedContractor.username,
          name,
          phone,
          email,
          projectAddress: address,
          projectType: selectedService || "General consultation",
          timeline,
          budgetRange: budget,
          notes: `[Southline Booking] ${notes}`,
          language: lang,
          preferredContact: "Text",
          bestTimeToContact: "",
          answers: {},
          photos: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setLeadId(data.leadId);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display text-2xl text-primary mb-2">
          {lang === "es" ? "¡Solicitud enviada!" : "Request sent!"}
        </h2>
        <p className="text-text-muted mb-2">
          {lang === "es"
            ? `${selectedContractor?.businessName ?? "El profesional"} recibió los detalles de tu proyecto y te contactará pronto.`
            : `${selectedContractor?.businessName ?? "The professional"} received your project details and will reach out soon.`}
        </p>
        <p className="text-xs text-text-muted/60 mb-6">
          {lang === "es" ? "ID de referencia:" : "Reference ID:"} {leadId}
        </p>
        <button
          onClick={reset}
          className="bg-accent-gold text-primary font-semibold px-6 py-3 rounded-xl hover:bg-accent-gold/90 active:scale-[0.98] motion-reduce:active:scale-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2"
        >
          {lang === "es" ? "Enviar otra solicitud" : "Send another request"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8 text-xs">
        {["contractor", "service", "details", "contact", "confirm"].map((s, i) => {
          const labels = [
            lang === "es" ? "Profesional" : "Professional",
            lang === "es" ? "Servicio" : "Service",
            lang === "es" ? "Detalles" : "Details",
            lang === "es" ? "Contacto" : "Contact",
            lang === "es" ? "Revisar" : "Review",
          ];
          const stepOrder = ["contractor", "service", "details", "contact", "confirm"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s);
          return (
            <div key={s} className="flex items-center gap-1">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  thisIdx <= currentIdx ? "bg-accent-gold text-primary" : "bg-surface/50 text-text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className={`hidden sm:inline ${thisIdx <= currentIdx ? "text-primary" : "text-text-muted/60"}`}>
                {labels[i]}
              </span>
              {i < 4 && <span className="w-4 h-px bg-surface/60 hidden sm:block" />}
            </div>
          );
        })}
      </div>

      {/* Step: Select contractor */}
      {step === "contractor" && (
        <div>
          <h2 className="font-display text-2xl text-primary text-center mb-2">
            {lang === "es" ? "Selecciona un profesional" : "Select a professional"}
          </h2>
          <p className="text-text-muted text-center mb-6 text-sm">
            {lang === "es"
              ? "Elige el contratista con quien deseas conectarte."
              : "Choose the contractor you'd like to connect with."}
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            {contractors.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedContractor(c);
                  setStep("service");
                }}
                className="w-full p-4 rounded-2xl border border-border-default bg-surface hover:border-accent-gold/50 hover:shadow-sm transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <p className="font-semibold text-primary">{c.businessName}</p>
                <p className="text-xs text-text-muted">{c.serviceArea}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Select service */}
      {step === "service" && (
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep("contractor")} className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-xl text-primary mb-2">
            {lang === "es" ? "¿Qué servicio necesitas?" : "What service do you need?"}
          </h2>
          <p className="text-text-muted text-sm mb-4">
            {lang === "es" ? "Selecciona el servicio que mejor describa tu proyecto." : "Pick the service that best describes your project."}
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {serviceOptions.map((svc) => (
              <button
                key={svc.name}
                onClick={() => {
                  setSelectedService(svc.name);
                  setStep("details");
                }}
                className="w-full p-3 rounded-xl border border-border-default bg-surface hover:border-accent-gold/50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="text-sm font-medium text-primary">{serviceLabel(svc.name, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Project details */}
      {step === "details" && (
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep("service")} className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-xl text-primary mb-4">
            {lang === "es" ? "Detalles del proyecto" : "Project details"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Dirección del proyecto" : "Project address"}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === "es" ? "Calle, ciudad" : "Street, city"}
                className="input bg-surface-raised border-border-default text-primary"
              />
            </div>
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "¿Cuándo te gustaría comenzar?" : "When would you like to start?"}
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
              >
                <option value="">{lang === "es" ? "Selecciona una opción" : "Select an option"}</option>
                {TIMELINE_OPTIONS.map((to) => (
                  <option key={to.value} value={to.value}>{to.es}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Rango de presupuesto" : "Budget range"}
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
              >
                <option value="">{lang === "es" ? "Selecciona una opción" : "Select an option"}</option>
                {BUDGET_OPTIONS.map((bo) => (
                  <option key={bo.value} value={bo.value}>{bo.es}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Notas adicionales" : "Additional notes"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input bg-surface-raised border-border-default text-primary !resize-y"
              />
            </div>
            <button onClick={() => setStep("contact")} className="btn-gold w-full">
              {lang === "es" ? "Continuar" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Contact info */}
      {step === "contact" && (
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep("details")} className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-xl text-primary mb-2">
            {lang === "es" ? "Tu información" : "Your information"}
          </h2>
          <p className="text-sm text-text-muted mb-4">
            {lang === "es"
              ? "El profesional usará estos datos para contactarte."
              : "The professional will use this info to contact you."}
          </p>
          <div className="space-y-4">
            <div>
              <label className="label text-text-muted">{lang === "es" ? "Nombre *" : "Name *"}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
                required
              />
            </div>
            <div>
              <label className="label text-text-muted">{lang === "es" ? "Teléfono *" : "Phone *"}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
                required
              />
            </div>
            <div>
              <label className="label text-text-muted">{lang === "es" ? "Correo electrónico" : "Email"}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
              />
            </div>
            <button
              onClick={() => setStep("confirm")}
              disabled={!name || !phone}
              className="btn-gold w-full disabled:opacity-40"
            >
              {lang === "es" ? "Revisar solicitud" : "Review request"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep("contact")} className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-xl text-primary mb-4">
            {lang === "es" ? "Confirmar solicitud" : "Confirm request"}
          </h2>
          <div className="bg-surface rounded-2xl border border-border-default p-5 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{lang === "es" ? "Profesional" : "Professional"}</span>
              <span className="text-primary font-medium">{selectedContractor?.businessName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{lang === "es" ? "Servicio" : "Service"}</span>
              <span className="text-primary font-medium">{serviceLabel(selectedService, lang)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{lang === "es" ? "Nombre" : "Name"}</span>
              <span className="text-primary font-medium">{name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{lang === "es" ? "Teléfono" : "Phone"}</span>
              <span className="text-primary font-medium">{phone}</span>
            </div>
          </div>
          {error && (
            <p className="text-sm text-state-error mb-4">{error}</p>
          )}
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-gold w-full disabled:opacity-40"
          >
            {submitting
              ? lang === "es" ? "Enviando…" : "Sending…"
              : lang === "es" ? "Enviar solicitud" : "Submit request"}
          </button>
        </div>
      )}
    </div>
  );
}

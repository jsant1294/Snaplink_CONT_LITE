"use client";

import { useState, useMemo } from "react";
import { SERVICE_CATEGORIES, SERVICE_LIBRARY, serviceLabel, type ServiceDef } from "@/lib/services";
import type { Contractor } from "@/lib/types";
import { t, type Lang } from "@/lib/southline-i18n";

type Step = "category" | "service" | "details" | "contact" | "results";

const PROPERTY_TYPES = [
  { value: "house", es: "Casa unifamiliar", en: "Single-family home" },
  { value: "townhouse", es: "Casa adosada", en: "Townhouse" },
  { value: "condo", es: "Condominio", en: "Condo/Apartment" },
  { value: "duplex", es: "Dúplex", en: "Duplex" },
  { value: "commercial", es: "Comercial", en: "Commercial" },
];

const BUDGET_RANGES = [
  { value: "under_1k", es: "Menos de $1,000", en: "Under $1,000" },
  { value: "1k_5k", es: "$1,000 - $5,000", en: "$1,000 - $5,000" },
  { value: "5k_15k", es: "$5,000 - $15,000", en: "$5,000 - $15,000" },
  { value: "15k_40k", es: "$15,000 - $40,000", en: "$15,000 - $40,000" },
  { value: "40k_plus", es: "$40,000+", en: "$40,000+" },
  { value: "not_sure", es: "No estoy seguro", en: "Not sure yet" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", es: "Lo antes posible", en: "ASAP" },
  { value: "2_weeks", es: "Dentro de 2 semanas", en: "Within 2 weeks" },
  { value: "month", es: "Dentro de un mes", en: "Within a month" },
  { value: "1_3_months", es: "1-3 meses", en: "1-3 months" },
  { value: "planning", es: "Solo estoy planeando", en: "Just planning" },
];

const DIY_CHOICES = [
  { value: "diy", es: "Lo haré yo mismo", en: "I'll do it myself" },
  { value: "pro", es: "Quiero contratar a un profesional", en: "I want to hire a professional" },
  { value: "undecided", es: "Aún no lo decido", en: "Not decided yet" },
];

function estimateBudgetRange(categoryId: string, lang: Lang): { min: string; max: string; label: string } {
  const ranges: Record<string, { min: number; max: number }> = {
    remodeling: { min: 5000, max: 50000 },
    paint_drywall: { min: 500, max: 10000 },
    flooring: { min: 1000, max: 20000 },
    roof_exterior: { min: 3000, max: 30000 },
    plumbing: { min: 200, max: 8000 },
    electrical: { min: 200, max: 10000 },
    hvac: { min: 3000, max: 15000 },
    outdoor: { min: 500, max: 25000 },
    concrete: { min: 1000, max: 20000 },
    handyman: { min: 100, max: 5000 },
  };
  const r = ranges[categoryId] ?? { min: 500, max: 10000 };
  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  return { min: fmt(r.min), max: fmt(r.max), label: `${fmt(r.min)} – ${fmt(r.max)}` };
}

function estimateTimeline(serviceName: string, lang: Lang): string {
  const timelines: Record<string, { es: string; en: string }> = {
    remodeling: { es: "2-8 semanas", en: "2-8 weeks" },
    paint_drywall: { es: "2-7 días", en: "2-7 days" },
    flooring: { es: "1-5 días", en: "1-5 days" },
    roof_exterior: { es: "1-4 semanas", en: "1-4 weeks" },
    plumbing: { es: "1-3 días", en: "1-3 days" },
    electrical: { es: "1-3 días", en: "1-3 days" },
    hvac: { es: "1-5 días", en: "1-5 days" },
    outdoor: { es: "1-4 semanas", en: "1-4 weeks" },
    concrete: { es: "1-3 semanas", en: "1-3 weeks" },
    handyman: { es: "1-2 días", en: "1-2 days" },
  };
  const def = timelines[serviceName] ?? { es: "Varía según el proyecto", en: "Varies by project" };
  return lang === "es" ? def.es : def.en;
}

export default function ProjectPlanner({
  lang,
  contractors,
}: {
  lang: Lang;
  contractors: Contractor[];
}) {
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceDef | null>(null);
  const [propertyType, setPropertyType] = useState("house");
  const [diyChoice, setDiyChoice] = useState("undecided");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("planning");
  const [budget, setBudget] = useState("not_sure");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const servicesInCategory = useMemo(
    () => SERVICE_LIBRARY.filter((s) => s.category === selectedCategory),
    [selectedCategory]
  );

  const matchedContractors = useMemo(
    () =>
      selectedService
        ? contractors.filter((c) => c.services.includes(selectedService.name))
        : selectedCategory
        ? contractors.filter((c) =>
            c.services.some((s) => {
              const def = SERVICE_LIBRARY.find((sl) => sl.name === s);
              return def?.category === selectedCategory;
            })
          )
        : [],
    [selectedCategory, selectedService, contractors]
  );

  function reset() {
    setStep("category");
    setSelectedCategory("");
    setSelectedService(null);
    setPropertyType("house");
    setDiyChoice("undecided");
    setName("");
    setPhone("");
    setEmail("");
    setLocation("");
    setTimeline("planning");
    setBudget("not_sure");
    setNotes("");
    setSubmitted(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const targetContractor = matchedContractors[0];
      if (targetContractor) {
        await fetch("/api/contractor/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractorUsername: targetContractor.username,
            name, phone, email,
            projectAddress: location,
            projectType: selectedService?.name ?? selectedCategory,
            timeline, budgetRange: budget,
            notes: `[Planner] ${notes}`,
            language: lang,
            preferredContact: "Text",
            answers: {},
            photos: [],
          }),
        });
      }
    } catch {
      // silently fail — results still shown
    }
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-display text-2xl text-primary mb-2">
          {lang === "es" ? "¡Plan guardado!" : "Plan saved!"}
        </h2>
        <p className="text-text-muted mb-6">
          {lang === "es"
            ? "Hemos guardado tu plan. Revisa los resultados abajo o empieza uno nuevo."
            : "Your plan has been saved. Check the results below or start a new one."}
        </p>
        <button
          onClick={reset}
          className="bg-accent-gold text-primary font-semibold px-6 py-3 rounded-xl"
        >
          {lang === "es" ? "Planificar otro proyecto" : "Plan another project"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["category", "service", "details", "contact"] as Step[]).map((s, i) => {
          const labels = [
            lang === "es" ? "Categoría" : "Category",
            lang === "es" ? "Servicio" : "Service",
            lang === "es" ? "Detalles" : "Details",
            lang === "es" ? "Contacto" : "Contact",
          ];
          const currentIdx = ["category", "service", "details", "contact"].indexOf(step);
          const thisIdx = ["category", "service", "details", "contact"].indexOf(s);
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  thisIdx <= currentIdx
                    ? "bg-accent-gold text-primary"
                    : "bg-surface/50 text-text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-xs hidden sm:inline ${
                  thisIdx <= currentIdx ? "text-primary font-medium" : "text-text-muted/60"
                }`}
              >
                {labels[i]}
              </span>
              {i < 3 && <span className="w-6 h-px bg-surface/60 hidden sm:block" />}
            </div>
          );
        })}
      </div>

      {/* Category step */}
      {step === "category" && (
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-primary text-center mb-2">
            {lang === "es" ? "¿Qué tipo de proyecto?" : "What type of project?"}
          </h2>
          <p className="text-text-muted text-center mb-8">
            {lang === "es"
              ? "Selecciona la categoría que mejor describa tu proyecto."
              : "Pick the category that best describes your project."}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedService(null);
                  setStep("service");
                }}
                className="p-4 rounded-2xl border border-border-default bg-surface hover:border-accent-gold/50 hover:shadow-sm transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="font-medium text-primary">
                  {lang === "es" ? cat.es : cat.en}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service step */}
      {step === "service" && (
        <div>
          <button
            onClick={() => setStep("category")}
            className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-2xl sm:text-3xl text-primary text-center mb-2">
            {lang === "es" ? "¿Cuál es el servicio?" : "Which service?"}
          </h2>
          <p className="text-text-muted text-center mb-8">
            {lang === "es"
              ? "Selecciona el servicio específico para tu proyecto."
              : "Select the specific service for your project."}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            {servicesInCategory.map((svc) => (
              <button
                key={svc.name}
                onClick={() => {
                  setSelectedService(svc);
                  setStep("details");
                }}
                className="p-4 rounded-2xl border border-border-default bg-surface hover:border-accent-gold/50 hover:shadow-sm transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="font-medium text-primary">
                  {serviceLabel(svc.name, lang)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Details step */}
      {step === "details" && (
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setStep("service")}
            className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-2xl text-primary text-center mb-6">
            {lang === "es" ? "Detalles del proyecto" : "Project details"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Tipo de propiedad" : "Property type"}
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {lang === "es" ? pt.es : pt.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-text-muted">
                {lang === "es"
                  ? "¿Quieres hacerlo tú mismo o contratar a un profesional?"
                  : "DIY or hire a professional?"}
              </label>
              <div className="space-y-2">
                {DIY_CHOICES.map((dc) => (
                  <label
                    key={dc.value}
                    className={`block p-3 rounded-xl border cursor-pointer transition ${
                      diyChoice === dc.value
                        ? "border-accent-gold bg-accent-gold/5"
                        : "border-border-default bg-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="diy"
                      value={dc.value}
                      checked={diyChoice === dc.value}
                      onChange={(e) => setDiyChoice(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm text-primary">
                      {lang === "es" ? dc.es : dc.en}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Presupuesto estimado" : "Estimated budget"}
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
              >
                {BUDGET_RANGES.map((br) => (
                  <option key={br.value} value={br.value}>
                    {lang === "es" ? br.es : br.en}
                  </option>
                ))}
              </select>
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
                {TIMELINE_OPTIONS.map((to) => (
                  <option key={to.value} value={to.value}>
                    {lang === "es" ? to.es : to.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Ubicación del proyecto" : "Project location"}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={lang === "es" ? "Ciudad, estado" : "City, state"}
                className="input bg-surface-raised border-border-default text-primary"
              />
            </div>

            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Notas adicionales" : "Additional notes"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={lang === "es" ? "Describe tu proyecto con más detalle…" : "Describe your project in more detail…"}
                className="input bg-surface-raised border-border-default text-primary !resize-y"
              />
            </div>

            <button
              onClick={() => setStep("contact")}
              className="btn-gold w-full"
            >
              {lang === "es" ? "Continuar" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Contact step */}
      {step === "contact" && (
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setStep("details")}
            className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            ← {lang === "es" ? "Volver" : "Back"}
          </button>
          <h2 className="font-display text-2xl text-primary text-center mb-2">
            {lang === "es" ? "¿Cómo te contactamos?" : "How do we reach you?"}
          </h2>
          <p className="text-text-muted text-center text-sm mb-6">
            {lang === "es"
              ? "Deja tu información para que podamos enviarte los resultados y conectarte con profesionales."
              : "Leave your info so we can send you results and connect you with professionals."}
          </p>
          <div className="space-y-4">
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Nombre completo *" : "Full name *"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
                required
              />
            </div>
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Teléfono *" : "Phone *"}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
                required
              />
            </div>
            <div>
              <label className="label text-text-muted">
                {lang === "es" ? "Correo electrónico" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input bg-surface-raised border-border-default text-primary"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !name || !phone}
              className="btn-gold w-full disabled:opacity-40"
            >
              {submitting
                ? lang === "es" ? "Guardando…" : "Saving…"
                : lang === "es" ? "Ver mi plan" : "See my plan"}
            </button>
          </div>
        </div>
      )}

      {/* Results step */}
      {step === "results" && selectedService && (
        <div className="space-y-8">
          <button
            onClick={reset}
            className="text-sm text-text-muted hover:text-primary inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            ← {lang === "es" ? "Nuevo plan" : "New plan"}
          </button>

          {/* Budget estimate */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 sm:p-8">
              <h2 className="font-display text-2xl text-primary mb-2">
                {lang === "es" ? "Tu plan de proyecto" : "Your Project Plan"}
              </h2>
            <p className="text-sm text-text-muted mb-6">
              {serviceLabel(selectedService.name, lang)} ·{" "}
              {lang === "es" ? "Plan de presupuesto" : "Budget plan"}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-surface/20 rounded-xl p-4">
                <p className="text-xs text-text-muted mb-1">
                  {lang === "es" ? "Rango de presupuesto estimado" : "Estimated budget range"}
                </p>
                <p className="font-display text-2xl text-accent-gold">
                  {estimateBudgetRange(selectedService.category, lang).label}
                </p>
                <p className="text-xs text-text-muted/60 mt-1">
                  {lang === "es"
                    ? "Este es un rango estimado. Los presupuestos reales varían según el contractor y materiales."
                    : "This is an estimated range. Actual quotes vary by contractor and materials."}
                </p>
              </div>
              <div className="bg-surface/20 rounded-xl p-4">
                <p className="text-xs text-text-muted mb-1">
                  {lang === "es" ? "Tiempo estimado" : "Estimated timeline"}
                </p>
                <p className="font-display text-2xl text-primary">
                  {estimateTimeline(selectedService.category, lang)}
                </p>
                <p className="text-xs text-text-muted/60 mt-1">
                  {lang === "es"
                    ? "El tiempo real depende del alcance y disponibilidad del contractor."
                    : "Actual timeline depends on scope and contractor availability."}
                </p>
              </div>
            </div>

            <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-xl p-4 text-xs text-text-muted">
              ⚠️{" "}
              {lang === "es"
                ? "Estos son rangos de planificación, no cotizaciones vinculantes. Los precios varían según materiales, mano de obra, ubicación y alcance específico del proyecto. Siempre solicita presupuestos detallados a los profesionales."
                : "These are planning ranges, not binding quotes. Prices vary based on materials, labor, location, and specific project scope. Always request detailed quotes from professionals."}
            </div>
          </div>

          {/* Recommended contractors */}
          {matchedContractors.length > 0 && (
            <div>
              <h3 className="font-display text-xl text-primary mb-4">
                {lang === "es"
                  ? "Profesionales recomendados"
                  : "Recommended professionals"}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {matchedContractors.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="bg-surface rounded-xl border border-border-default p-4"
                  >
                    <p className="font-semibold text-primary">{c.businessName}</p>
                    <p className="text-xs text-text-muted mb-3">{c.serviceArea}</p>
                    <div className="flex gap-2">
                      <a
                        href={`/contractor/${c.username}`}
                        className="text-xs flex-1 text-center border border-border-default text-text-muted rounded-lg py-2 hover:bg-surface/20 transition-colors"
                      >
                        {lang === "es" ? "Ver perfil" : "View profile"}
                      </a>
                      <a
                        href={`/book?contractor=${c.id}`}
                        className="text-xs flex-1 text-center bg-accent-dark text-on-dark rounded-lg py-2 hover:bg-accent-dark/90 transition-colors"
                      >
                        {lang === "es" ? "Reservar ahora" : "Book now"}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="bg-surface rounded-2xl border border-border-default p-6">
            <h3 className="font-display text-lg text-primary mb-4">
              {lang === "es" ? "Próximos pasos" : "Next steps"}
            </h3>
            <div className="space-y-3">
              {diyChoice === "pro" || diyChoice === "undecided" ? (
                <>
                  <a
                    href="/book"
                    className="block w-full bg-accent-gold text-primary font-semibold text-center py-3 rounded-xl"
                  >
                    {lang === "es"
                      ? "Reservar consulta ahora"
                      : "Book a consultation now"}
                  </a>
                  <a
                    href="/book"
                    className="block w-full border-2 border-primary/20 text-primary text-center py-3 rounded-xl hover:bg-accent-dark hover:text-on-dark transition-colors"
                  >
                    {lang === "es"
                      ? "Explorar más profesionales"
                      : "Browse more professionals"}
                  </a>
                </>
              ) : (
                <p className="text-sm text-text-muted text-center">
                  {lang === "es"
                    ? "¡Genial! Si decides que necesitas ayuda profesional, estamos aquí para conectarte."
                    : "Great! If you decide you need professional help, we're here to connect you."}
                </p>
              )}
              <button
                onClick={reset}
                className="block w-full text-sm text-text-muted hover:text-primary text-center py-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {lang === "es"
                  ? "Planificar otro proyecto"
                  : "Plan another project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

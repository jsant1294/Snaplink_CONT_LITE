"use client";

import { useState } from "react";
import type { Contractor } from "@/lib/types";
import { t, type Lang } from "@/lib/southline-i18n";

export default function RecruitmentForm({
  lang,
  contractors,
}: {
  lang: Lang;
  contractors: Contractor[];
}) {
  const [mode, setMode] = useState<"join" | "claim">("join");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<Contractor | null>(null);

  const matchingBusinesses = searchQuery.trim()
    ? contractors.filter((c) =>
        c.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/southline/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          name,
          phone,
          email,
          businessName,
          serviceArea,
          notes: mode === "claim" && selectedBusiness
            ? `Claiming existing business: ${selectedBusiness.businessName} (${selectedBusiness.serviceArea})`
            : `New contractor interest`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-display text-xl text-obsidian mb-2">
          {lang === "es" ? "¡Recibimos tu información!" : "We received your info!"}
        </h3>
        <p className="text-clay text-sm">
          {lang === "es"
            ? "El equipo de Southline Living te contactará pronto."
            : "The Southline Living team will reach out soon."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-sand/40 overflow-hidden mb-6">
        <button
          onClick={() => setMode("join")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            mode === "join" ? "bg-obsidian text-cream" : "bg-paper text-clay"
          }\`}
        >
          {lang === "es" ? "Únete a Snaplink" : "Join Snaplink"}
        </button>
        <button
          onClick={() => setMode("claim")}
          className={\`flex-1 py-3 text-sm font-medium transition \${
            mode === "claim" ? "bg-obsidian text-cream" : "bg-paper text-clay"
          }`}
        >
          {lang === "es" ? "Reclama tu negocio" : "Claim Your Business"}
        </button>
      </div>

      <div className="space-y-4">
        {/* Claim: search existing business */}
        {mode === "claim" && !selectedBusiness && (
          <div>
            <label className="label text-clay">
              {lang === "es" ? "Busca tu negocio" : "Search for your business"}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "es" ? "Nombre de tu negocio" : "Your business name"}
              className="input bg-white border-sand/60 text-obsidian mb-2"
            />
            {matchingBusinesses.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {matchingBusinesses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedBusiness(c)}
                    className="w-full p-3 rounded-xl border border-sand/40 bg-paper hover:border-gold/50 text-left"
                  >
                    <p className="font-medium text-sm text-obsidian">{c.businessName}</p>
                    <p className="text-xs text-clay">{c.serviceArea}</p>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && matchingBusinesses.length === 0 && (
              <p className="text-xs text-clay/60">
                {lang === "es"
                  ? "No encontramos este negocio. ¿Quieres agregarlo?"
                  : "We didn't find this business. Want to add it?"}
              </p>
            )}
          </div>
        )}

        {/* Selected business info */}
        {selectedBusiness && (
          <div className="bg-sand/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-obsidian">{selectedBusiness.businessName}</p>
              <p className="text-xs text-clay">{selectedBusiness.serviceArea}</p>
            </div>
            <button
              onClick={() => setSelectedBusiness(null)}
              className="text-xs text-clay hover:text-obsidian"
            >
              {lang === "es" ? "Cambiar" : "Change"}
            </button>
          </div>
        )}

        {/* Form fields */}
        <div>
          <label className="label text-clay">
            {lang === "es" ? "Nombre completo *" : "Full name *"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input bg-white border-sand/60 text-obsidian"
          />
        </div>
        <div>
          <label className="label text-clay">
            {lang === "es" ? "Nombre del negocio *" : "Business name *"}
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input bg-white border-sand/60 text-obsidian"
          />
        </div>
        <div>
          <label className="label text-clay">
            {lang === "es" ? "Correo electrónico *" : "Email *"}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input bg-white border-sand/60 text-obsidian"
          />
        </div>
        <div>
          <label className="label text-clay">
            {lang === "es" ? "Teléfono *" : "Phone *"}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input bg-white border-sand/60 text-obsidian"
          />
        </div>
        <div>
          <label className="label text-clay">
            {lang === "es" ? "Área de servicio" : "Service area"}
          </label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder={lang === "es" ? "Ciudades donde trabajas" : "Cities you serve"}
            className="input bg-white border-sand/60 text-obsidian"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-clay">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-gold"
          />
          <span>
            {lang === "es"
              ? "Acepto que Southline Living me contacte sobre oportunidades para mi negocio."
              : "I agree to be contacted by Southline Living about business opportunities."}
          </span>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting || !name || !businessName || !email || !phone || !agreed}
          className="btn-gold w-full disabled:opacity-40"
        >
          {submitting
            ? lang === "es" ? "Enviando…" : "Sending…"
            : mode === "claim"
            ? lang === "es" ? "Solicitar reclamo" : "Submit claim"
            : lang === "es" ? "Enviar solicitud" : "Send request"}
        </button>
      </div>
    </div>
  );
}

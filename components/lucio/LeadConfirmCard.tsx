"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/southline-i18n";
import { getLucioSessionId } from "@/lib/lucio/widget-state";

export interface LeadProposal {
  kind: "lead" | "booking";
  summary: {
    name: string;
    phone: string;
    projectType: string;
    contractorUsername?: string;
    contractorBusinessName?: string;
  };
}

// Renders the proposeLeadOrBooking tool's output. This component — not the
// model — makes the actual POST /api/contractor/leads call, and only after
// the visitor clicks Confirm. The model can prepare this card; it can never
// submit it.
export default function LeadConfirmCard({ lang, proposal }: { lang: Lang; proposal: LeadProposal }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const { name, phone, projectType, contractorUsername, contractorBusinessName } = proposal.summary;

  async function handleConfirm() {
    if (!contractorUsername) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/contractor/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorUsername, name, phone, projectType }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      fetch("/api/lucio/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: proposal.kind === "booking" ? "booking_completed" : "lead_submitted",
          sessionId: getLucioSessionId(),
        }),
      }).catch(() => {});
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="rounded-xl border border-sage/30 bg-sage/10 p-3 text-sm text-sage">{t("lucioLeadSubmitted", lang)}</p>;
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-cream p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-walnut/50">{t("lucioReviewBeforeSending", lang)}</p>
      <dl className="mt-2 space-y-1 text-sm text-walnut">
        <div><dt className="inline font-medium">{name}</dt></div>
        <div><dd className="inline">{phone}</dd></div>
        <div><dd className="inline">{projectType}</dd></div>
        {contractorBusinessName && <div><dd className="inline">{contractorBusinessName}</dd></div>}
      </dl>
      {!contractorUsername && (
        <p className="mt-3 text-xs text-clay">
          {lang === "es"
            ? "Elige un profesional específico antes de enviar tu solicitud."
            : "Pick a specific professional before this request can be sent."}
        </p>
      )}
      {contractorUsername && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === "submitting"}
            className="rounded-lg bg-obsidian px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-obsidian/90 disabled:opacity-50"
          >
            {proposal.kind === "booking" ? t("lucioConfirmBooking", lang) : t("lucioConfirmLead", lang)}
          </button>
        </div>
      )}
      {status === "error" && <p className="mt-2 text-xs text-danger">{lang === "es" ? "Algo salió mal. Intenta de nuevo." : "Something went wrong. Please try again."}</p>}
    </div>
  );
}

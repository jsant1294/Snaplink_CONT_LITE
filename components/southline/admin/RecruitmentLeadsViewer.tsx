"use client";

import { useState, useEffect } from "react";

interface RecruitmentLead {
  id: string;
  mode: "join" | "claim";
  name: string;
  email: string;
  phone: string;
  businessName: string;
  serviceArea: string;
  notes: string;
  createdAt: string;
}

export default function RecruitmentLeadsViewer({ pin }: { pin: string }) {
  const [leads, setLeads] = useState<RecruitmentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/recruitment", {
      headers: { "x-snaplink-pin": pin },
    })
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [pin]);

  if (loading) return <p className="text-sm text-muted">Loading recruitment leads…</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm mb-1">No recruitment leads yet.</p>
        <p className="text-muted/60 text-xs">
          Leads from <code className="text-gold">/for-contractors</code> will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      {[...leads].reverse().map((lead) => (
        <div key={lead.id} className="bg-obsidian border border-white/10 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${lead.mode === "claim" ? "bg-amber-900/40 text-amber-300" : "bg-sage/20 text-sage"}`}>
              {lead.mode === "claim" ? "Claim" : "New Join"}
            </span>
            <span className="text-[11px] text-muted">
              {new Date(lead.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm font-medium">{lead.name}</p>
          <p className="text-sm text-bone/80">{lead.businessName}</p>
          <div className="flex gap-3 text-xs text-muted">
            <a href={`tel:${lead.phone}`} className="hover:text-gold transition-colors">{lead.phone}</a>
            <a href={`mailto:${lead.email}`} className="hover:text-gold transition-colors">{lead.email}</a>
          </div>
          {lead.serviceArea && <p className="text-xs text-muted/60">Area: {lead.serviceArea}</p>}
          {lead.notes && <p className="text-xs text-muted/60 italic">{lead.notes}</p>}
        </div>
      ))}
    </div>
  );
}

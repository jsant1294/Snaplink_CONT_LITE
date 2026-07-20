"use client";

// Operator master console — Southline's view. PIN-gated with the OPERATOR PIN.
// Shows the contractor directory + the all-tenants lead board.

import { useEffect, useState } from "react";
import Dashboard, { PinGate } from "@/components/admin/Dashboard";
import type { Contractor } from "@/lib/types";

type PublicContractor = Omit<Contractor, "pin">;

export default function MasterAdminPage() {
  return (
    <PinGate title="Operator Console">
      {(pin) => <MasterView pin={pin} />}
    </PinGate>
  );
}

function MasterView({ pin }: { pin: string }) {
  const [contractors, setContractors] = useState<PublicContractor[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contractor/profiles")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors ?? []));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function patchContractor(
    contractorId: string,
    patch: { pin?: string; preferredLanguage?: "en" | "es" }
  ): Promise<boolean> {
    const res = await fetch("/api/contractor/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
      body: JSON.stringify({ contractorId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error ?? "Update failed");
      return false;
    }
    setContractors((cs) => cs.map((c) => (c.id === contractorId ? data.contractor : c)));
    return true;
  }

  return (
    <>
      <section className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-2xl">Contractors ({contractors.length})</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {contractors.map((c) => (
            <ContractorCard key={c.id} c={c} onPatch={patchContractor} onToast={showToast} />
          ))}
        </div>
      </section>
      <Dashboard mode="master" pin={pin} />
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </>
  );
}

function ContractorCard({
  c,
  onPatch,
  onToast,
}: {
  c: PublicContractor;
  onPatch: (id: string, patch: { pin?: string; preferredLanguage?: "en" | "es" }) => Promise<boolean>;
  onToast: (msg: string) => void;
}) {
  const [resetting, setResetting] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveNewPin() {
    setBusy(true);
    const ok = await onPatch(c.id, { pin: newPin });
    setBusy(false);
    if (ok) {
      onToast(`PIN for ${c.businessName} reset to ${newPin} — tell them, then close this.`);
      setResetting(false);
      setNewPin("");
    }
  }

  async function toggleLanguage() {
    const next = c.preferredLanguage === "es" ? "en" : "es";
    const ok = await onPatch(c.id, { preferredLanguage: next });
    if (ok) onToast(`${c.businessName} dashboard → ${next === "es" ? "Español" : "English"}`);
  }

  return (
    <div className="card p-4">
      <p className="font-semibold">{c.businessName}</p>
      <p className="text-xs text-muted mb-1">
        /{c.username} ·{" "}
        <button onClick={toggleLanguage} className="underline decoration-dotted">
          {c.preferredLanguage === "es" ? "Panel en español" : "English dashboard"}
        </button>
      </p>
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        <a href={`/contractor/${c.username}`} className="btn-outline !py-1.5 !px-3 !rounded-lg">Public page</a>
        <a href={`/contractor-admin/${c.username}`} className="btn-gold !py-1.5 !px-3 !rounded-lg">Their dashboard</a>
        <button onClick={() => setResetting(!resetting)} className="btn-outline !py-1.5 !px-3 !rounded-lg !border-warn/50 !text-warn">
          {resetting ? "Cancel" : "Reset PIN"}
        </button>
      </div>
      {resetting && (
        <div className="mt-3 flex gap-2">
          <input
            className="input !py-2 text-sm font-mono tracking-widest flex-1"
            inputMode="numeric"
            maxLength={6}
            placeholder="New 6-digit PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && newPin.length === 6 && saveNewPin()}
          />
          <button
            onClick={saveNewPin}
            disabled={busy || newPin.length !== 6}
            className="btn-gold !py-2 !px-4 text-sm disabled:opacity-40"
          >
            {busy ? "…" : "Set"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import type { SouthlineSettings } from "@/lib/southline-types";

const FLAG_LABELS: Record<string, string> = {
  southline_homepage: "Southline Living homepage",
  consumer_booking: "Consumer booking",
  project_planner: "Project planner",
  diy_hub: "DIY Hub",
  diy_premium: "DIY premium membership",
  contractor_recruitment: "Contractor recruitment",
  claim_business: "Claim your business",
  community_spotlight: "Community spotlight",
};

export default function FeatureFlagPanel({ pin }: { pin: string }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", {
      headers: { "x-snaplink-pin": pin },
    })
      .then((r) => r.json())
      .then((d) => setFlags(d.settings?.featureFlags ?? {}));
  }, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function toggle(key: string) {
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify({ featureFlags: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Flag ${next[key] ? "enabled" : "disabled"}`);
    } catch (e) {
      setFlags(flags); // revert
      showToast(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Enable or disable Southline Living features. Disabled features are hidden
        from the consumer experience without removing code.
      </p>
      {Object.entries(FLAG_LABELS).map(([key, label]) => (
        <label
          key={key}
          className="flex items-center justify-between py-3 border-b border-white/5"
        >
          <div>
            <span className="text-sm">{label}</span>
            <span className="block text-xs text-muted">{key}</span>
          </div>
          <button
            onClick={() => toggle(key)}
            disabled={busy}
            className={`w-10 h-6 rounded-full transition-colors ${
              flags[key] ? "bg-gold" : "bg-white/10"
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 mx-0.5 ${
                flags[key] ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      ))}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

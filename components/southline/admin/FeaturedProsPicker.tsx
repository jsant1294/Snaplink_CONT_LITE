"use client";

import { useState, useEffect } from "react";
import type { Contractor } from "@/lib/types";
import type { SouthlineSettings } from "@/lib/southline-types";

type PublicContractor = Omit<Contractor, "pin">;

export default function FeaturedProsPicker({ pin }: { pin: string }) {
  const [contractors, setContractors] = useState<PublicContractor[]>([]);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/contractor/profiles", { headers: { "x-snaplink-pin": pin } }).then((r) => r.json()),
      fetch("/api/southline/settings", {
        headers: { "x-snaplink-pin": pin },
      }).then((r) => r.json()),
    ]).then(([profiles, settingsData]) => {
      setContractors(profiles.contractors ?? []);
      setFeaturedIds(new Set(settingsData.settings?.featuredContractorIds ?? []));
    });
  }, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function toggle(id: string) {
    const next = new Set(featuredIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setFeaturedIds(next);
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify({ featuredContractorIds: Array.from(next) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Featured pros updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Select which contractors appear in the Featured Professionals section on
        the Southline Living homepage.
      </p>
      {contractors.length === 0 && (
        <p className="text-sm text-muted">No contractors found.</p>
      )}
      <div className="grid gap-3">
        {contractors.map((c) => (
          <label
            key={c.id}
            className="card p-4 flex items-center gap-4 cursor-pointer hover:border-gold/30 transition-colors"
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-gold"
              checked={featuredIds.has(c.id)}
              onChange={() => toggle(c.id)}
              disabled={busy}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{c.businessName}</p>
              <p className="text-xs text-muted truncate">
                {c.serviceArea} · /{c.username}
              </p>
            </div>
            {featuredIds.has(c.id) && (
              <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </label>
        ))}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

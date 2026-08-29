"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { IntakeOwnerType } from "@/lib/professional-intake/types";

interface IntakeRow {
  id: string;
  ownerType: IntakeOwnerType;
  ownerId: string;
  ownerName: string | null;
  status: string;
  filter: string;
  needsAssets: boolean;
  currentStep: number;
  submittedAt: string | null;
  appliedAt: string | null;
  contentApprovedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const FILTERS = ["all", "new", "in_progress", "needs_assets", "ready", "completed"] as const;

const FILTER_CHIP_LABEL: Record<(typeof FILTERS)[number], string> = {
  all: "All",
  new: "New",
  in_progress: "In Progress",
  needs_assets: "Needs Assets",
  ready: "Ready",
  completed: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  applied: "text-bone",
  completed: "text-emerald-300",
  in_progress: "text-gold",
  not_started: "text-muted",
  archived: "text-rose-300",
};

function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function IntakeCenterPanel({ pin }: { pin: string }) {
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [ownerType, setOwnerType] = useState<"" | IntakeOwnerType>("");
  const [onlyNeedsAssets, setOnlyNeedsAssets] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (ownerType) params.set("ownerType", ownerType);
    if (onlyNeedsAssets) params.set("onlyNeedsAssets", "true");
    setLoading(true);
    setError(null);
    fetch(`/api/professional-intake/admin/sessions?${params.toString()}`, {
      headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setRows(data.sessions ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [pin, ownerType, onlyNeedsAssets]);

  const visible = rows.filter((r) => (filter === "all" ? true : r.filter === FILTER_CHIP_LABEL[filter]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Intake Command Center</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === f ? "bg-gold text-obsidian" : "bg-white/5 text-muted hover:text-bone"
            }`}
          >
            {FILTER_CHIP_LABEL[f]}
          </button>
        ))}
        <select
          value={ownerType}
          onChange={(e) => setOwnerType((e.target.value || "") as "" | IntakeOwnerType)}
          className="ml-2 rounded-lg border border-white/10 bg-charcoal px-2 py-1.5 text-xs text-bone focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="">All owner types</option>
          <option value="contractor">Contractors</option>
          <option value="agent">Agents / Professionals</option>
        </select>
        <label className="ml-2 flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={onlyNeedsAssets} onChange={(e) => setOnlyNeedsAssets(e.target.checked)} className="accent-gold" />
          Only needs assets
        </label>
      </div>

      {error && <p className="text-xs text-rose-300">Failed to load intakes: {error}</p>}
      {loading && <p className="text-sm text-muted">Loading intakes…</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-muted/60">No intake sessions in this view.</p>
      )}

      <div className="space-y-3">
        {!loading && !error && visible.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-obsidian p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`text-sm font-medium ${STATUS_COLOR[r.status] ?? "text-bone"}`}>{r.filter}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {r.ownerType === "agent" ? "Agent" : "Contractor"}
                </span>
                {r.needsAssets && (
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                    Needs assets
                  </span>
                )}
              </div>
              <Link
                href={`/southline/admin/intake/${r.ownerType}/${r.ownerId}`}
                className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-obsidian"
              >
                Open Intake
              </Link>
            </div>
            <p className="mt-2 text-sm text-bone">{r.ownerName ?? "Unknown owner"}</p>
            <p className="mt-1 text-xs text-muted">
              Step {r.currentStep} · status {r.status}
              {r.contentApprovedAt ? " · content approved" : ""}
              {r.appliedAt ? " · applied" : ""}
            </p>
            <p className="mt-1 text-[11px] text-muted/70">
              Created {dateLabel(r.createdAt)} · Updated {dateLabel(r.updatedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

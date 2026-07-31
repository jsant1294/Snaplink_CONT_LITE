"use client";

import { useEffect, useState } from "react";
import type { Contractor } from "@/lib/types";
import type { FlipCampaign, FlipCampaignStatus } from "@/lib/flipbook-types";
import { nt, type Lang } from "@/lib/i18n";
import FlipbookEditor from "@/components/admin/FlipbookEditor";

type PublicContractor = Omit<Contractor, "pin">;

function statusLabel(status: FlipCampaignStatus, lang: Lang): string {
  if (status === "published") return nt("published", lang);
  if (status === "archived") return nt("statusArchived", lang);
  return nt("statusDraft", lang);
}

export default function FlipbookBoard({
  contractor,
  pin,
}: {
  contractor?: PublicContractor | null;
  pin: string;
}) {
  const lang: Lang = contractor?.preferredLanguage ?? "en";
  const [campaigns, setCampaigns] = useState<FlipCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const contractorId = contractor?.id ?? "";

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin };
  }

  function load() {
    if (!contractorId) return;
    setLoading(true);
    fetch(`/api/contractor/flipbook/campaigns?contractorId=${contractorId}`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(load, [contractorId]);

  async function create() {
    const res = await fetch("/api/contractor/flipbook/campaigns", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contractorId, title: nt("untitledFlipbook", lang) }),
    });
    const data = await res.json();
    if (data.campaign) {
      setCampaigns((c) => [data.campaign, ...c]);
      setEditingId(data.campaign.id);
    }
  }

  function updateInList(updated: FlipCampaign) {
    setCampaigns((c) => c.map((x) => (x.id === updated.id ? updated : x)));
  }

  const editing = campaigns.find((c) => c.id === editingId);

  if (!contractor) return <p className="text-sm text-muted">{nt("loading", lang)}</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {campaigns.length} {nt("flipbooksCount", lang)}
        </p>
        <button onClick={create} className="btn-gold !py-2 text-sm">
          {nt("newFlipbook", lang)}
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <FlipbookEditor
            campaign={editing}
            contractorId={contractorId}
            lang={lang}
            pin={pin}
            onClose={() => setEditingId(null)}
            onChanged={updateInList}
          />
        </div>
      )}

      {loading && <p className="text-sm text-muted">{nt("loading", lang)}</p>}
      {!loading && campaigns.length === 0 && (
        <p className="py-8 text-center text-sm text-muted/60">{nt("noFlipbooks", lang)}</p>
      )}

      <div className="space-y-2">
        {campaigns
          .filter((c) => c.id !== editingId)
          .map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-obsidian p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted">{statusLabel(c.status, lang)}</p>
              </div>
              <button onClick={() => setEditingId(c.id)} className="btn-outline !py-1.5 !px-3 text-xs">
                {nt("edit", lang)}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

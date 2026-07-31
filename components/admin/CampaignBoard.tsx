"use client";

import { useEffect, useState } from "react";
import type { Contractor } from "@/lib/types";
import type { Campaign } from "@/lib/campaign-types";
import CampaignEditor from "@/components/admin/CampaignEditor";

type PublicContractor = Omit<Contractor, "pin">;

export default function CampaignBoard({
  contractor,
  pin,
}: {
  contractor?: PublicContractor | null;
  pin: string;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const contractorId = contractor?.id ?? "";

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin };
  }

  function load() {
    if (!contractorId) return;
    setLoading(true);
    fetch(`/api/contractor/campaigns?contractorId=${contractorId}`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(load, [contractorId]);

  async function create() {
    const res = await fetch("/api/contractor/campaigns", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contractorId, titleEn: "Untitled Campaign", ctaType: "phone", ctaValue: contractor?.phone ?? "" }),
    });
    const data = await res.json();
    if (data.campaign) {
      setCampaigns((c) => [data.campaign, ...c]);
      setEditingId(data.campaign.id);
    }
  }

  function updateInList(updated: Campaign) {
    setCampaigns((c) => c.map((x) => (x.id === updated.id ? updated : x)));
  }

  const editing = campaigns.find((c) => c.id === editingId);

  if (!contractor) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{campaigns.length} campaigns</p>
        <button onClick={create} className="btn-gold !py-2 text-sm">
          + New Campaign
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <CampaignEditor
            campaign={editing}
            username={contractor.username}
            pin={pin}
            onClose={() => setEditingId(null)}
            onChanged={updateInList}
          />
        </div>
      )}

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {!loading && campaigns.length === 0 && (
        <p className="py-8 text-center text-sm text-muted/60">
          No campaigns yet. Create a single-page promo you can text or share.
        </p>
      )}

      <div className="space-y-2">
        {campaigns
          .filter((c) => c.id !== editingId)
          .map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-obsidian p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.titleEn}</p>
                <p className="text-xs text-muted">{c.status}</p>
              </div>
              <button onClick={() => setEditingId(c.id)} className="btn-outline !py-1.5 !px-3 text-xs">
                Edit
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

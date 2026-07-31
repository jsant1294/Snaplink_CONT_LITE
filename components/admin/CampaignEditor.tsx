"use client";

import { useState } from "react";
import type { Campaign, CampaignCtaType, CampaignStatus } from "@/lib/campaign-types";

const CTA_TYPES: CampaignCtaType[] = ["url", "phone", "sms", "whatsapp"];
const STATUSES: CampaignStatus[] = ["draft", "scheduled", "active", "expired", "archived"];

export default function CampaignEditor({
  campaign,
  username,
  pin,
  onClose,
  onChanged,
}: {
  campaign: Campaign;
  username: string;
  pin: string;
  onClose: () => void;
  onChanged: (campaign: Campaign) => void;
}) {
  const [local, setLocal] = useState(campaign);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin };
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/contractor/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
        titleEn: local.titleEn,
        titleEs: local.titleEs,
        bodyEn: local.bodyEn,
        bodyEs: local.bodyEs,
        mediaUrl: local.mediaUrl,
        ctaType: local.ctaType,
        ctaValue: local.ctaValue,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.campaign) {
      onChanged(data.campaign);
      showToast("Saved");
    }
  }

  async function setStatus(status: CampaignStatus) {
    setBusy(true);
    const res = await fetch(`/api/contractor/campaigns/${campaign.id}/status`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.campaign) {
      setLocal(data.campaign);
      onChanged(data.campaign);
      showToast("Updated");
    }
  }

  async function uploadImage(file: File) {
    const form = new FormData();
    form.append("contractorId", campaign.contractorId);
    form.append("file", file);
    const res = await fetch("/api/contractor/flipbook/upload", {
      method: "POST",
      headers: { "x-snaplink-pin": pin },
      body: form,
    });
    const data = await res.json();
    if (data.url) setLocal((c) => ({ ...c, mediaUrl: data.url }));
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${username}/${campaign.slug}` : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-charcoal p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={local.status}
          onChange={(e) => setStatus(e.target.value as CampaignStatus)}
          disabled={busy}
          className="input !w-auto !py-1.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={onClose} className="text-xs text-muted hover:text-bone">
          Close
        </button>
      </div>

      {local.status === "active" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-obsidian p-3 text-xs">
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="truncate text-gold underline">
            {publicUrl}
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              showToast("Link copied");
            }}
            className="shrink-0 text-muted hover:text-bone"
          >
            Copy
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Title (EN)</label>
          <input value={local.titleEn} onChange={(e) => setLocal((c) => ({ ...c, titleEn: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="label">Title (ES)</label>
          <input value={local.titleEs} onChange={(e) => setLocal((c) => ({ ...c, titleEs: e.target.value }))} className="input" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Body (EN)</label>
          <textarea rows={2} value={local.bodyEn} onChange={(e) => setLocal((c) => ({ ...c, bodyEn: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="label">Body (ES)</label>
          <textarea rows={2} value={local.bodyEs} onChange={(e) => setLocal((c) => ({ ...c, bodyEs: e.target.value }))} className="input" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {local.mediaUrl && <img src={local.mediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
          className="text-xs text-muted"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label">CTA type</label>
          <select
            value={local.ctaType}
            onChange={(e) => setLocal((c) => ({ ...c, ctaType: e.target.value as CampaignCtaType }))}
            className="input"
          >
            {CTA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Phone / URL / number</label>
          <input value={local.ctaValue} onChange={(e) => setLocal((c) => ({ ...c, ctaValue: e.target.value }))} className="input" />
        </div>
      </div>

      <button onClick={save} disabled={busy} className="btn-gold mt-4 w-full !py-2 text-sm disabled:opacity-40">
        {busy ? "Saving…" : "Save"}
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-gold/40 bg-charcoal px-4 py-2.5 text-sm shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}

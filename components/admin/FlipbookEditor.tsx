"use client";

import { useEffect, useState } from "react";
import type { FlipCampaign, FlipPage, FlipPageType, FlipCtaType } from "@/lib/flipbook-types";
import { nt, type Lang } from "@/lib/i18n";

const PAGE_TYPES: FlipPageType[] = ["cover", "image", "text_image", "offer", "cta", "contact"];
const CTA_TYPES: FlipCtaType[] = ["url", "phone", "sms", "whatsapp"];

const PAGE_TYPE_KEYS: Record<FlipPageType, "pageTypeCover" | "pageTypeImage" | "pageTypeTextImage" | "pageTypeOffer" | "pageTypeCta" | "pageTypeContact"> = {
  cover: "pageTypeCover",
  image: "pageTypeImage",
  text_image: "pageTypeTextImage",
  offer: "pageTypeOffer",
  cta: "pageTypeCta",
  contact: "pageTypeContact",
};

function statusLabel(status: FlipCampaign["status"], lang: Lang): string {
  if (status === "published") return nt("published", lang);
  if (status === "archived") return nt("statusArchived", lang);
  return nt("statusDraft", lang);
}

export default function FlipbookEditor({
  campaign,
  contractorId,
  lang,
  pin,
  onClose,
  onChanged,
}: {
  campaign: FlipCampaign;
  contractorId: string;
  lang: Lang;
  pin: string;
  onClose: () => void;
  onChanged: (campaign: FlipCampaign) => void;
}) {
  const [pages, setPages] = useState<FlipPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(campaign.title);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function headers() {
    return { "Content-Type": "application/json", "x-snaplink-pin": pin };
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function load() {
    setLoading(true);
    fetch(`/api/contractor/flipbook/campaigns/${campaign.id}/pages`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(load, [campaign.id]);

  async function saveTitle() {
    setBusy(true);
    const res = await fetch(`/api/contractor/flipbook/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.campaign) {
      onChanged(data.campaign);
      showToast(nt("saved", lang));
    }
  }

  async function setStatus(status: FlipCampaign["status"]) {
    setBusy(true);
    const res = await fetch(`/api/contractor/flipbook/campaigns/${campaign.id}/status`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.campaign) {
      onChanged(data.campaign);
      showToast(status === "published" ? nt("published", lang) : nt("updated", lang));
    }
  }

  async function addPage() {
    const res = await fetch(`/api/contractor/flipbook/campaigns/${campaign.id}/pages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ pageType: pages.length === 0 ? "cover" : "image", headline: "", body: "" }),
    });
    const data = await res.json();
    if (data.page) setPages((p) => [...p, data.page]);
  }

  async function updatePage(id: string, patch: Partial<FlipPage>) {
    setPages((p) => p.map((pg) => (pg.id === id ? { ...pg, ...patch } : pg)));
    await fetch(`/api/contractor/flipbook/pages/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(patch),
    });
  }

  async function deletePage(id: string) {
    if (!confirm(nt("confirmDeletePage", lang))) return;
    await fetch(`/api/contractor/flipbook/pages/${id}`, { method: "DELETE", headers: headers() });
    setPages((p) => p.filter((pg) => pg.id !== id));
  }

  async function movePage(id: string, delta: number) {
    const idx = pages.findIndex((p) => p.id === id);
    const next = idx + delta;
    if (idx < 0 || next < 0 || next >= pages.length) return;
    const reordered = [...pages];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    setPages(reordered);
    await fetch(`/api/contractor/flipbook/campaigns/${campaign.id}/pages/reorder`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ orderedIds: reordered.map((p) => p.id) }),
    });
  }

  async function uploadImage(id: string, file: File) {
    const form = new FormData();
    form.append("contractorId", contractorId);
    form.append("file", file);
    const res = await fetch("/api/contractor/flipbook/upload", {
      method: "POST",
      headers: { "x-snaplink-pin": pin },
      body: form,
    });
    const data = await res.json();
    if (data.url) await updatePage(id, { mediaUrl: data.url });
  }

  const publicUrl = campaign.publicToken ? `${window.location.origin}/f/${campaign.publicToken}` : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-charcoal p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="input !w-auto text-lg font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs ${
              campaign.status === "published"
                ? "border-success/40 bg-success/15 text-success"
                : campaign.status === "archived"
                  ? "border-white/20 bg-white/10 text-muted"
                  : "border-gold/40 bg-gold/15 text-goldlight"
            }`}
          >
            {statusLabel(campaign.status, lang)}
          </span>
          {campaign.status !== "published" && (
            <button onClick={() => setStatus("published")} disabled={busy} className="btn-gold !py-1.5 !px-3 text-xs">
              {nt("publish", lang)}
            </button>
          )}
          {campaign.status === "published" && (
            <button onClick={() => setStatus("archived")} disabled={busy} className="btn-outline !py-1.5 !px-3 text-xs">
              {nt("archive", lang)}
            </button>
          )}
          <button onClick={onClose} className="text-xs text-muted hover:text-bone">
            {nt("close", lang)}
          </button>
        </div>
      </div>

      {campaign.status === "published" && publicUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-obsidian p-3 text-xs">
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="truncate text-gold underline">
            {publicUrl}
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              showToast(nt("linkCopied", lang));
            }}
            className="shrink-0 text-muted hover:text-bone"
          >
            {nt("copy", lang)}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-muted">{nt("loading", lang)}</p>}

      <div className="space-y-3">
        {pages.map((page, i) => (
          <div key={page.id} className="rounded-xl border border-white/10 bg-obsidian p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <select
                value={page.pageType}
                onChange={(e) => updatePage(page.id, { pageType: e.target.value as FlipPageType })}
                className="input !w-auto !py-1.5 text-xs"
              >
                {PAGE_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {nt(PAGE_TYPE_KEYS[pt], lang)}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  aria-label={nt("moveUp", lang)}
                  onClick={() => movePage(page.id, -1)}
                  disabled={i === 0}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  ↑
                </button>
                <button
                  aria-label={nt("moveDown", lang)}
                  onClick={() => movePage(page.id, 1)}
                  disabled={i === pages.length - 1}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  ↓
                </button>
                <button
                  onClick={() => deletePage(page.id)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
                >
                  {nt("delete", lang)}
                </button>
              </div>
            </div>

            <input
              value={page.headline}
              onChange={(e) => setPages((p) => p.map((pg) => (pg.id === page.id ? { ...pg, headline: e.target.value } : pg)))}
              onBlur={(e) => updatePage(page.id, { headline: e.target.value })}
              placeholder={nt("headlinePlaceholder", lang)}
              className="input mb-2 text-sm"
            />
            <textarea
              value={page.body}
              onChange={(e) => setPages((p) => p.map((pg) => (pg.id === page.id ? { ...pg, body: e.target.value } : pg)))}
              onBlur={(e) => updatePage(page.id, { body: e.target.value })}
              rows={2}
              placeholder={nt("bodyPlaceholder", lang)}
              className="input mb-2 text-sm"
            />

            <div className="mb-2 flex items-center gap-2">
              {page.mediaUrl && <img src={page.mediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(page.id, file);
                }}
                className="text-xs text-muted"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={page.ctaType ?? ""}
                onChange={(e) =>
                  updatePage(page.id, { ctaType: (e.target.value || undefined) as FlipCtaType | undefined })
                }
                className="input !py-1.5 text-xs"
              >
                <option value="">{nt("noCta", lang)}</option>
                {CTA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                defaultValue={page.ctaLabel ?? ""}
                onBlur={(e) => updatePage(page.id, { ctaLabel: e.target.value })}
                placeholder={nt("buttonLabel", lang)}
                className="input !py-1.5 text-xs"
              />
              <input
                defaultValue={page.ctaValue ?? ""}
                onBlur={(e) => updatePage(page.id, { ctaValue: e.target.value })}
                placeholder={nt("ctaValuePlaceholder", lang)}
                className="input !py-1.5 text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={addPage} className="btn-outline mt-3 w-full !py-2 text-sm">
        {nt("addPage", lang)}
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-gold/40 bg-charcoal px-4 py-2.5 text-sm shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}

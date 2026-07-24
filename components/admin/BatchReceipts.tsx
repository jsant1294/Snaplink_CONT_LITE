"use client";

// ---------------------------------------------------------------------------
// Batch receipt capture — Lucio Financial Copilot.
// Built for the "first year shoebox" problem: drop in 20 photos, the reader
// pre-fills what it can, the user confirms each one and saves.
//
// The OCR NEVER saves on its own. Every row requires a human tap.
// OCR runs one at a time (not parallel) to stay inside free-tier rate limits.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lead } from "@/lib/types";
import type { ExpenseCategory } from "@/lib/money-types";
import { todayIso } from "@/lib/money";
import { bt, mt, type Lang } from "@/lib/i18n";
import { serviceLabel } from "@/lib/services";

type ItemState = "queued" | "scanning" | "ready" | "saving" | "saved" | "failed";

interface QueueItem {
  key: string;
  dataUrl: string;
  filename: string;
  state: ItemState;
  source: string;
  amount: string;
  spentOn: string;
  vendor: string;
  categoryId: string;
  isJob: boolean;
  leadId: string;
  error?: string;
}

/** Same compression settings as the intake wizard and the single-expense form. */
async function compressImage(file: File, maxDim = 1400, quality = 0.75): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function BatchReceipts({
  username,
  pin,
  lang,
  categories,
  leads,
  onClose,
  onSaved,
}: {
  username: string;
  pin: string;
  lang: Lang;
  categories: ExpenseCategory[];
  leads: Lead[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const scanningRef = useRef(false);

  const defaultCategoryId = categories[0]?.id ?? "";
  const authHeaders = { "x-snaplink-pin": pin };

  function patch(key: string, changes: Partial<QueueItem>) {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...changes } : it)));
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: QueueItem[] = [];
    for (const file of Array.from(files).slice(0, 40)) {
      try {
        next.push({
          key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl: await compressImage(file),
          filename: file.name,
          state: "queued",
          source: "",
          amount: "",
          spentOn: todayIso(),
          vendor: "",
          categoryId: defaultCategoryId,
          isJob: false,
          leadId: "",
        });
      } catch {
        // Unreadable file — skip it rather than blocking the batch.
      }
    }
    setItems((list) => [...list, ...next]);
  }

  /** Process the queue one item at a time so free-tier rate limits hold. */
  const runScanner = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    try {
      for (;;) {
        const target = items.find((it) => it.state === "queued");
        if (!target) break;
        patch(target.key, { state: "scanning" });
        try {
          const res = await fetch("/api/contractor/receipt-ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({ contractorUsername: username, dataUrl: target.dataUrl }),
          });
          const data = await res.json();
          const s = data?.suggestion ?? {};
          patch(target.key, {
            state: "ready",
            source: String(s.source ?? ""),
            amount: s.amount ?? "",
            spentOn: s.spentOn ?? todayIso(),
            vendor: s.vendor ?? "",
          });
        } catch {
          patch(target.key, { state: "ready", source: bt("couldNotRead", lang) });
        }
        // Small gap between calls — free tiers throttle aggressively.
        await new Promise((r) => setTimeout(r, 600));
      }
    } finally {
      scanningRef.current = false;
    }
    // items is read fresh each loop via the closure over state setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, username, lang]);

  useEffect(() => {
    if (items.some((it) => it.state === "queued")) runScanner();
  }, [items, runScanner]);

  async function saveItem(item: QueueItem) {
    if (!item.amount || Number(item.amount) <= 0) {
      patch(item.key, { error: bt("needAmount", lang) });
      return false;
    }
    patch(item.key, { state: "saving", error: undefined });
    try {
      const res = await fetch("/api/contractor/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          contractorUsername: username,
          amount: item.amount,
          categoryId: item.categoryId,
          leadId: item.isJob && item.leadId ? item.leadId : undefined,
          spentOn: item.spentOn,
          vendor: item.vendor,
          receipt: { dataUrl: item.dataUrl, filename: item.filename },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      patch(item.key, { state: "saved" });
      setSavedCount((n) => n + 1);
      onSaved();
      return true;
    } catch (e) {
      patch(item.key, { state: "ready", error: e instanceof Error ? e.message : "Save failed" });
      return false;
    }
  }

  async function saveAllReady() {
    const ready = items.filter((it) => it.state === "ready" && it.amount && Number(it.amount) > 0);
    for (const item of ready) {
      // Re-read the latest version of this row before saving
      const current = items.find((it) => it.key === item.key) ?? item;
      await saveItem(current);
    }
  }

  const pending = items.filter((it) => it.state !== "saved");
  const readyCount = items.filter(
    (it) => it.state === "ready" && it.amount && Number(it.amount) > 0
  ).length;

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-2xl">{bt("batchTitle", lang)}</h2>
        <button onClick={onClose} className="btn-outline !py-1.5 !px-3 text-xs">
          {bt("closeBatch", lang)}
        </button>
      </div>
      <p className="text-sm text-muted mb-4">{bt("batchIntro", lang)}</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="btn-gold !py-2.5 cursor-pointer">
          {items.length === 0 ? bt("choosePhotos", lang) : bt("addMore", lang)}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {readyCount > 0 && (
          <button onClick={saveAllReady} className="btn-outline !py-2.5">
            {bt("saveAllReady", lang)} ({readyCount})
          </button>
        )}
        {savedCount > 0 && (
          <span className="text-sm text-success">
            {savedCount} {bt("batchDone", lang)}
          </span>
        )}
      </div>

      <div className="bg-slateink rounded-xl p-3 mb-4">
        <p className="text-[11px] text-warn">⚠ {bt("alwaysCheck", lang)}</p>
      </div>

      {items.length === 0 && <p className="text-sm text-muted py-4 text-center">{bt("queueEmpty", lang)}</p>}

      <div className="space-y-3">
        {pending.map((item, idx) => (
          <div key={item.key} className="bg-slateink rounded-xl p-3">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.dataUrl}
                alt={item.filename}
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] text-muted">
                    {idx + 1} {bt("ofCount", lang)} {pending.length}
                  </span>
                  {item.state === "scanning" && (
                    <span className="text-[11px] text-gold">{bt("scanning", lang)}</span>
                  )}
                  {item.state === "ready" && item.source && (
                    <span className="text-[10px] text-muted truncate max-w-[60%]" title={item.source}>
                      {bt("readBy", lang)}: {item.source}
                    </span>
                  )}
                </div>

                {item.state === "scanning" ? (
                  <div className="h-9 rounded-lg bg-white/5 animate-pulse" />
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                        <input
                          className="input !py-2 !pl-6 text-sm"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => patch(item.key, { amount: e.target.value, error: undefined })}
                          aria-label={mt("amount", lang)}
                        />
                      </div>
                      <input
                        className="input !py-2 text-sm"
                        type="date"
                        value={item.spentOn}
                        onChange={(e) => patch(item.key, { spentOn: e.target.value })}
                        aria-label={mt("date", lang)}
                      />
                      <input
                        className="input !py-2 text-sm"
                        placeholder={mt("vendorPlaceholder", lang)}
                        value={item.vendor}
                        onChange={(e) => patch(item.key, { vendor: e.target.value })}
                        aria-label={mt("vendor", lang)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <select
                        className="input !py-2 text-sm"
                        value={item.categoryId}
                        onChange={(e) => patch(item.key, { categoryId: e.target.value })}
                        aria-label={mt("category", lang)}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-charcoal">
                            {lang === "es" ? c.labelEs : c.labelEn}
                          </option>
                        ))}
                      </select>

                      {item.isJob ? (
                        <select
                          className="input !py-2 text-sm"
                          value={item.leadId}
                          onChange={(e) => patch(item.key, { leadId: e.target.value })}
                          aria-label={mt("whichJob", lang)}
                        >
                          <option value="" className="bg-charcoal">
                            {mt("pickJob", lang)}
                          </option>
                          {leads.map((l) => (
                            <option key={l.id} value={l.id} className="bg-charcoal">
                              {l.clientName} · {serviceLabel(l.projectType, lang)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button
                        onClick={() => patch(item.key, { isJob: false, leadId: "" })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] border ${
                          !item.isJob ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"
                        }`}
                      >
                        {mt("overhead", lang)}
                      </button>
                      <button
                        onClick={() => patch(item.key, { isJob: true })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] border ${
                          item.isJob ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"
                        }`}
                      >
                        {mt("jobMaterial", lang)}
                      </button>

                      <div className="flex-1" />

                      <button
                        onClick={() => setItems((l) => l.filter((x) => x.key !== item.key))}
                        className="text-[11px] text-danger px-2"
                      >
                        {bt("skipThis", lang)}
                      </button>
                      <button
                        onClick={() => saveItem(item)}
                        disabled={item.state === "saving" || !item.amount || (item.isJob && !item.leadId)}
                        className="btn-gold !py-1.5 !px-4 text-xs disabled:opacity-40"
                      >
                        {item.state === "saving" ? mt("saving", lang) : bt("saveThis", lang)}
                      </button>
                    </div>

                    {item.error && <p className="text-[11px] text-danger mt-2">{item.error}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

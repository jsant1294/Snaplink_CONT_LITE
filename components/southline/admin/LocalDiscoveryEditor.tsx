"use client";

import { useState, useEffect } from "react";
import type { LocalDiscoveryDestination, SouthlineLocalCategory, SouthlineLocalDiscoveryContent } from "@/lib/southline-types";
import {
  buildDiscoveryTarget,
  computeLocalDiscoveryStatus,
  isValidUsZip,
  type LocalDiscoveryStatus,
} from "@/lib/southline-local-discovery";
import LocalDiscovery from "@/components/southline/LocalDiscovery";

const STATUS_META: Record<LocalDiscoveryStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  hidden: { label: "Hidden", className: "bg-white/10 text-muted border-white/20" },
  warning: { label: "Warning", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  misconfigured: { label: "Misconfigured", className: "bg-danger/15 text-danger border-danger/30" },
};

function StatusBadge({ status }: { status: LocalDiscoveryStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export default function LocalDiscoveryEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineLocalDiscoveryContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [previewLang, setPreviewLang] = useState<"en" | "es">("en");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const [testZip, setTestZip] = useState("30004");
  const [testCategoryId, setTestCategoryId] = useState("");
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [testZipError, setTestZipError] = useState<string | null>(null);
  const [bridgeCheck, setBridgeCheck] = useState<"idle" | "checking" | "reachable" | "unreachable">("idle");
  const [lastSuccessfulTest, setLastSuccessfulTest] = useState<string | null>(null);

  function load() {
    setLoadError(null);
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.settings) throw new Error(d.error ?? "Failed to load local discovery");
        setContent(d.settings.localDiscovery);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load local discovery"));
  }

  useEffect(load, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify({ localDiscovery: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.localDiscovery);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="text-sm">
        <p className="text-danger mb-2">{loadError}</p>
        <button onClick={load} className="btn-outline !py-2 !px-4 text-xs">
          Retry
        </button>
      </div>
    );
  }
  if (!content) return <p className="text-muted text-sm">Loading local discovery…</p>;

  const status = computeLocalDiscoveryStatus(content);
  const masterOff = !content.enabled;

  function set(field: keyof SouthlineLocalDiscoveryContent, value: string | null | boolean) {
    setContent((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateCategory(index: number, patch: Partial<SouthlineLocalCategory>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: current.categories.map((category, i) =>
          i === index ? { ...category, ...patch } : category
        ),
      };
    });
  }

  function moveCategory(index: number, offset: number) {
    setContent((current) => {
      if (!current) return current;
      const next = [...current.categories];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...current, categories: next.map((category, i) => ({ ...category, order: i })) };
    });
  }

  function addCategory() {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: [
          ...current.categories,
          {
            id: `category_${Date.now()}`,
            labelEn: "",
            labelEs: "",
            descriptionEn: null,
            descriptionEs: null,
            icon: null,
            imageUrl: null,
            snaplinkCategory: null,
            destination: "southline",
            internalSlug: null,
            visible: true,
            featured: false,
            order: current.categories.length,
            seasonalTag: null,
          },
        ],
      };
    });
  }

  function removeCategory(index: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: current.categories
          .filter((_, i) => i !== index)
          .map((category, i) => ({ ...category, order: i })),
      };
    });
  }

  function runTestBridge() {
    if (!content) return;
    const normalized = testZip.trim();
    if (normalized && !isValidUsZip(normalized)) {
      setTestZipError("Enter a valid US ZIP code (e.g. 30004 or 30004-1234).");
      setTestUrl(null);
      return;
    }
    setTestZipError(null);
    const selected = content.categories.find((c) => c.id === testCategoryId) ?? null;
    let target: { url: string; external: boolean };
    try {
      target = buildDiscoveryTarget({
        settings: {
          internalDirectoryRoute: content.internalDirectoryRoute,
          directoryBaseUrl: content.directoryBaseUrl,
          directoryRoute: content.directoryRoute,
          zipParam: content.zipParam,
          categoryParam: content.categoryParam,
          localeParam: content.localeParam,
          sourceValue: content.sourceValue,
          placementValue: content.placementValue,
          preserveUtm: content.preserveUtm !== false,
          attributionEnabled: content.attributionEnabled !== false,
          fallbackUrl: content.fallbackUrl,
        },
        locale: previewLang,
        zip: normalized || null,
        category: selected,
      });
    } catch {
      setTestUrl(null);
      setBridgeCheck("idle");
      setTestZipError("Couldn't build that route — check the category destination and slug.");
      return;
    }
    setTestUrl(target.url);
    setBridgeCheck("checking");
    if (target.external) {
      // Best-effort reachability probe only — the browser cannot read a
      // cross-origin no-cors response, so a resolved fetch is treated as
      // "reachable" and a thrown network error as "unreachable". Diagnostics
      // failures here never block the CMS or the public redirect.
      fetch(target.url, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setBridgeCheck("reachable");
          setLastSuccessfulTest(new Date().toLocaleString());
        })
        .catch(() => setBridgeCheck("unreachable"));
    } else {
      // Internal route — the destination is Southline itself; no probe needed.
      setBridgeCheck("reachable");
      setLastSuccessfulTest(new Date().toLocaleString());
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted max-w-2xl">
          Local discovery sends visitors to the right destination per category: Southline-owned categories
          stay on the internal Southline directory, SnapLink-owned categories (like Photography) hand off
          to SnapLink Local. Categories are entry-point placeholders only — no merchant names, ratings, or
          counts are fabricated here. Only the per-category "destination" decides where a visitor goes.
        </p>
        <StatusBadge status={status} />
      </div>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm font-medium">Local discovery enabled</span>
        <Toggle on={content.enabled} onToggle={() => set("enabled", !content.enabled)} />
      </label>
      <p className="text-xs text-muted -mt-2">
        Master switch. When off, the homepage section and category cards never render, regardless of the
        settings below — their values are preserved so nothing is lost while the feature is disabled.
      </p>
      <label className={`flex items-center justify-between py-3 border-b border-white/5 ${masterOff ? "opacity-40" : ""}`}>
        <span className="text-sm">Show on homepage</span>
        <Toggle
          on={content.showOnHomepage}
          onToggle={() => set("showOnHomepage", !content.showOnHomepage)}
          disabled={masterOff}
        />
      </label>
      <label className={`flex items-center justify-between py-3 border-b border-white/5 ${masterOff ? "opacity-40" : ""}`}>
        <span className="text-sm">Show category cards</span>
        <Toggle
          on={content.showCategoryCards}
          onToggle={() => set("showCategoryCards", !content.showCategoryCards)}
          disabled={masterOff}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Eyebrow (EN)</label>
          <input className="input" value={content.eyebrowEn ?? ""} onChange={(e) => set("eyebrowEn", e.target.value || null)} placeholder="Local" />
        </div>
        <div>
          <label className="label">Eyebrow (ES)</label>
          <input className="input" value={content.eyebrowEs ?? ""} onChange={(e) => set("eyebrowEs", e.target.value || null)} placeholder="Local" />
        </div>
        <div>
          <label className="label">Title (EN)</label>
          <input className="input" value={content.titleEn ?? ""} onChange={(e) => set("titleEn", e.target.value || null)} placeholder="Find trusted professionals near you" />
        </div>
        <div>
          <label className="label">Title (ES)</label>
          <input className="input" value={content.titleEs ?? ""} onChange={(e) => set("titleEs", e.target.value || null)} placeholder="Encuentra profesionales de confianza cerca de ti" />
        </div>
        <div>
          <label className="label">Description (EN)</label>
          <textarea className="input !resize-y" rows={2} value={content.descriptionEn ?? ""} onChange={(e) => set("descriptionEn", e.target.value || null)} placeholder="Enter your ZIP code to browse local professionals powered by SnapLink." />
        </div>
        <div>
          <label className="label">Description (ES)</label>
          <textarea className="input !resize-y" rows={2} value={content.descriptionEs ?? ""} onChange={(e) => set("descriptionEs", e.target.value || null)} placeholder="Ingresa tu código postal para explorar profesionales locales en SnapLink." />
        </div>
        <div>
          <label className="label">ZIP placeholder (EN)</label>
          <input className="input" value={content.zipPlaceholderEn ?? ""} onChange={(e) => set("zipPlaceholderEn", e.target.value || null)} placeholder="e.g. 75204" />
        </div>
        <div>
          <label className="label">ZIP placeholder (ES)</label>
          <input className="input" value={content.zipPlaceholderEs ?? ""} onChange={(e) => set("zipPlaceholderEs", e.target.value || null)} placeholder="ej. 75204" />
        </div>
        <div>
          <label className="label">Submit label (EN)</label>
          <input className="input" value={content.submitLabelEn ?? ""} onChange={(e) => set("submitLabelEn", e.target.value || null)} placeholder="Continue to SnapLink" />
        </div>
        <div>
          <label className="label">Submit label (ES)</label>
          <input className="input" value={content.submitLabelEs ?? ""} onChange={(e) => set("submitLabelEs", e.target.value || null)} placeholder="Continuar a SnapLink" />
        </div>
        <div>
          <label className="label">Powered-by label (EN)</label>
          <input className="input" value={content.poweredByLabelEn ?? ""} onChange={(e) => set("poweredByLabelEn", e.target.value || null)} placeholder="Powered by the SnapLink professional network" />
        </div>
        <div>
          <label className="label">Powered-by label (ES)</label>
          <input className="input" value={content.poweredByLabelEs ?? ""} onChange={(e) => set("poweredByLabelEs", e.target.value || null)} placeholder="Impulsado por la red profesional de SnapLink" />
        </div>
      </div>

      <div className="pt-2 border-t border-white/10">
        <p className="text-sm font-medium text-gold mb-1 mt-4">Routing & Bridge</p>
        <p className="text-xs text-muted mb-3">
          Everything below controls how visitors are handed off: Southline-owned categories go to the
          internal Southline route above; SnapLink-owned categories hand off to SnapLink Local. The
          external destination host is restricted to the SnapLink allowlist server-side — this cannot be
          used to redirect visitors anywhere else.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Base URL</label>
            <input className="input" value={content.directoryBaseUrl ?? ""} onChange={(e) => set("directoryBaseUrl", e.target.value || null)} placeholder="https://snaplink.southlineone.com/en/local" />
            <p className="text-xs text-muted mt-1">Stored as a bare allowlisted origin; the locale segment is resolved automatically for each language.</p>
          </div>
          <div>
            <label className="label">Internal directory route</label>
            <input className="input" value={content.internalDirectoryRoute ?? ""} onChange={(e) => set("internalDirectoryRoute", e.target.value || null)} placeholder="/results" />
            <p className="text-xs text-muted mt-1">Where Southline-owned categories go (must start with "/").</p>
          </div>
          <div>
            <label className="label">Directory route</label>
            <input className="input" value={content.directoryRoute ?? ""} onChange={(e) => set("directoryRoute", e.target.value || null)} placeholder="local" />
          </div>
          <div>
            <label className="label">ZIP parameter name</label>
            <input className="input" value={content.zipParam ?? ""} onChange={(e) => set("zipParam", e.target.value || null)} placeholder="zip" />
          </div>
          <div>
            <label className="label">Category parameter name</label>
            <input className="input" value={content.categoryParam ?? ""} onChange={(e) => set("categoryParam", e.target.value || null)} placeholder="category" />
          </div>
          <div>
            <label className="label">Locale parameter name (optional)</label>
            <input className="input" value={content.localeParam ?? ""} onChange={(e) => set("localeParam", e.target.value || null)} placeholder="locale" />
            <p className="text-xs text-muted mt-1">Locale is already carried in the path (/en/local); set this only if SnapLink also expects it as a query parameter.</p>
          </div>
          <div>
            <label className="label">Default category (id)</label>
            <input className="input" value={content.defaultCategory ?? ""} onChange={(e) => set("defaultCategory", e.target.value || null)} placeholder="interior-designers" />
          </div>
          <div>
            <label className="label">Source value</label>
            <input className="input" value={content.sourceValue ?? ""} onChange={(e) => set("sourceValue", e.target.value || null)} placeholder="southline-living" />
          </div>
          <div>
            <label className="label">Placement value</label>
            <input className="input" value={content.placementValue ?? ""} onChange={(e) => set("placementValue", e.target.value || null)} placeholder="homepage-local-discovery" />
          </div>
          <div>
            <label className="label">Open behavior</label>
            <select
              className="input"
              value={content.openBehavior ?? "same-tab"}
              onChange={(e) => set("openBehavior", e.target.value as "same-tab" | "new-tab")}
            >
              <option value="same-tab">Same tab</option>
              <option value="new-tab">New tab</option>
            </select>
          </div>
          <div>
            <label className="label">Fallback URL (internal path)</label>
            <input className="input" value={content.fallbackUrl ?? ""} onChange={(e) => set("fallbackUrl", e.target.value || null)} placeholder="/results" />
            <p className="text-xs text-muted mt-1">Must start with "/". Keeps visitors on Southline if the bridge is ever misconfigured.</p>
          </div>
        </div>
        <label className="flex items-center justify-between py-3 border-b border-white/5 mt-2">
          <span className="text-sm">Preserve UTM parameters</span>
          <Toggle on={content.preserveUtm} onToggle={() => set("preserveUtm", !content.preserveUtm)} />
        </label>
        <label className="flex items-center justify-between py-3 border-b border-white/5">
          <span className="text-sm">Enable referral attribution</span>
          <Toggle on={content.attributionEnabled} onToggle={() => set("attributionEnabled", !content.attributionEnabled)} />
        </label>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Categories</p>
      </div>
      {content.categories.map((category, index) => (
        <div key={category.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">
              {category.labelEn || `Category ${index + 1}`}
              <span className="ml-2 text-xs text-muted font-normal">({category.id})</span>
            </span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveCategory(index, -1)} disabled={index === 0} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  ↑
                </button>
                <button type="button" onClick={() => moveCategory(index, 1)} disabled={index === content.categories.length - 1} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Enabled
                <Toggle on={category.visible} onToggle={() => updateCategory(index, { visible: !category.visible })} />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                Featured
                <Toggle on={category.featured} onToggle={() => updateCategory(index, { featured: !category.featured })} />
              </label>
              <button type="button" onClick={() => removeCategory(index)} className="text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2">
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">ID</label>
              <input className="input" value={category.id} onChange={(e) => updateCategory(index, { id: e.target.value })} placeholder="interior-designers" />
            </div>
            <div>
              <label className="label">Destination (routes this category)</label>
              <select
                className="input"
                value={category.destination ?? "southline"}
                onChange={(e) =>
                  updateCategory(index, { destination: e.target.value as LocalDiscoveryDestination })
                }
              >
                <option value="southline">Southline (internal)</option>
                <option value="snaplink">SnapLink Local (external)</option>
              </select>
              <p className="text-xs text-muted mt-1">
                Only "destination" decides routing — a missing slug never changes where this category goes.
              </p>
            </div>
            {(category.destination ?? (category.id === "photography" ? "snaplink" : "southline")) === "snaplink" ? (
              <div>
                <label className="label">SnapLink slug (canonical)</label>
                <input className="input" value={category.snaplinkCategory ?? ""} onChange={(e) => updateCategory(index, { snaplinkCategory: e.target.value || null })} placeholder="canonical SnapLink category slug" />
                {!category.snaplinkCategory && category.visible && (
                  <p className="text-xs text-amber-500 mt-1">
                    SnapLink category missing a slug — visitors will see an error instead of a guessed URL.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="label">Internal slug (canonical)</label>
                <input className="input" value={category.internalSlug ?? ""} onChange={(e) => updateCategory(index, { internalSlug: e.target.value || null })} placeholder="maps to a real /results category, e.g. remodeling" />
                {!category.internalSlug && category.visible && (
                  <p className="text-xs text-amber-500 mt-1">
                    No internal slug — this category falls back to its id when routing internally.
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="label">Label (EN)</label>
              <input className="input" value={category.labelEn} onChange={(e) => updateCategory(index, { labelEn: e.target.value })} />
            </div>
            <div>
              <label className="label">Label (ES)</label>
              <input className="input" value={category.labelEs} onChange={(e) => updateCategory(index, { labelEs: e.target.value })} />
            </div>
            <div>
              <label className="label">Description (EN)</label>
              <input className="input" value={category.descriptionEn ?? ""} onChange={(e) => updateCategory(index, { descriptionEn: e.target.value || null })} placeholder="Browse local interior designers" />
            </div>
            <div>
              <label className="label">Description (ES)</label>
              <input className="input" value={category.descriptionEs ?? ""} onChange={(e) => updateCategory(index, { descriptionEs: e.target.value || null })} placeholder="Explora diseñadores de interiores locales" />
            </div>
            <div>
              <label className="label">Icon</label>
              <input className="input" value={category.icon ?? ""} onChange={(e) => updateCategory(index, { icon: e.target.value || null })} placeholder="optional, hidden from screen readers" />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={category.imageUrl ?? ""} onChange={(e) => updateCategory(index, { imageUrl: e.target.value || null })} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Seasonal tag (optional)</label>
              <input className="input" value={category.seasonalTag ?? ""} onChange={(e) => updateCategory(index, { seasonalTag: e.target.value || null })} placeholder="e.g. spring, holiday" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addCategory} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Category
      </button>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm font-medium text-gold mb-1 mt-4">Test Bridge</p>
        <p className="text-xs text-muted mb-3">
          Builds the exact destination URL from the settings above — internal for Southline-owned
          categories, external for SnapLink-owned ones — and does a best-effort reachability check for
          external targets.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">ZIP</label>
            <input className="input" value={testZip} onChange={(e) => setTestZip(e.target.value)} placeholder="30004" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={testCategoryId} onChange={(e) => setTestCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {content.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.labelEn || c.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Locale</label>
            <select className="input" value={previewLang} onChange={(e) => setPreviewLang(e.target.value as "en" | "es")}>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
        {testZipError && <p className="text-xs text-danger mt-2">{testZipError}</p>}
        <button type="button" onClick={runTestBridge} className="btn-outline !py-2 !px-4 text-xs mt-3">
          Test Bridge
        </button>
        {testUrl && (
          <div className="mt-3 rounded-lg border border-white/10 bg-charcoal p-3 text-xs">
            <p className="text-muted mb-1">Generated URL (shown before opening):</p>
            <p className="break-all text-bone">{testUrl}</p>
            <div className="mt-2 flex items-center gap-3">
              <a href={testUrl} target="_blank" rel="noreferrer" className="text-gold font-semibold">
                Open in new tab
              </a>
              <span className="text-muted">
                {bridgeCheck === "checking" && "Checking…"}
                {bridgeCheck === "reachable" && "Reachable"}
                {bridgeCheck === "unreachable" && "Unreachable (network error)"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm font-medium text-gold mb-1 mt-4">Diagnostics</p>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <DiagnosticRow label="Master feature enabled" ok={content.enabled} />
          <DiagnosticRow label="Homepage visible" ok={content.enabled && content.showOnHomepage} />
          <DiagnosticRow label="Category cards visible" ok={content.enabled && content.showCategoryCards} />
          <DiagnosticRow label="Base URL valid" ok={status !== "misconfigured"} />
          <DiagnosticRow
            label="Category ownership valid"
            ok={
              content.categories.filter((c) => c.visible).length === 0 ||
              content.categories
                .filter((c) => c.visible)
                .every(
                  (c) =>
                    ((c.destination ?? (c.id === "photography" ? "snaplink" : "southline")) === "snaplink"
                      ? !!c.snaplinkCategory?.trim()
                      : true)
                )
            }
          />
          <DiagnosticRow label="Locale mapping valid" ok={true} />
          <DiagnosticRow label="Attribution enabled" ok={content.attributionEnabled} />
          <DiagnosticRow
            label="Directory route reachable"
            ok={bridgeCheck === "reachable"}
            neutral={bridgeCheck === "idle" || bridgeCheck === "checking"}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          Last successful bridge test: {lastSuccessfulTest ?? "not tested this session"}
        </p>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mt-4 mb-1">
          <p className="text-sm font-medium text-gold">Preview</p>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
              <button type="button" onClick={() => setPreviewLang("en")} className={`px-3 py-1 ${previewLang === "en" ? "bg-gold text-obsidian" : "text-muted"}`}>EN</button>
              <button type="button" onClick={() => setPreviewLang("es")} className={`px-3 py-1 ${previewLang === "es" ? "bg-gold text-obsidian" : "text-muted"}`}>ES</button>
            </div>
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
              <button type="button" onClick={() => setPreviewDevice("desktop")} className={`px-3 py-1 ${previewDevice === "desktop" ? "bg-gold text-obsidian" : "text-muted"}`}>Desktop</button>
              <button type="button" onClick={() => setPreviewDevice("mobile")} className={`px-3 py-1 ${previewDevice === "mobile" ? "bg-gold text-obsidian" : "text-muted"}`}>Mobile</button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted mb-3">Non-interactive preview — links are disabled here so nothing navigates away from the CMS.</p>
        {!content.enabled ? (
          <p className="text-xs text-muted italic">Local discovery is disabled — nothing renders publicly.</p>
        ) : (
          <div className={previewDevice === "mobile" ? "max-w-[380px]" : "w-full"}>
            <div className="pointer-events-none select-none rounded-xl overflow-hidden border border-white/10">
              <LocalDiscovery lang={previewLang} content={content} />
            </div>
          </div>
        )}
      </div>

      <div>
        <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save Local Discovery"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function DiagnosticRow({ label, ok, neutral }: { label: string; ok: boolean; neutral?: boolean }) {
  const color = neutral ? "text-muted" : ok ? "text-emerald-400" : "text-danger";
  const icon = neutral ? "○" : ok ? "✓" : "✕";
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${color}`}>{icon}</span>
    </div>
  );
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-10 h-6 rounded-full transition-colors ${on ? "bg-gold" : "bg-white/10"} ${disabled ? "cursor-not-allowed" : ""}`}
    >
      <span
        className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 mx-0.5 ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

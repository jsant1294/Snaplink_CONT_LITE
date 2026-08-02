"use client";

import { useState, useEffect } from "react";
import type {
  CmsImage,
  HomeServicesContent,
  HeroContent,
  SeasonalContent,
  SectionVisibility,
  SnapLinkPromoContent,
  SouthlineCategory,
  SouthlineSettings,
  TrendingProjectItem,
} from "@/lib/southline-types";
import { isSeasonalActive } from "@/lib/seasonal-schedule";
import ImageField from "./ImageField";

function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

type Tab = "hero" | "sections" | "services" | "trending" | "seasonal" | "categories" | "snapLinkPromo";

export default function HomepageEditor({ pin }: { pin: string }) {
  const [settings, setSettings] = useState<SouthlineSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("hero");

  function load() {
    setLoadError(null);
    fetch("/api/southline/settings", {
      headers: { "x-snaplink-pin": pin },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.settings) throw new Error(d.error ?? "Failed to load settings");
        setSettings(d.settings);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load settings"));
  }

  useEffect(load, [pin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save(patch: Partial<SouthlineSettings>) {
    setBusy(true);
    try {
      const res = await fetch("/api/southline/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
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
  if (!settings) {
    return <p className="text-muted text-sm">Loading settings…</p>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "hero", label: "Hero & Copy" },
    { key: "services", label: "Home Services" },
    { key: "trending", label: "Trending" },
    { key: "seasonal", label: "Seasonal" },
    { key: "categories", label: "Categories" },
    { key: "snapLinkPromo", label: "SnapLink Local Promo" },
    { key: "sections", label: "Sections" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 pb-px overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
              activeTab === t.key
                ? "bg-charcoal text-bone border border-white/10 border-b-transparent"
                : "text-muted hover:text-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "hero" && (
        <HeroTab hero={settings.hero} heroImage={settings.heroImage} busy={busy} pin={pin} onSave={save} />
      )}
      {activeTab === "sections" && (
        <SectionsTab sections={settings.sections} busy={busy} onSave={save} />
      )}
      {activeTab === "services" && (
        <HomeServicesTab content={settings.homeServices} busy={busy} pin={pin} onSave={save} />
      )}
      {activeTab === "trending" && (
        <TrendingTab items={settings.trendingProjects} busy={busy} pin={pin} onSave={save} />
      )}
      {activeTab === "seasonal" && (
        <SeasonalTab content={settings.seasonal} busy={busy} pin={pin} onSave={save} />
      )}
      {activeTab === "categories" && (
        <CategoriesTab items={settings.categories} busy={busy} pin={pin} onSave={save} />
      )}
      {activeTab === "snapLinkPromo" && (
        <SnapLinkPromoTab content={settings.snapLinkPromo} busy={busy} pin={pin} onSave={save} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-10 h-6 rounded-full transition-colors ${on ? "bg-gold" : "bg-white/10"}`}
    >
      <span
        className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 mx-0.5 ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function HeroTab({
  hero,
  heroImage,
  busy,
  pin,
  onSave,
}: {
  hero: HeroContent;
  heroImage: CmsImage;
  busy: boolean;
  pin: string;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(hero);
  const [image, setImage] = useState(heroImage);

  useEffect(() => setLocal(hero), [hero]);
  useEffect(() => setImage(heroImage), [heroImage]);

  const fields: { key: keyof HeroContent; label: string; rows?: number }[] = [
    { key: "tagline", label: "Tagline" },
    { key: "titleEs", label: "Title (ES)", rows: 2 },
    { key: "titleEn", label: "Title (EN)", rows: 2 },
    { key: "subtitleEs", label: "Subtitle (ES)", rows: 2 },
    { key: "subtitleEn", label: "Subtitle (EN)", rows: 2 },
    { key: "searchPromptEs", label: "Search prompt (ES)" },
    { key: "searchPromptEn", label: "Search prompt (EN)" },
    { key: "ctaExploreEs", label: "Explore CTA (ES)" },
    { key: "ctaExploreEn", label: "Explore CTA (EN)" },
    { key: "ctaPlanEs", label: "Plan CTA (ES)" },
    { key: "ctaPlanEn", label: "Plan CTA (EN)" },
    { key: "ctaFindProEs", label: "Find Pro CTA (ES)" },
    { key: "ctaFindProEn", label: "Find Pro CTA (EN)" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the hero section copy and background image. Spanish is the default consumer language.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          label="Hero image (desktop)"
          value={image.desktopUrl}
          onChange={(url) => setImage({ ...image, desktopUrl: url })}
          pin={pin}
          kind="hero"
        />
        <ImageField
          label="Hero image (mobile)"
          value={image.mobileUrl}
          onChange={(url) => setImage({ ...image, mobileUrl: url })}
          pin={pin}
          kind="hero"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Hero image alt (ES)</label>
          <input
            className="input"
            value={image.altEs ?? ""}
            onChange={(e) => setImage({ ...image, altEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Hero image alt (EN)</label>
          <input
            className="input"
            value={image.altEn ?? ""}
            onChange={(e) => setImage({ ...image, altEn: e.target.value })}
          />
        </div>
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="label">{f.label}</label>
          {f.rows ? (
            <textarea
              className="input !resize-y"
              rows={f.rows}
              value={local[f.key] as string}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
            />
          ) : (
            <input
              className="input"
              value={local[f.key] as string}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
            />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave({ hero: local, heroImage: image })}
        disabled={busy}
        className="btn-gold disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save hero"}
      </button>
    </div>
  );
}

interface ContractorOption {
  id: string;
  businessName: string;
  username: string;
  serviceArea: string;
}

function HomeServicesTab({
  content,
  busy,
  pin,
  onSave,
}: {
  content: HomeServicesContent;
  busy: boolean;
  pin: string;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(content);
  const [contractors, setContractors] = useState<ContractorOption[]>([]);

  useEffect(() => setLocal(content), [content]);

  useEffect(() => {
    fetch("/api/contractor/profiles")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the Home Services section. Leave fields blank to use the current defaults.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Eyebrow (ES)</label>
          <input
            className="input"
            value={local.eyebrowEs ?? ""}
            onChange={(e) => setLocal({ ...local, eyebrowEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Eyebrow (EN)</label>
          <input
            className="input"
            value={local.eyebrowEn ?? ""}
            onChange={(e) => setLocal({ ...local, eyebrowEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Title (ES)</label>
          <textarea
            className="input !resize-y"
            rows={2}
            value={local.titleEs ?? ""}
            onChange={(e) => setLocal({ ...local, titleEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Title (EN)</label>
          <textarea
            className="input !resize-y"
            rows={2}
            value={local.titleEn ?? ""}
            onChange={(e) => setLocal({ ...local, titleEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description (ES)</label>
          <textarea
            className="input !resize-y"
            rows={3}
            value={local.descriptionEs ?? ""}
            onChange={(e) => setLocal({ ...local, descriptionEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description (EN)</label>
          <textarea
            className="input !resize-y"
            rows={3}
            value={local.descriptionEn ?? ""}
            onChange={(e) => setLocal({ ...local, descriptionEn: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label">Featured professional</label>
        <select
          className="input"
          value={local.featuredContractorId ?? ""}
          onChange={(e) => setLocal({ ...local, featuredContractorId: e.target.value || undefined })}
        >
          <option value="">Demo content</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.businessName} — {c.serviceArea || `/${c.username}`}
            </option>
          ))}
        </select>
        {contractors.length === 0 && (
          <p className="mt-1 text-xs text-muted">No contractor profiles found.</p>
        )}
      </div>

      <ImageField
        label="Featured project image"
        value={local.featuredImageUrl}
        onChange={(url) => setLocal({ ...local, featuredImageUrl: url })}
        pin={pin}
        kind="services"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Primary CTA label (ES)</label>
          <input
            className="input"
            value={local.primaryCtaLabelEs ?? ""}
            onChange={(e) => setLocal({ ...local, primaryCtaLabelEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Primary CTA label (EN)</label>
          <input
            className="input"
            value={local.primaryCtaLabelEn ?? ""}
            onChange={(e) => setLocal({ ...local, primaryCtaLabelEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Primary CTA URL</label>
          <input
            className="input"
            placeholder="e.g. /contractor/example"
            value={local.primaryCtaUrl ?? ""}
            onChange={(e) => setLocal({ ...local, primaryCtaUrl: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={() => onSave({ homeServices: local })}
        disabled={busy}
        className="btn-gold disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save home services"}
      </button>
    </div>
  );
}

function TrendingTab({
  items,
  busy,
  pin,
  onSave,
}: {
  items: TrendingProjectItem[];
  busy: boolean;
  pin: string;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(items);

  useEffect(() => setLocal(items), [items]);

  function update(index: number, patch: Partial<TrendingProjectItem>) {
    setLocal((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, offset: number) {
    setLocal((current) => {
      const next = [...current];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next.map((it, i) => ({ ...it, sortOrder: i }));
    });
  }

  function add() {
    setLocal((current) => [
      ...current,
      {
        id: `trend_${Date.now()}`,
        titleEs: "",
        titleEn: "",
        imageUrl: "",
        linkUrl: "/diy",
        visible: true,
        sortOrder: current.length,
      },
    ]);
  }

  function remove(index: number) {
    setLocal((current) =>
      current.filter((_, i) => i !== index).map((it, i) => ({ ...it, sortOrder: i }))
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the Trending &amp; editorial cards. Hide a card to keep it from appearing on the homepage.
      </p>
      {local.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">Card {index + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === local.length - 1}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Visible
                <Toggle on={item.visible} onToggle={() => update(index, { visible: !item.visible })} />
              </label>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Title (ES)</label>
              <input
                className="input"
                value={item.titleEs}
                onChange={(e) => update(index, { titleEs: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Title (EN)</label>
              <input
                className="input"
                value={item.titleEn}
                onChange={(e) => update(index, { titleEn: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description (ES)</label>
              <textarea
                className="input !resize-y"
                rows={2}
                value={item.descriptionEs ?? ""}
                onChange={(e) => update(index, { descriptionEs: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description (EN)</label>
              <textarea
                className="input !resize-y"
                rows={2}
                value={item.descriptionEn ?? ""}
                onChange={(e) => update(index, { descriptionEn: e.target.value })}
              />
            </div>
            <ImageField
              label="Card image"
              value={item.imageUrl}
              onChange={(url) => update(index, { imageUrl: url })}
              pin={pin}
              kind="trending"
            />
            <div>
              <label className="label">Link URL</label>
              <input
                className="input"
                value={item.linkUrl}
                onChange={(e) => update(index, { linkUrl: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Card
      </button>
      <div>
        <button
          onClick={() => onSave({ trendingProjects: local })}
          disabled={busy}
          className="btn-gold disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save trending"}
        </button>
      </div>
    </div>
  );
}

function SeasonalTab({
  content,
  busy,
  pin,
  onSave,
}: {
  content: SeasonalContent;
  busy: boolean;
  pin: string;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(content);
  const [startInput, setStartInput] = useState(isoToLocalInput(content.startAt));
  const [endInput, setEndInput] = useState(isoToLocalInput(content.endAt));

  useEffect(() => setLocal(content), [content]);
  useEffect(() => setStartInput(isoToLocalInput(content.startAt)), [content.startAt]);
  useEffect(() => setEndInput(isoToLocalInput(content.endAt)), [content.endAt]);

  function updateStartAt(v: string) {
    setStartInput(v);
    setLocal((prev) => ({ ...prev, startAt: localInputToIso(v) }));
  }

  function updateEndAt(v: string) {
    setEndInput(v);
    setLocal((prev) => ({ ...prev, endAt: localInputToIso(v) }));
  }

  const activeNow = isSeasonalActive(local);
  const status = local.enabled === false
    ? "Disabled — banner hidden"
    : activeNow
      ? "Active now"
      : "Scheduled — outside the active window";

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the Seasonal Ideas banner. Disabling it hides the banner even when the section is on.
      </p>
      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Seasonal banner enabled</span>
        <Toggle on={local.enabled !== false} onToggle={() => setLocal({ ...local, enabled: local.enabled === false })} />
      </label>
      <div className={`rounded-xl border px-4 py-3 text-sm ${activeNow ? "border-gold/40 bg-gold/10 text-gold" : "border-white/10 bg-obsidian text-muted"}`}>
        Status: {status}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Start date &amp; time</label>
          <input
            type="datetime-local"
            className="input"
            value={startInput}
            onChange={(e) => updateStartAt(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">Leave empty for no start constraint.</p>
        </div>
        <div>
          <label className="label">End date &amp; time</label>
          <input
            type="datetime-local"
            className="input"
            value={endInput}
            onChange={(e) => updateEndAt(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">Leave empty for no end constraint.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Eyebrow (ES)</label>
          <input
            className="input"
            value={local.eyebrowEs ?? ""}
            onChange={(e) => setLocal({ ...local, eyebrowEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Eyebrow (EN)</label>
          <input
            className="input"
            value={local.eyebrowEn ?? ""}
            onChange={(e) => setLocal({ ...local, eyebrowEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Title (ES)</label>
          <input
            className="input"
            value={local.titleEs ?? ""}
            onChange={(e) => setLocal({ ...local, titleEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Title (EN)</label>
          <input
            className="input"
            value={local.titleEn ?? ""}
            onChange={(e) => setLocal({ ...local, titleEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description (ES)</label>
          <textarea
            className="input !resize-y"
            rows={3}
            value={local.descriptionEs ?? ""}
            onChange={(e) => setLocal({ ...local, descriptionEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description (EN)</label>
          <textarea
            className="input !resize-y"
            rows={3}
            value={local.descriptionEn ?? ""}
            onChange={(e) => setLocal({ ...local, descriptionEn: e.target.value })}
          />
        </div>
        <ImageField
          label="Banner image"
          value={local.imageUrl}
          onChange={(url) => setLocal({ ...local, imageUrl: url })}
          pin={pin}
          kind="seasonal"
        />
        <ImageField
          label="Banner image (mobile)"
          value={local.mobileImageUrl}
          onChange={(url) => setLocal({ ...local, mobileImageUrl: url })}
          pin={pin}
          kind="seasonal"
        />
        <div>
          <label className="label">Image alt (ES)</label>
          <input
            className="input"
            value={local.imageAltEs ?? ""}
            onChange={(e) => setLocal({ ...local, imageAltEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Image alt (EN)</label>
          <input
            className="input"
            value={local.imageAltEn ?? ""}
            onChange={(e) => setLocal({ ...local, imageAltEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">CTA label (ES)</label>
          <input
            className="input"
            value={local.ctaLabelEs ?? ""}
            onChange={(e) => setLocal({ ...local, ctaLabelEs: e.target.value })}
          />
        </div>
        <div>
          <label className="label">CTA label (EN)</label>
          <input
            className="input"
            value={local.ctaLabelEn ?? ""}
            onChange={(e) => setLocal({ ...local, ctaLabelEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">CTA URL</label>
          <input
            className="input"
            value={local.ctaUrl ?? ""}
            onChange={(e) => setLocal({ ...local, ctaUrl: e.target.value })}
          />
        </div>
      </div>
      <button
        onClick={() => onSave({ seasonal: local })}
        disabled={busy}
        className="btn-gold disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save seasonal"}
      </button>
    </div>
  );
}

function CategoriesTab({
  items,
  busy,
  pin,
  onSave,
}: {
  items: SouthlineCategory[];
  busy: boolean;
  pin: string;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(items);

  useEffect(() => setLocal(items), [items]);

  function update(index: number, patch: Partial<SouthlineCategory>) {
    setLocal((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, offset: number) {
    setLocal((current) => {
      const next = [...current];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next.map((it, i) => ({ ...it, sortOrder: i }));
    });
  }

  function add() {
    setLocal((current) => [
      ...current,
      {
        id: `cat_${Date.now()}`,
        titleEs: "",
        titleEn: "",
        imageUrl: "",
        linkUrl: "/ideas",
        visible: true,
        sortOrder: current.length,
      },
    ]);
  }

  function remove(index: number) {
    setLocal((current) =>
      current.filter((_, i) => i !== index).map((it, i) => ({ ...it, sortOrder: i }))
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the Browse Categories cards. Hide a card to keep it off the homepage.
      </p>
      {local.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">Category {index + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === local.length - 1}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Featured
                <Toggle on={item.featured === true} onToggle={() => update(index, { featured: item.featured !== true })} />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                Visible
                <Toggle on={item.visible} onToggle={() => update(index, { visible: !item.visible })} />
              </label>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Title (ES)</label>
              <input
                className="input"
                value={item.titleEs}
                onChange={(e) => update(index, { titleEs: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Title (EN)</label>
              <input
                className="input"
                value={item.titleEn}
                onChange={(e) => update(index, { titleEn: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description (ES)</label>
              <input
                className="input"
                value={item.descriptionEs ?? ""}
                onChange={(e) => update(index, { descriptionEs: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description (EN)</label>
              <input
                className="input"
                value={item.descriptionEn ?? ""}
                onChange={(e) => update(index, { descriptionEn: e.target.value })}
              />
            </div>
            <ImageField
              label="Card image"
              value={item.imageUrl}
              onChange={(url) => update(index, { imageUrl: url })}
              pin={pin}
              kind="category"
            />
            <div>
              <label className="label">Link URL</label>
              <input
                className="input"
                value={item.linkUrl}
                onChange={(e) => update(index, { linkUrl: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Category
      </button>
      <div>
        <button
          onClick={() => onSave({ categories: local })}
          disabled={busy}
          className="btn-gold disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save categories"}
        </button>
      </div>
    </div>
  );
}

function SnapLinkPromoTab({
  content,
  busy,
  pin,
  onSave,
}: {
  content: SnapLinkPromoContent;
  busy: boolean;
  pin: string;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(content);

  useEffect(() => setLocal(content), [content]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Edit the image-driven SnapLink Local cross-promo section. Headline/body copy comes from the
        site dictionary (EN/ES) — this tab controls the image and its presentation.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          label="Image (desktop)"
          value={local.desktopImageUrl}
          onChange={(url) => setLocal({ ...local, desktopImageUrl: url })}
          pin={pin}
          kind="snaplink-promo"
        />
        <ImageField
          label="Image (mobile)"
          value={local.mobileImageUrl ?? ""}
          onChange={(url) => setLocal({ ...local, mobileImageUrl: url || null })}
          pin={pin}
          kind="snaplink-promo"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Image alt (EN)</label>
          <input
            className="input"
            value={local.imageAltEn}
            onChange={(e) => setLocal({ ...local, imageAltEn: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Image alt (ES)</label>
          <input
            className="input"
            value={local.imageAltEs}
            onChange={(e) => setLocal({ ...local, imageAltEs: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Layout</label>
          <select
            className="input"
            value={local.layout}
            onChange={(e) => setLocal({ ...local, layout: e.target.value as SnapLinkPromoContent["layout"] })}
          >
            <option value="image-left">Split card — image left</option>
            <option value="image-right">Split card — image right</option>
            <option value="full-background">Full-background image</option>
          </select>
        </div>
        <div>
          <label className="label">Content alignment (full-background only)</label>
          <select
            className="input"
            value={local.contentAlignment}
            onChange={(e) => setLocal({ ...local, contentAlignment: e.target.value as SnapLinkPromoContent["contentAlignment"] })}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="label">Overlay strength (full-background only)</label>
          <select
            className="input"
            value={local.overlayStrength}
            onChange={(e) => setLocal({ ...local, overlayStrength: e.target.value as SnapLinkPromoContent["overlayStrength"] })}
          >
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>
        </div>
        <div>
          <label className="label">Focal point (desktop)</label>
          <select
            className="input"
            value={local.focalPoint}
            onChange={(e) => setLocal({ ...local, focalPoint: e.target.value as SnapLinkPromoContent["focalPoint"] })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="label">Focal point (mobile)</label>
          <select
            className="input"
            value={local.mobileFocalPoint}
            onChange={(e) => setLocal({ ...local, mobileFocalPoint: e.target.value as SnapLinkPromoContent["mobileFocalPoint"] })}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Show SnapLink badge</span>
        <Toggle on={local.showBadge} onToggle={() => setLocal({ ...local, showBadge: !local.showBadge })} />
      </label>
      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Show category chips</span>
        <Toggle on={local.showChips} onToggle={() => setLocal({ ...local, showChips: !local.showChips })} />
      </label>
      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Show secondary line</span>
        <Toggle on={local.showSecondaryLine} onToggle={() => setLocal({ ...local, showSecondaryLine: !local.showSecondaryLine })} />
      </label>

      <button
        onClick={() => onSave({ snapLinkPromo: local })}
        disabled={busy}
        className="btn-gold disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save SnapLink Local promo"}
      </button>
    </div>
  );
}

function SectionsTab({
  sections,
  busy,
  onSave,
}: {
  sections: SectionVisibility;
  busy: boolean;
  onSave: (p: Partial<SouthlineSettings>) => void;
}) {
  const [local, setLocal] = useState(sections);

  useEffect(() => setLocal(sections), [sections]);

  const items: { key: keyof SectionVisibility; label: string }[] = [
    { key: "hero", label: "Hero section" },
    { key: "categories", label: "Inspiration categories" },
    { key: "featuredPros", label: "Featured professionals" },
    { key: "featuredAgents", label: "Real estate discovery block" },
    { key: "featuredHomes", label: "Featured homes" },
    { key: "featuredServices", label: "Featured services marketplace" },
    { key: "poweredBySnaplink", label: "Powered by SnapLink" },
    { key: "localPromo", label: "SnapLink Local cross-promo" },
    { key: "diyLearning", label: "DIY learning" },
    { key: "trending", label: "Trending & editorial" },
    { key: "seasonalIdeas", label: "Seasonal ideas banner" },
    { key: "costEstimator", label: "Cost estimator CTA" },
    { key: "bookConsultation", label: "Book consultation CTA" },
    { key: "recruitment", label: "Become a SnapLink Professional CTA" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">Toggle homepage sections on or off.</p>
      {items.map((item) => (
        <label
          key={item.key}
          className="flex items-center justify-between py-3 border-b border-white/5"
        >
          <span className="text-sm">{item.label}</span>
          <Toggle
            on={local[item.key]}
            onToggle={() => {
              const next = { ...local, [item.key]: !local[item.key] };
              setLocal(next);
              onSave({ sections: next });
            }}
          />
        </label>
      ))}
    </div>
  );
}

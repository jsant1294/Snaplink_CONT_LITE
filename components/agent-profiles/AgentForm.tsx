"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AGENT_MODULE_KEYS } from "@/lib/agent-profiles/types";
import type { AgentModuleKey, AgentProfile } from "@/lib/agent-profiles/types";
import { AGENT_TIER_LABELS, CANONICAL_AGENT_TIERS, TIER_MODULE_BUNDLES, computeTierModules, resolveAgentTier } from "@/lib/agent-profiles/tiers";
import { LICENSED_PROFESSION_TYPES, PROFESSION_TYPES, DEFAULT_AGENT_PROFESSION_TYPE } from "@/lib/profession-types";

export interface AgentFormValues {
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  slug: string;
  email: string;
  phone: string;
  pin: string;
  photoUrl: string;
  coverPhotoUrl: string;
  preferredLanguage: "en" | "es" | "both";

  brokerageName: string;
  officeName: string;
  teamName: string;
  professionType: string;
  licenseNumber: string;
  licenseState: string;
  yearsExperience: string;
  specialties: string;
  serviceArea: string;
  serviceAreas: string;
  bio: string;
  tagline: string;
  languages: string;

  smsPhone: string;
  whatsapp: string;
  website: string;
  bookingLink: string;
  facebook: string;
  instagram: string;
  linkedin: string;

  featured: boolean;
  categories: string;
  neighborhoods: string;
  serviceRadius: string;
  seoTitle: string;
  seoDescription: string;
  marketplaceSummary: string;

  tier: string;
  modules: Record<AgentModuleKey, boolean>;

  snaplinkStatus: "draft" | "published" | "unpublished";
  southlineStatus: "draft" | "published" | "featured" | "hidden";
}

function emptyModules(): Record<AgentModuleKey, boolean> {
  return Object.fromEntries(AGENT_MODULE_KEYS.map((k) => [k, false])) as Record<AgentModuleKey, boolean>;
}

function csv(list?: string[]): string {
  return (list ?? []).join(", ");
}

function fromCsv(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

// Brokerage-based professions keep real-estate wording ("Brokerage", license
// prominent). Every other profession on the unified model gets profession-
// neutral copy ("Company name") — the field model is identical either way.
const BROKERAGE_PROFESSIONS = new Set(["realtor", "mortgage_broker"]);

export function valuesFromProfile(profile?: AgentProfile): AgentFormValues {
  return {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    displayName: profile?.displayName ?? "",
    username: profile?.username ?? "",
    slug: profile?.slug ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    pin: "",
    photoUrl: profile?.photoUrl ?? "",
    coverPhotoUrl: profile?.coverPhotoUrl ?? "",
    preferredLanguage: profile?.preferredLanguage ?? "en",

    brokerageName: profile?.brokerageName ?? "",
    officeName: profile?.officeName ?? "",
    teamName: profile?.teamName ?? "",
    professionType: profile?.professionType ?? DEFAULT_AGENT_PROFESSION_TYPE,
    licenseNumber: profile?.licenseNumber ?? "",
    licenseState: profile?.licenseState ?? "",
    yearsExperience: profile?.yearsExperience?.toString() ?? "",
    specialties: csv(profile?.specialties),
    serviceArea: profile?.serviceArea ?? "",
    serviceAreas: csv(profile?.serviceAreas),
    bio: profile?.bio ?? "",
    tagline: profile?.tagline ?? "",
    languages: csv(profile?.languages),

    smsPhone: profile?.smsPhone ?? "",
    whatsapp: profile?.whatsapp ?? "",
    website: profile?.website ?? "",
    bookingLink: profile?.bookingLink ?? "",
    facebook: profile?.facebook ?? "",
    instagram: profile?.instagram ?? "",
    linkedin: profile?.linkedin ?? "",

    featured: profile?.featured ?? false,
    categories: csv(profile?.categories),
    neighborhoods: csv(profile?.neighborhoods),
    serviceRadius: profile?.serviceRadius?.toString() ?? "",
    seoTitle: profile?.seoTitle ?? "",
    seoDescription: profile?.seoDescription ?? "",
    marketplaceSummary: profile?.marketplaceSummary ?? "",

    // Resolves a legacy stored value ("basic"/"featured") to its canonical
    // label for display; re-saving the form (even unchanged) then persists
    // the canonical value — a natural, non-destructive upgrade path, never a
    // background rewrite. See docs/commercial-architecture/
    // 10-tier-entitlement-implementation.md "Existing-account compatibility."
    tier: resolveAgentTier(profile?.tier) ?? "",
    modules: { ...emptyModules(), ...(profile?.modules ?? {}) },

    snaplinkStatus: profile?.snaplinkStatus ?? "draft",
    southlineStatus: profile?.southlineStatus ?? "draft",
  };
}

export function buildPayload(v: AgentFormValues) {
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    displayName: v.displayName.trim() || undefined,
    username: v.username.trim(),
    slug: v.slug.trim() || undefined,
    email: v.email.trim(),
    phone: v.phone.trim(),
    pin: v.pin.trim() || undefined,
    photoUrl: v.photoUrl.trim() || undefined,
    coverPhotoUrl: v.coverPhotoUrl.trim() || undefined,
    preferredLanguage: v.preferredLanguage,

    brokerageName: v.brokerageName.trim() || undefined,
    officeName: v.officeName.trim() || undefined,
    teamName: v.teamName.trim() || undefined,
    professionType: v.professionType,
    licenseNumber: v.licenseNumber.trim() || undefined,
    licenseState: v.licenseState.trim() || undefined,
    yearsExperience: v.yearsExperience ? Number(v.yearsExperience) : undefined,
    specialties: fromCsv(v.specialties),
    serviceArea: v.serviceArea.trim() || undefined,
    serviceAreas: fromCsv(v.serviceAreas),
    bio: v.bio.trim() || undefined,
    tagline: v.tagline.trim() || undefined,
    languages: fromCsv(v.languages),

    smsPhone: v.smsPhone.trim() || undefined,
    whatsapp: v.whatsapp.trim() || undefined,
    website: v.website.trim() || undefined,
    bookingLink: v.bookingLink.trim() || undefined,
    facebook: v.facebook.trim() || undefined,
    instagram: v.instagram.trim() || undefined,
    linkedin: v.linkedin.trim() || undefined,

    featured: v.featured,
    categories: fromCsv(v.categories),
    neighborhoods: fromCsv(v.neighborhoods),
    serviceRadius: v.serviceRadius ? Number(v.serviceRadius) : undefined,
    seoTitle: v.seoTitle.trim() || undefined,
    seoDescription: v.seoDescription.trim() || undefined,
    marketplaceSummary: v.marketplaceSummary.trim() || undefined,

    tier: v.tier || undefined,
    modules: v.modules,

    snaplinkStatus: v.snaplinkStatus,
    southlineStatus: v.southlineStatus,
  };
}

type FieldCheck = { available: boolean; reason?: string };

/** Shared Identity/Professional/Contact/Marketplace/SnapLink/Publishing form for New + Edit Agent pages. */
export default function AgentForm({
  pin,
  values,
  onChange,
  excludeId,
  mode,
}: {
  pin: string;
  values: AgentFormValues;
  onChange: (v: AgentFormValues) => void;
  excludeId?: string;
  mode: "create" | "edit";
}) {
  const [checks, setChecks] = useState<Record<string, FieldCheck>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof AgentFormValues>(key: K, value: AgentFormValues[K]) => onChange({ ...values, [key]: value });

  const runCheck = useCallback(
    (username: string, slug: string, email: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const params = new URLSearchParams();
        if (username) params.set("username", username);
        if (slug) params.set("slug", slug);
        if (email) params.set("email", email);
        if (excludeId) params.set("excludeId", excludeId);
        if (!params.toString()) return;
        try {
          const r = await fetch(`/api/agent-profiles/check?${params.toString()}`, { headers: { "x-snaplink-pin": pin } });
          if (r.ok) setChecks(await r.json());
        } catch {
          // Live validation is best-effort; server-side validation on submit is authoritative.
        }
      }, 400);
    },
    [pin, excludeId]
  );

  useEffect(() => {
    runCheck(values.username, values.slug, values.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.username, values.slug, values.email]);

  const inputCls = "w-full rounded-lg border border-white/10 bg-charcoal px-3 py-2 text-sm text-bone placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40";
  const labelCls = "mb-1 block text-xs font-medium text-muted";

  function fieldHint(field: string) {
    const c = checks[field];
    if (!c) return null;
    return <p className={`mt-1 text-xs ${c.available ? "text-success" : "text-danger"}`}>{c.available ? "Available" : c.reason}</p>;
  }

  const snaplinkUrl = values.username ? `/p/${values.username}` : undefined;
  const southlineUrl = values.slug ? `/agents/${values.slug}` : values.username ? `/agents/${values.username}` : undefined;
  const workspaceUrl = mode === "edit" && excludeId ? `/southline/admin/agents/${excludeId}` : undefined;
  const isBrokerageProfession = BROKERAGE_PROFESSIONS.has(values.professionType);

  return (
    <div className="space-y-8">
      {/* --- Shared Professional Identity: one account, one professional identity shared by both channels. --- */}
      <section id="shared-identity">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Shared Professional Identity</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>First name *</label><input className={inputCls} value={values.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
          <div><label className={labelCls}>Last name *</label><input className={inputCls} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
          <div><label className={labelCls}>Display name</label><input className={inputCls} value={values.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Defaults to first + last" /></div>
          <div><label className={labelCls}>Preferred language</label>
            <select className={inputCls} value={values.preferredLanguage} onChange={(e) => set("preferredLanguage", e.target.value as AgentFormValues["preferredLanguage"])}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Username (SnapLink URL: /p/username) *</label>
            <input className={inputCls} value={values.username} onChange={(e) => set("username", e.target.value.toLowerCase())} />
            {fieldHint("username")}
          </div>
          <div>
            <label className={labelCls}>Slug (Southline URL: /agents/slug)</label>
            <input className={inputCls} value={values.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="Defaults to username" />
            {fieldHint("slug")}
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input className={inputCls} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
            {fieldHint("email")}
          </div>
          <div><label className={labelCls}>Phone *</label><input className={inputCls} value={values.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><label className={labelCls}>Supported languages (comma-separated)</label><input className={inputCls} value={values.languages} onChange={(e) => set("languages", e.target.value)} /></div>
          <div><label className={labelCls}>Profile photo URL</label><input className={inputCls} value={values.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} /></div>
          <div><label className={labelCls}>Cover photo URL</label><input className={inputCls} value={values.coverPhotoUrl} onChange={(e) => set("coverPhotoUrl", e.target.value)} /></div>
          <div>
            <label className={labelCls}>{mode === "create" ? "Set 6-digit PIN *" : "Reset 6-digit PIN"}</label>
            <input className={inputCls} maxLength={6} value={values.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))} placeholder={mode === "edit" ? "Leave blank to keep current PIN" : "••••••"} />
          </div>
        </div>
      </section>

      {/* --- Professional Details: the profession-specific extension of the shared identity. --- */}
      <section id="real-estate-details">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Professional Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Profession type</label>
            <select className={inputCls} value={values.professionType} onChange={(e) => set("professionType", e.target.value)}>
              <optgroup label="Licensed professionals">
                {LICENSED_PROFESSION_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>{p.en}</option>
                ))}
              </optgroup>
              <optgroup label="Trades & services">
                {PROFESSION_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>{p.en}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div><label className={labelCls}>Professional title / tagline</label><input className={inputCls} value={values.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Senior listing agent, licensed contractor, studio owner" /></div>
          <div><label className={labelCls}>{isBrokerageProfession ? "Brokerage" : "Company name"}</label><input className={inputCls} value={values.brokerageName} onChange={(e) => set("brokerageName", e.target.value)} placeholder={isBrokerageProfession ? "e.g. Southline Realty Group" : "e.g. Studio or company name"} /></div>
          <div><label className={labelCls}>Office</label><input className={inputCls} value={values.officeName} onChange={(e) => set("officeName", e.target.value)} /></div>
          <div><label className={labelCls}>Team</label><input className={inputCls} value={values.teamName} onChange={(e) => set("teamName", e.target.value)} /></div>
          <div><label className={labelCls}>License number {isBrokerageProfession ? "" : "(optional for non-licensed)"}</label><input className={inputCls} value={values.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} /></div>
          <div><label className={labelCls}>License state {isBrokerageProfession ? "" : "(optional)"}</label><input className={inputCls} value={values.licenseState} onChange={(e) => set("licenseState", e.target.value)} /></div>
          <div><label className={labelCls}>Years of experience</label><input className={inputCls} type="number" value={values.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} /></div>
          <div><label className={labelCls}>Primary service area</label><input className={inputCls} value={values.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} /></div>
          <div><label className={labelCls}>Service areas (comma-separated)</label><input className={inputCls} value={values.serviceAreas} onChange={(e) => set("serviceAreas", e.target.value)} /></div>
          <div><label className={labelCls}>Specialties (comma-separated)</label><input className={inputCls} value={values.specialties} onChange={(e) => set("specialties", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Biography</label><textarea className={inputCls} rows={4} value={values.bio} onChange={(e) => set("bio", e.target.value)} /></div>
        </div>
      </section>

      {/* --- Southline Living Listing: the homeowner-facing discovery layer (/agents/{slug}). --- */}
      <section id="southline-listing">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Southline Living Listing</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Southline publication status</label>
            <select className={inputCls} value={values.southlineStatus} onChange={(e) => set("southlineStatus", e.target.value as AgentFormValues["southlineStatus"])}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="featured">Featured</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-bone"><input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured placement</label>
          <div><label className={labelCls}>Categories (comma-separated)</label><input className={inputCls} value={values.categories} onChange={(e) => set("categories", e.target.value)} /></div>
          <div><label className={labelCls}>Neighborhoods (comma-separated)</label><input className={inputCls} value={values.neighborhoods} onChange={(e) => set("neighborhoods", e.target.value)} /></div>
          <div><label className={labelCls}>Service radius (mi)</label><input className={inputCls} type="number" value={values.serviceRadius} onChange={(e) => set("serviceRadius", e.target.value)} /></div>
          <div><label className={labelCls}>SEO title</label><input className={inputCls} value={values.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></div>
          <div><label className={labelCls}>SEO description</label><input className={inputCls} value={values.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Marketplace summary</label><textarea className={inputCls} rows={3} value={values.marketplaceSummary} onChange={(e) => set("marketplaceSummary", e.target.value)} /></div>
          {southlineUrl && (
            <p className="sm:col-span-2 text-xs text-muted">Southline URL: <span className="text-bone">{southlineUrl}</span></p>
          )}
        </div>
      </section>

      {/* --- SnapLink Workspace and Modules: the client-owned asset (/p/{username}), contact channels, and entitlements. --- */}
      <section id="snaplink-workspace">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">SnapLink Workspace and Modules</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>SnapLink publication status</label>
            <select className={inputCls} value={values.snaplinkStatus} onChange={(e) => set("snaplinkStatus", e.target.value as AgentFormValues["snaplinkStatus"])}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tier</label>
            <select
              className={inputCls}
              value={values.tier}
              onChange={(e) => {
                const nextTier = resolveAgentTier(e.target.value);
                // Tier-authoritative: picking a tier immediately resets the
                // module checkboxes below to exactly that tier's bundle. The
                // operator can still hand-adjust before saving, but the next
                // tier change resets again — see the implementation doc's
                // "Manual overrides" section for why.
                // computeTierModules always sets every AGENT_MODULE_KEYS entry
                // explicitly, so this is a full Record despite AgentModules'
                // Partial<> type — safe to cast at this one call site.
                onChange({ ...values, tier: e.target.value, modules: nextTier ? (computeTierModules(nextTier) as Record<AgentModuleKey, boolean>) : values.modules });
              }}
            >
              <option value="">No tier</option>
              {CANONICAL_AGENT_TIERS.map((t) => (
                <option key={t} value={t}>{AGENT_TIER_LABELS[t]}</option>
              ))}
            </select>
            {values.tier && resolveAgentTier(values.tier) && (
              <p className="mt-1 text-xs text-muted">
                Plan includes: {TIER_MODULE_BUNDLES[resolveAgentTier(values.tier)!].join(", ")}
              </p>
            )}
          </div>
          {snaplinkUrl && (
            <p className="text-xs text-muted">Profile link: <span className="text-bone">{snaplinkUrl}</span></p>
          )}
          {workspaceUrl && (
            <p className="text-xs text-muted">Workspace link: <span className="text-bone">{workspaceUrl}</span></p>
          )}
        </div>

        <h4 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Contact Methods</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>SMS phone</label><input className={inputCls} value={values.smsPhone} onChange={(e) => set("smsPhone", e.target.value)} /></div>
          <div><label className={labelCls}>WhatsApp</label><input className={inputCls} value={values.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          <div><label className={labelCls}>Website</label><input className={inputCls} value={values.website} onChange={(e) => set("website", e.target.value)} /></div>
          <div><label className={labelCls}>Booking link</label><input className={inputCls} value={values.bookingLink} onChange={(e) => set("bookingLink", e.target.value)} /></div>
          <div><label className={labelCls}>Facebook</label><input className={inputCls} value={values.facebook} onChange={(e) => set("facebook", e.target.value)} /></div>
          <div><label className={labelCls}>Instagram</label><input className={inputCls} value={values.instagram} onChange={(e) => set("instagram", e.target.value)} /></div>
          <div><label className={labelCls}>LinkedIn</label><input className={inputCls} value={values.linkedin} onChange={(e) => set("linkedin", e.target.value)} /></div>
        </div>

        <p className={labelCls + " mt-6"}>
          Enabled modules <span className="text-muted/70">— manual override; the next tier change resets this to that tier&apos;s plan</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AGENT_MODULE_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-bone">
              <input type="checkbox" checked={values.modules[key]} onChange={(e) => set("modules", { ...values.modules, [key]: e.target.checked })} />
              {key}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

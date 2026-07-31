"use client";

// Operator-only profile editor for one contractor. The API route
// (PATCH /api/contractor/profiles) enforces operator-only server-side
// regardless of which PIN unlocked this page — see route.ts.

import { use, useEffect, useState } from "react";
import { PinGate } from "@/components/admin/Dashboard";
import { SERVICE_CATEGORIES, SERVICE_LIBRARY } from "@/lib/services";
import { PROFESSION_TYPES } from "@/lib/profession-types";
import type { Contractor } from "@/lib/types";

type PublicContractor = Omit<Contractor, "pin">;

export default function ProfileEditPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return (
    <PinGate username={username} title={`Edit Profile · ${username}`}>
      {(pin, contractor) => <ProfileEditor pin={pin} contractor={contractor} />}
    </PinGate>
  );
}

function ProfileEditor({ pin, contractor }: { pin: string; contractor: PublicContractor | null }) {
  const [form, setForm] = useState({
    businessName: contractor?.businessName ?? "",
    ownerName: contractor?.ownerName ?? "",
    phone: contractor?.phone ?? "",
    whatsapp: contractor?.whatsapp ?? "",
    email: contractor?.email ?? "",
    serviceArea: contractor?.serviceArea ?? "",
    tagline: contractor?.tagline ?? "",
    licenseInfo: contractor?.licenseInfo ?? "",
    reviewsUrl: contractor?.reviewsUrl ?? "",
    galleryUrl: contractor?.galleryUrl ?? "",
  });
  const [professionType, setProfessionType] = useState(contractor?.professionType ?? "contractor");
  const [services, setServices] = useState<Set<string>>(new Set(contractor?.services ?? []));
  const [avatarUrl, setAvatarUrl] = useState(contractor?.avatarUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(contractor?.logoUrl ?? "");
  const [uploading, setUploading] = useState<"avatar" | "logo" | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!contractor) return;
    setForm({
      businessName: contractor.businessName,
      ownerName: contractor.ownerName,
      phone: contractor.phone,
      whatsapp: contractor.whatsapp ?? "",
      email: contractor.email,
      serviceArea: contractor.serviceArea,
      tagline: contractor.tagline ?? "",
      licenseInfo: contractor.licenseInfo ?? "",
      reviewsUrl: contractor.reviewsUrl ?? "",
      galleryUrl: contractor.galleryUrl ?? "",
    });
    setProfessionType(contractor.professionType);
    setServices(new Set(contractor.services ?? []));
    setAvatarUrl(contractor.avatarUrl ?? "");
    setLogoUrl(contractor.logoUrl ?? "");
  }, [contractor]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleService(name: string) {
    setServices((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function uploadImage(kind: "avatar" | "logo", file: File) {
    if (!contractor) return;
    setUploading(kind);
    const body = new FormData();
    body.append("contractorId", contractor.id);
    body.append("kind", kind);
    body.append("file", file);
    const res = await fetch("/api/contractor/avatar-upload", {
      method: "POST",
      headers: { "x-snaplink-pin": pin },
      body,
    });
    const data = await res.json();
    setUploading(null);
    if (data.url) {
      if (kind === "avatar") setAvatarUrl(data.url);
      else setLogoUrl(data.url);
    } else {
      showToast(data.error ?? "Upload failed");
    }
  }

  async function save() {
    if (!contractor) return;
    setSaving(true);
    const res = await fetch("/api/contractor/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
      body: JSON.stringify({
        contractorId: contractor.id,
        ...form,
        professionType,
        services: Array.from(services),
        avatarUrl,
        logoUrl,
      }),
    });
    const data = await res.json();
    setSaving(false);
    showToast(res.ok ? "Saved" : (data.error ?? "Save failed"));
  }

  if (!contractor) return <p className="text-center pt-16 text-muted">Loading…</p>;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-5 pt-8 pb-20">
      <a href="/contractor-admin" className="text-sm text-muted">
        ← Operator console
      </a>
      <h1 className="font-display text-4xl mt-3 mb-1">Edit Profile</h1>
      <p className="text-muted text-sm mb-6">{contractor.businessName} · /{contractor.username}</p>

      <div className="space-y-4">
        {/* Avatar & logo */}
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Photo & logo</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Profile photo</label>
              <div className="flex items-center gap-3">
                {avatarUrl && (
                  <img src={avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover border border-white/10" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading === "avatar"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage("avatar", file);
                  }}
                  className="text-xs text-muted"
                />
              </div>
            </div>
            <div>
              <label className="label">Business logo</label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img src={logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover border border-white/10 bg-white/5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading === "logo"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage("logo", file);
                  }}
                  className="text-xs text-muted"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Business name *</label>
            <input className="input" value={form.businessName} onChange={set("businessName")} />
          </div>
          <div>
            <label className="label">Owner name</label>
            <input className="input" value={form.ownerName} onChange={set("ownerName")} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" type="tel" value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label className="label">WhatsApp (if different)</label>
            <input className="input" type="tel" value={form.whatsapp} onChange={set("whatsapp")} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="label">Service area</label>
            <input className="input" value={form.serviceArea} onChange={set("serviceArea")} />
          </div>
          <div>
            <label className="label">License / insurance line</label>
            <input className="input" value={form.licenseInfo} onChange={set("licenseInfo")} />
          </div>
          <div>
            <label className="label">Google reviews URL</label>
            <input className="input" value={form.reviewsUrl} onChange={set("reviewsUrl")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline} onChange={set("tagline")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Gallery URL</label>
            <input className="input" value={form.galleryUrl} onChange={set("galleryUrl")} />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Professional type</p>
          <div className="flex flex-wrap gap-2">
            {PROFESSION_TYPES.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfessionType(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  professionType === p.id
                    ? "bg-gold text-obsidian border-gold font-medium"
                    : "border-white/15 text-bone"
                }`}
              >
                {p.en}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            Services offered <span className="text-gold">({services.size} selected)</span>
          </label>
          <div className="space-y-4 mt-2">
            {SERVICE_CATEGORIES.map((cat) => {
              const inCat = SERVICE_LIBRARY.filter((s) => s.category === cat.id);
              return (
                <div key={cat.id} className="card p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-2">{cat.en}</p>
                  <div className="flex flex-wrap gap-2">
                    {inCat.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => toggleService(s.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                          services.has(s.name)
                            ? "bg-gold text-obsidian border-gold font-medium"
                            : "border-white/15 text-bone"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || !form.businessName || !form.phone}
          className="btn-gold w-full disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal border border-gold/40 rounded-xl px-4 py-2.5 text-sm shadow-card z-50">
          {toast}
        </div>
      )}
    </main>
  );
}

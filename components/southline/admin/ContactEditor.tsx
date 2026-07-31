"use client";

import { useState, useEffect } from "react";
import type { SouthlineBusinessHoursEntry, SouthlineContactContent, SouthlineContactCtaType } from "@/lib/southline-types";

const CTA_TYPES: { value: SouthlineContactCtaType; label: string }[] = [
  { value: "call", label: "Call (tel:)" },
  { value: "text", label: "Text (sms:)" },
  { value: "email", label: "Email (mailto:)" },
  { value: "whatsapp", label: "WhatsApp (wa.me)" },
  { value: "directions", label: "Directions URL" },
  { value: "external_link", label: "External link" },
];

export default function ContactEditor({ pin }: { pin: string }) {
  const [content, setContent] = useState<SouthlineContactContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/southline/settings", { headers: { "x-snaplink-pin": pin } })
      .then((r) => r.json())
      .then((d) => setContent(d.settings.contact));
  }, [pin]);

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
        body: JSON.stringify({ contact: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.settings.contact);
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-muted text-sm">Loading contact info…</p>;

  function set(field: keyof SouthlineContactContent, value: string | null) {
    setContent((current) => (current ? { ...current, [field]: value } : current));
  }

  function moveHour(index: number, offset: number) {
    setContent((current) => {
      if (!current) return current;
      const next = [...current.hours];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      const [entry] = next.splice(index, 1);
      next.splice(target, 0, entry);
      return { ...current, hours: next.map((h, i) => ({ ...h, sortOrder: i })) };
    });
  }

  function updateHour(index: number, patch: Partial<SouthlineBusinessHoursEntry>) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        hours: current.hours.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
      };
    });
  }

  function addHour() {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        hours: [
          ...current.hours,
          {
            id: `hours_${Date.now()}`,
            dayLabel: "",
            hoursLabel: "",
            enabled: true,
            sortOrder: current.hours.length,
          },
        ],
      };
    });
  }

  function removeHour(index: number) {
    setContent((current) => {
      if (!current) return current;
      return {
        ...current,
        hours: current.hours.filter((_, i) => i !== index).map((entry, i) => ({ ...entry, sortOrder: i })),
      };
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Manage global business and contact info. Blank fields fall back to the default site copy and the contact
        methods, address, and hours blocks are hidden until filled in.
      </p>

      <label className="flex items-center justify-between py-3 border-b border-white/5">
        <span className="text-sm">Contact page enabled</span>
        <Toggle on={content.enabled} onToggle={() => setContent({ ...content, enabled: !content.enabled })} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Page heading</label>
          <input className="input" value={content.heading ?? ""} onChange={(e) => set("heading", e.target.value || null)} placeholder="Contact us" />
        </div>
        <div>
          <label className="label">Business name</label>
          <input className="input" value={content.businessName ?? ""} onChange={(e) => set("businessName", e.target.value || null)} placeholder="Southline Living" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Introductory copy (shown on the contact page)</label>
          <textarea className="input !resize-y" rows={3} value={content.body ?? ""} onChange={(e) => set("body", e.target.value || null)} placeholder="We're here to help you take the next step on your project." />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Short business description (shown on the contact page and footer)</label>
          <textarea className="input !resize-y" rows={2} value={content.businessDescription ?? ""} onChange={(e) => set("businessDescription", e.target.value || null)} />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Contact methods</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Phone</label>
          <input className="input" value={content.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={content.email ?? ""} onChange={(e) => set("email", e.target.value || null)} placeholder="hello@southlineliving.com" />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="input" value={content.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value || null)} placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Address</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Address line 1</label>
          <input className="input" value={content.addressLine1 ?? ""} onChange={(e) => set("addressLine1", e.target.value || null)} />
        </div>
        <div>
          <label className="label">Address line 2</label>
          <input className="input" value={content.addressLine2 ?? ""} onChange={(e) => set("addressLine2", e.target.value || null)} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" value={content.city ?? ""} onChange={(e) => set("city", e.target.value || null)} />
        </div>
        <div>
          <label className="label">Region / State</label>
          <input className="input" value={content.region ?? ""} onChange={(e) => set("region", e.target.value || null)} />
        </div>
        <div>
          <label className="label">Postal code</label>
          <input className="input" value={content.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value || null)} />
        </div>
        <div>
          <label className="label">Directions / map URL</label>
          <input className="input" value={content.directionsUrl ?? ""} onChange={(e) => set("directionsUrl", e.target.value || null)} placeholder="https://maps.google.com/..." />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Primary contact CTA</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Button label</label>
          <input className="input" value={content.primaryCtaLabel ?? ""} onChange={(e) => set("primaryCtaLabel", e.target.value || null)} placeholder="Contact us" />
        </div>
        <div>
          <label className="label">Action type</label>
          <select
            className="input"
            value={content.primaryCtaType ?? ""}
            onChange={(e) => set("primaryCtaType", (e.target.value || null) as SouthlineContactCtaType | null)}
          >
            <option value="">None</option>
            {CTA_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Value</label>
          <input className="input" value={content.primaryCtaValue ?? ""} onChange={(e) => set("primaryCtaValue", e.target.value || null)} placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gold mb-3">Business hours</p>
      </div>
      {content.hours.map((entry, index) => (
        <div key={entry.id} className="space-y-3 rounded-xl border border-white/10 bg-obsidian p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gold">Hours {index + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveHour(index, -1)} disabled={index === 0} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => moveHour(index, 1)} disabled={index === content.hours.length - 1} className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30">
                  ↓
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Visible
                <Toggle on={entry.enabled} onToggle={() => updateHour(index, { enabled: !entry.enabled })} />
              </label>
              <button type="button" onClick={() => removeHour(index)} className="text-xs text-danger">
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Day label</label>
              <input className="input" value={entry.dayLabel} onChange={(e) => updateHour(index, { dayLabel: e.target.value })} placeholder="Monday" />
            </div>
            <div>
              <label className="label">Hours label</label>
              <input className="input" value={entry.hoursLabel} onChange={(e) => updateHour(index, { hoursLabel: e.target.value })} placeholder="8:00 AM – 6:00 PM" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addHour} className="text-xs bg-gold text-obsidian font-semibold px-3 py-1.5 rounded-lg">
        + Add Hours
      </button>

      <div>
        <button onClick={save} disabled={busy} className="btn-gold disabled:opacity-40">
          {busy ? "Saving…" : "Save Contact Info"}
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

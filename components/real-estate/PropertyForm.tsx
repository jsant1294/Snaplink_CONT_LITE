"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storedPin } from "@/components/admin/Dashboard";
import { demoAgents, demoBrokerage, demoTenant } from "@/lib/real-estate/fixtures";
import { slugifyProperty } from "@/lib/real-estate/validation";
import type { Property, PropertyMedia } from "@/lib/real-estate/types";

const authHeaders = () => ({ "Content-Type": "application/json", "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });
const blank = {
  organizationId: "re-demo-organization", brokerageId: demoBrokerage.id, listingAgentId: demoAgents[0].id,
  title: "", slug: "", propertyType: "single_family", propertyStatus: "draft",
  address: "", addressLine2: "", city: "", state: "GA", postalCode: "", country: "US",
  price: "0", bedrooms: "0", bathrooms: "0", squareFeet: "0", lotSize: "", yearBuilt: "",
  shortDescription: "", description: "", features: "", amenities: "", heroImage: "", isPublished: false,
};

type FormState = typeof blank;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/[0.08] bg-[#20231F] p-5 sm:p-6"><h2 className="font-display text-xl">{title}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium text-[#B6B3AA]">{label}</span>{children}{error && <span className="mt-1 block text-xs text-danger">{error}</span>}</label>;
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#181A17] px-4 py-3 text-sm text-[#EEE9DF] outline-none focus:border-[#B99A5B]";

export default function PropertyForm({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(blank);
  const [media, setMedia] = useState<PropertyMedia[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(Boolean(propertyId));
  const editing = Boolean(propertyId);
  const set = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!propertyId) return;
    Promise.all([
      fetch(`/api/real-estate/properties/${propertyId}`, { headers: authHeaders() }).then((response) => response.json()),
      fetch(`/api/real-estate/properties/${propertyId}/media`, { headers: authHeaders() }).then((response) => response.json()),
    ]).then(([propertyData, mediaData]) => {
      const property = propertyData.property as Property | undefined;
      if (property) setForm({
        organizationId: property.organizationId, brokerageId: property.brokerageId, listingAgentId: property.agentId,
        title: property.title, slug: property.slug, propertyType: property.propertyType, propertyStatus: property.status,
        address: property.address, addressLine2: property.addressLine2 ?? "", city: property.city, state: property.state,
        postalCode: property.postalCode, country: property.country, price: String(property.price), bedrooms: String(property.bedrooms),
        bathrooms: String(property.bathrooms), squareFeet: String(property.squareFeet), lotSize: property.lotSize ?? "",
        yearBuilt: property.yearBuilt ? String(property.yearBuilt) : "", shortDescription: property.shortDescription,
        description: property.description, features: property.features.join("\n"), amenities: property.amenities.join("\n"),
        heroImage: property.imageUrls[0] ?? "", isPublished: property.published,
      });
      setMedia(mediaData.media ?? []);
      setBusy(false);
    }).catch(() => { setMessage("Unable to load property"); setBusy(false); });
  }, [propertyId]);

  function payload() {
    return {
      ...form,
      price: Number(form.price), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
      squareFeet: Number(form.squareFeet), yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      features: form.features.split("\n").filter(Boolean), amenities: form.amenities.split("\n").filter(Boolean),
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setErrors({}); setMessage("");
    const response = await fetch(propertyId ? `/api/real-estate/properties/${propertyId}` : "/api/real-estate/properties", {
      method: propertyId ? "PATCH" : "POST", headers: authHeaders(), body: JSON.stringify(payload()),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setErrors(data.errors ?? {}); setMessage(data.error ?? "Unable to save property"); return; }
    router.push(`/real-estate/properties/${data.property.id}/edit`);
    router.refresh();
    setMessage("Property saved");
  }

  async function upload(file: File, replaceId?: string) {
    if (!propertyId) { setMessage("Save the property before adding media"); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
    });
    const response = await fetch(`/api/real-estate/properties/${propertyId}/media`, {
      method: replaceId ? "PATCH" : "POST", headers: authHeaders(),
      body: JSON.stringify({ ...(replaceId && { id: replaceId }), dataUrl, filename: file.name, isHero: media.length === 0 }),
    });
    const data = await response.json();
    if (!response.ok) setMessage(data.error ?? "Upload failed");
    else await reloadMedia();
  }

  async function reloadMedia() {
    if (!propertyId) return;
    const data = await fetch(`/api/real-estate/properties/${propertyId}/media`, { headers: authHeaders() }).then((response) => response.json());
    setMedia(data.media ?? []);
  }

  async function reorder(index: number, offset: number) {
    if (!propertyId || index + offset < 0 || index + offset >= media.length) return;
    const ids = media.map((item) => item.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    await fetch(`/api/real-estate/properties/${propertyId}/media`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ ids }) });
    reloadMedia();
  }

  async function removeMedia(id: string) {
    if (!propertyId || !window.confirm("Remove this image?")) return;
    await fetch(`/api/real-estate/properties/${propertyId}/media?mediaId=${id}`, { method: "DELETE", headers: authHeaders() });
    reloadMedia();
  }

  if (busy && editing && !form.title) return <div className="p-8 text-[#9FA098]">Loading property…</div>;
  return <form onSubmit={save} className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8">
    <div><p className="text-xs uppercase tracking-[0.22em] text-[#B99A5B]">Property management</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">{editing ? "Edit property" : "New property"}</h1></div>
    {message && <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">{message}</p>}
    <Section title="General"><Field label="Title" error={errors.title} wide><input className={inputClass} value={form.title} onChange={(event) => { set("title", event.target.value); if (!editing) set("slug", slugifyProperty(event.target.value)); }} /></Field><Field label="Slug" error={errors.slug}><input className={inputClass} value={form.slug} onChange={(event) => set("slug", slugifyProperty(event.target.value))} /></Field><Field label="Property type" error={errors.propertyType}><select className={inputClass} value={form.propertyType} onChange={(event) => set("propertyType", event.target.value)}><option value="single_family">Single-family</option><option value="townhome">Townhome</option><option value="condo">Condo</option><option value="multi_family">Multi-family</option><option value="land">Land</option><option value="commercial">Commercial</option><option value="rental">Rental</option></select></Field></Section>
    <Section title="Location"><Field label="Street address" error={errors.address} wide><input className={inputClass} value={form.address} onChange={(event) => set("address", event.target.value)} /></Field><Field label="Address line 2"><input className={inputClass} value={form.addressLine2} onChange={(event) => set("addressLine2", event.target.value)} /></Field><Field label="City" error={errors.city}><input className={inputClass} value={form.city} onChange={(event) => set("city", event.target.value)} /></Field><Field label="State" error={errors.state}><input className={inputClass} value={form.state} onChange={(event) => set("state", event.target.value)} /></Field><Field label="Postal code" error={errors.postalCode}><input className={inputClass} value={form.postalCode} onChange={(event) => set("postalCode", event.target.value)} /></Field><Field label="Country" error={errors.country}><input className={inputClass} maxLength={2} value={form.country} onChange={(event) => set("country", event.target.value.toUpperCase())} /></Field></Section>
    <Section title="Pricing"><Field label="Price" error={errors.price}><input className={inputClass} type="number" min="0" value={form.price} onChange={(event) => set("price", event.target.value)} /></Field></Section>
    <Section title="Property Details"><Field label="Bedrooms" error={errors.bedrooms}><input className={inputClass} type="number" min="0" step=".5" value={form.bedrooms} onChange={(event) => set("bedrooms", event.target.value)} /></Field><Field label="Bathrooms" error={errors.bathrooms}><input className={inputClass} type="number" min="0" step=".5" value={form.bathrooms} onChange={(event) => set("bathrooms", event.target.value)} /></Field><Field label="Square feet" error={errors.squareFeet}><input className={inputClass} type="number" min="0" value={form.squareFeet} onChange={(event) => set("squareFeet", event.target.value)} /></Field><Field label="Lot size" error={errors.lotSize}><input className={inputClass} value={form.lotSize} onChange={(event) => set("lotSize", event.target.value)} /></Field><Field label="Year built" error={errors.yearBuilt}><input className={inputClass} type="number" value={form.yearBuilt} onChange={(event) => set("yearBuilt", event.target.value)} /></Field></Section>
    <Section title="Description"><Field label="Short description" wide><textarea className={inputClass} rows={2} value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} /></Field><Field label="Full description" wide><textarea className={inputClass} rows={6} value={form.description} onChange={(event) => set("description", event.target.value)} /></Field></Section>
    <Section title="Features"><Field label="One feature per line" wide><textarea className={inputClass} rows={5} value={form.features} onChange={(event) => set("features", event.target.value)} /></Field></Section>
    <Section title="Amenities"><Field label="One amenity per line" wide><textarea className={inputClass} rows={5} value={form.amenities} onChange={(event) => set("amenities", event.target.value)} /></Field></Section>
    <Section title="Media"><Field label="Property images" wide><input className={inputClass} type="file" accept="image/*" multiple onChange={(event) => Array.from(event.target.files ?? []).forEach((file) => upload(file))} />{!propertyId && <p className="mt-2 text-xs text-[#8F928A]">Save first to enable uploads.</p>}</Field>{media.map((item, index) => <div key={item.id} className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-white/10 p-3"><img src={item.url} alt={item.altText} className="h-16 w-24 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs">{item.filename}</p><p className="mt-1 text-[10px] text-[#8F928A]">{item.isHero ? "Hero image" : `Gallery ${index + 1}`}</p></div><button type="button" onClick={() => reorder(index, -1)} className="text-xs">Up</button><button type="button" onClick={() => reorder(index, 1)} className="text-xs">Down</button><label className="cursor-pointer text-xs text-[#D1B06A]">Replace<input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0], item.id)} /></label><button type="button" onClick={() => removeMedia(item.id)} className="text-xs text-danger">Delete</button></div>)}</Section>
    <Section title="Publishing"><Field label="Status" error={errors.propertyStatus}><select className={inputClass} value={form.propertyStatus} onChange={(event) => set("propertyStatus", event.target.value)}><option value="draft">Draft</option><option value="coming_soon">Coming soon</option><option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option><option value="rental">Rental</option><option value="archived">Archived</option></select></Field><Field label="Publication"><label className="flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(event) => set("isPublished", event.target.checked)} />Visible in Southline Living</label>{errors.isPublished && <span className="text-xs text-danger">{errors.isPublished}</span>}</Field></Section>
    <Section title="Settings"><Field label="Organization ID"><input className={inputClass} value={form.organizationId} readOnly /></Field><Field label="Brokerage"><select className={inputClass} value={form.brokerageId} onChange={(event) => set("brokerageId", event.target.value)}><option value={demoBrokerage.id}>{demoBrokerage.name}</option></select></Field><Field label="Listing agent"><select className={inputClass} value={form.listingAgentId} onChange={(event) => set("listingAgentId", event.target.value)}>{demoAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></Field></Section>
    <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-white/10 bg-[#171916]/95 p-4 shadow-2xl"><button type="button" onClick={() => router.push("/real-estate/properties")} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Cancel</button><button disabled={busy} className="rounded-xl bg-[#B99A5B] px-6 py-3 text-sm font-semibold text-[#1A1C18] disabled:opacity-50">{busy ? "Saving…" : "Save property"}</button></div>
  </form>;
}

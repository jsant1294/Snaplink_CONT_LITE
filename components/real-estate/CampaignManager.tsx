"use client";
import { useCallback, useEffect, useState } from "react";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";

const headers = { "Content-Type": "application/json", "x-snaplink-pin": "", "x-real-estate-tenant": demoTenant.id };
export default function CampaignManager() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [name, setName] = useState("");
  const [campaignType, setType] = useState("listing_launch");
  const load = useCallback(async () => { const r = await fetch("/api/real-estate/campaigns", { headers: { ...headers, "x-snaplink-pin": storedPin() } }); const d = await r.json(); if (r.ok) setItems(d.campaigns || []); }, []);
  useEffect(() => { load(); }, [load]);
  async function create(e: React.FormEvent) { e.preventDefault(); await fetch("/api/real-estate/campaigns", { method: "POST", headers: { ...headers, "x-snaplink-pin": storedPin() }, body: JSON.stringify({ name, campaignType, status: "draft", channels: ["email"], content: {} }) }); setName(""); load(); }
  return <div className="mx-auto max-w-6xl p-6"><p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">Persistent outreach</p><h1 className="mt-2 font-display text-4xl">Campaigns</h1><form onSubmit={create} className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#20231F] p-5 sm:grid-cols-[1fr_220px_auto]"><input required value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name" className="rounded-xl bg-[#181A17] px-4 py-3"/><select value={campaignType} onChange={e => setType(e.target.value)} className="rounded-xl bg-[#181A17] px-4"><option value="listing_launch">Listing launch</option><option value="open_house">Open house</option><option value="nurture">Lead nurture</option></select><button className="rounded-xl bg-[#B99A5B] px-5 font-semibold text-[#181A17]">Create</button></form><div className="mt-5 grid gap-3">{items.map(item => <article key={String(item.id)} className="rounded-2xl border border-white/10 bg-[#20231F] p-5"><div className="flex justify-between"><strong>{String(item.name)}</strong><span className="text-xs uppercase text-[#B99A5B]">{String(item.status)}</span></div><p className="mt-2 text-sm text-[#9B9E96]">{String(item.campaignType).replaceAll("_", " ")}</p></article>)}</div></div>;
}

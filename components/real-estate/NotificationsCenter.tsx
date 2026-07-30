"use client";
import { useCallback, useEffect, useState } from "react";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
const headers = () => ({ "Content-Type": "application/json", "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });
export default function NotificationsCenter() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]), [filter, setFilter] = useState("unread");
  const load = useCallback(async () => { const r = await fetch(`/api/real-estate/notifications?filter=${filter}`, { headers: headers() }), d = await r.json(); if (r.ok) setItems(d.notifications || []); }, [filter]);
  useEffect(() => { load(); }, [load]);
  async function act(id: unknown, action: string) { await fetch(`/api/real-estate/notifications/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ action }) }); load(); }
  return <div className="mx-auto max-w-5xl p-6"><h1 className="font-display text-4xl">Notifications</h1><select value={filter} onChange={e => setFilter(e.target.value)} className="mt-6 rounded-xl bg-[#20231F] px-4 py-3"><option value="unread">Unread</option><option value="">All active</option><option value="archived">Archived</option></select><div className="mt-4 space-y-3">{items.map(item => <article key={String(item.id)} className="rounded-2xl border border-white/10 bg-[#20231F] p-5"><div className="flex gap-4"><div className="flex-1"><p className="text-xs uppercase text-[#B99A5B]">{String(item.type)} · {String(item.priority)}</p><h2 className="mt-1 font-semibold">{String(item.title)}</h2><p className="mt-1 text-sm text-[#AAA9A2]">{String(item.message)}</p></div><div className="flex gap-2"><button onClick={() => act(item.id, item.readAt ? "unread" : "read")} className="text-xs">{item.readAt ? "Unread" : "Read"}</button><button onClick={() => act(item.id, "archive")} className="text-xs">Archive</button></div></div></article>)}</div></div>;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
import type { Property } from "@/lib/real-estate/types";
import Icon from "./Icon";

const headers = () => ({
  "Content-Type": "application/json",
  "x-snaplink-pin": storedPin(),
  "x-real-estate-tenant": demoTenant.id,
});

export default function PropertyAdmin() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search, sort, direction, page: String(page), pageSize: "10" });
    const response = await fetch(`/api/real-estate/properties?${query}`, { headers: headers() });
    const data = await response.json();
    if (response.ok) {
      setProperties(data.properties ?? []);
      setTotal(data.total ?? 0);
      setError("");
    } else setError(data.error ?? "Unable to load properties");
    setLoading(false);
  }, [search, sort, direction, page]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function action(id: string, operation: "publish" | "unpublish" | "archive" | "delete") {
    if (operation === "delete" && !window.confirm("Soft delete this property?")) return;
    const response = await fetch(`/api/real-estate/properties/${id}`, {
      method: operation === "delete" ? "DELETE" : "PATCH",
      headers: headers(),
      ...(operation !== "delete" && { body: JSON.stringify({ action: operation }) }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Action failed");
    else load();
  }

  const pages = Math.max(1, Math.ceil(total / 10));
  return <div className="mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#B99A5B]">Property management</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">Properties</h1><p className="mt-2 text-sm text-[#9FA098]">Create, publish, archive, and manage property media.</p></div><Link href="/real-estate/properties/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B99A5B] px-4 py-3 text-sm font-semibold text-[#1A1C18]"><Icon name="plus" className="h-4 w-4" />Create property</Link></div>
    <div className="mt-7 grid gap-3 rounded-2xl border border-white/[0.08] bg-[#20231F] p-4 md:grid-cols-[1fr_180px_130px]">
      <label><span className="sr-only">Search properties</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by title, city, or address" className="w-full rounded-xl border border-white/10 bg-[#181A17] px-4 py-3 text-sm outline-none focus:border-[#B99A5B]" /></label>
      <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-white/10 bg-[#181A17] px-3 py-3 text-sm"><option value="updatedAt">Last updated</option><option value="title">Title</option><option value="price">Price</option><option value="status">Status</option></select>
      <select value={direction} onChange={(event) => setDirection(event.target.value)} className="rounded-xl border border-white/10 bg-[#181A17] px-3 py-3 text-sm"><option value="desc">Descending</option><option value="asc">Ascending</option></select>
    </div>
    {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#20231F]">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-[#858980]"><tr><th className="p-4">Property</th><th>Price</th><th>Status</th><th>Publication</th><th>Updated</th><th className="pr-4 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-white/[0.06]">{loading ? <tr><td colSpan={6} className="p-8 text-center text-[#8F928A]">Loading properties…</td></tr> : properties.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[#8F928A]">No properties match this view.</td></tr> : properties.map((property) => <tr key={property.id}>
          <td className="p-4"><div className="flex items-center gap-3">{property.imageUrls[0] ? <img src={property.imageUrls[0]} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <span className="grid h-12 w-16 place-items-center rounded-lg bg-white/5"><Icon name="home" /></span>}<div><p className="font-medium">{property.title}</p><p className="mt-1 text-xs text-[#8F928A]">{property.address} · {property.city}</p></div></div></td>
          <td>${property.price.toLocaleString()}</td><td><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase text-[#C9C5BC]">{property.status.replace("_", " ")}</span></td><td><span className={`rounded-full px-2.5 py-1 text-[10px] ${property.published ? "bg-[#789071]/15 text-[#A9C0A2]" : "bg-white/5 text-[#92958D]"}`}>{property.published ? "Published" : "Draft"}</span></td><td className="text-xs text-[#8F928A]">{new Date(property.updatedAt).toLocaleDateString()}</td>
          <td className="pr-4"><div className="flex justify-end gap-2"><Link href={`/real-estate/properties/${property.id}/edit`} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs">Edit</Link><button onClick={() => action(property.id, property.published ? "unpublish" : "publish")} className="rounded-lg border border-[#B99A5B]/40 px-2.5 py-1.5 text-xs text-[#D1B06A]">{property.published ? "Unpublish" : "Publish"}</button><button onClick={() => action(property.id, "archive")} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs">Archive</button><button onClick={() => action(property.id, "delete")} className="rounded-lg border border-danger/30 px-2.5 py-1.5 text-xs text-danger">Delete</button></div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="mt-4 flex items-center justify-between text-sm"><p className="text-[#8F928A]">{total} properties</p><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">Previous</button><span className="text-xs text-[#A9AAA3]">{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">Next</button></div></div>
  </div>;
}

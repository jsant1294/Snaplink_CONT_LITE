"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { allowedTransactionTransitions } from "@/lib/real-estate/transactions/status";
import type { TransactionStatus } from "@/lib/real-estate/transactions/types";
type Workspace = { transaction: Record<string, unknown>; participants: Record<string, unknown>[]; offers: Record<string, unknown>[]; milestones: Record<string, unknown>[]; statusHistory: Record<string, unknown>[]; inspections: Record<string, unknown>[]; escrow: Record<string, unknown>[]; threads: Record<string, unknown>[] };
const cards = ["Participants", "Tasks", "Documents", "Inspection", "Escrow", "Commission estimate", "Messages", "Activity", "Audit history"];
export default function TransactionDetail({ id }: { id: string }) {
  const [data, setData] = useState<Workspace | null>(null); const [error, setError] = useState("");
  const load = useCallback(async () => { const response = await fetch(`/api/real-estate/transactions/${id}/workspace`, { cache: "no-store" }); if (!response.ok) return setError("This transaction is unavailable or outside your access scope."); setData(await response.json()); }, [id]);
  useEffect(() => { void load(); }, [load]);
  async function transition(status: string) {
    const response = await fetch(`/api/real-estate/transactions/${id}/status`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": `ui-${id}-${status}-${Date.now()}` }, body: JSON.stringify({ status }) });
    if (!response.ok) setError((await response.json()).error); else void load();
  }
  if (error && !data) return <div className="p-8"><div className="rounded-2xl border border-red-300/20 bg-red-950/20 p-5">{error}</div></div>;
  if (!data) return <p className="p-8 text-sm text-[#AFA99E]">Loading secure transaction workspace…</p>;
  const tx = data.transaction; const status = String(tx.status) as TransactionStatus;
  return <section className="p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">{String(tx.transactionNumber)}</p><h1 className="mt-2 font-display text-3xl">{String(tx.transactionType).replaceAll("_", " ")}</h1><p className="mt-2 text-sm text-[#AFA99E]">Closing {tx.closingDate ? new Date(String(tx.closingDate)).toLocaleString() : "not yet scheduled"}</p></div><Link href={`/real-estate/transactions/${id}/edit`} className="h-fit rounded-xl border border-[#B99A5B]/50 px-4 py-2.5 text-sm text-[#D1B06A]">Edit details</Link></div>
    {error && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-950/20 p-3 text-sm">{error}</p>}
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#1D201C] p-5"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#B99A5B]/15 px-3 py-1.5 text-sm text-[#D1B06A]">{status.replaceAll("_", " ")}</span>{allowedTransactionTransitions(status).map(next => <button key={next} onClick={() => void transition(next)} className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:border-[#B99A5B]/50">Move to {next.replaceAll("_", " ")}</button>)}</div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-white/10 bg-[#1D201C] p-5"><p className="text-xs uppercase text-[#8F9188]">Purchase price</p><strong className="mt-2 block font-display text-xl">{tx.purchasePriceCents == null ? "Not set" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(tx.purchasePriceCents) / 100)}</strong></article>
      <article className="rounded-2xl border border-white/10 bg-[#1D201C] p-5"><p className="text-xs uppercase text-[#8F9188]">Priority</p><strong className="mt-2 block capitalize">{String(tx.priority)}</strong></article>
      <article className="rounded-2xl border border-white/10 bg-[#1D201C] p-5"><p className="text-xs uppercase text-[#8F9188]">Milestones</p><strong className="mt-2 block">{data.milestones.length}</strong></article>
      <article className="rounded-2xl border border-white/10 bg-[#1D201C] p-5"><p className="text-xs uppercase text-[#8F9188]">Offers</p><strong className="mt-2 block">{data.offers.length}</strong></article>
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-2xl border border-white/10 bg-[#1D201C] p-5"><div className="flex justify-between"><h2 className="font-display text-xl">Closing timeline</h2><span className="text-xs text-[#8F9188]">Agenda</span></div><div className="mt-4 space-y-3">{data.milestones.length ? data.milestones.map(item => <div key={String(item.id)} className="flex justify-between gap-4 border-l border-[#B99A5B]/40 pl-4"><div><strong className="text-sm">{String(item.title)}</strong><p className="text-xs text-[#8F9188]">{String(item.status)}</p></div><time className="text-xs text-[#B9B7AF]">{item.dueAt ? new Date(String(item.dueAt)).toLocaleDateString() : "Flexible"}</time></div>) : <p className="text-sm text-[#8F9188]">Dates will appear as contract deadlines are added.</p>}</div></div>
      <div className="rounded-2xl border border-white/10 bg-[#1D201C] p-5"><div className="flex justify-between"><h2 className="font-display text-xl">Offers</h2><Link href={`/real-estate/transactions/${id}/offers/new`} className="text-xs text-[#D1B06A]">New offer</Link></div><div className="mt-4 space-y-3">{data.offers.map(offer => <Link key={String(offer.id)} href={`/real-estate/transactions/${id}/offers/${offer.id}`} className="block rounded-xl border border-white/10 p-3 text-sm"><strong>{String(offer.offerNumber)}</strong><span className="float-right text-[#D1B06A]">{String(offer.status)}</span></Link>)}{!data.offers.length && <p className="text-sm text-[#8F9188]">No offers recorded.</p>}</div></div>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(name => <article key={name} className="min-h-32 rounded-2xl border border-white/10 bg-[#1D201C] p-5"><h2 className="font-display text-lg">{name}</h2><p className="mt-2 text-sm text-[#8F9188]">{name === "Commission estimate" ? "Internal estimate only. Never visible in the client portal." : `Secure ${name.toLowerCase()} records for this transaction.`}</p></article>)}</div>
  </section>;
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TRANSACTION_STATUSES } from "@/lib/real-estate/transactions/types";

type RecordRow = {
  id: string; transactionNumber: string; transactionType: string; status: string;
  priority: string; purchasePriceCents: number | null; closingDate: string | null; updatedAt: string;
};

export default function TransactionWorkspace() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const load = useCallback(async () => {
    setState("loading");
    const query = new URLSearchParams({ search, ...(status && { status }) });
    const response = await fetch(`/api/real-estate/transactions?${query}`, { cache: "no-store" });
    if (!response.ok) return setState("error");
    setRecords((await response.json()).records);
    setState("ready");
  }, [search, status]);
  useEffect(() => { void load(); }, [load]);
  return <section className="p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">Brokerage operations</p><h1 className="mt-2 font-display text-3xl">Transactions</h1><p className="mt-2 text-sm text-[#AFA99E]">Contracts, deadlines, client collaboration, and closing progress.</p></div>
      <Link href="/real-estate/transactions/new" className="rounded-xl bg-[#C4A25E] px-4 py-2.5 text-sm font-semibold text-[#171916]">New transaction</Link>
    </div>
    <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-[#1D201C] p-4 sm:grid-cols-[1fr_220px_auto]">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transaction number" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3 text-sm outline-none focus:border-[#B99A5B]" />
      <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3 text-sm"><option value="">All statuses</option>{TRANSACTION_STATUSES.map(item => <option key={item}>{item}</option>)}</select>
      <button onClick={() => void load()} className="rounded-xl border border-[#B99A5B]/50 px-4 py-3 text-sm text-[#D1B06A]">Refresh</button>
    </div>
    {state === "loading" && <p className="mt-8 text-sm text-[#AFA99E]">Loading transactions…</p>}
    {state === "error" && <div className="mt-8 rounded-2xl border border-red-300/20 bg-red-950/20 p-5 text-sm">Transactions could not be loaded. Confirm your membership and try again.</div>}
    {state === "ready" && !records.length && <div className="mt-8 rounded-2xl border border-dashed border-[#B99A5B]/30 p-10 text-center"><h2 className="font-display text-xl">No transactions found</h2><p className="mt-2 text-sm text-[#AFA99E]">Create the first file or adjust the filters.</p></div>}
    {!!records.length && <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#1D201C]">
      <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wider text-[#8F9188] md:grid"><span>Transaction</span><span>Type</span><span>Status</span><span>Closing</span><span>Volume</span></div>
      {records.map(record => <Link href={`/real-estate/transactions/${record.id}`} key={record.id} className="grid gap-3 border-b border-white/[.07] p-5 transition hover:bg-white/[.03] md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] md:items-center">
        <div><strong className="text-[#F2EDE4]">{record.transactionNumber}</strong><p className="mt-1 text-xs text-[#8F9188]">{record.priority} priority</p></div>
        <span className="text-sm text-[#B9B7AF]">{record.transactionType.replaceAll("_", " ")}</span>
        <span className="w-fit rounded-full border border-[#B99A5B]/25 bg-[#B99A5B]/10 px-2.5 py-1 text-xs text-[#D1B06A]">{record.status.replaceAll("_", " ")}</span>
        <span className="text-sm">{record.closingDate ? new Date(record.closingDate).toLocaleDateString() : "Not scheduled"}</span>
        <span className="text-sm">{record.purchasePriceCents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(record.purchasePriceCents / 100)}</span>
      </Link>)}
    </div>}
  </section>;
}

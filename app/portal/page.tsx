import Link from "next/link"; import { redirect } from "next/navigation";
import { currentPortalPrincipal } from "@/lib/real-estate/portal/server"; import { portalTransactions } from "@/lib/real-estate/portal/data";
export default async function PortalPage() {
  const principal = await currentPortalPrincipal(); if (!principal) redirect("/portal/login");
  const transactions = await portalTransactions(principal);
  return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-xs uppercase tracking-[.2em] text-[#92712e]">Secure workspace</p><h1 className="mt-2 font-display text-3xl">Your transactions</h1><p className="mt-2 text-sm text-[#6a6057]">Only information approved for client visibility appears here.</p><div className="mt-7 grid gap-4 md:grid-cols-2">{transactions.map(item => <Link key={item.id} href={`/portal/transactions/${item.id}`} className="rounded-2xl border border-[#92712e]/20 bg-[#f5efe2] p-5 shadow-sm"><span className="text-xs uppercase text-[#92712e]">{item.transactionNumber}</span><h2 className="mt-2 font-display text-xl capitalize">{item.transactionType.replaceAll("_", " ")}</h2><p className="mt-3 text-sm capitalize">{item.status.replaceAll("_", " ")}</p></Link>)}{!transactions.length && <div className="rounded-2xl border border-dashed border-[#92712e]/30 p-8 text-sm">No active transaction access grants.</div>}</div></main>;
}

"use client";
import { useParams, useRouter } from "next/navigation";
export default function OfferDetailPage() {
  const params = useParams<{ id: string; offerId: string }>(); const router = useRouter();
  async function action(status: string) { const response = await fetch(`/api/real-estate/transactions/${params.id}/offers/${params.offerId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); if (response.ok) router.push(`/real-estate/transactions/${params.id}`); }
  return <section className="mx-auto max-w-3xl p-4 sm:p-8"><p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">Offer record</p><h1 className="mt-2 font-display text-3xl">{params.offerId}</h1><div className="mt-6 rounded-2xl border border-white/10 bg-[#1D201C] p-5"><h2 className="font-display text-xl">Offer actions</h2><p className="mt-2 text-sm text-[#AFA99E]">Final actions are recorded in status history and the immutable transaction audit.</p><div className="mt-5 flex flex-wrap gap-3">{["submitted", "received", "accepted", "rejected", "withdrawn"].map(status => <button key={status} onClick={() => void action(status)} className="rounded-xl border border-[#B99A5B]/35 px-4 py-2 text-sm capitalize text-[#D1B06A]">{status}</button>)}</div></div></section>;
}

"use client";
import { useState } from "react"; import { useRouter } from "next/navigation";
export default function OfferForm({ transactionId }: { transactionId: string }) {
  const router = useRouter(); const [error, setError] = useState("");
  async function submit(data: FormData) {
    const response = await fetch(`/api/real-estate/transactions/${transactionId}/offers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      offerPriceCents: Math.round(Number(data.get("offerPrice")) * 100), earnestMoneyAmountCents: Math.round(Number(data.get("earnestMoney") || 0) * 100),
      financingType: data.get("financingType"), closingDate: data.get("closingDate") ? new Date(String(data.get("closingDate"))).toISOString() : null,
      expirationAt: data.get("expirationAt") ? new Date(String(data.get("expirationAt"))).toISOString() : null, terms: data.get("terms"),
    }) });
    const body = await response.json(); if (!response.ok) return setError(body.error); router.push(`/real-estate/transactions/${transactionId}/offers/${body.offer.id}`);
  }
  return <section className="mx-auto max-w-3xl p-4 sm:p-8"><p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">Offer management</p><h1 className="mt-2 font-display text-3xl">Draft offer</h1><form action={submit} className="mt-6 grid gap-5 rounded-2xl border border-white/10 bg-[#1D201C] p-5 sm:grid-cols-2">
    {[["offerPrice", "Offer price"], ["earnestMoney", "Earnest money"]].map(([name,label]) => <label key={name} className="grid gap-2 text-sm"><span>{label}</span><input name={name} required={name === "offerPrice"} type="number" min="0" step=".01" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>)}
    <label className="grid gap-2 text-sm"><span>Financing</span><select name="financingType" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3"><option>conventional</option><option>cash</option><option>fha</option><option>va</option></select></label>
    <label className="grid gap-2 text-sm"><span>Closing date</span><input name="closingDate" type="datetime-local" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>
    <label className="grid gap-2 text-sm"><span>Expiration</span><input name="expirationAt" type="datetime-local" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>
    <label className="grid gap-2 text-sm sm:col-span-2"><span>Terms</span><textarea name="terms" rows={5} className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>
    {error && <p className="sm:col-span-2 text-sm text-red-200">{error}</p>}<button className="rounded-xl bg-[#C4A25E] px-5 py-3 font-semibold text-[#171916]">Save draft</button>
  </form></section>;
}

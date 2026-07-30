"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Option = { value: string; label: string };
const TYPES = ["buyer_purchase", "seller_listing", "dual_agency", "cash_purchase", "financed_purchase"];
export default function TransactionForm() {
  const router = useRouter();
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { for (const type of ["brokerages", "properties", "buyers", "sellers", "leads", "memberships"]) fetch(`/api/real-estate/selectors?type=${type}`).then(r => r.json()).then(body => setOptions(value => ({ ...value, [type]: body.options || [] }))); }, []);
  async function submit(formData: FormData) {
    setBusy(true); setError("");
    const raw = Object.fromEntries(formData);
    const cents = (value: FormDataEntryValue | undefined) => value ? Math.round(Number(value) * 100) : null;
    const response = await fetch("/api/real-estate/transactions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      ...raw, purchasePriceCents: cents(raw.purchasePrice), listPriceCents: cents(raw.listPrice),
      closingDate: raw.closingDate ? new Date(String(raw.closingDate)).toISOString() : null,
    }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to create transaction"); setBusy(false); return; }
    router.push(`/real-estate/transactions/${result.record.id}`);
  }
  const select = (name: string, label: string, type: string, required = false) => <label className="grid gap-2 text-sm"><span className="text-[#B9B7AF]">{label}</span><select name={name} required={required} className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3"><option value="">Select {label.toLowerCase()}</option>{(options[type] || []).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
  return <section className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">Transaction operations</p><h1 className="mt-2 font-display text-3xl">New transaction</h1>
    <form action={submit} className="mt-7 space-y-6">
      <div className="grid gap-5 rounded-2xl border border-white/10 bg-[#1D201C] p-5 sm:grid-cols-2">
        {select("brokerageId", "Brokerage", "brokerages", true)}
        <label className="grid gap-2 text-sm"><span className="text-[#B9B7AF]">Transaction type</span><select name="transactionType" required className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3">{TYPES.map(type => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
        {select("propertyId", "Property", "properties")}
        {select("leadId", "Lead", "leads")}
        {select("buyerId", "Buyer", "buyers")}
        {select("sellerId", "Seller", "sellers")}
      </div>
      <div className="grid gap-5 rounded-2xl border border-white/10 bg-[#1D201C] p-5 sm:grid-cols-3">
        {select("listingAgentMembershipId", "Listing agent", "memberships")}
        {select("buyerAgentMembershipId", "Buyer agent", "memberships")}
        {select("transactionCoordinatorMembershipId", "Coordinator", "memberships")}
      </div>
      <div className="grid gap-5 rounded-2xl border border-white/10 bg-[#1D201C] p-5 sm:grid-cols-3">
        {["listPrice", "purchasePrice"].map(name => <label key={name} className="grid gap-2 text-sm"><span className="capitalize text-[#B9B7AF]">{name.replace(/([A-Z])/g, " $1")}</span><input name={name} type="number" min="0" step=".01" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>)}
        <label className="grid gap-2 text-sm"><span className="text-[#B9B7AF]">Closing date</span><input name="closingDate" type="datetime-local" className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>
      </div>
      <label className="grid gap-2 text-sm"><span className="text-[#B9B7AF]">Internal notes</span><textarea name="internalNotes" rows={4} className="rounded-xl border border-white/10 bg-[#171916] px-4 py-3" /></label>
      {error && <p className="rounded-xl border border-red-300/20 bg-red-950/20 p-3 text-sm">{error}</p>}
      <button disabled={busy} className="rounded-xl bg-[#C4A25E] px-5 py-3 font-semibold text-[#171916] disabled:opacity-50">{busy ? "Creating…" : "Create transaction"}</button>
    </form>
  </section>;
}
